import React, { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import Toast from '../Common/Toast';
import './Layout.css';

const Layout = ({ children }) => {
  const { user } = useContext(AppContext);
  const location = useLocation();

  const publicRoutes = ['/', '/login', '/signup'];
  const isPublic = publicRoutes.includes(location.pathname);

  // If public route, just render children directly (e.g. Landing page handles its own layout)
  if (isPublic) {
    return (
      <div className="public-container">
        {children}
        <Toast />
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Top Header & Bottom Tab Bar */}
      <MobileNav />

      {/* Main Content Pane */}
      <main className="main-content">
        {children}
      </main>

      {/* Global Toasts */}
      <Toast />
    </div>
  );
};

export default Layout;
