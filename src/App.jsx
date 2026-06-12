import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppContext } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Landing from './pages/Landing';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MyFridge from './pages/MyFridge';
import Reorder from './pages/Reorder';
import Notebook from './pages/Notebook';
import Settings from './pages/Settings';

// Route guard for authenticated areas (dashboard)
const ProtectedRoute = ({ children }) => {
  const { user } = useContext(AppContext);
  return user ? children : <Navigate to="/login" replace />;
};

// Route guard for login/signup pages (prevents logged in user from accessing signup/login)
const AuthRoute = ({ children }) => {
  const { user } = useContext(AppContext);
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<AuthRoute><Signup /></AuthRoute>} />
        <Route path="/login" element={<AuthRoute><Login /></AuthRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/my-fridge" element={<ProtectedRoute><MyFridge /></ProtectedRoute>} />
        <Route path="/reorder" element={<ProtectedRoute><Reorder /></ProtectedRoute>} />
        <Route path="/notebook" element={<ProtectedRoute><Notebook /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

        
        {/* Wildcard Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
