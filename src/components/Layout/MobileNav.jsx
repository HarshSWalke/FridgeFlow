import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  BookOpen, 
  LogOut 
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import './Layout.css';

const MobileNav = () => {
  const { user, logout, showToast } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, enabled: true },
    { name: 'My Fridge', path: '/my-fridge', icon: Package, enabled: true },
    { name: 'Reorder', path: '/reorder', icon: ClipboardList, enabled: true },
    { name: 'Notebook', path: '/notebook', icon: BookOpen, enabled: true },
  ];

  const handleNavClick = (item) => {
    if (item.enabled) {
      navigate(item.path);
    } else {
      showToast(`${item.name} is a placeholder (out of workspace scope)`, 'warning');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <header className="mobile-header">
        <div className="logo-container" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <span className="logo-icon">🧊</span>
          <span className="logo-text">FridgeFlow</span>
        </div>
        <button 
          onClick={handleLogout} 
          style={{ background: 'none', border: 'none', color: 'var(--expired)', padding: '0.5rem', cursor: 'pointer' }}
          aria-label="Log Out"
        >
          <LogOut size={20} />
        </button>
      </header>

      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.name}
              onClick={() => handleNavClick(item)}
              className={`mobile-nav-item ${isActive ? 'active' : ''} ${!item.enabled ? 'nav-link-disabled' : ''}`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </div>
          );
        })}
      </nav>
    </>
  );
};

export default MobileNav;
