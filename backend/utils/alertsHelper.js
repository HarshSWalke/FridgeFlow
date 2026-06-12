export const computeAlerts = (items) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return items.reduce((acc, item) => {
    const itemAlerts = [];
    const itemId = item._id?.toString() || item.id;

    if (item.expiryDate) {
      const expDate = new Date(item.expiryDate);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        itemAlerts.push({
          id: `alert-exp-${itemId}`,
          itemId,
          itemName: item.name,
          type: 'expired',
          severity: 'red',
          message: `"${item.name} expired ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} ago"`,
          actionType: 'expired',
        });
      } else if (diffDays <= 3) {
        itemAlerts.push({
          id: `alert-exp-${itemId}`,
          itemId,
          itemName: item.name,
          type: 'expiring',
          severity: 'yellow',
          message: `"${item.name} expiring ${diffDays === 0 ? 'today' : diffDays === 1 ? 'tomorrow' : `in ${diffDays} days`}"`,
          actionType: 'expiring',
        });
      }
    }

    if (item.quantity <= item.threshold && item.quantity > 0) {
      itemAlerts.push({
        id: `alert-qty-${itemId}`,
        itemId,
        itemName: item.name,
        type: 'low-stock',
        severity: 'orange',
        message: `"${item.name} below threshold (${item.quantity}${item.unit} left)"`,
        actionType: 'low-stock',
      });
    }

    return [...acc, ...itemAlerts];
  }, []);
};
