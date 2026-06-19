require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const Order = require('../models/Order');

const exportOrders = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const orders = await Order.find({ status: 'sent' });

  // Build a list of all unique item names
  const allItems = [...new Set(
    orders.flatMap(o => o.items.map(i => i.itemName))
  )];

  // Build CSV rows — one row per order
  const rows = orders.map(order => {
    const itemsInOrder = order.items.map(i => i.itemName);
    return allItems.map(item => itemsInOrder.includes(item) ? 'True' : 'False');
  });

  // Write CSV
  const header = allItems.join(',');
  const body = rows.map(r => r.join(',')).join('\n');
  fs.writeFileSync('orders.csv', `${header}\n${body}`);
  
  console.log(`Exported ${orders.length} orders with ${allItems.length} unique items`);
  mongoose.disconnect();
};

exportOrders();