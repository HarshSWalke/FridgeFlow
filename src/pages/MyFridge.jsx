import React, { useContext, useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  MoreVertical, 
  Edit2, 
  Trash2, 
  Check, 
  AlertTriangle,
  X,
  PlusCircle,
  MinusCircle,
  HelpCircle,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import EmptyState from '../components/Common/EmptyState';
import { openFoodFactsApi } from '../services/api';
import './MyFridge.css';

const MyFridge = () => {
  const { 
    user, 
    fridgeItems, 
    addItem, 
    editItem, 
    removeItem, 
    markFinished, 
    showToast 
  } = useContext(AppContext);

  // Search, Category, and Filter states
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Drawer Form states
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('Dairy');
  const [itemQty, setItemQty] = useState(1.0);
  const [itemUnit, setItemUnit] = useState('kg');
  const [itemExpiryToggle, setItemExpiryToggle] = useState(false); // true if "no fixed expiry"
  const [itemExpiryDate, setItemExpiryDate] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemThreshold, setItemThreshold] = useState(0.5);
  const [itemVendor, setItemVendor] = useState('');

  // Autocomplete Suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [isProductSearchLoading, setIsProductSearchLoading] = useState(false);
  const [productSearchError, setProductSearchError] = useState('');
  
  // Duplicate detection override state
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  const autocompleteRef = useRef(null);
  const menuRef = useRef(null);

  const categories = ['All', 'Dairy', 'Vegetables', 'Fruits', 'Dry Goods', 'Beverages', 'Snacks', 'Leftovers'];

  const standardSuggestions = [];
  const today = new Date();

  // Close menus and popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter autocomplete list as name changes
  useEffect(() => {
    if (itemName.trim().length > 0) {
      const searchQuery = itemName.trim();
      setIsProductSearchLoading(true);
      setProductSearchError('');

      openFoodFactsApi.search(searchQuery)
        .then((result) => {
          setFilteredSuggestions(result || []);
        })
        .catch((err) => {
          setProductSearchError(err.message || 'Failed to fetch product suggestions');
          setFilteredSuggestions([]);
        })
        .finally(() => {
          setIsProductSearchLoading(false);
        });
    } else {
      setFilteredSuggestions([]);
      setProductSearchError('');
    }
  }, [itemName]);

  // Expiry freshness color calculation
  const getItemFreshness = (item) => {
    if (!item.expiryDate) return 'fresh'; // green
    const expDate = new Date(item.expiryDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'expired'; // red
    if (diffDays <= 3) return 'expiring'; // yellow
    return 'fresh'; // green
  };

  const getFilteredItems = () => {
    return fridgeItems.filter(item => {
      // 1. Search filter
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      
      // 2. Category filter
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      
      // 3. Status filter (Expired / Expiring Soon / Low Stock / Fresh)
      let matchesStatus = true;
      const freshness = getItemFreshness(item);
      const isLowStock = item.quantity <= item.threshold && item.quantity > 0;

      if (selectedFilter === 'Expired') {
        matchesStatus = freshness === 'expired';
      } else if (selectedFilter === 'Expiring') {
        matchesStatus = freshness === 'expiring';
      } else if (selectedFilter === 'LowStock') {
        matchesStatus = isLowStock;
      } else if (selectedFilter === 'Fresh') {
        matchesStatus = freshness === 'fresh' && !isLowStock;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  // Stepper handlers inside card
  const handleCardQtyStepper = (itemId, change) => {
    const item = fridgeItems.find(i => i.id === itemId);
    if (!item) return;
    const nextVal = parseFloat((item.quantity + change).toFixed(2));
    
    if (nextVal <= 0) {
      if (window.confirm(`Mark ${item.name} as Finished?`)) {
        markFinished(itemId);
      }
    } else {
      editItem(itemId, { quantity: nextVal });
    }
  };

  // Open Drawer for Add Item
  const openAddDrawer = () => {
    setEditingItem(null);
    setItemName('');
    setItemCategory('Dairy');
    setItemQty(1.0);
    setItemUnit('kg');
    setItemExpiryToggle(false);
    setItemExpiryDate('');
    setItemPrice('');
    setItemThreshold(0.5);
    setItemVendor('');
    setDuplicateWarning(null);
    setIsDrawerOpen(true);
  };

  // Open Drawer for Edit Item
  const openEditDrawer = (item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemQty(item.quantity);
    setItemUnit(item.unit);
    setItemExpiryToggle(!item.expiryDate);
    setItemExpiryDate(item.expiryDate || '');
    setItemPrice(item.pricePerUnit || '');
    setItemThreshold(item.threshold || 0);
    setItemVendor(item.vendorId || '');
    setDuplicateWarning(null);
    setIsDrawerOpen(true);
  };

  // Handle Autocomplete suggestion click
  const handleSuggestionClick = (suggestion) => {
    setItemName(suggestion.name);
    setItemCategory(suggestion.category || 'Other');
    setItemUnit(suggestion.unit || 'pcs');
    setItemPrice('');
    setItemQty(suggestion.quantity || 1);
    setShowSuggestions(false);
  };

  // Steppers inside Drawer
  const handleDrawerQtyStepper = (change) => {
    setItemQty(prev => Math.max(0, parseFloat((prev + change).toFixed(2))));
  };

  const handleDrawerThresholdStepper = (change) => {
    setItemThreshold(prev => Math.max(0, parseFloat((prev + change).toFixed(2))));
  };

  // Submit Drawer Form
  const handleDrawerSave = async (bypassDuplicate = false) => {
    if (!itemName.trim()) {
      showToast('Item name is required', 'error');
      return;
    }

    // Check duplicate if not editing and duplicate not bypassed
    if (!editingItem && !bypassDuplicate) {
      const duplicate = fridgeItems.find(
        i => i.name.toLowerCase() === itemName.trim().toLowerCase() && 
             i.category === itemCategory && 
             i.quantity > 0
      );

      if (duplicate) {
        setDuplicateWarning(duplicate);
        return;
      }
    }

    const itemDetails = {
      name: itemName.trim(),
      category: itemCategory,
      quantity: itemQty,
      unit: itemUnit,
      expiryDate: itemExpiryToggle ? null : itemExpiryDate || null,
      pricePerUnit: itemPrice ? parseFloat(itemPrice) : 0,
      threshold: itemThreshold,
      vendorId: itemVendor || ''
    };

    if (editingItem) {
      await editItem(editingItem.id, itemDetails);
    } else {
      const result = await addItem(itemDetails, bypassDuplicate);
      if (result?.duplicate) {
        setDuplicateWarning(result.duplicate);
        return;
      }
    }

    setIsDrawerOpen(false);
  };

  // Duplicate Warning - Action: Update existing quantity
  const handleDuplicateMerge = async () => {
    if (!duplicateWarning) return;
    
    const itemDetails = {
      name: itemName.trim(),
      category: itemCategory,
      quantity: itemQty,
      unit: itemUnit,
      expiryDate: itemExpiryToggle ? null : itemExpiryDate || duplicateWarning.expiryDate,
      pricePerUnit: itemPrice ? parseFloat(itemPrice) : duplicateWarning.pricePerUnit,
      threshold: itemThreshold,
      vendorId: itemVendor || duplicateWarning.vendorId,
      merge: true,
    };

    await addItem(itemDetails, true);
    
    setIsDrawerOpen(false);
    setDuplicateWarning(null);
    showToast(`Merged quantity! Total of ${duplicateWarning.name} updated`, 'success');
  };

  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      
      {/* Top Bar Section */}
      <div className="fridge-header">
        <div className="welcome-msg">
          <h1 style={{ fontSize: '1.75rem' }}>My Fridge</h1>
          <p>Manage your food stock, expiry dates, and alert safety levels.</p>
        </div>
        
        <div className="fridge-actions">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="Search groceries..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select 
            className="filter-select"
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            <option value="All">All Freshness</option>
            <option value="Expired">🔴 Expired</option>
            <option value="Expiring">🟡 Expiring Soon</option>
            <option value="LowStock">🟠 Low Stock</option>
            <option value="Fresh">🟢 Fresh / Okay</option>
          </select>

          <button className="btn btn-primary flex-center" onClick={openAddDrawer}>
            <Plus size={18} /> Add Item
          </button>
        </div>
      </div>

      {/* Category Tabs Scroll Panel */}
      <div className="category-tabs-container">
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Item Cards Grid */}
      {getFilteredItems().length === 0 ? (
        <EmptyState 
          icon="🥑"
          title="No food matches"
          description="Your search criteria doesn't match any food item in your pantry."
          actionText="Add New Item"
          onAction={openAddDrawer}
        />
      ) : (
        <div className="fridge-grid">
          {getFilteredItems().map((item) => {
            const freshness = getItemFreshness(item);
            const isLowStock = item.quantity <= item.threshold && item.quantity > 0;
            const isFinished = item.quantity <= 0;

            return (
              <div 
                key={item.id} 
                className="card fridge-card card-hover"
                style={{ 
                  borderLeft: isFinished 
                    ? '4px solid var(--text-muted)' 
                    : isLowStock 
                      ? '4px solid var(--low-stock)' 
                      : '1px solid var(--border-color)' 
                }}
              >
                {/* Expiry Freshness Color Dot */}
                <div className="card-top">
                  <div className="card-dot-badge">
                    {!isFinished && <span className={`status-dot ${freshness}`} />}
                    <span className="card-title">{item.name}</span>
                  </div>
                  
                  {/* Category badge */}
                  <span className="badge badge-low" style={{ fontSize: '0.7rem' }}>
                    {item.category}
                  </span>
                </div>

                {/* Card Quantity row */}
                <div className="card-qty-row">
                  <span className="card-qty" style={{ color: isFinished ? 'var(--text-muted)' : 'inherit' }}>
                    {item.quantity}
                  </span>
                  <span className="card-unit">{item.unit}</span>
                  
                  {isLowStock && !isFinished && (
                    <span className="badge badge-low" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginLeft: '0.5rem', backgroundColor: 'rgba(249,115,22,0.15)', color: 'var(--low-stock)', fontSize: '0.7rem' }}>
                      <AlertTriangle size={10} /> Low
                    </span>
                  )}
                  {isFinished && (
                    <span className="badge badge-expired" style={{ display: 'inline-flex', alignItems: 'center', marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                      Finished
                    </span>
                  )}
                </div>

                {/* Expiry details lists */}
                <div className="card-meta-list">
                  <div className="card-meta-item">
                    <span className="card-meta-label">Expiry Date:</span>
                    <span 
                      className="card-meta-value"
                      style={{ 
                        color: freshness === 'expired' && !isFinished 
                          ? 'var(--expired)' 
                          : freshness === 'expiring' && !isFinished 
                            ? 'var(--expiring)' 
                            : 'inherit' 
                      }}
                    >
                      {item.expiryDate ? item.expiryDate : 'No Expiry'}
                    </span>
                  </div>
                  <div className="card-meta-item">
                    <span className="card-meta-label">Added Date:</span>
                    <span className="card-meta-value">{item.dateAdded}</span>
                  </div>
                  <div className="card-meta-item">
                    <span className="card-meta-label">Safety Alert Threshold:</span>
                    <span className="card-meta-value">{item.threshold} {item.unit}</span>
                  </div>
                </div>

                {/* Card footer controls */}
                <div className="card-footer">
                  <div className="card-footer-buttons">
                    <button 
                      className="btn btn-outline btn-sm flex-center"
                      onClick={() => openEditDrawer(item)}
                      style={{ flex: 1 }}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    {item.quantity > 0 ? (
                      <button 
                        className="btn btn-primary btn-sm flex-center"
                        onClick={() => markFinished(item.id)}
                        style={{ flex: 1.5 }}
                      >
                        <Check size={12} /> Finish
                      </button>
                    ) : (
                      <button 
                        className="btn btn-secondary btn-sm flex-center"
                        onClick={() => handleCardQtyStepper(item.id, item.threshold * 2 || 1)}
                        style={{ flex: 1.5 }}
                      >
                        <PlusCircle size={12} /> Restock
                      </button>
                    )}
                  </div>

                  {/* Dropdown Menu actions */}
                  <div style={{ position: 'relative' }}>
                    <button 
                      className="menu-trigger-btn"
                      onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {activeMenuId === item.id && (
                      <div className="dropdown-menu" ref={menuRef}>
                        <button 
                          className="dropdown-item"
                          onClick={() => {
                            setActiveMenuId(null);
                            openEditDrawer(item);
                          }}
                        >
                          <Edit2 size={12} /> Modify details
                        </button>
                        <button 
                          className="dropdown-item"
                          onClick={() => {
                            setActiveMenuId(null);
                            showToast(`${item.name} added to reorder queue!`, 'success');
                          }}
                        >
                          <PlusCircle size={12} /> Add to Reorder
                        </button>
                        <button 
                          className="dropdown-item danger-action"
                          onClick={() => {
                            setActiveMenuId(null);
                            if (window.confirm(`Delete ${item.name} permanently?`)) {
                              removeItem(item.id);
                            }
                          }}
                        >
                          <Trash2 size={12} /> Delete Card
                        </button>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* DRAWER LAYOUT PANEL */}
      {isDrawerOpen && (
        <>
          <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)} />
          <div className="drawer">
            <div className="drawer-header">
              <h3>{editingItem ? 'Edit Pantry Item' : 'Add Fridge Item'}</h3>
              <button className="drawer-close-btn" onClick={() => setIsDrawerOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="drawer-body">
              
              {/* DUPLICATE WARNING CARD */}
              {duplicateWarning && (
                <div className="duplicate-warning">
                  <div className="duplicate-warning-title">
                    <AlertCircle size={16} />
                    <span>Duplicate item detected</span>
                  </div>
                  <p>
                    <strong>{duplicateWarning.name}</strong> already exists in <strong>{duplicateWarning.category}</strong> with a quantity of <strong>{duplicateWarning.quantity}{duplicateWarning.unit}</strong>.
                  </p>
                  <div className="duplicate-warning-actions">
                    <button className="btn btn-secondary btn-sm" onClick={handleDuplicateMerge} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                      Update quantity
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDrawerSave(true)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                      Add as Separate
                    </button>
                  </div>
                </div>
              )}

              {/* Item Name Autocomplete */}
              <div className="autocomplete-container" ref={autocompleteRef}>
                <label>Item Name *</label>
                <input 
                  type="text" 
                  placeholder="Item name" 
                  value={itemName}
                  onChange={(e) => {
                    setItemName(e.target.value);
                    setShowSuggestions(true);
                    setDuplicateWarning(null); // Clear warnings on edit
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                
                {showSuggestions && (
                  <div className="autocomplete-suggestions">
                    {isProductSearchLoading ? (
                      <div className="autocomplete-suggestion">Loading suggestions...</div>
                    ) : productSearchError ? (
                      <div className="autocomplete-suggestion">{productSearchError}</div>
                    ) : filteredSuggestions.length > 0 ? (
                      filteredSuggestions.map((suggestion, idx) => (
                        <div 
                          key={idx}
                          className="autocomplete-suggestion"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          {suggestion.name} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>({suggestion.category})</span>
                        </div>
                      ))
                    ) : (
                      <div className="autocomplete-suggestion">No product suggestions. Continue manual entry.</div>
                    )}
                  </div>
                )}
              </div>

              {/* Category Dropdown */}
              <div>
                <label>Category</label>
                <select 
                  value={itemCategory}
                  onChange={(e) => {
                    setItemCategory(e.target.value);
                    setDuplicateWarning(null);
                  }}
                >
                  <option value="Dairy">Dairy</option>
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Dry Goods">Dry Goods</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Leftovers">Leftovers</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Quantity Steppers */}
              <div className="drawer-form-row">
                <div>
                  <label>Quantity</label>
                  <div className="stepper" style={{ width: '100%', height: '44px' }}>
                    <button className="stepper-btn" onClick={() => handleDrawerQtyStepper(-0.25)}>-</button>
                    <input 
                      type="number" 
                      className="stepper-input" 
                      value={itemQty}
                      onChange={(e) => setItemQty(Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{ flex: 1 }}
                    />
                    <button className="stepper-btn" onClick={() => handleDrawerQtyStepper(0.25)}>+</button>
                  </div>
                </div>

                <div>
                  <label>Unit</label>
                  <select 
                    value={itemUnit}
                    onChange={(e) => setItemUnit(e.target.value)}
                    style={{ height: '44px' }}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="mL">mL</option>
                    <option value="pcs">pcs</option>
                    <option value="packets">packets</option>
                    <option value="bottles">bottles</option>
                  </select>
                </div>
              </div>

              {/* Expiry Date Settings */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0 }}>Expiry Date</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <label className="switch" style={{ width: '36px', height: '20px' }}>
                      <input 
                        type="checkbox" 
                        checked={itemExpiryToggle}
                        onChange={(e) => setItemExpiryToggle(e.target.checked)}
                      />
                      <span className="slider" style={{ borderRadius: '20px' }}></span>
                    </label>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>No Expiry</span>
                  </div>
                </div>

                {!itemExpiryToggle && (
                  <input 
                    type="date" 
                    value={itemExpiryDate}
                    onChange={(e) => setItemExpiryDate(e.target.value)}
                  />
                )}
              </div>

              {/* Price Per Unit & Safety Threshold */}
              <div className="drawer-form-row">
                <div>
                  <label>Price Per Unit (₹)</label>
                  <input 
                    type="number" 
                    placeholder="Price"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                  />
                </div>

                <div>
                  <label>Alert Threshold</label>
                  <div className="stepper" style={{ width: '100%', height: '44px' }}>
                    <button className="stepper-btn" onClick={() => handleDrawerThresholdStepper(-0.1)}>-</button>
                    <input 
                      type="number" 
                      className="stepper-input" 
                      value={itemThreshold}
                      onChange={(e) => setItemThreshold(Math.max(0, parseFloat(e.target.value) || 0))}
                      style={{ flex: 1 }}
                    />
                    <button className="stepper-btn" onClick={() => handleDrawerThresholdStepper(0.1)}>+</button>
                  </div>
                </div>
              </div>

              {/* Vendor Assignment */}
              <div>
                <label>Assign Vendor</label>
                <select 
                  value={itemVendor}
                  onChange={(e) => setItemVendor(e.target.value)}
                >
                  <option value="">No vendor contact</option>
                  {user.vendors && user.vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.emoji} {vendor.name}
                    </option>
                  ))}
                </select>
              </div>

            </div>

            <div className="drawer-footer">
              <button className="btn btn-secondary" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={() => handleDrawerSave(false)}>
                Save Item
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default MyFridge;
