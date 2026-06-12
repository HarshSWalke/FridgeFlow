import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { protect } from '../middleware/auth.js';
import { formatOrder, formatPendingOrder } from '../utils/formatters.js';
import { logActivity } from '../utils/activityHelper.js';
import { recordTransaction } from '../utils/transactionHelper.js';
import DatabaseService from '../utils/dbService.js';
import Order from '../models/Order.js';
import Item from '../models/Item.js';
import RecurringItem from '../models/RecurringItem.js';

const router = Router();

router.use(protect);

const frequencyMap = {
  none: null,
  daily: 'daily',
  '2days': 'every_2_days',
  every_2_days: 'every_2_days',
  weekly: 'weekly',
};

// GET /api/orders/reorder — auto low-stock + pending manual orders
router.get(
  '/reorder',
  asyncHandler(async (req, res) => {
    const lowStockItems = await Item.find({
      userId: req.user._id,
      $expr: { $lte: ['$quantity', '$threshold'] },
    });

    const autoEntries = lowStockItems.map((item) => ({
      id: `auto-${item._id}`,
      itemId: item._id.toString(),
      name: item.name,
      category: item.category,
      quantity: Math.max(1, Math.ceil(item.threshold * 2 - item.quantity)),
      unit: item.unit,
      vendorId: item.vendorId || '',
      source: 'auto',
      recurring: 'none',
    }));

    const pendingOrders = await Order.find({
      userId: req.user._id,
      status: 'pending',
    });

    const manualEntries = pendingOrders.flatMap((order) =>
      order.items.map((oi, idx) => ({
        id: `${order._id}-${idx}`,
        orderId: order._id.toString(),
        itemId: oi.itemId?.toString() || null,
        name: oi.name,
        category: 'Other',
        quantity: oi.quantity,
        unit: oi.unit,
        vendorId: order.vendorId,
        source: 'manual',
        recurring: 'none',
      }))
    );

    const autoIds = new Set(autoEntries.map((e) => e.itemId));
    const filteredManual = manualEntries.filter(
      (m) => !m.itemId || !autoIds.has(m.itemId)
    );

    sendSuccess(
      res,
      [...autoEntries, ...filteredManual].map(formatPendingOrder),
      'Reorder list retrieved'
    );
  })
);

// GET /api/orders
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = { userId: req.user._id };

    if (req.query.status) {
      if (req.query.status === 'history') {
        filter.status = { $in: ['sent', 'confirmed', 'delivered'] };
      } else {
        filter.status = req.query.status;
      }
    }

    const { docs } = await DatabaseService.findMany(Order, filter, {
      sort: { createdAt: -1 },
      limit: 100,
    });

    sendSuccess(res, docs.map(formatOrder), 'Orders retrieved');
  })
);

// GET /api/orders/:id
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await DatabaseService.findById(Order, req.params.id);
    if (!order || order.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Order not found', 404);
    }
    sendSuccess(res, formatOrder(order), 'Order retrieved');
  })
);

// POST /api/orders
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { vendorId, vendorName, vendorContact, items, messageText, recurring, itemId, name, quantity, unit, category } = req.body;

    if (name && (!items || items.length === 0)) {
      const vendor = req.user.vendors?.find(
        (v) => v._id.toString() === vendorId || v.id === vendorId
      );

      const order = await DatabaseService.create(Order, {
        userId: req.user._id,
        vendorId: vendorId || '',
        vendorName: vendorName || vendor?.name || 'Unknown Vendor',
        vendorContact: vendorContact || vendor?.contact || '',
        items: [{
          name,
          quantity: quantity || 1,
          unit: unit || 'pcs',
          itemId: itemId || null,
        }],
        status: 'pending',
        messageText: messageText || '',
      });

      if (recurring && recurring !== 'none') {
        const freq = frequencyMap[recurring] || recurring;
        if (freq) {
          await DatabaseService.create(RecurringItem, {
            userId: req.user._id,
            itemId: itemId || null,
            name,
            category: category || 'Other',
            quantity: quantity || 1,
            unit: unit || 'pcs',
            vendorId: vendorId || '',
            frequency: freq,
            nextScheduledDate: new Date(),
            isActive: true,
          });
        }
      }

      await logActivity(
        req.user._id,
        'system',
        `${name} added to reorder list`,
        req.user.name,
        { orderId: order._id }
      );

      return sendSuccess(res, formatOrder(order), 'Item added to reorder', 201);
    }

    if (!vendorId || !vendorName || !items?.length) {
      return sendError(res, 'Vendor and items are required', 400);
    }

    const order = await DatabaseService.create(Order, {
      userId: req.user._id,
      vendorId,
      vendorName,
      vendorContact: vendorContact || '',
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        itemId: i.itemId || null,
      })),
      status: 'pending',
      messageText: messageText || '',
    });

    sendSuccess(res, formatOrder(order), 'Order created', 201);
  })
);

