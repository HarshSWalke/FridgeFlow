import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  AlertTriangle,
  Clock,
  CheckCircle,
  TrendingUp,
  Plus
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import EmptyState from '../components/Common/EmptyState';
import './Dashboard.css';

const Dashboard = () => {
  const { 
    user, 
    fridgeItems, 
    alerts, 
    activityLog, 
    dashboardStats,
    markFinished, 
    removeItem, 
    useNow, 
    extendDate, 
    showToast 
  } = useContext(AppContext);

  const navigate = useNavigate();
  const [isAlertsCollapsed, setIsAlertsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('Dairy');

  if (!user) return null;

  // Calculate stats dynamically (prefer API stats when available)
  const totalItems = dashboardStats?.totalItems ?? fridgeItems.filter(item => item.quantity > 0).length;
  const expiringCount = dashboardStats?.expiringSoon ?? alerts.filter(a => a.type === 'expired' || a.type === 'expiring').length;
  const lowStockCount = dashboardStats?.lowStock ?? alerts.filter(a => a.type === 'low-stock').length;
  
  const itemsSpend = fridgeItems.reduce((acc, item) => acc + ((item.pricePerUnit || 0) * item.quantity), 0);
  const totalSpend = dashboardStats?.monthlySpend ?? Math.round(itemsSpend);

  const categories = ['Dairy', 'Vegetables', 'Fruits', 'Dry Goods', 'Snacks'];

  const normalizeCategory = (value) => value?.toString().trim().toLowerCase();

  const getFilteredItems = (category) => {
    const normalizedCategory = normalizeCategory(category);
    return fridgeItems
      .filter((item) => item.quantity > 0 && normalizeCategory(item.category) === normalizedCategory)
      .slice(0, 5); // top 5
  };

  const getItemFreshnessColor = (item) => {
    if (!item.expiryDate) return 'fresh';
    const today = new Date();
    const expDate = new Date(item.expiryDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired';
    if (diffDays <= 3) return 'expiring';
    return 'fresh';
  };

  const handleManualReorder = (itemName) => {
    showToast(`${itemName} added to your Reorder list!`, 'success');
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '2rem' }}>
      
      {/* Dashboard Top Header */}
      <div className="dashboard-header">
        <div className="welcome-msg">
          <h1>Namaste, {user.name}!</h1>
          <p>Here is your kitchen and pantry status for today.</p>
        </div>
        <button 
          className="btn btn-primary btn-sm flex-center"
          onClick={() => navigate('/my-fridge')}
          style={{ minHeight: 'auto' }}
        >
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="stats-grid">
        <div className="card stat-card spend">
          <span className="stat-label">Total in Fridge</span>
          <span className="stat-value">{totalItems} Items</span>
        </div>
        <div className="card stat-card expired">
          <span className="stat-label">Expiring/Expired</span>
          <span className="stat-value">{expiringCount} items</span>
        </div>
        <div className="card stat-card low-stock">
          <span className="stat-label">Low on Stock</span>
          <span className="stat-value">{lowStockCount} items</span>
        </div>
        <div className="card stat-card spend">
          <span className="stat-label">This Month's Spend</span>
          <span className="stat-value">₹{totalSpend.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Collapsible Alerts Panel */}
      <div className="card alerts-card">
        <div 
          className="card-header"
          onClick={() => setIsAlertsCollapsed(!isAlertsCollapsed)}
        >
          <h2>
            <AlertTriangle size={20} style={{ color: alerts.length > 0 ? 'var(--expiring)' : 'var(--fresh)' }} />
            Needs Your Attention 
            <span className="badge badge-low" style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}>
              {alerts.length}
            </span>
          </h2>
          <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            {isAlertsCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </button>
        </div>

        {!isAlertsCollapsed && (
          <div className="alert-list">
            {alerts.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', backgroundColor: 'rgba(16,185,129,0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <CheckCircle size={20} style={{ color: 'var(--fresh)' }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--fresh)', fontWeight: 600 }}>Everything looks good today! No urgent items.</span>
              </div>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="alert-item">
                  <div className="alert-info">
                    <span className={`status-dot ${alert.severity === 'red' ? 'expired' : alert.severity === 'orange' ? 'low-stock' : 'expiring'}`} />
                    <span className="alert-msg">{alert.message}</span>
                  </div>

                  <div className="alert-actions">
                    {alert.actionType === 'expired' && (
                      <>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => markFinished(alert.itemId)}
                        >
                          Mark Finished
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => removeItem(alert.itemId)}
                        >
                          Remove
                        </button>
                      </>
                    )}

                    {alert.actionType === 'expiring' && (
                      <>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => useNow(alert.itemId)}
                        >
                          Use Now
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => extendDate(alert.itemId, 3)}
                        >
                          Extend 3 Days
                        </button>
                      </>
                    )}

                    {alert.actionType === 'low-stock' && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleManualReorder(alert.itemName)}
                      >
                        Add to Reorder
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Mini Snapshot & Activity Feed */}
      <div className="dashboard-grid">
        
        {/* Fridge Snapshot (Mini View) */}
        <div className="card snapshot-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Fridge Snapshot</h2>
            <button 
              className="btn btn-outline btn-sm flex-center"
              onClick={() => navigate('/my-fridge')}
              style={{ minHeight: 'auto', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
            >
              View Full Fridge <ArrowRight size={14} />
            </button>
          </div>

          {/* Horizontal scroll tabs */}
          <div className="snapshot-tabs">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`snapshot-tab ${activeTab === cat ? 'active' : ''}`}
                onClick={() => setActiveTab(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* List of top 5 items */}
          <div className="snapshot-list">
            {getFilteredItems(activeTab).length === 0 ? (
              <EmptyState 
                icon="🧊"
                title={`No ${activeTab} items`}
                description={`You have no active items in the ${activeTab} category.`}
              />
            ) : (
              getFilteredItems(activeTab).map((item) => (
                <div key={item.id} className="snapshot-item">
                  <div className="snapshot-item-left">
                    <span className={`status-dot ${getItemFreshnessColor(item)}`} />
                    <span className="snapshot-item-name">{item.name}</span>
                  </div>
                  <span className="snapshot-item-qty">{item.quantity} {item.unit}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card timeline-card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} style={{ color: 'var(--primary)' }} />
            Recent Activity
          </h2>
          
          <div className="timeline">
            {activityLog.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No recent activity logged.</p>
            ) : (
              activityLog.slice(0, 10).map((log) => (
                <div key={log.id} className="timeline-item">
                  <span className="timeline-dot" />
                  <p className="timeline-message">{log.message}</p>
                  <div className="timeline-meta">
                    <span>{log.time}</span>
                    <span>by {log.user}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
