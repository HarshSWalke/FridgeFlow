import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { protect } from '../middleware/auth.js';
import { logActivity } from '../utils/activityHelper.js';
import DatabaseService from '../utils/dbService.js';
import RecurringItem from '../models/RecurringItem.js';
import Order from '../models/Order.js';

const router = Router();

router.use(protect);

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

// GET /api/recurring
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { docs } = await DatabaseService.findMany(
      RecurringItem,
      { userId: req.user._id, isActive: true },
      { sort: { nextScheduledDate: 1 }, limit: 100 }
    );

    sendSuccess(res, docs, 'Recurring items retrieved');
  })
);

// GET /api/recurring/suggestions — due items for auto reorder
router.get(
  '/suggestions',
  asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dueItems = await RecurringItem.find({
      userId: req.user._id,
      isActive: true,
      nextScheduledDate: { $lte: today },
    });

    const suggestions = dueItems.map((r) => ({
      id: r._id.toString(),
      itemId: r.itemId?.toString() || null,
      name: r.name,
      category: r.category,
      quantity: r.quantity,
      unit: r.unit,
      vendorId: r.vendorId,
      frequency: r.frequency,
      source: 'recurring',
      recurring: r.frequency,
    }));

    sendSuccess(res, suggestions, 'Recurring suggestions retrieved');
  })
);

// POST /api/recurring
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { itemId, name, category, quantity, unit, vendorId, frequency } = req.body;

    if (!name || !quantity || !unit || !frequency) {
      return sendError(res, 'Name, quantity, unit, and frequency are required', 400);
    }

    const recurring = await DatabaseService.create(RecurringItem, {
      userId: req.user._id,
      itemId: itemId || null,
      name,
      category: category || 'Other',
      quantity,
      unit,
      vendorId: vendorId || '',
      frequency,
      nextScheduledDate: new Date(),
      isActive: true,
    });

    sendSuccess(res, recurring, 'Recurring item created', 201);
  })
);

// PATCH /api/recurring/:id
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const existing = await DatabaseService.findById(RecurringItem, req.params.id);
    if (!existing || existing.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Recurring item not found', 404);
    }

    const updates = {};
    const allowed = ['frequency', 'quantity', 'vendorId', 'isActive', 'name'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = await DatabaseService.updateById(RecurringItem, req.params.id, updates);
    sendSuccess(res, updated, 'Recurring item updated');
  })
);

// POST /api/recurring/trigger — process due recurring items into pending orders
router.post(
  '/trigger',
  asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const dueItems = await RecurringItem.find({
      userId: req.user._id,
      isActive: true,
      nextScheduledDate: { $lte: today },
    });

    const created = [];

    for (const recurring of dueItems) {
      const vendor = req.user.vendors?.find(
        (v) => v._id.toString() === recurring.vendorId
      );

      const order = await DatabaseService.create(Order, {
        userId: req.user._id,
        vendorId: recurring.vendorId || '',
        vendorName: vendor?.name || 'Vendor',
        vendorContact: vendor?.contact || '',
        items: [{
          name: recurring.name,
          quantity: recurring.quantity,
          unit: recurring.unit,
          itemId: recurring.itemId || null,
        }],
        status: 'pending',
      });

      recurring.lastTriggered = new Date();
      await recurring.save();

      await logActivity(
        req.user._id,
        'system',
        `Recurring reorder: ${recurring.name} (${recurring.frequencyLabel || recurring.frequency})`,
        req.user.name,
        { recurringId: recurring._id, orderId: order._id }
      );

      created.push(order);
    }

    sendSuccess(res, { triggered: created.length }, `${created.length} recurring items triggered`);
  })
);

export default router;
