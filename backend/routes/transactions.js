import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { protect } from '../middleware/auth.js';
import { formatTransaction } from '../utils/formatters.js';
import DatabaseService from '../utils/dbService.js';
import Transaction from '../models/Transaction.js';

const router = Router();

router.use(protect);

// GET /api/transactions/summary — must be before /:id routes
router.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);

    const [currentAgg, prevAgg, wasteAgg, itemCountAgg] = await Promise.all([
      DatabaseService.aggregate(Transaction, [
        {
          $match: {
            userId: req.user._id,
            date: { $gte: startDate, $lte: endDate },
            type: { $in: ['added', 'adjusted'] },
          },
        },
        {
          $group: {
            _id: '$category',
            total: { $sum: { $multiply: ['$quantity', '$pricePerUnit'] } },
            count: { $sum: 1 },
          },
        },
      ]),
      DatabaseService.aggregate(Transaction, [
        {
          $match: {
            userId: req.user._id,
            date: { $gte: prevStart, $lte: prevEnd },
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
      DatabaseService.aggregate(Transaction, [
        {
          $match: {
            userId: req.user._id,
            date: { $gte: startDate, $lte: endDate },
            type: 'expired',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ['$quantity', '$pricePerUnit'] } },
            count: { $sum: 1 },
          },
        },
      ]),
      DatabaseService.aggregate(Transaction, [
        {
          $match: {
            userId: req.user._id,
            date: { $gte: startDate, $lte: endDate },
          },
        },
        {
          $group: {
            _id: '$itemId',
          },
        },
        { $count: 'count' },
      ]),
    ]);

    const categories = ['Dairy', 'Vegetables', 'Fruits', 'Dry Goods', 'Beverages', 'Snacks', 'Leftovers', 'Other'];
    const spends = {};
    categories.forEach((cat) => { spends[cat] = 0; });

    let totalSpent = 0;
    currentAgg.forEach((row) => {
      const amount = Math.round(row.total);
      spends[row._id || 'Other'] = amount;
      totalSpent += amount;
    });

    const prevTotal = Math.round(prevAgg[0]?.total || 0);
    const wasteCost = Math.round(wasteAgg[0]?.total || 0);
    const wasteCount = wasteAgg[0]?.count || 0;
    const itemsCount = itemCountAgg[0]?.count || 0;

    const budget = req.user.budget || 0;
    const budgetUsed = budget > 0 ? Math.round((totalSpent / budget) * 100) : 0;

    sendSuccess(res, {
      month,
      year,
      totalSpent,
      prevTotal,
      spends,
      wasteCost,
      wasteCount,
      itemsCount,
      budget,
      budgetUsed,
      monthLabel: startDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
    }, 'Spending summary retrieved');
  })
);

// GET /api/transactions
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = { userId: req.user._id };

    if (req.query.type) filter.type = req.query.type;
    if (req.query.category) filter.category = req.query.category;

    if (req.query.month && req.query.year) {
      const year = parseInt(req.query.year, 10);
      const month = parseInt(req.query.month, 10);
      filter.date = {
        $gte: new Date(year, month - 1, 1),
        $lte: new Date(year, month, 0, 23, 59, 59, 999),
      };
    }

    const { docs } = await DatabaseService.findMany(Transaction, filter, {
      sort: { date: -1 },
      limit: 200,
    });

    sendSuccess(res, docs.map(formatTransaction), 'Transactions retrieved');
  })
);

// POST /api/transactions
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { itemId, itemName, category, quantity, unit, pricePerUnit, type } = req.body;

    if (!itemId || !itemName || !type) {
      return sendError(res, 'itemId, itemName, and type are required', 400);
    }

    const tx = await DatabaseService.create(Transaction, {
      userId: req.user._id,
      itemId,
      itemName,
      category: category || 'Other',
      quantity: Math.abs(quantity),
      unit: unit || 'pcs',
      pricePerUnit: pricePerUnit ?? 0,
      type,
      date: new Date(),
    });

    sendSuccess(res, formatTransaction(tx), 'Transaction recorded', 201);
  })
);

export default router;
