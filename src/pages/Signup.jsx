import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Plus, Trash2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import './Signup.css';

const Signup = () => {
  const { signup, showToast } = useContext(AppContext);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 State
  const [formData, setFormData] = useState({
    name: '',
    countryCode: '+91',
    mobile: '',
    email: '',
    password: '',
    familySize: '3',
    language: 'English'
  });
  const [errors, setErrors] = useState({});

  // Step 2 State (Vendors)
  const [vendors, setVendors] = useState([
    { name: 'Milkman Ramesh', contact: '9876543210', category: 'Dairy', emoji: '🥛' },
    { name: 'Suresh Vegetables', contact: '9123456789', category: 'Vegetables', emoji: '🥦' },
    { name: 'Rajesh Fruits', contact: '9812345678', category: 'Fruits', emoji: '🍎' },
    { name: 'Kirana General Store', contact: '9000000009', category: 'General', emoji: '🛒' }
  ]);
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [newVendor, setNewVendor] = useState({ name: '', emoji: '🥛', contact: '' });

  // Step 3 State (Thresholds)
  const [thresholdItems, setThresholdItems] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: 'Dairy', threshold: 1.0, unit: 'kg' });

  // Load Thresholds when Step 1 is done
  useEffect(() => {
    if (step === 3 && thresholdItems.length === 0) {
      const fs = formData.familySize;
      const mult = fs === '1' ? 0.5 : fs === '2' ? 1.0 : fs === '3' || fs === '4' ? 1.5 : 2.5;
      
      const defaults = [
        { name: 'Milk', category: 'Dairy', threshold: Math.max(0.5, 1.0 * mult), unit: 'L', included: true },
        { name: 'Curd', category: 'Dairy', threshold: Math.ceil(200 * mult), unit: 'g', included: true },
        { name: 'Paneer', category: 'Dairy', threshold: Math.ceil(100 * mult), unit: 'g', included: true },
        { name: 'Onion', category: 'Vegetables', threshold: Math.max(0.5, 1.0 * mult), unit: 'kg', included: true },
        { name: 'Tomato', category: 'Vegetables', threshold: Math.max(0.5, 1.0 * mult), unit: 'kg', included: true },
        { name: 'Potato', category: 'Vegetables', threshold: Math.max(0.5, 1.0 * mult), unit: 'kg', included: true },
        { name: 'Rice', category: 'Dry Goods', threshold: Math.max(1.0, 2.0 * mult), unit: 'kg', included: true },
        { name: 'Dal', category: 'Dry Goods', threshold: Math.max(0.5, 1.0 * mult), unit: 'kg', included: true },
        { name: 'Bread', category: 'Snacks', threshold: 1, unit: 'packets', included: true },
        { name: 'Eggs', category: 'Dairy', threshold: Math.ceil(4 * mult), unit: 'pcs', included: true },
        { name: 'Sugar', category: 'Dry Goods', threshold: Math.max(0.5, 1.0 * mult), unit: 'kg', included: true },
        { name: 'Oil', category: 'Dry Goods', threshold: Math.max(1.0, 1.0 * mult), unit: 'L', included: true }
      ];
      setThresholdItems(defaults);
    }
  }, [step, formData.familySize, thresholdItems.length]);

  // Step 1 Validation
  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    
    // Mobile validation: exactly 10 digits
    const mobileDigits = formData.mobile.replace(/\D/g, '');
    if (mobileDigits.length !== 10) {
      newErrors.mobile = 'Mobile number must be exactly 10 digits';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation: min 8 chars, 1 number
    if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    } else {
      showToast('Please fix validation errors first', 'error');
    }
  };

  // Step 2 Action Handlers
  const handleVendorFieldChange = (idx, field, value) => {
    const updated = [...vendors];
    updated[idx][field] = value;
    setVendors(updated);
  };

  const handleAddCustomVendor = () => {
    if (!newVendor.name.trim()) {
      showToast('Vendor name is required', 'error');
      return;
    }
    const phoneDigits = newVendor.contact.replace(/\D/g, '');
    if (newVendor.contact && phoneDigits.length !== 10) {
      showToast('WhatsApp number must be 10 digits', 'error');
      return;
    }
    if (vendors.length >= 10) {
      showToast('Maximum 10 vendors allowed during signup', 'warning');
      return;
    }
    setVendors([...vendors, newVendor]);
    setNewVendor({ name: '', emoji: '🥛', contact: '' });
    setShowAddVendor(false);
    showToast('Custom vendor added!', 'success');
  };

  const handleDeleteVendor = (idx) => {
    setVendors(vendors.filter((_, i) => i !== idx));
  };

  // Step 3 Action Handlers
  const handleThresholdChange = (idx, change) => {
    const updated = [...thresholdItems];
    const nextVal = parseFloat((updated[idx].threshold + change).toFixed(1));
    updated[idx].threshold = Math.max(0, nextVal);
    setThresholdItems(updated);
  };

  const handleThresholdInputChange = (idx, val) => {
    const updated = [...thresholdItems];
    const num = parseFloat(val);
    updated[idx].threshold = isNaN(num) ? 0 : Math.max(0, num);
    setThresholdItems(updated);
  };

  const handleIncludeToggle = (idx) => {
    const updated = [...thresholdItems];
    updated[idx].included = !updated[idx].included;
    setThresholdItems(updated);
  };

  const handleAddCustomItem = () => {
    if (!newItem.name.trim()) {
      showToast('Item name is required', 'error');
      return;
    }
    setThresholdItems([...thresholdItems, { ...newItem, included: true }]);
    setNewItem({ name: '', category: 'Dairy', threshold: 1.0, unit: 'kg' });
    setShowAddItem(false);
    showToast('Custom item added to your list!', 'success');
  };

  const handleFinish = () => {
    // Collect active items and format them
    const activeItems = thresholdItems
      .filter(item => item.included)
      .map((item, idx) => ({
        id: `signup-item-${idx}`,
        name: item.name,
        category: item.category,
        quantity: item.threshold * 2, // Prefill double threshold as current qty
        unit: item.unit,
        threshold: item.threshold,
        dateAdded: '2026-06-03',
        expiryDate: item.category === 'Dairy' ? '2026-06-08' : item.category === 'Vegetables' ? '2026-06-07' : null,
        pricePerUnit: item.category === 'Dairy' ? 60 : 40,
        addedBy: formData.name
      }));

    signup({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      mobile: formData.mobile,
      familySize: formData.familySize,
      language: formData.language,
      vendors: vendors,
      items: activeItems
    });
    
    navigate('/dashboard');
  };

  return (
    <div className="signup-page animate-fade-in">
      <div className="signup-card">
        
        {/* Onboarding Header */}
        <div className="signup-header">
          <h2 className="signup-title">Create Your Account</h2>
          <p className="signup-subtitle">
            {step === 1 && 'Step 1: Set up your primary details'}
            {step === 2 && 'Step 2: Add WhatsApp vendor contacts'}
            {step === 3 && 'Step 3: Define alert inventory thresholds'}
          </p>
        </div>

        {/* Custom Step progress bar */}
        <div className="progress-container">
          <div className="progress-bar-bg"></div>
          <div 
            className="progress-bar-active" 
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
          <div className={`progress-step-dot ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            {step > 1 ? <Check size={16} /> : '1'}
          </div>
          <div className={`progress-step-dot ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            {step > 2 ? <Check size={16} /> : '2'}
          </div>
          <div className={`progress-step-dot ${step === 3 ? 'active' : ''}`}>
            3
          </div>
        </div>

        {/* STEP 1 FORM */}
        {step === 1 && (
          <form onSubmit={handleNextStep1} className="form-grid">
            <div className="col-span-2">
              <label htmlFor="fullName">Full Name</label>
              <input 
                id="fullName"
                type="text" 
                placeholder="Priya Sharma"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="col-span-2">
              <label htmlFor="mobile">Mobile Number</label>
              <div className="phone-input-group">
                <select 
                  className="country-code-select"
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                >
                  <option value="+91">+91 (IN)</option>
                  <option value="+1">+1 (US)</option>
                  <option value="+44">+44 (UK)</option>
                </select>
                <input 
                  id="mobile"
                  type="tel" 
                  placeholder="98765 43210"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                />
              </div>
              {errors.mobile && <span className="error-text">{errors.mobile}</span>}
            </div>

            <div className="col-span-2">
              <label htmlFor="email">Email Address</label>
              <input 
                id="email"
                type="email" 
                placeholder="priya@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="col-span-2">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input 
                  id="password"
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div>
              <label htmlFor="familySize">Family Size</label>
              <select 
                id="familySize"
                value={formData.familySize}
                onChange={(e) => setFormData({ ...formData, familySize: e.target.value })}
              >
                <option value="1">1 Person</option>
                <option value="2">2 People</option>
                <option value="3">3 People</option>
                <option value="4">4 People</option>
                <option value="5">5+ People</option>
              </select>
            </div>

            <div>
              <label htmlFor="language">Language Preference</label>
              <select 
                id="language"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
              </select>
            </div>

            <div className="col-span-2 btn-group">
              <button type="submit" className="btn btn-primary">
                Next <ArrowRight size={16} />
              </button>
            </div>
            
            <div className="col-span-2" style={{ textAlign: 'center', marginTop: '1rem' }}>
              <p style={{ fontSize: '0.85rem' }}>
                Already have an account? <Link to="/login">Log In</Link>
              </p>
            </div>
          </form>
        )}

        {/* STEP 2: ADD VENDORS */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              We'll use these contact numbers to format and send orders directly via WhatsApp. You can customize or skip these for now.
            </p>

            <div className="vendors-list">
              {vendors.map((vendor, idx) => (
                <div key={idx} className="vendor-row">
                  <div className="vendor-label">
                    <span className="vendor-emoji">{vendor.emoji}</span>
                    <span>{vendor.category}</span>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Vendor Name"
                    value={vendor.name}
                    onChange={(e) => handleVendorFieldChange(idx, 'name', e.target.value)}
                    style={{ flex: 1, height: '36px', padding: '0 0.5rem' }}
                  />
                  <input 
                    type="tel" 
                    placeholder="WhatsApp (10-digit)"
                    value={vendor.contact}
                    onChange={(e) => handleVendorFieldChange(idx, 'contact', e.target.value.replace(/\D/g, ''))}
                    style={{ width: '130px', height: '36px', padding: '0 0.5rem' }}
                  />
                  <button 
                    onClick={() => handleDeleteVendor(idx)}
                    className="delete-vendor-btn"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>

            {/* Custom Vendor Drawer/Form */}
            {showAddVendor ? (
              <div className="custom-vendor-form animate-fade-in">
                <h4 style={{ fontSize: '0.95rem' }}>Add Custom Vendor</h4>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    type="text" 
                    placeholder="Vendor Name (e.g. Milkman)"
                    value={newVendor.name}
                    onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                    style={{ flex: 1 }}
                  />
                  <input 
                    type="tel" 
                    placeholder="WhatsApp No."
                    value={newVendor.contact}
                    onChange={(e) => setNewVendor({ ...newVendor, contact: e.target.value.replace(/\D/g, '') })}
                    style={{ width: '150px' }}
                  />
                </div>
                <div>
                  <label style={{ marginBottom: '0.25rem' }}>Choose Emoji Icon</label>
                  <div className="emoji-selector">
                    {['🥛', '🥦', '🍎', '🛒', '🍞', '🥩', '🐟', '🧴'].map(emoji => (
                      <span 
                        key={emoji}
                        className={`emoji-option ${newVendor.emoji === emoji ? 'selected' : ''}`}
                        onClick={() => setNewVendor({ ...newVendor, emoji, category: emoji === '🥛' ? 'Dairy' : emoji === '🥦' ? 'Vegetables' : emoji === '🍎' ? 'Fruits' : 'Custom' })}
                      >
                        {emoji}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAddVendor(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleAddCustomVendor}>Add Row</button>
                </div>
              </div>
            ) : (
              <button 
                className="btn add-vendor-btn"
                onClick={() => setShowAddVendor(true)}
              >
                <Plus size={16} /> Add Custom Vendor
              </button>
            )}

            <div className="btn-group">
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={() => setStep(3)}>
                Next <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DEFAULT THRESHOLDS */}
        {step === 3 && (
          <div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Define alert points. Smart defaults are pre-filled below based on your family size of {formData.familySize}.
            </p>

            <div className="thresholds-list">
              {thresholdItems.map((item, idx) => (
                <div key={idx} className={`threshold-row ${!item.included ? 'skipped' : ''}`}>
                  <div className="threshold-info">
                    <span className="threshold-name">{item.name}</span>
                    <span className="threshold-cat">{item.category}</span>
                  </div>
                  
                  {item.included && (
                    <div className="threshold-controls">
                      {/* Quantity Stepper */}
                      <div className="stepper">
                        <button className="stepper-btn" onClick={() => handleThresholdChange(idx, -0.5)}>-</button>
                        <input 
                          type="text" 
                          className="stepper-input" 
                          value={item.threshold}
                          onChange={(e) => handleThresholdInputChange(idx, e.target.value)}
                        />
                        <button className="stepper-btn" onClick={() => handleThresholdChange(idx, 0.5)}>+</button>
                      </div>

                      <select 
                        className="unit-selector-mini"
                        value={item.unit}
                        onChange={(e) => {
                          const updated = [...thresholdItems];
                          updated[idx].unit = e.target.value;
                          setThresholdItems(updated);
                        }}
                      >
                        <option value="kg">kg</option>
                        <option value="g">g</option>
                        <option value="L">L</option>
                        <option value="pcs">pcs</option>
                        <option value="packets">pkts</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="switch">
                      <input 
                        type="checkbox" 
                        checked={item.included}
                        onChange={() => handleIncludeToggle(idx)}
                      />
                      <span className="slider"></span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Item Form */}
            {showAddItem ? (
              <div className="custom-item-form animate-fade-in">
                <h4 style={{ fontSize: '0.95rem' }}>Add Custom Item</h4>
                <div className="custom-item-row">
                  <input 
                    type="text" 
                    placeholder="Butter, Bread, etc."
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                  <select 
                    value={newItem.category} 
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    style={{ width: '120px' }}
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Vegetables">Veg</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Dry Goods">Dry</option>
                    <option value="Snacks">Snacks</option>
                  </select>
                </div>
                <div className="custom-item-row">
                  <input 
                    type="number" 
                    placeholder="Limit"
                    value={newItem.threshold}
                    onChange={(e) => setNewItem({ ...newItem, threshold: parseFloat(e.target.value) || 0 })}
                  />
                  <select 
                    value={newItem.unit} 
                    onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                    style={{ width: '100px' }}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="L">L</option>
                    <option value="pcs">pcs</option>
                    <option value="packets">pkts</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowAddItem(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleAddCustomItem}>Add Item</button>
                </div>
              </div>
            ) : (
              <button 
                className="add-custom-item-btn"
                onClick={() => setShowAddItem(true)}
              >
                <Plus size={14} /> Add custom item
              </button>
            )}

            <div className="btn-group">
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> Back
              </button>
              <button className="btn btn-primary" onClick={handleFinish}>
                Finish Setup <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Signup;
