import { Router } from 'express';
import asyncHandler from '../utils/asyncHandler.js';
import { searchOpenFoodFacts, lookupOpenFoodFactsBarcode } from '../controllers/openFoodFactsController.js';

const router = Router();

router.get('/search', asyncHandler(searchOpenFoodFacts));
router.get('/barcode/:code', asyncHandler(lookupOpenFoodFactsBarcode));

export default router;
