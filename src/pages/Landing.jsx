import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  PlusCircle, 
  Bell, 
  MessageSquare, 
  TrendingUp, 
  Users, 
  Share2,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();

  const handleStart = () => {
    navigate('/signup');
  };

  const steps = [
    {
      number: 1,
      title: 'Add your fridge items',
      desc: 'Quickly register your groceries. Track quantities, categories, and custom expiry dates with a few simple taps.',
      icon: PlusCircle
    },
    {
      number: 2,
      title: 'Get smart alerts',
      desc: 'Receive proactive alerts when items are expiring soon, expired, or falling below your custom safety threshold.',
      icon: Bell
    },
    {
      number: 3,
      title: 'Reorder in one tap',
      desc: 'Generate automatically sorted grocery lists grouped by vendor and send standard orders directly via WhatsApp.',
      icon: MessageSquare
    }
  ];

  const features = [
    {
      title: 'Virtual Fridge',
      desc: 'At-a-glance shelf status of all your dairy, vegetables, fruits, and dry goods with color-coded freshness dots.',
      icon: Layers
    },
    {
      title: 'Expiry Alerts',
      desc: 'No more science experiments in the back of the shelf. Know exactly what needs to be consumed today or tomorrow.',
      icon: Calendar
    },
    {
      title: 'WhatsApp Reorder',
      desc: 'Send formatted, prefilled delivery lists directly to your milkman, vegetable vendor, or local store in seconds.',
      icon: MessageSquare
    },
    {
      title: 'Spending Tracker',
      desc: 'Understand exactly where your grocery money goes. Track monthly budgets, category costs, and wasted food values.',
      icon: TrendingUp
    },
    {
      title: 'Multi-Vendor Sync',
      desc: 'Register multiple suppliers and assign items directly, letting the system route order lists to the right contact.',
      icon: Users
    },
    {
      title: 'Family Sharing',
      desc: 'Collaborate with your family. Shared state prevents duplicate purchases and lists the member who consumed or added items.',
      icon: Share2
    }
  ];

  return (
    <div className="landing-page animate-fade-in">
      {/* Sticky Header */}
      <header className="landing-header">
        <div className="logo-container" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <span className="logo-icon">🧊</span>
          <span className="logo-text">FridgeFlow</span>
        </div>

        <nav className="landing-nav">
          <a href="#how-it-works" className="landing-nav-link">How It Works</a>
          <a href="#features" className="landing-nav-link">Features</a>
        </nav>

        <div className="landing-auth-buttons">
          <Link to="/login" className="btn btn-secondary btn-sm" style={{ minHeight: 'auto' }}>Log In</Link>
          <Link to="/signup" className="btn btn-primary btn-sm" style={{ minHeight: 'auto' }}>Get Started</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero-headline">
          Never waste food.<br />Never run out. Never forget.
        </h1>
        <p className="hero-subheadline">
          FridgeFlow is the intelligent virtual pantry that monitors expiry dates, tracks thresholds, and builds WhatsApp orders automatically.
        </p>
        <button className="btn btn-primary" onClick={handleStart} style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}>
          Get Started Free <ArrowRight size={18} />
        </button>

        {/* Virtual Fridge CSS Illustration */}
        <div className="fridge-illustration">
          <div className="fridge-handle-top"></div>
          <div className="fridge-handle-bottom"></div>
          <div className="fridge-door-line"></div>
          
          {/* Shelf 1 */}
          <div className="fridge-shelf">
            <span className="preview-item preview-tall"></span>
            <span className="preview-item preview-tall" style={{ opacity: 0.5 }}></span>
            <span className="preview-item preview-jar"></span>
          </div>
          {/* Shelf 2 */}
          <div className="fridge-shelf">
            <span className="preview-item preview-round"></span>
            <span className="preview-item preview-round" style={{ backgroundColor: '#10b981' }}></span>
            <span className="preview-item preview-dot"></span>
            <span className="preview-item preview-dot" style={{ backgroundColor: '#f59e0b' }}></span>
          </div>
          {/* Shelf 3 */}
          <div className="fridge-shelf">
            <span className="preview-item preview-jar" style={{ backgroundColor: '#8b5cf6', height: '28px' }}></span>
            <span className="preview-item preview-round" style={{ width: '22px', height: '22px' }}></span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="how-it-works">
        <h2 className="section-title">How FridgeFlow Works</h2>
        <p className="section-subtitle">Keep your kitchen flow seamless in three simple steps</p>
        
        <div className="steps-grid">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="step-card">
                <div className="step-icon-wrapper">
                  <Icon size={32} />
                  <span className="step-number">{step.number}</span>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Features Strip */}
      <section id="features" className="features-strip">
        <h2 className="section-title" style={{ textAlign: 'center' }}>Tailored Features</h2>
        <p className="section-subtitle" style={{ textAlign: 'center' }}>Everything you need to manage your inventory and vendors</p>

        <div className="features-grid">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div key={idx} className="card feature-card card-hover">
                <div className="feature-icon-wrapper">
                  <Icon size={24} />
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-desc">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <span style={{ fontSize: '1.5rem' }}>🧊</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>FridgeFlow</span>
          </div>
          <div className="footer-links">
            <a href="#privacy" className="footer-link" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
            <a href="#terms" className="footer-link" onClick={(e) => e.preventDefault()}>Terms of Service</a>
            <a href="#contact" className="footer-link" onClick={(e) => e.preventDefault()}>Contact Support</a>
          </div>
        </div>
        <div className="copyright">
          &copy; {new Date().getFullYear()} FridgeFlow. All rights reserved. Made for premium smart kitchens.
        </div>
      </footer>
    </div>
  );
};

export default Landing;
