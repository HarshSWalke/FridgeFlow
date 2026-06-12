import React from 'react';
import './Components.css';

const EmptyState = ({ 
  icon = '🔍', 
  title = 'No results found', 
  description = 'Try adjusting your filters or searches to find what you are looking for.', 
  actionText, 
  onAction 
}) => {
  return (
    <div className="empty-state animate-fade-in">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
