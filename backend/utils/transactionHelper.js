import Transaction from '../models/Transaction.js';
import DatabaseService from './dbService.js';

export const recordTransaction = async ({
  userId,
  itemId,
  itemName,
  category,
  quantity,
  unit,
  pricePerUnit,
  type,
}) => {
  return DatabaseService.create(Transaction, {
    userId,
    itemId,
    itemName,
    category: category || 'Other',
    quantity: Math.abs(quantity),
    unit: unit || 'pcs',
    pricePerUnit: pricePerUnit ?? 0,
    type,
    date: new Date(),
  });
};
