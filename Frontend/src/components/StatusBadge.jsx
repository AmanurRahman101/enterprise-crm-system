import React from 'react';

const StatusBadge = ({ 
  status, 
  variant = 'default', // default, success, warning, error, info
  icon = null,
  pulse = false,
  size = 'md', // sm, md, lg
  className = ''
}) => {
  // Predefined status configurations
  const statusConfigs = {
    // Deal stages
    lead: { variant: 'info', icon: '🎯', label: 'Lead' },
    qualified: { variant: 'default', icon: '✓', label: 'Qualified' },
    proposal: { variant: 'warning', icon: '📄', label: 'Proposal' },
    negotiation: { variant: 'warning', icon: '🤝', label: 'Negotiation' },
    won: { variant: 'success', icon: '🎉', label: 'Won' },
    lost: { variant: 'error', icon: '✗', label: 'Lost' },
    
    // Issue statuses
    open: { variant: 'info', icon: '📭', label: 'Open' },
    in_progress: { variant: 'warning', icon: '⚙️', label: 'In Progress' },
    resolved: { variant: 'success', icon: '✓', label: 'Resolved' },
    closed: { variant: 'default', icon: '✓', label: 'Closed' },
    
    // Priorities
    low: { variant: 'default', icon: '⬇', label: 'Low' },
    medium: { variant: 'info', icon: '➡', label: 'Medium' },
    high: { variant: 'warning', icon: '⬆', label: 'High' },
    critical: { variant: 'error', icon: '🔥', label: 'Critical' },
    
    // Member roles
    owner: { variant: 'error', icon: '👑', label: 'Owner' },
    admin: { variant: 'warning', icon: '⚡', label: 'Admin' },
    member: { variant: 'info', icon: '👤', label: 'Member' },
    viewer: { variant: 'default', icon: '👁', label: 'Viewer' },
    
    // Activity types
    note: { variant: 'default', icon: '📝', label: 'Note' },
    call: { variant: 'info', icon: '📞', label: 'Call' },
    email: { variant: 'default', icon: '📧', label: 'Email' },
    meeting: { variant: 'warning', icon: '📅', label: 'Meeting' },
    task: { variant: 'info', icon: '✓', label: 'Task' }
  };

  // Get configuration for the status
  const config = typeof status === 'string' && statusConfigs[status.toLowerCase()] 
    ? statusConfigs[status.toLowerCase()] 
    : { variant, icon, label: status };

  // Variant styles
  const variants = {
    default: {
      bg: 'bg-gray-700/50',
      border: 'border-gray-600/50',
      text: 'text-gray-300',
      glow: 'shadow-gray-500/20'
    },
    success: {
      bg: 'bg-gradient-to-r from-emerald-500/20 to-green-500/20',
      border: 'border-emerald-500/40',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/30'
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/40',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/30'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-500/20 to-rose-500/20',
      border: 'border-red-500/40',
      text: 'text-red-400',
      glow: 'shadow-red-500/30'
    },
    info: {
      bg: 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20',
      border: 'border-cyan-500/40',
      text: 'text-cyan-400',
      glow: 'shadow-cyan-500/30'
    }
  };

  // Size styles
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const variantStyles = variants[config.variant] || variants.default;
  const sizeStyles = sizes[size] || sizes.md;

  // Icon component
  const renderIcon = () => {
    if (config.icon) {
      return (
        <span className="mr-1.5">
          {config.icon}
        </span>
      );
    }
    return null;
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        ${variantStyles.bg}
        ${variantStyles.border}
        ${variantStyles.text}
        ${sizeStyles}
        border rounded-full
        font-medium
        backdrop-blur-sm
        transition-all duration-200
        ${pulse ? 'animate-pulse' : ''}
        ${pulse ? `shadow-lg ${variantStyles.glow}` : 'shadow-sm'}
        ${className}
      `}
    >
      {renderIcon()}
      {config.label}
      
      {/* Pulse dot for active statuses */}
      {pulse && (
        <span className="relative ml-1.5 flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${variantStyles.text} opacity-75`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${variantStyles.text}`}></span>
        </span>
      )}
    </span>
  );
};

export default StatusBadge;

