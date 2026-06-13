import React, { useContext, useState, useRef } from 'react';
import { 
  ShoppingBag, 
  Send, 
  Trash2, 
  Plus, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  MessageSquare,
  Clock,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  X
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import EmptyState from '../components/Common/EmptyState';
import './Reorder.css';

const Reorder = () => {
  const { 
    user, 
    vendors, 
    pendingOrders, 
    addManualReorderItem, 
    removeReorderItem, 
    updateReorderQty, 
    updateReorderVendor,
    updateReorderRecurring,
    sendWhatsAppOrder, 
    orderHistory, 
    reorderSameItems,
    showToast 
  } = useContext(AppContext);

  const [activeTab, setActiveTab] = useState('Pending'); // Pending | History
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  // Send Sheet Overlay States
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [sendVendor, setSendVendor] = useState(null);
  const [sendItems, setSendItems] = useState([]);
  const [messageText, setMessageText] = useState('');

  // Manual Item Row states
  const [manualName, setManualName] = useState('');
  const [manualQty, setManualQty] = useState(1);
  const [manualUnit, setManualUnit] = useState('kg');
  const [manualVendor, setManualVendor] = useState('');
  const [showManualSuggestions, setShowManualSuggestions] = useState(false);

  const autocompleteRef = useRef(null);

  const suggestions = [];

  // Group pending orders by vendor
  const groupedOrders = pendingOrders.reduce((acc, item) => {
    const vId = item.vendorId || 'unassigned';
    if (!acc[vId]) acc[vId] = [];
    acc[vId].push(item);
    return acc;
  }, {});

  // Handle manual item add
  const handleAddManual = (e) => {
    e.preventDefault();
    if (!manualName.trim()) {
      showToast('Please enter an item name', 'error');
      return;
    }
    
    addManualReorderItem({
      name: manualName.trim(),
      quantity: parseFloat(manualQty) || 1,
      unit: manualUnit,
      vendorId: manualVendor
    });

    setManualName('');
    setManualQty(1);
    setManualVendor('');
    setShowManualSuggestions(false);
  };

  // Stepper handlers
  const handleQtyStepper = (id, currentVal, change) => {
    const nextVal = parseFloat((currentVal + change).toFixed(2));
    updateReorderQty(id, Math.max(0.1, nextVal));
  };

  // Open WhatsApp Preview sheet
  const handleOpenSendSheet = (vendorId, items) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) {
      showToast('Assign a vendor contact first before sending', 'error');
      return;
    }

    if (!items || items.length === 0) {
      showToast('Reorder list is empty. Add items before sending.', 'error');
      return;
    }

    setSendVendor(vendor);
    setSendItems(items);

    const totalItems = items.reduce((acc, item) => acc + (item.quantity || 0), 0);
    const listText = items.map(item => `${item.name} x ${item.quantity} ${item.unit}`).join('\n');
    const greeting = `FridgeFlow Reorder Request\n\n${listText}\n\nTotal Items: ${totalItems}\n\nPlease confirm availability and delivery.\nThank you!`;

    setMessageText(greeting);
    setIsSheetOpen(true);
  };

  // Send WhatsApp Action
  const handleSendWhatsApp = () => {
    if (!sendVendor) {
      showToast('No vendor selected for WhatsApp order', 'error');
      return;
    }

    console.log('sendVendor', sendVendor);
    console.log('messageText', messageText);

    const rawNumber = (sendVendor.contact || '').toString().replace(/\D/g, '');
    console.log('rawNumber', rawNumber);
    if (!rawNumber) {
      showToast('Vendor contact number is missing or invalid', 'error');
      return;
    }

    let waNumber = rawNumber.startsWith('0') ? rawNumber.replace(/^0+/, '') : rawNumber;
    if (waNumber.length === 10) {
      waNumber = `91${waNumber}`;
    }
    console.log('waNumber', waNumber);

    if (waNumber.length < 10) {
      showToast('Vendor contact number is too short for WhatsApp', 'error');
      return;
    }

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(messageText)}`;
    console.log('waUrl', waUrl);
    window.open(waUrl, '_blank');

    sendWhatsAppOrder(sendVendor.id, messageText, sendItems);
    setIsSheetOpen(false);
  };

  // Copy WhatsApp Text to Clipboard
  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText);
    showToast('Order details copied to clipboard!', 'success');
  };

  return (
    <div className="reorder-page animate-fade-in">
      
      {/* Page Header */}
      <div className="reorder-header">
        <h1 style={{ fontSize: '1.75rem' }}>Reorder Dashboard</h1>
        <p>Compile grocery reorders and dispatch them to vendor contacts via WhatsApp.</p>
      </div>

      {/* Tabs Row */}
      <div className="reorder-tabs">
        <button 
          className={`reorder-tab ${activeTab === 'Pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('Pending')}
        >
          Pending Orders ({pendingOrders.length})
        </button>
        <button 
          className={`reorder-tab ${activeTab === 'History' ? 'active' : ''}`}
          onClick={() => setActiveTab('History')}
        >
          Order History ({orderHistory.length})
        </button>
      </div>

      {/* PENDING ORDERS TAB VIEW */}
      {activeTab === 'Pending' && (
        <div>
          {pendingOrders.length === 0 ? (
            <EmptyState 
              icon="🛒"
              title="Reorder queue is empty"
              description="Excellent! No items are below safety thresholds. You can also manually add items using the form below."
            />
          ) : (
            <div>
              {Object.keys(groupedOrders).map((vendorKey) => {
                const vendor = vendors.find(v => v.id === vendorKey);
                const items = groupedOrders[vendorKey];
                
                return (
                  <div key={vendorKey} className="card vendor-group-card animate-fade-in">
                    <div className="vendor-group-header">
                      <div className="vendor-details">
                        <span style={{ fontSize: '1.25rem' }}>{vendor ? vendor.emoji : '❓'}</span>
                        <div>
                          <h3>{vendor ? vendor.name : 'Unassigned Items'}</h3>
                          {vendor && <span className="vendor-phone">+91 {vendor.contact}</span>}
                        </div>
                      </div>

                      {vendor ? (
                        <button 
                          className="btn btn-primary btn-sm flex-center"
                          onClick={() => handleOpenSendSheet(vendor.id, items)}
                          style={{ minHeight: 'auto', padding: '0.4rem 1rem' }}
                        >
                          <Send size={14} /> Send Order
                        </button>
                      ) : (
                        <span className="badge badge-low" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--expired)' }}>
                          Assign vendor contacts below
                        </span>
                      )}
                    </div>

                    <div className="vendor-items-list">
                      {items.map((item) => (
                        <div key={item.id} className="pending-item-row">
                          <div className="pending-item-info">
                            <span className="pending-item-name">{item.name}</span>
                            <span className="badge badge-fresh" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem' }}>
                              {item.category}
                            </span>
                            {item.source === 'auto' && (
                              <span className="badge badge-low" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', backgroundColor: 'rgba(249, 115, 22, 0.08)' }}>
                                Auto
                              </span>
                            )}
                          </div>

                          <div className="pending-item-controls">
                            {/* Quantity Stepper */}
                            <div className="stepper" style={{ height: '32px' }}>
                              <button className="stepper-btn" onClick={() => handleQtyStepper(item.id, item.quantity, -1)}>-</button>
                              <input 
                                type="text" 
                                className="stepper-input" 
                                value={item.quantity}
                                onChange={(e) => updateReorderQty(item.id, parseFloat(e.target.value) || 1)}
                                style={{ width: '40px' }}
                              />
                              <button className="stepper-btn" onClick={() => handleQtyStepper(item.id, item.quantity, 1)}>+</button>
                            </div>
                            
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', width: '40px' }}>
                              {item.unit}
                            </span>

                            {/* Recurring dropdown */}
                            <select 
                              className="recurring-select"
                              value={item.recurring}
                              onChange={(e) => updateReorderRecurring(item.id, e.target.value)}
                            >
                              <option value="none">One-time</option>
                              <option value="daily">Daily</option>
                              <option value="2days">2 Days</option>
                              <option value="weekly">Weekly</option>
                            </select>

                            {/* Vendor Selector dropdown (especially helpful for unassigned) */}
                            <select
                              value={item.vendorId || ''}
                              onChange={(e) => updateReorderVendor(item.id, e.target.value)}
                              style={{ width: '120px', height: '32px', padding: '0 0.25rem', fontSize: '0.8rem', borderRadius: 'var(--radius-md)' }}
                            >
                              <option value="">Choose Vendor</option>
                              {vendors.map(v => (
                                <option key={v.id} value={v.id}>{v.emoji} {v.name}</option>
                              ))}
                            </select>

                            {/* Remove button */}
                            <button 
                              onClick={() => removeReorderItem(item.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                              title="Exclude from list"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* MANUAL ITEM ADDITION ROW */}
          <div className="card manual-adder-card">
            <h3 className="manual-adder-title flex-center" style={{ justifyContent: 'flex-start', gap: '0.5rem' }}>
              <PlusCircle size={18} style={{ color: 'var(--primary)' }} />
              Add Item Manually
            </h3>
            
            <form onSubmit={handleAddManual} className="manual-adder-row" ref={autocompleteRef}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="text" 
                  placeholder="Item name" 
                  value={manualName}
                  onChange={(e) => {
                    setManualName(e.target.value);
                    setShowManualSuggestions(true);
                  }}
                  onFocus={() => setShowManualSuggestions(true)}
                />
                
                {showManualSuggestions && manualName.trim().length > 0 && (
                  <div className="autocomplete-suggestions">
                    {suggestions
                      .filter(s => s.toLowerCase().includes(manualName.toLowerCase()))
                      .map((suggestion, idx) => (
                        <div 
                          key={idx}
                          className="autocomplete-suggestion"
                          onClick={() => {
                            setManualName(suggestion);
                            setShowManualSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <input 
                type="number" 
                placeholder="Qty" 
                value={manualQty}
                onChange={(e) => setManualQty(Math.max(0.1, parseFloat(e.target.value) || 1))}
              />

              <select value={manualUnit} onChange={(e) => setManualUnit(e.target.value)}>
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="L">L</option>
                <option value="pcs">pcs</option>
                <option value="packets">pkts</option>
              </select>

              <select value={manualVendor} onChange={(e) => setManualVendor(e.target.value)}>
                <option value="">Select Vendor contact</option>
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.emoji} {v.name}</option>
                ))}
              </select>

              <button type="submit" className="btn btn-primary flex-center">
                <Plus size={16} /> Add Row
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ORDER HISTORY TAB VIEW */}
      {activeTab === 'History' && (
        <div className="history-list">
          {orderHistory.length === 0 ? (
            <EmptyState 
              icon="🕒"
              title="No order history found"
              description="Dispatched WhatsApp templates will be recorded here for one-click restoration."
            />
          ) : (
            orderHistory.map((history) => {
              const isExpanded = expandedHistoryId === history.id;
              const summaryText = history.items.map(i => `${i.name} (${i.quantity}${i.unit})`).join(', ');
              
              return (
                <div key={history.id} className="history-card animate-fade-in">
                  <div 
                    className="history-header"
                    onClick={() => setExpandedHistoryId(isExpanded ? null : history.id)}
                  >
                    <div className="history-title-block">
                      <span className="history-vendor-name">{history.vendorName}</span>
                      <span className="history-date">Sent: {history.dateSent}</span>
                    </div>

                    {!isExpanded && (
                      <span className="history-summary" style={{ flex: 1, padding: '0 2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {summaryText}
                      </span>
                    )}

                    <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="history-content">
                      <div className="history-items-grid">
                        {history.items.map((item, idx) => (
                          <div key={idx} className="history-item-row">
                            <span style={{ fontWeight: 600 }}>{item.name}</span>
                            <span style={{ color: 'var(--text-secondary)' }}>{item.quantity} {item.unit}</span>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        className="btn btn-secondary btn-sm flex-center"
                        onClick={() => {
                          reorderSameItems(history.items, history.vendorId);
                          setActiveTab('Pending');
                        }}
                        style={{ width: '100%' }}
                      >
                        <Clock size={14} /> Reorder Same Items
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* WHATSAPP MESSAGE PREVIEW SHEET SLIDE UP */}
      {isSheetOpen && sendVendor && (
        <>
          <div className="sheet-overlay" onClick={() => setIsSheetOpen(false)} />
          <div className="sheet">
            <div className="sheet-header">
              <h3>WhatsApp Message Preview</h3>
              <button 
                className="drawer-close-btn" 
                onClick={() => setIsSheetOpen(false)}
                style={{ minHeight: 'auto', minWidth: 'auto', padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="sheet-body">
              <label>Message Content (Editable)</label>
              <textarea 
                className="message-textarea"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                * Clicking Send will redirect you to WhatsApp Web/App, mark items as ordered, and automatically restock fridge quantities in local memory.
              </p>
            </div>

            <div className="sheet-footer">
              <button className="btn btn-secondary flex-center" onClick={handleCopyText}>
                <Copy size={16} /> Copy Text
              </button>
              <button className="btn btn-primary flex-center" onClick={handleSendWhatsApp}>
                <MessageSquare size={16} /> Send via WhatsApp
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default Reorder;
