import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  authApi,
  itemsApi,
  ordersApi,
  dashboardApi,
  usersApi,
  transactionsApi,
  recurringApi,
  getToken,
  setToken,
} from '../services/api';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const today = new Date();

  const [user, setUser] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [fridgeItems, setFridgeItems] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [orderHistory, setOrderHistory] = useState([]);
  const [budget, setBudgetState] = useState(4000);
  const [notificationPrefs, setNotificationPrefs] = useState({
    dailySummary: true,
    summaryTime: '08:00',
    expiryAlerts: '1',
    lowStockAlerts: true,
    reorderReminders: true,
    weeklySummary: false,
  });
  const [pendingOrders, setPendingOrders] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notebookSummary, setNotebookSummary] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const refreshItems = useCallback(async () => {
    const { data } = await itemsApi.list();
    setFridgeItems(data || []);
    return data;
  }, []);

  const refreshReorderList = useCallback(async () => {
    try {
      const { data } = await ordersApi.reorderList();
      setPendingOrders(data || []);
    } catch {
      setPendingOrders([]);
    }
  }, []);

  const refreshOrderHistory = useCallback(async () => {
    const { data } = await ordersApi.list('history');
    setOrderHistory(data || []);
  }, []);

  const refreshDashboard = useCallback(async () => {
    const { data } = await dashboardApi.get();
    if (data?.activityLog) setActivityLog(data.activityLog);
    if (data?.stats) setDashboardStats(data.stats);
    return data;
  }, []);

  const refreshNotebookSummary = useCallback(async (month, year) => {
    const now = new Date();
    const m = month || now.getMonth() + 1;
    const y = year || now.getFullYear();
    const { data } = await transactionsApi.summary(m, y);
    setNotebookSummary(data);
    return data;
  }, []);

  const loadUserData = useCallback(async () => {
    try {
      const { data: userData } = await authApi.me();
      setUser(userData);
      setVendors(userData.vendors || []);
      setBudgetState(userData.budget ?? 4000);
      setNotificationPrefs(userData.notificationPrefs || notificationPrefs);

      await Promise.all([
        refreshItems(),
        refreshReorderList(),
        refreshOrderHistory(),
        refreshDashboard(),
        refreshNotebookSummary(),
        recurringApi.trigger().catch(() => {}),
      ]);
    } catch {
      setToken(null);
      setUser(null);
    }
  }, [refreshItems, refreshReorderList, refreshOrderHistory, refreshDashboard, refreshNotebookSummary]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      if (getToken()) {
        await loadUserData();
      }
      setLoading(false);
    };
    init();
  }, [loadUserData]);

  const alerts = fridgeItems.reduce((acc, item) => {
    const itemAlerts = [];

    if (item.expiryDate) {
      const expDate = new Date(item.expiryDate);
      const diffTime = expDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        itemAlerts.push({
          id: `alert-exp-${item.id}`,
          itemId: item.id,
          itemName: item.name,
          type: 'expired',
          severity: 'red',
          message: `"${item.name} expired ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} ago"`,
          actionType: 'expired',
        });
      } else if (diffDays <= 3) {
        itemAlerts.push({
          id: `alert-exp-${item.id}`,
          itemId: item.id,
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
        id: `alert-qty-${item.id}`,
        itemId: item.id,
        itemName: item.name,
        type: 'low-stock',
        severity: 'orange',
        message: `"${item.name} below threshold (${item.quantity}${item.unit} left)"`,
        actionType: 'low-stock',
      });
    }

    return [...acc, ...itemAlerts];
  }, []);

  const markFinished = async (itemId) => {
    const item = fridgeItems.find((i) => i.id === itemId);
    if (!item) return;

    try {
      await itemsApi.finish(itemId);
      await refreshItems();
      await refreshReorderList();
      await refreshDashboard();
      showToast(`${item.name} marked as finished!`, 'success');
      if (item.threshold > 0) {
        showToast(`${item.name} added to your Reorder list`, 'warning');
      }
    } catch (err) {
      showToast(err.message || 'Failed to mark item as finished', 'error');
    }
  };

  const removeItem = async (itemId) => {
    const item = fridgeItems.find((i) => i.id === itemId);
    if (!item) return;

    try {
      await itemsApi.delete(itemId);
      await refreshItems();
      await refreshDashboard();
      showToast(`${item.name} removed successfully`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to remove item', 'error');
    }
  };

  const useNow = async (itemId) => {
    const item = fridgeItems.find((i) => i.id === itemId);
    if (!item) return;

    let nextQty = item.quantity;
    if (item.unit === 'kg' || item.unit === 'L') {
      nextQty = Math.max(0, parseFloat((item.quantity - 0.25).toFixed(2)));
    } else {
      nextQty = Math.max(0, item.quantity - 1);
    }

    if (nextQty === 0) {
      await markFinished(itemId);
    } else {
      try {
        await itemsApi.update(itemId, { quantity: nextQty });
        await refreshItems();
        await refreshDashboard();
        showToast(`Updated quantity of ${item.name} to ${nextQty}${item.unit}`, 'success');
      } catch (err) {
        showToast(err.message || 'Failed to update item', 'error');
      }
    }
  };

  const extendDate = async (itemId, days = 3) => {
    const item = fridgeItems.find((i) => i.id === itemId);
    if (!item) return;

    const baseDate = item.expiryDate ? new Date(item.expiryDate) : today;
    baseDate.setDate(baseDate.getDate() + days);
    const newExpiry = baseDate.toISOString().split('T')[0];

    try {
      await itemsApi.update(itemId, { expiryDate: newExpiry });
      await refreshItems();
      await refreshDashboard();
      showToast(`Expiry of ${item.name} extended to ${newExpiry}`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to extend expiry', 'error');
    }
  };

  const addItem = async (item, merge = false) => {
    try {
      const { data, status } = await itemsApi.create({ ...item, merge });
      if (status === 409 && data?.duplicate) {
        return { duplicate: data.duplicate };
      }
      await refreshItems();
      await refreshDashboard();
      showToast(`${item.name} added successfully`, 'success');
      return { success: true, item: data };
    } catch (err) {
      showToast(err.message || 'Failed to add item', 'error');
      return { error: err.message };
    }
  };

  const editItem = async (itemId, updatedFields) => {
    try {
      await itemsApi.update(itemId, updatedFields);
      await refreshItems();
      await refreshReorderList();
      await refreshDashboard();
      const name = updatedFields.name || fridgeItems.find((i) => i.id === itemId)?.name || '';
      showToast(`${name} details updated`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update item', 'error');
    }
  };

  const addVendor = async (vendor) => {
    try {
      const { data } = await usersApi.addVendor(vendor);
      setUser(data);
      setVendors(data.vendors || []);
      showToast(`Vendor ${vendor.name} added!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add vendor', 'error');
    }
  };

  const updateVendor = async (vendorId, fields) => {
    try {
      const { data } = await usersApi.updateVendor(vendorId, fields);
      setUser(data);
      setVendors(data.vendors || []);
      showToast('Vendor details updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update vendor', 'error');
    }
  };

  const removeVendor = async (vendorId) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    try {
      const { data } = await usersApi.removeVendor(vendorId);
      setUser(data);
      setVendors(data.vendors || []);
      if (vendor) showToast(`Vendor ${vendor.name} removed`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to remove vendor', 'error');
    }
  };

  const addManualReorderItem = async (item) => {
    try {
      await ordersApi.create({
        vendorId: item.vendorId || '',
        vendorName: vendors.find((v) => v.id === item.vendorId)?.name || 'Vendor',
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || 'pcs',
        category: item.category,
      });
      await refreshReorderList();
      showToast(`${item.name} added to pending orders`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to add reorder item', 'error');
    }
  };

  const removeReorderItem = (itemId) => {
    setPendingOrders((prev) => prev.filter((p) => p.id !== itemId));
    showToast('Item removed from pending orders', 'success');
  };

  const updateReorderQty = (itemId, quantity) => {
    setPendingOrders((prev) =>
      prev.map((p) => (p.id === itemId ? { ...p, quantity: Math.max(0.1, quantity) } : p))
    );
  };

  const updateReorderVendor = (itemId, vendorId) => {
    setPendingOrders((prev) =>
      prev.map((p) => (p.id === itemId ? { ...p, vendorId } : p))
    );
  };

  const updateReorderRecurring = async (itemId, recurring) => {
    const entry = pendingOrders.find((p) => p.id === itemId);
    if (!entry) return;

    setPendingOrders((prev) =>
      prev.map((p) => (p.id === itemId ? { ...p, recurring } : p))
    );

    if (recurring !== 'none') {
      try {
        const freqMap = { daily: 'daily', '2days': 'every_2_days', weekly: 'weekly' };
        await recurringApi.create({
          itemId: entry.itemId,
          name: entry.name,
          category: entry.category,
          quantity: entry.quantity,
          unit: entry.unit,
          vendorId: entry.vendorId,
          frequency: freqMap[recurring] || recurring,
        });
      } catch {
        // recurring save is best-effort
      }
    }

    showToast(`Recurring frequency updated to ${recurring}`, 'success');
  };

  const sendWhatsAppOrder = async (vendorId, messageText, orderedItems) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    if (!vendor) return;

    try {
      await ordersApi.sendBatch({
        vendorId,
        vendorName: vendor.name,
        vendorContact: vendor.contact,
        messageText,
        items: orderedItems.map((o) => ({
          name: o.name,
          quantity: o.quantity,
          unit: o.unit,
          itemId: o.itemId,
        })),
      });

      await Promise.all([refreshItems(), refreshReorderList(), refreshOrderHistory(), refreshDashboard()]);
      showToast(`Order sent to ${vendor.name}!`, 'success');
    } catch (err) {
      showToast(err.message || 'Failed to send order', 'error');
    }
  };

  const reorderSameItems = async (historyItems, vendorId) => {
    const vendor = vendors.find((v) => v.id === vendorId);
    try {
      await ordersApi.reorderSame({
        items: historyItems,
        vendorId,
        vendorName: vendor?.name || 'Vendor',
        vendorContact: vendor?.contact || '',
      });
      await refreshReorderList();
      showToast('Items added back into pending orders!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to reorder items', 'error');
    }
  };

  const updateThreshold = async (itemId, thresholdValue) => {
    try {
      await itemsApi.update(itemId, { threshold: Math.max(0, thresholdValue) });
      await refreshItems();
      await refreshReorderList();
      showToast('Threshold limit updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update threshold', 'error');
    }
  };

  const resetThresholds = async () => {
    try {
      await usersApi.resetThresholds();
      await refreshItems();
      await refreshReorderList();
      showToast('Thresholds reset based on family size', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to reset thresholds', 'error');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const { data } = await usersApi.updateProfile(profileData);
      setUser(data);
      setVendors(data.vendors || []);
      showToast('Profile information updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile', 'error');
    }
  };

  const setBudget = async (value) => {
    try {
      const { data } = await usersApi.updateBudget(value);
      setUser(data);
      setBudgetState(data.budget);
      showToast('Budget updated', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update budget', 'error');
    }
  };

  const setNotificationPrefsHandler = async (prefs) => {
    try {
      const { data } = await usersApi.updateNotifications(prefs);
      setUser(data);
      setNotificationPrefs(data.notificationPrefs);
    } catch (err) {
      showToast(err.message || 'Failed to update notifications', 'error');
    }
  };

  const deleteAccount = async () => {
    try {
      await usersApi.deleteAccount();
      setToken(null);
      setUser(null);
      setVendors([]);
      setFridgeItems([]);
      setActivityLog([]);
      setOrderHistory([]);
      setPendingOrders([]);
      setBudgetState(4000);
      showToast('Account deleted successfully', 'error');
    } catch (err) {
      showToast(err.message || 'Failed to delete account', 'error');
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await authApi.login({ email, password });
      setToken(data.token);
      setUser(data.user);
      setVendors(data.user.vendors || []);
      setBudgetState(data.user.budget ?? 4000);
      setNotificationPrefs(data.user.notificationPrefs || notificationPrefs);

      await Promise.all([
        refreshItems(),
        refreshReorderList(),
        refreshOrderHistory(),
        refreshDashboard(),
        refreshNotebookSummary(),
      ]);

      showToast(`Welcome back, ${data.user.name.split(' ')[0]}!`, 'success');
      return true;
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
      return false;
    }
  };

  const signup = async (signupData) => {
    try {
      const { data } = await authApi.register({
        name: signupData.name,
        email: signupData.email,
        password: signupData.password,
        mobile: signupData.mobile,
        familySize: signupData.familySize,
        language: signupData.language,
        vendors: signupData.vendors,
        items: signupData.items,
      });

      setToken(data.token);
      setUser(data.user);
      setVendors(data.user.vendors || []);
      setBudgetState(data.user.budget ?? 4000);

      await Promise.all([
        refreshItems(),
        refreshReorderList(),
        refreshOrderHistory(),
        refreshDashboard(),
      ]);

      showToast('FridgeFlow onboarding complete!', 'success');
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // logout even if API fails
    }
    setToken(null);
    setUser(null);
    showToast('Logged out successfully', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        user,
        vendors,
        fridgeItems,
        setFridgeItems,
        alerts,
        activityLog,
        toasts,
        loading,
        notebookSummary,
        dashboardStats,
        refreshNotebookSummary,
        showToast,
        markFinished,
        removeItem,
        useNow,
        extendDate,
        login,
        signup,
        logout,
        addItem,
        editItem,
        addVendor,
        updateVendor,
        removeVendor,
        pendingOrders,
        addManualReorderItem,
        removeReorderItem,
        updateReorderQty,
        updateReorderVendor,
        updateReorderRecurring,
        sendWhatsAppOrder,
        orderHistory,
        reorderSameItems,
        budget,
        setBudget,
        updateThreshold,
        resetThresholds,
        updateProfile,
        deleteAccount,
        notificationPrefs,
        setNotificationPrefs: setNotificationPrefsHandler,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
