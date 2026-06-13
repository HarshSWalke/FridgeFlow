import { fetchExchangeRate } from '../services/exchangeRateService.js';
import { sendError, sendSuccess } from '../utils/response.js';

export const convertCurrency = async (req, res) => {
  const base = (req.query.base || 'INR').toUpperCase();
  const target = (req.query.target || 'USD').toUpperCase();
  const amount = Number(req.query.amount || 1);

  if (!base || !target) {
    return res.status(400).json({ success: false, message: 'Base and target currencies are required' });
  }

  try {
    const rate = await fetchExchangeRate(base, target);
    const converted = Math.round((amount * rate + Number.EPSILON) * 100) / 100;
    return sendSuccess(res, { base, target, amount, rate, converted }, 'Exchange rate retrieved');
  } catch (error) {
    return sendError(res, error.message || 'Exchange rate retrieval failed', error.statusCode || 502);
  }
};
