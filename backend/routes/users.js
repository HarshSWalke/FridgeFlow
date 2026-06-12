import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { protect } from '../middleware/auth.js';
import { formatUser } from '../utils/formatters.js';
import { logActivity } from '../utils/activityHelper.js';
import DatabaseService from '../utils/dbService.js';
import User from '../models/User.js';
import Item from '../models/Item.js';
import Order from '../models/Order.js';
import Transaction from '../models/Transaction.js';
import ActivityLog from '../models/ActivityLog.js';
import RecurringItem from '../models/RecurringItem.js';

const router = Router();

router.use(protect);

// PATCH /api/users/profile
router.patch(
  '/profile',
  asyncHandler(async (req, res) => {
    const allowed = ['name', 'email', 'mobile', 'familySize', 'language', 'countryCode'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await DatabaseService.updateById(User, req.user._id, updates);

    await logActivity(req.user._id, 'settings_updated', 'Profile information updated', user.name);

    sendSuccess(res, formatUser(user), 'Profile updated');
  })
);

// PATCH /api/users/budget
router.patch(
  '/budget',
  asyncHandler(async (req, res) => {
    const { budget } = req.body;
    if (budget === undefined || budget < 0) {
      return sendError(res, 'Valid budget amount is required', 400);
    }

    const user = await DatabaseService.updateById(User, req.user._id, { budget });

    await logActivity(req.user._id, 'budget_updated', `Monthly budget set to ₹${budget}`, user.name);

    sendSuccess(res, formatUser(user), 'Budget updated');
  })
);

// PATCH /api/users/notifications
router.patch(
  '/notifications',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const prefs = user.notificationPrefs?.toObject?.() || { ...user.notificationPrefs };
    user.notificationPrefs = { ...prefs, ...req.body };
    await user.save();

    await logActivity(req.user._id, 'settings_updated', 'Notification preferences updated', user.name);

    sendSuccess(res, formatUser(user), 'Notification preferences updated');
  })
);

// POST /api/users/vendors
router.post(
  '/vendors',
  asyncHandler(async (req, res) => {
    const { name, contact, category, emoji } = req.body;
    if (!name?.trim()) {
      return sendError(res, 'Vendor name is required', 400);
    }

    const user = await User.findById(req.user._id);
    user.vendors.push({
      name: name.trim(),
      contact: contact || '',
      category: category || '',
      emoji: emoji || '🛒',
    });
    await user.save();

    await logActivity(req.user._id, 'vendor_added', `Added vendor ${name.trim()}`, user.name);

    sendSuccess(res, formatUser(user), 'Vendor added', 201);
  })
);

// PATCH /api/users/vendors/:vendorId
router.patch(
  '/vendors/:vendorId',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const vendor = user.vendors.id(req.params.vendorId);

    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    const allowed = ['name', 'contact', 'category', 'emoji'];
    for (const key of allowed) {
      if (req.body[key] !== undefined) vendor[key] = req.body[key];
    }

    await user.save();
    sendSuccess(res, formatUser(user), 'Vendor updated');
  })
);

// DELETE /api/users/vendors/:vendorId
router.delete(
  '/vendors/:vendorId',
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    const vendor = user.vendors.id(req.params.vendorId);

    if (!vendor) {
      return sendError(res, 'Vendor not found', 404);
    }

    const vendorName = vendor.name;
    vendor.deleteOne();
    await user.save();

    await logActivity(req.user._id, 'vendor_removed', `Removed vendor ${vendorName}`, user.name);

    sendSuccess(res, formatUser(user), 'Vendor removed');
  })
);

// POST /api/users/thresholds/reset
router.post(
  '/thresholds/reset',
  asyncHandler(async (req, res) => {
    const fs = req.user.familySize || '3';
    const mult = fs === '1' ? 0.5 : fs === '2' ? 1.0 : fs === '3' || fs === '4' ? 1.5 : 2.5;

    const items = await Item.find({ userId: req.user._id });

    for (const item of items) {
      let defaultVal = 0.5;
      const lower = item.name.toLowerCase();
      if (lower.includes('milk')) defaultVal = 1.0;
      else if (lower.includes('curd')) defaultVal = 250;
      else if (lower.includes('paneer')) defaultVal = 100;
      else if (lower.includes('rice')) defaultVal = 1.0;
      else if (lower.includes('eggs')) defaultVal = 6;

      const nextThreshold = item.unit === 'g' || item.unit === 'mL'
        ? Math.ceil(defaultVal * mult)
        : parseFloat((defaultVal * mult).toFixed(1));

      item.threshold = nextThreshold;
      await item.save();
    }

    await logActivity(req.user._id, 'threshold_updated', 'Thresholds reset based on family size', req.user.name);

    sendSuccess(res, null, 'Thresholds reset');
  })
);

// DELETE /api/users/account
router.delete(
  '/account',
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Promise.all([
      Item.deleteMany({ userId }),
      Order.deleteMany({ userId }),
      Transaction.deleteMany({ userId }),
      ActivityLog.deleteMany({ userId }),
      RecurringItem.deleteMany({ userId }),
    ]);

    await User.findByIdAndDelete(userId);

    sendSuccess(res, null, 'Account deleted');
  })
);

export default router;
