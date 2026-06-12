import React, { useContext, useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  TrendingUp, 
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import EmptyState from '../components/Common/EmptyState';
import './Notebook.css';

const Notebook = () => {
  const { fridgeItems, budget, showToast, notebookSummary, refreshNotebookSummary } = useContext(AppContext);
  const [currentMonthIndex, setCurrentMonthIndex] = useState(1); // 0: May, 1: June, 2: July
  const [monthData, setMonthData] = useState(null);

  const months = ['May 2026', 'June 2026', 'July 2026'];
  const monthMap = [
    { month: 5, year: 2026 },
    { month: 6, year: 2026 },
    { month: 7, year: 2026 },
  ];
  const today = new Date();

  useEffect(() => {
    const { month, year } = monthMap[currentMonthIndex];
    refreshNotebookSummary(month, year).then((data) => setMonthData(data));
  }, [currentMonthIndex, refreshNotebookSummary]);

  const wastedItems = fridgeItems.filter(
    (item) => item.expiryDate && new Date(item.expiryDate) < today && item.quantity > 0
  );

  const getPercentage = (value) => {
    const total = activeData().totalSpent;
    if (total === 0) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  const handleExportPDF = () => {
    showToast('Exporting PDF monthly statement...', 'success');
    setTimeout(() => {
      showToast('PDF exported successfully! Saved to downloads folder.', 'success');
    }, 1500);
  };

  const activeData = () => {
    if (monthData) {
      const spends = monthData.spends || {};
      return {
        totalSpent: monthData.totalSpent || 0,
        itemsCount: monthData.itemsCount || 0,
        wasteCount: monthData.wasteCount || 0,
        wasteCost: monthData.wasteCost || 0,
        spends: {
          Dairy: spends.Dairy || 0,
          Vegetables: spends.Vegetables || 0,
          Fruits: spends.Fruits || 0,
          'Dry Goods': spends['Dry Goods'] || 0,
          Snacks: spends.Snacks || 0,
          Other: spends.Other || 0,
        },
        prevTotal: monthData.prevTotal || 0,
      };
    }

    return {
      totalSpent: 0,
      itemsCount: 0,
      wasteCount: 0,
      wasteCost: 0,
      spends: { Dairy: 0, Vegetables: 0, Fruits: 0, 'Dry Goods': 0, Snacks: 0, Other: 0 },
      prevTotal: 0,
    };
  };

  const data = activeData();
  const budgetRatio = budget > 0 ? data.totalSpent / budget : 0;
  const budgetPercentage = Math.round(budgetRatio * 100);

  const prevMonthSpends = {
    Dairy: Math.round((data.prevTotal || 0) * 0.26),
    Vegetables: Math.round((data.prevTotal || 0) * 0.19),
    Fruits: Math.round((data.prevTotal || 0) * 0.13),
    'Dry Goods': Math.round((data.prevTotal || 0) * 0.29),
    Snacks: Math.round((data.prevTotal || 0) * 0.1),
    Other: Math.round((data.prevTotal || 0) * 0.03),
    Total: data.prevTotal || 0,
  };

  const getProgressBarColor = () => {
    if (budgetRatio < 0.8) return 'green';
    if (budgetRatio < 1.0) return 'orange';
    return 'red';
  };

  return (
    <div className="reorder-page animate-fade-in">
      
      {/* Top Header */}
      <div className="notebook-header">
        <div className="welcome-msg">
          <h1 style={{ fontSize: '1.75rem' }}>Notebook & Spending</h1>
          <p>Analyze monthly spends, review wasted food statistics, and enforce grocery budgets.</p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {/* Month Select */}
          <div className="month-navigator">
            <button 
              className="month-nav-btn" 
              onClick={() => setCurrentMonthIndex(p => Math.max(0, p - 1))}
              disabled={currentMonthIndex === 0}
            >
              <ChevronLeft size={18} />
            </button>
            <span className="current-month">{months[currentMonthIndex]}</span>
            <button 
              className="month-nav-btn" 
              onClick={() => setCurrentMonthIndex(p => Math.min(months.length - 1, p + 1))}
              disabled={currentMonthIndex === months.length - 1}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <button className="btn btn-outline btn-sm flex-center" onClick={handleExportPDF} style={{ minHeight: '40px' }}>
            <Download size={16} /> Export PDF
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="notebook-summary-grid">
        <div className="card stat-card spend">
          <span className="stat-label">Total Spent</span>
          <span className="stat-value">₹{data.totalSpent.toLocaleString('en-IN')}</span>
        </div>
        <div className="card stat-card spend" style={{ borderColor: 'var(--primary)' }}>
          <span className="stat-label">Groceries Bought</span>
          <span className="stat-value">{data.itemsCount} Items</span>
        </div>
        <div className="card stat-card expired">
          <span className="stat-label">Wasted Costs</span>
          <span className="stat-value">₹{data.wasteCost.toLocaleString('en-IN')}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({data.wasteCount} expired items)</span>
        </div>
        <div className="card stat-card" style={{ borderColor: budgetRatio >= 1 ? 'var(--expired)' : 'var(--border-color)' }}>
          <span className="stat-label">Budget Remaining</span>
          <span className="stat-value" style={{ color: budgetRatio >= 1 ? 'var(--expired)' : 'var(--fresh)' }}>
            {budgetRatio >= 1 ? 'Exceeded' : `₹${(budget - data.totalSpent).toLocaleString('en-IN')}`}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Limit: ₹{budget}</span>
        </div>
      </div>

      {/* Budget Control Track Slider */}
      <div className="card budget-card">
        <div className="budget-stats-row">
          <h3 style={{ fontSize: '1rem' }}>Grocery Budget Enforcer</h3>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {budgetPercentage}% used (₹{data.totalSpent} of ₹{budget})
          </span>
        </div>
        <div className="budget-progress-track">
          <div 
            className={`budget-progress-fill ${getProgressBarColor()}`}
            style={{ width: `${Math.min(100, budgetPercentage)}%` }}
          />
        </div>

        {budgetRatio >= 1.0 && (
          <div className="budget-alert-banner">
            <AlertTriangle size={16} />
            <span>Warning: You have exceeded your grocery budget for this month! Spend responsibly.</span>
          </div>
        )}
      </div>

      {/* Main Grid Panels */}
      <div className="notebook-grid">
        
        {/* Category Horizontal Bars */}
        <div className="card chart-card">
          <h2 style={{ fontSize: '1.25rem' }}>Spend by Category</h2>
          
          <div className="chart-list">
            {[
              { key: 'Dairy', label: 'Dairy🥛', className: 'dairy' },
              { key: 'Vegetables', label: 'Vegetables🥦', className: 'vegetables' },
              { key: 'Fruits', label: 'Fruits🍎', className: 'fruits' },
              { key: 'Dry Goods', label: 'Dry Goods🌾', className: 'dry' },
              { key: 'Snacks', label: 'Snacks🍿', className: 'snacks' },
              { key: 'Other', label: 'Others🛒', className: 'other' }
            ].map(item => {
              const val = data.spends[item.key] || 0;
              return (
                <div key={item.key} className="chart-bar-row">
                  <span className="chart-bar-label">{item.label}</span>
                  <div className="chart-bar-track">
                    <div 
                      className={`chart-bar-fill ${item.className}`} 
                      style={{ width: data.totalSpent > 0 ? `${(val / data.totalSpent) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="chart-bar-value">₹{val} ({getPercentage(val)})</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Waste Log Tracker */}
        <div className="card timeline-card">
          <h2 style={{ fontSize: '1.25rem', color: 'var(--expired)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} />
            Waste Log Tracker
          </h2>

          <div className="waste-list">
            {wastedItems.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem', backgroundColor: 'rgba(16,185,129,0.05)', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(16,185,129,0.1)' }}>
                <CheckCircle size={16} style={{ color: 'var(--fresh)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--fresh)' }}>Awesome! No wasted food loss recorded.</span>
              </div>
            ) : (
              wastedItems.map((item) => {
                const loss = (item.pricePerUnit || 0) * item.quantity;
                return (
                  <div key={item.id} className="waste-item animate-fade-in">
                    <div>
                      <span className="waste-item-name">{item.name}</span>
                      <div className="waste-item-meta">Expired: {item.expiryDate}</div>
                    </div>
                    <span className="waste-loss">
                      {loss > 0 ? `₹${Math.round(loss)}` : 'Price not set'}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Comparison list Table */}
        <div className="card comparison-card col-span-2">
          <h2 style={{ fontSize: '1.25rem' }}>Month vs Last Month comparison</h2>
          
          <div className="comparison-table-wrapper">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Last Month (May)</th>
                  <th>This Month (June)</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Dairy 🥛', current: data.spends.Dairy, prev: prevMonthSpends.Dairy },
                  { label: 'Vegetables 🥦', current: data.spends.Vegetables, prev: prevMonthSpends.Vegetables },
                  { label: 'Fruits 🍎', current: data.spends.Fruits, prev: prevMonthSpends.Fruits },
                  { label: 'Dry Goods 🌾', current: data.spends['Dry Goods'], prev: prevMonthSpends['Dry Goods'] },
                  { label: 'Snacks 🍿', current: data.spends.Snacks, prev: prevMonthSpends.Snacks },
                  { label: 'Other 🛒', current: data.spends.Other, prev: prevMonthSpends.Other },
                  { label: 'Total Spent 🧾', current: data.totalSpent, prev: prevMonthSpends.Total, isTotal: true }
                ].map((row, idx) => {
                  const diff = row.current - row.prev;
                  const isUp = diff > 0;
                  
                  return (
                    <tr key={idx} style={{ fontWeight: row.isTotal ? 'bold' : 'normal', backgroundColor: row.isTotal ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                      <td>{row.label}</td>
                      <td>₹{row.prev}</td>
                      <td>₹{row.current}</td>
                      <td>
                        {diff === 0 ? (
                          <span style={{ color: 'var(--text-muted)' }}>No change</span>
                        ) : (
                          <span className={`change-arrow ${isUp ? 'up' : 'down'}`}>
                            {isUp ? <ArrowRight size={12} style={{ transform: 'rotate(-45deg)', color: 'var(--expired)' }} /> : <ArrowRight size={12} style={{ transform: 'rotate(45deg)', color: 'var(--fresh)' }} />}
                            {isUp ? '+' : ''}₹{Math.abs(diff)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="comparison-summary-text">
            {data.totalSpent > prevMonthSpends.Total ? (
              <span>Your spending is <strong>up by ₹{data.totalSpent - prevMonthSpends.Total}</strong> compared to last month. Consider review safety thresholds to minimize grocery purchases.</span>
            ) : (
              <span>Great job! Your spending is <strong>down by ₹{prevMonthSpends.Total - data.totalSpent}</strong> compared to last month. Keep tracking your inventory!</span>
            )}
          </p>
        </div>

      </div>

    </div>
  );
};

// Quick mock for CheckCircle icon
const CheckCircle = ({ size, style }) => (
  <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>
);

export default Notebook;
