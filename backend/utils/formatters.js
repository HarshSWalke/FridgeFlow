export const formatVendor = (vendor, index = 0) => ({
  id: vendor._id?.toString() || vendor.id || `v${index}`,
  name: vendor.name,
  contact: vendor.contact || '',
  category: vendor.category || '',
  emoji: vendor.emoji || '🛒',
});

export const formatUser = (user) => {
  const obj = user.toJSON ? user.toJSON() : user;
  return {
    id: obj._id?.toString() || obj.id,
    name: obj.name,
    email: obj.email,
    mobile: obj.mobile,
    countryCode: obj.countryCode || '+91',
    familySize: obj.familySize || '3',
    language: obj.language || 'English',
    vendors: (obj.vendors || []).map(formatVendor),
    budget: obj.budget ?? 0,
    notificationPrefs: obj.notificationPrefs || {},
  };
};

export const formatItem = (item) => {
  const obj = item.toJSON ? item.toJSON() : item;
  return {
    id: obj._id?.toString() || obj.id,
    name: obj.name,
    category: obj.category,
    quantity: obj.quantity,
    unit: obj.unit,
    threshold: obj.threshold ?? 0,
    dateAdded: obj.dateAdded
      ? new Date(obj.dateAdded).toISOString().split('T')[0]
      : null,
    expiryDate: obj.expiryDate
      ? new Date(obj.expiryDate).toISOString().split('T')[0]
      : null,
    pricePerUnit: obj.pricePerUnit ?? 0,
    addedBy: obj.addedBy || 'User',
    vendorId: obj.vendorId || '',
    freshness: obj.freshness,
    stockStatus: obj.stockStatus,
    totalValue: obj.totalValue,
  };
};

export const formatActivityLog = (log) => {
  const obj = log.toJSON ? log.toJSON() : log;
  return {
    id: obj._id?.toString() || obj.id,
    message: obj.message,
    time: obj.timeAgo || 'Just now',
    user: obj.performedBy || 'User',
    action: obj.action,
  };
};

export const formatOrder = (order) => {
  const obj = order.toJSON ? order.toJSON() : order;
  return {
    id: obj._id?.toString() || obj.id,
    vendorId: obj.vendorId,
    vendorName: obj.vendorName,
    vendorContact: obj.vendorContact || '',
    dateSent: obj.dateSent
      ? new Date(obj.dateSent).toISOString().split('T')[0]
      : null,
    status: obj.status,
    items: obj.items || [],
    messageText: obj.messageText || '',
    createdAt: obj.createdAt,
  };
};

export const formatPendingOrder = (entry) => ({
  id: entry.id,
  itemId: entry.itemId || null,
  name: entry.name,
  category: entry.category || 'Other',
  quantity: entry.quantity,
  unit: entry.unit,
  vendorId: entry.vendorId || '',
  source: entry.source || 'manual',
  recurring: entry.recurring || 'none',
});

export const formatTransaction = (tx) => {
  const obj = tx.toJSON ? tx.toJSON() : tx;
  return {
    id: obj._id?.toString() || obj.id,
    itemId: obj.itemId?.toString() || obj.itemId,
    itemName: obj.itemName,
    category: obj.category,
    quantity: obj.quantity,
    unit: obj.unit,
    pricePerUnit: obj.pricePerUnit,
    type: obj.type,
    date: obj.date,
    totalCost: obj.totalCost,
  };
};
