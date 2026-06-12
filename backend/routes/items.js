import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { protect } from '../middleware/auth.js';
import { formatItem } from '../utils/formatters.js';
import { logActivity } from '../utils/activityHelper.js';
import { recordTransaction } from '../utils/transactionHelper.js';
import DatabaseService from '../utils/dbService.js';
import Item from '../models/Item.js';
import { processExpiredItems } from '../utils/expiryHelper.js';

const router = Router();

router.use(protect);

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findDuplicate = async (userId, name, category) => {
  return Item.findOne({
    userId,
    name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, 'i') },
    category,
    quantity: { $gt: 0 },
  });
};

const parseItemBody = (body, user) => ({
  name: body.name?.trim(),
  category: body.category,
  quantity: body.quantity ?? 0,
  unit: body.unit,
  threshold: body.threshold ?? 0,
  expiryDate: body.expiryDate || null,
  pricePerUnit: body.pricePerUnit ?? 0,
  addedBy: body.addedBy || user.name?.split(' ')[0] || 'User',
  vendorId: body.vendorId || '',
});

// GET /api/items
router.get(
  '/',
  asyncHandler(async (req, res) => {
    await processExpiredItems(req.user._id, req.user.name);

    const { docs } = await DatabaseService.findMany(
      Item,
      { userId: req.user._id },
      { sort: { dateAdded: -1 }, limit: 500 }
    );
    sendSuccess(res, docs.map(formatItem), 'Items retrieved');
  })
);

// GET /api/items/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await DatabaseService.findById(Item, req.params.id);
    if (!item || item.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Item not found', 404);
    }
    sendSuccess(res, formatItem(item), 'Item retrieved');
  })
);

// POST /api/items
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = parseItemBody(req.body, req.user);

    if (!data.name || !data.category || data.unit === undefined) {
      return sendError(res, 'Name, category, and unit are required', 400);
    }

    if (data.quantity < 0) {
      return sendError(res, 'Quantity cannot be negative', 400);
    }

    const duplicate = await findDuplicate(req.user._id, data.name, data.category);

    if (duplicate && !req.body.merge) {
      return sendSuccess(
        res,
        { duplicate: formatItem(duplicate) },
        'Duplicate item found',
        409
      );
    }

    if (duplicate && req.body.merge) {
      const newQty = parseFloat((duplicate.quantity + data.quantity).toFixed(2));
      const updated = await DatabaseService.updateById(Item, duplicate._id, {
        quantity: newQty,
        expiryDate: data.expiryDate ?? duplicate.expiryDate,
        pricePerUnit: data.pricePerUnit || duplicate.pricePerUnit,
      });

      await logActivity(
        req.user._id,
        'item_edited',
        `Merged ${data.quantity}${data.unit} into ${data.name} (total: ${newQty}${data.unit})`,
        req.user.name,
        { itemId: duplicate._id }
      );

      if (data.quantity > 0) {
        await recordTransaction({
          userId: req.user._id,
          itemId: duplicate._id,
          itemName: data.name,
          category: data.category,
          quantity: data.quantity,
          unit: data.unit,
          pricePerUnit: data.pricePerUnit,
          type: 'added',
        });
      }

      return sendSuccess(res, formatItem(updated), 'Item quantity merged');
    }

    const item = await DatabaseService.create(Item, {
      ...data,
      userId: req.user._id,
    });

    await logActivity(
      req.user._id,
      'item_added',
      `You added ${data.quantity}${data.unit} ${data.name}`,
      req.user.name,
      { itemId: item._id }
    );

    if (data.quantity > 0) {
      await recordTransaction({
        userId: req.user._id,
        itemId: item._id,
        itemName: data.name,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        pricePerUnit: data.pricePerUnit,
        type: 'added',
      });
    }

    sendSuccess(res, formatItem(item), 'Item added', 201);
  })
);

// PUT /api/items/:id
router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await DatabaseService.findById(Item, req.params.id);
    if (!existing || existing.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Item not found', 404);
    }

    const updates = {};
    const allowed = ['name', 'category', 'quantity', 'unit', 'threshold', 'expiryDate', 'pricePerUnit', 'vendorId', 'addedBy'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = key === 'name' ? req.body[key]?.trim() : req.body[key];
      }
    }

    if (updates.quantity !== undefined && updates.quantity < 0) {
      return sendError(res, 'Quantity cannot be negative', 400);
    }

    const prevQty = existing.quantity;
    const item = await DatabaseService.updateById(Item, req.params.id, updates);

    await logActivity(
      req.user._id,
      'item_edited',
      `Updated details for ${item.name}`,
      req.user.name,
      { itemId: item._id }
    );

    if (updates.quantity !== undefined && updates.quantity !== prevQty) {
      const diff = updates.quantity - prevQty;
      if (diff > 0) {
        await recordTransaction({
          userId: req.user._id,
          itemId: item._id,
          itemName: item.name,
          category: item.category,
          quantity: diff,
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          type: 'added',
        });
      } else if (diff < 0) {
        await recordTransaction({
          userId: req.user._id,
          itemId: item._id,
          itemName: item.name,
          category: item.category,
          quantity: Math.abs(diff),
          unit: item.unit,
          pricePerUnit: item.pricePerUnit,
          type: 'consumed',
        });
      }
    }

    sendSuccess(res, formatItem(item), 'Item updated');
  })
);

// DELETE /api/items/:id
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const item = await DatabaseService.findById(Item, req.params.id);
    if (!item || item.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Item not found', 404);
    }

    await DatabaseService.deleteById(Item, req.params.id);

    await logActivity(
      req.user._id,
      'item_removed',
      `${item.name} removed from fridge`,
      req.user.name,
      { itemId: item._id }
    );

    sendSuccess(res, null, 'Item deleted');
  })
);

// PATCH /api/items/:id/finish
router.patch(
  '/:id/finish',
  asyncHandler(async (req, res) => {
    const item = await DatabaseService.findById(Item, req.params.id);
    if (!item || item.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Item not found', 404);
    }

    const consumedQty = item.quantity;

    const updated = await DatabaseService.updateById(Item, req.params.id, { quantity: 0 });

    await logActivity(
      req.user._id,
      'item_finished',
      `${consumedQty}${item.unit} ${item.name} marked as Finished`,
      req.user.name,
      { itemId: item._id }
    );

    if (consumedQty > 0) {
      await recordTransaction({
        userId: req.user._id,
        itemId: item._id,
        itemName: item.name,
        category: item.category,
        quantity: consumedQty,
        unit: item.unit,
        pricePerUnit: item.pricePerUnit,
        type: 'consumed',
      });
    }

    sendSuccess(res, formatItem(updated), 'Item marked as finished');
  })
);

export default router;
