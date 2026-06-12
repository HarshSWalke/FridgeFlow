import { Router } from 'express';
import bcrypt from 'bcryptjs';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { protect, signToken } from '../middleware/auth.js';
import { formatUser } from '../utils/formatters.js';
import { logActivity } from '../utils/activityHelper.js';
import DatabaseService from '../utils/dbService.js';
import User from '../models/User.js';
import Item from '../models/Item.js';

const router = Router();

const mapVendorIds = (signupVendors, savedVendors) => {
  const mapping = {};
  signupVendors.forEach((v, i) => {
    if (v.id && savedVendors[i]) {
      mapping[v.id] = savedVendors[i]._id.toString();
    }
  });
  return mapping;
};

// POST /api/auth/register
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, mobile, familySize, language, vendors, items, budget } = req.body;

    if (!name || !email || !password || !mobile) {
      return sendError(res, 'Name, email, password, and mobile are required', 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return sendError(res, 'An account with this email already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const vendorData = (vendors || []).map(({ name: vName, contact, category, emoji }) => ({
      name: vName,
      contact: contact || '',
      category: category || '',
      emoji: emoji || '🛒',
    }));

    const user = await DatabaseService.create(User, {
      name,
      email,
      password: hashedPassword,
      mobile,
      familySize: familySize || '3',
      language: language || 'English',
      vendors: vendorData,
      budget: budget ?? 4000,
    });

    const vendorIdMap = vendors?.length ? mapVendorIds(vendors, user.vendors) : {};

    if (items?.length) {
      const itemDocs = items.map((item) => ({
        userId: user._id,
        name: item.name,
        category: item.category,
        quantity: item.quantity ?? 0,
        unit: item.unit,
        threshold: item.threshold ?? 0,
        expiryDate: item.expiryDate || null,
        pricePerUnit: item.pricePerUnit ?? 0,
        addedBy: name.split(' ')[0] || 'User',
        vendorId: item.vendorId ? (vendorIdMap[item.vendorId] || item.vendorId) : '',
      }));
      await Item.insertMany(itemDocs);
    }

    await logActivity(user._id, 'user_signup', 'Account created & configured', name);

    const token = signToken(user._id);

    sendSuccess(
      res,
      { token, user: formatUser(user) },
      'Registration successful',
      201
    );
  })
);

// POST /api/auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Email and password are required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    user.password = undefined;

    await logActivity(user._id, 'user_login', 'User logged in', user.name);

    const token = signToken(user._id);

    sendSuccess(res, { token, user: formatUser(user) }, 'Login successful');
  })
);

// POST /api/auth/logout
router.post(
  '/logout',
  protect,
  asyncHandler(async (req, res) => {
    await logActivity(req.user._id, 'user_logout', 'User logged out', req.user.name);
    sendSuccess(res, null, 'Logged out successfully');
  })
);

// GET /api/auth/me
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    sendSuccess(res, formatUser(req.user), 'User retrieved');
  })
);

export default router;
