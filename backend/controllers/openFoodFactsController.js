import { searchProducts, lookupProductByBarcode } from '../services/openFoodFactsService.js';
import { sendSuccess } from '../utils/response.js';

export const searchOpenFoodFacts = async (req, res) => {
  const query = req.query.q || req.query.query || '';
  try {
    const products = await searchProducts(query, 10);
    return sendSuccess(res, products, 'Product suggestions retrieved');
  } catch (error) {
    if (error.message === 'Open Food Facts temporarily unavailable') {
      return sendSuccess(res, [], 'Open Food Facts temporarily unavailable; enter item manually');
    }
    throw error;
  }
};

export const lookupOpenFoodFactsBarcode = async (req, res) => {
  const barcode = req.params.code;
  const product = await lookupProductByBarcode(barcode);
  return sendSuccess(res, product, 'Barcode product retrieved');
};