// PATCH /api/orders/:id/send
router.patch(
  '/:id/send',
  asyncHandler(async (req, res) => {
    const order = await DatabaseService.findById(Order, req.params.id);
    if (!order || order.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Order not found', 404);
    }

    const updates = {
      status: 'sent',
      dateSent: new Date(),
    };
    if (req.body.messageText) updates.messageText = req.body.messageText;

    const updated = await DatabaseService.updateById(Order, req.params.id, updates);

    for (const oi of updated.items) {
      if (oi.itemId) {
        const item = await DatabaseService.findById(Item, oi.itemId);
        if (item && item.userId.toString() === req.user._id.toString()) {
          const newQty = parseFloat((item.quantity + oi.quantity).toFixed(2));
          await DatabaseService.updateById(Item, oi.itemId, { quantity: newQty });

          await recordTransaction({
            userId: req.user._id,
            itemId: item._id,
            itemName: item.name,
            category: item.category,
            quantity: oi.quantity,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit,
            type: 'added',
          });
        }
      }
    }

    await logActivity(
      req.user._id,
      'order_sent',
      `Reorder sent to ${updated.vendorName}`,
      req.user.name,
      { orderId: updated._id }
    );

    sendSuccess(res, formatOrder(updated), 'Order sent');
  })
);

// PATCH /api/orders/:id/confirm
router.patch(
  '/:id/confirm',
  asyncHandler(async (req, res) => {
    const order = await DatabaseService.findById(Order, req.params.id);
    if (!order || order.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Order not found', 404);
    }

    const updated = await DatabaseService.updateById(Order, req.params.id, {
      status: 'confirmed',
    });

    await logActivity(
      req.user._id,
      'order_confirmed',
      `Order from ${updated.vendorName} confirmed`,
      req.user.name,
      { orderId: updated._id }
    );

    sendSuccess(res, formatOrder(updated), 'Order confirmed');
  })
);

// PATCH /api/orders/:id — update status or pending item qty
router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await DatabaseService.findById(Order, req.params.id);
    if (!order || order.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Order not found', 404);
    }

    const updates = {};
    if (req.body.status) updates.status = req.body.status;
    if (req.body.messageText) updates.messageText = req.body.messageText;

    if (req.body.items) {
      updates.items = req.body.items;
    }

    const updated = await DatabaseService.updateById(Order, req.params.id, updates);
    sendSuccess(res, formatOrder(updated), 'Order updated');
  })
);

// DELETE /api/orders/:id — remove pending order
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await DatabaseService.findById(Order, req.params.id);
    if (!order || order.userId.toString() !== req.user._id.toString()) {
      return sendError(res, 'Order not found', 404);
    }

    await DatabaseService.deleteById(Order, req.params.id);
    sendSuccess(res, null, 'Order removed');
  })
);

// POST /api/orders/send-batch — send WhatsApp order for vendor group (frontend helper)
router.post(
  '/send-batch',
  asyncHandler(async (req, res) => {
    const { vendorId, vendorName, vendorContact, items, messageText } = req.body;

    if (!vendorId || !items?.length) {
      return sendError(res, 'Vendor and items are required', 400);
    }

    const order = await DatabaseService.create(Order, {
      userId: req.user._id,
      vendorId,
      vendorName: vendorName || 'Vendor',
      vendorContact: vendorContact || '',
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        itemId: i.itemId || null,
      })),
      status: 'sent',
      dateSent: new Date(),
      messageText: messageText || '',
    });

    for (const oi of order.items) {
      if (oi.itemId) {
        const item = await DatabaseService.findById(Item, oi.itemId);
        if (item && item.userId.toString() === req.user._id.toString()) {
          const newQty = parseFloat((item.quantity + oi.quantity).toFixed(2));
          await DatabaseService.updateById(Item, oi.itemId, { quantity: newQty });

          await recordTransaction({
            userId: req.user._id,
            itemId: item._id,
            itemName: item.name,
            category: item.category,
            quantity: oi.quantity,
            unit: item.unit,
            pricePerUnit: item.pricePerUnit,
            type: 'added',
          });
        }
      }
    }

    await logActivity(
      req.user._id,
      'order_sent',
      `Reorder sent to ${order.vendorName}`,
      req.user.name,
      { orderId: order._id }
    );

    sendSuccess(res, formatOrder(order), 'Order sent', 201);
  })
);

// POST /api/orders/reorder-same — restore items from history
router.post(
  '/reorder-same',
  asyncHandler(async (req, res) => {
    const { items, vendorId, vendorName, vendorContact } = req.body;

    if (!items?.length) {
      return sendError(res, 'Items are required', 400);
    }

    const order = await DatabaseService.create(Order, {
      userId: req.user._id,
      vendorId: vendorId || '',
      vendorName: vendorName || 'Vendor',
      vendorContact: vendorContact || '',
      items: items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        itemId: i.itemId || null,
      })),
      status: 'pending',
    });

    sendSuccess(res, formatOrder(order), 'Items added to pending orders', 201);
  })
);

export default router;
