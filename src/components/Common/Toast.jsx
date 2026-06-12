import React, { useContext } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { AppContext } from '../../context/AppContext';
import './Components.css';

const Toast = () => {
  const { toasts, setToasts } = useContext(AppContext);

  if (!toasts || toasts.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="toast-icon-success" size={20} />;
      case 'warning':
        return <AlertTriangle className="toast-icon-warning" size={20} />;
      case 'error':
        return <AlertCircle className="toast-icon-error" size={20} />;
      default:
        return <CheckCircle2 className="toast-icon-success" size={20} />;
    }
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast-${toast.type}`}>
          {getIcon(toast.type)}
          <span className="toast-message">{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

export default Toast;
