import React, { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import './Settings.css';

const TABS = ['Profile', 'Vendors', 'Notifications', 'Thresholds', 'Data'];

export default function Settings() {
  const {
    user,
    updateProfile,
    vendors,
    addVendor,
    updateVendor,
    removeVendor,
    notificationPrefs,
    setNotificationPrefs,
    fridgeItems,
    updateThreshold,
    resetThresholds,
    deleteAccount,
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('Profile');

  // Local state for profile editing
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    familySize: user?.familySize || '3',
    language: user?.language || 'English'
  });

  // Vendor form state
  const [newVendor, setNewVendor] = useState({ name: '', contact: '', category: '', emoji: '' });

  // Notification prefs local copy
  const [notifPrefs, setNotifPrefs] = useState({ ...notificationPrefs });

  // Handlers
  const handleProfileSave = () => {
    updateProfile(profileData);
  };

  const handleAddVendor = () => {
    if (newVendor.name.trim()) {
      addVendor(newVendor);
      setNewVendor({ name: '', contact: '', category: '', emoji: '' });
    }
  };

  const handleVendorUpdate = (id, field, value) => {
    updateVendor(id, { [field]: value });
  };

  const handleNotifChange = (key, value) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    setNotificationPrefs(updated);
  };

  const handleThresholdChange = (itemId, val) => {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      updateThreshold(itemId, num);
    }
  };

  const confirmAndDelete = () => {
    if (window.confirm('This action will permanently delete your account and all data. Continue?')) {
      deleteAccount();
    }
  };

  return (
    <div className="settings-page glass">
      <div className="settings-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={tab === activeTab ? 'tab active' : 'tab'}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="settings-content">
        {activeTab === 'Profile' && (
          <div className="tab-panel profile-tab">
            <h2>Profile</h2>
            <div className="form-grid">
              <label>Name</label>
              <input type="text" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} />
              <label>Email</label>
              <input type="email" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} />
              <label>Mobile</label>
              <input type="tel" value={profileData.mobile} onChange={e => setProfileData({ ...profileData, mobile: e.target.value })} />
              <label>Family Size</label>
              <select value={profileData.familySize} onChange={e => setProfileData({ ...profileData, familySize: e.target.value })}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5+</option>
              </select>
              <label>Language</label>
              <input type="text" value={profileData.language} onChange={e => setProfileData({ ...profileData, language: e.target.value })} />
            </div>
            <button className="primary-btn" onClick={handleProfileSave}>Save Changes</button>
          </div>
        )}
        {activeTab === 'Vendors' && (
          <div className="tab-panel vendors-tab">
            <h2>Vendors</h2>
            <div className="vendor-list">
              {vendors.map(v => (
                <div key={v.id} className="vendor-card">
                  <span className="emoji">{v.emoji}</span>
                  <input type="text" value={v.name} onChange={e => handleVendorUpdate(v.id, 'name', e.target.value)} />
                  <input type="text" value={v.contact} onChange={e => handleVendorUpdate(v.id, 'contact', e.target.value)} placeholder="Contact" />
                  <input type="text" value={v.category} onChange={e => handleVendorUpdate(v.id, 'category', e.target.value)} placeholder="Category" />
                  <button className="danger-btn" onClick={() => removeVendor(v.id)}>Delete</button>
                </div>
              ))}
            </div>
            <div className="add-vendor-form">
              <h3>Add New Vendor</h3>
              <input type="text" placeholder="Name" value={newVendor.name} onChange={e => setNewVendor({ ...newVendor, name: e.target.value })} />
              <input type="text" placeholder="Contact" value={newVendor.contact} onChange={e => setNewVendor({ ...newVendor, contact: e.target.value })} />
              <input type="text" placeholder="Category" value={newVendor.category} onChange={e => setNewVendor({ ...newVendor, category: e.target.value })} />
              <input type="text" placeholder="Emoji" value={newVendor.emoji} onChange={e => setNewVendor({ ...newVendor, emoji: e.target.value })} />
              <button className="primary-btn" onClick={handleAddVendor}>Add Vendor</button>
            </div>
          </div>
        )}
        {activeTab === 'Notifications' && (
          <div className="tab-panel notifications-tab">
            <h2>Notification Preferences</h2>
            <div className="notif-grid">
              <label>
                <input type="checkbox" checked={notifPrefs.dailySummary} onChange={e => handleNotifChange('dailySummary', e.target.checked)} /> Daily Summary
              </label>
              <label>
                Summary Time
                <input type="time" value={notifPrefs.summaryTime} onChange={e => handleNotifChange('summaryTime', e.target.value)} />
              </label>
              <label>
                <input type="checkbox" checked={notifPrefs.expiryAlerts === '1'} onChange={e => handleNotifChange('expiryAlerts', e.target.checked ? '1' : '0')} /> Expiry Alerts (1 day before)
              </label>
              <label>
                <input type="checkbox" checked={notifPrefs.lowStockAlerts} onChange={e => handleNotifChange('lowStockAlerts', e.target.checked)} /> Low Stock Alerts
              </label>
              <label>
                <input type="checkbox" checked={notifPrefs.reorderReminders} onChange={e => handleNotifChange('reorderReminders', e.target.checked)} /> Reorder Reminders
              </label>
              <label>
                <input type="checkbox" checked={notifPrefs.weeklySummary} onChange={e => handleNotifChange('weeklySummary', e.target.checked)} /> Weekly Summary
              </label>
            </div>
          </div>
        )}
        {activeTab === 'Thresholds' && (
          <div className="tab-panel thresholds-tab">
            <h2>Item Thresholds</h2>
            <table className="threshold-table">
              <thead>
                <tr><th>Name</th><th>Current Threshold</th><th>Set New</th></tr>
              </thead>
              <tbody>
                {fridgeItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.threshold}</td>
                    <td>
                      <input type="number" min="0" step="0.1" defaultValue={item.threshold} onBlur={e => handleThresholdChange(item.id, e.target.value)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="primary-btn" onClick={resetThresholds}>Reset Thresholds (Family Size)</button>
          </div>
        )}
        {activeTab === 'Data' && (
          <div className="tab-panel data-tab">
            <h2>Data Management</h2>
            <button className="primary-btn" onClick={() => alert('CSV export is not available yet')}>Export CSV</button>
            <button className="primary-btn" onClick={() => alert('PDF export is not available yet')}>Export PDF</button>
            <hr />
            <button className="danger-btn" onClick={confirmAndDelete}>Delete Account</button>
          </div>
        )}
      </div>
    </div>
  );
}
