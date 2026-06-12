import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ClipboardList, 
  BookOpen, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import './Layout.css';

const Sidebar = () => {
  const { user, logout, showToast } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, enabled: true },
    { name: 'My Fridge', path: '/my-fridge', icon: Package, enabled: true },
    { name: 'Reorder', path: '/reorder', icon: ClipboardList, enabled: true },
    { name: 'Notebook', path: '/notebook', icon: BookOpen, enabled: true },
    { name: 'Settings', path: '/settings', icon: Settings, enabled: true },
  ];

  const handleNavClick = (item) => {
    if (item.enabled) {
      navigate(item.path);
    } else {
      showToast(`${item.name} is a placeholder (out of workspace scope for this build)`, 'warning');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div>
        <div className="logo-container">
          <span className="logo-icon">🧊</span>
          <span className="logo-text">FridgeFlow</span>
        </div>

        <div className="user-profile">
          <div className="avatar flex-center">
            {getInitials(user.name)}
          </div>
          <div className="user-info">
            <span className="user-name">{user.name}</span>
            <span className="user-role">Premium Member</span>
          </div>
        </div>

        <nav className="nav-links">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <div
                key={item.name}
                onClick={() => handleNavClick(item)}
                className={`nav-link ${isActive ? 'active' : ''} ${!item.enabled ? 'nav-link-disabled' : ''}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </div>
            );
          })}
        </nav>
      </div>

      <div className="logout-btn" onClick={handleLogout}>
        <LogOut size={20} />
        <span>Log Out</span>
      </div>
    </aside>
  );
};

export default Sidebar;
