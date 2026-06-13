import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { convertCurrency } from '../controllers/exchangeRateController.js';

const router = Router();

router.get('/convert', asyncHandler(convertCurrency));

export default router;
