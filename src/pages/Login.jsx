import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { AppContext } from '../context/AppContext';
import './Login.css';

const Login = () => {
  const { login, showToast } = useContext(AppContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const handleLogin = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      }
    } else {
      showToast('Please fix validation errors', 'error');
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors({ email: 'Please enter your email to request a reset link' });
      showToast('Please specify email address first', 'error');
    } else {
      setErrors({});
      showToast(`Reset instructions sent to ${email}`, 'success');
    }
  };

  const handleGoogleSignIn = async () => {
    showToast('Google sign-in requires email registration', 'error');
  };

  return (
    <div className="login-page animate-fade-in">
      <div className="login-card">
        {/* Login Header */}
        <div className="login-header">
          <div className="logo-container" style={{ borderBottom: 'none', paddingBottom: 0, justifyContent: 'center', marginBottom: '0.75rem' }}>
            <span className="logo-icon" style={{ fontSize: '2rem' }}>🧊</span>
            <span className="logo-text" style={{ fontSize: '1.5rem' }}>FridgeFlow</span>
          </div>
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle font-sans">Enter your credentials to access your fridge dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="login-form">
          <div>
            <label htmlFor="email">Email Address</label>
            <input 
              id="email"
              type="email" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password" style={{ marginBottom: 0 }}>Password</label>
              <a href="#forgot" onClick={handleForgotPassword} className="forgot-password-link">
                Forgot Password?
              </a>
            </div>
            <div className="password-input-wrapper" style={{ marginTop: '0.5rem' }}>
              <input 
                id="password"
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
            <LogIn size={18} /> Log In
          </button>
        </form>

        <div className="divider">or</div>

        {/* Google sign-in button */}
        <button 
          className="btn google-login-btn"
          onClick={handleGoogleSignIn}
        >
          {/* Custom inline Google SVG Icon */}
          <svg className="google-icon" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.48 14.98 1 12 1 7.35 1 3.39 3.65 1.5 7.5l3.86 3C6.27 7.74 8.92 5.04 12 5.04z"
            />
            <path
              fill="#4285F4"
              d="M23.49 12.27c0-.81-.07-1.59-.2-2.27H12v4.51h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.75-4.87 3.75-8.63z"
            />
            <path
              fill="#FBBC05"
              d="M5.36 14.5c-.24-.72-.38-1.49-.38-2.3s.14-1.58.38-2.3L1.5 6.9C.54 8.84 0 10.97 0 13.2s.54 4.36 1.5 6.3l3.86-3z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-4.3 1.09-3.08 0-5.73-2.7-6.64-5.46l-3.86 3C3.39 20.35 7.35 23 12 23z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="signup-redirect font-sans">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
