import React from 'react';
import './Components.css';

export const SkeletonText = ({ lines = 3, className = '' }) => {
  return (
    <div className={`skeleton-container ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="skeleton-pulse skeleton-text" 
          style={{ width: i === lines - 1 && lines > 1 ? '70%' : '100%' }}
        />
      ))}
    </div>
  );
};

export const SkeletonCircle = ({ size = 48, className = '' }) => {
  return (
    <div 
      className={`skeleton-pulse ${className}`} 
      style={{ width: size, height: size, borderRadius: '50%' }}
    />
  );
};

export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton-pulse skeleton-title" style={{ width: '40%' }} />
        <SkeletonCircle size={16} />
      </div>
      <div style={{ margin: '0.5rem 0' }}>
        <div className="skeleton-pulse skeleton-title" style={{ width: '70%', height: '24px' }} />
      </div>
      <SkeletonText lines={2} />
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <div className="skeleton-pulse" style={{ height: '36px', flex: 1, borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton-pulse" style={{ height: '36px', width: '36px', borderRadius: '50%' }} />
      </div>
    </div>
  );
};

export const SkeletonDashboard = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* 4 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton-card" style={{ height: '110px', justifyContent: 'center' }}>
            <div className="skeleton-pulse" style={{ height: '12px', width: '50%', marginBottom: '8px' }} />
            <div className="skeleton-pulse" style={{ height: '28px', width: '80%' }} />
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="skeleton-card" style={{ height: '250px' }}>
            <div className="skeleton-pulse skeleton-title" />
            <SkeletonText lines={4} />
          </div>
          <div className="skeleton-card" style={{ height: '200px' }}>
            <div className="skeleton-pulse skeleton-title" style={{ width: '30%' }} />
            <SkeletonText lines={3} />
          </div>
        </div>
        <div className="skeleton-card" style={{ height: '470px' }}>
          <div className="skeleton-pulse skeleton-title" style={{ marginBottom: '1.5rem' }} />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
              <SkeletonCircle size={32} />
              <div style={{ flex: 1 }}>
                <div className="skeleton-pulse" style={{ height: '12px', width: '60%', marginBottom: '6px' }} />
                <div className="skeleton-pulse" style={{ height: '10px', width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
