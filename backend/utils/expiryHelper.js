import Item from '../models/Item.js';
import { logActivity } from './activityHelper.js';
import { recordTransaction } from './transactionHelper.js';

export const processExpiredItems = async (userId, userName = 'User') => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiredItems = await Item.find({
    userId,
    quantity: { $gt: 0 },
    expiryDate: { $lt: today },
  });

  for (const item of expiredItems) {
    const wastedQty = item.quantity;

    await recordTransaction({
      userId,
      itemId: item._id,
      itemName: item.name,
      category: item.category,
      quantity: wastedQty,
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      type: 'expired',
    });

    await logActivity(
      userId,
      'item_expired',
      `${wastedQty}${item.unit} ${item.name} expired and marked as waste`,
      userName,
      { itemId: item._id }
    );

    item.quantity = 0;
    await item.save();
  }

  return expiredItems.length;
};
