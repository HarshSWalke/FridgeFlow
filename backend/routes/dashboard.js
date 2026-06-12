import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import { protect } from '../middleware/auth.js';
import { formatActivityLog } from '../utils/formatters.js';
import { computeAlerts } from '../utils/alertsHelper.js';
import DatabaseService from '../utils/dbService.js';
import Item from '../models/Item.js';
import ActivityLog from '../models/ActivityLog.js';
import Transaction from '../models/Transaction.js';
import { processExpiredItems } from '../utils/expiryHelper.js';

const router = Router();

router.use(protect);

// GET /api/dashboard
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const [items, activityLogs, monthlySpendAgg] = await Promise.all([
      (async () => {
        await processExpiredItems(userId, req.user.name);
        return Item.find({ userId });
      })(),
      ActivityLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10),
      DatabaseService.aggregate(Transaction, [
        {
          $match: {
            userId,
            date: { $gte: startOfMonth, $lte: endOfMonth },
            type: { $in: ['added', 'adjusted'] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$quantity', '$pricePerUnit'] } },
          },
        },
      ]),
    ]);

    const activeItems = items.filter((i) => i.quantity > 0);
    const totalItems = activeItems.length;

    const expiringSoon = items.filter((item) => {
      if (!item.expiryDate || item.quantity <= 0) return false;
      const expiry = new Date(item.expiryDate);
      return expiry <= threeDaysFromNow;
    }).length;

    const lowStock = items.filter(
      (item) => item.quantity > 0 && item.quantity <= item.threshold
    ).length;

    const monthlySpend = Math.round(monthlySpendAgg[0]?.total || 0);
    const alerts = computeAlerts(items);

    sendSuccess(res, {
      stats: {
        totalItems,
        expiringSoon,
        lowStock,
        monthlySpend,
      },
      alerts,
      activityLog: activityLogs.map(formatActivityLog),
    }, 'Dashboard data retrieved');
  })
);

export default router;
