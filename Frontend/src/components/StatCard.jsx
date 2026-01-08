import React, { useState } from 'react';
import { Link } from 'react-router';

const StatCard = ({
  title,
  value,
  icon,
  trend = null, // { value: 12, direction: 'up' | 'down' }
  change = null, // percentage change
  subtext = null,
  linkTo = null,
  color = 'teal', // teal, emerald, blue, purple, amber, red
  progress = null, // { value: 75, max: 100 }
  onClick = null,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Color schemes
  const colors = {
    teal: {
      gradient: 'from-teal-500 to-emerald-500',
      bg: 'bg-teal-500/20',
      border: 'border-teal-500/30',
      text: 'text-teal-400',
      glow: 'shadow-teal-500/20 hover:shadow-teal-500/30'
    },
    emerald: {
      gradient: 'from-emerald-500 to-green-500',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      text: 'text-emerald-400',
      glow: 'shadow-emerald-500/20 hover:shadow-emerald-500/30'
    },
    blue: {
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      text: 'text-blue-400',
      glow: 'shadow-blue-500/20 hover:shadow-blue-500/30'
    },
    purple: {
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      glow: 'shadow-purple-500/20 hover:shadow-purple-500/30'
    },
    amber: {
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      glow: 'shadow-amber-500/20 hover:shadow-amber-500/30'
    },
    red: {
      gradient: 'from-red-500 to-rose-500',
      bg: 'bg-red-500/20',
      border: 'border-red-500/30',
      text: 'text-red-400',
      glow: 'shadow-red-500/20 hover:shadow-red-500/30'
    }
  };

  const colorScheme = colors[color] || colors.teal;

  // Trend indicator
  const TrendIndicator = () => {
    if (!trend) return null;

    const isUp = trend.direction === 'up';
    const trendColor = isUp ? 'text-emerald-400' : 'text-red-400';

    return (
      <div className={`flex items-center text-xs font-medium ${trendColor}`}>
        <svg
          className={`w-4 h-4 mr-1 ${isUp ? '' : 'rotate-180'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
        {trend.value}%
      </div>
    );
  };

  // Progress bar
  const ProgressBar = () => {
    if (!progress) return null;

    const percentage = (progress.value / progress.max) * 100;

    return (
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
          <span>Progress</span>
          <span>{progress.value} / {progress.max}</span>
        </div>
        <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${colorScheme.gradient} transition-all duration-500 ease-out`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  };

  const CardContent = () => (
    <>
      <div className="flex items-center justify-between mb-3">
        {/* Icon */}
        <div className={`w-12 h-12 bg-gradient-to-br ${colorScheme.gradient} rounded-lg flex items-center justify-center shadow-lg ${colorScheme.glow} shrink-0`}>
          {typeof icon === 'string' ? (
            <span className="text-2xl">{icon}</span>
          ) : (
            icon
          )}
        </div>

        {/* Trend/Change indicator */}
        {(trend || change !== null) && (
          <div className="flex flex-col items-end">
            <TrendIndicator />
            {change !== null && (
              <span className={`text-xs ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <p className="text-sm text-gray-400 mb-1">{title}</p>

      {/* Value */}
      <p className={`text-3xl font-bold bg-gradient-to-r ${colorScheme.gradient} bg-clip-text text-transparent mb-1`}>
        {value}
      </p>

      {/* Subtext */}
      {subtext && (
        <p className="text-xs text-gray-500">{subtext}</p>
      )}

      {/* Progress Bar */}
      <ProgressBar />

      {/* Expand indicator */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-gray-700/50 text-xs text-gray-400 animate-fade-in">
          <p>Additional details would appear here</p>
        </div>
      )}
    </>
  );

  const cardClasses = `
    glass-card rounded-xl p-6 
    transition-all duration-300 ease-out
    hover:shadow-2xl ${colorScheme.glow}
    hover:border-${color}-500/30
    transform hover:-translate-y-1
    ${onClick || linkTo ? 'cursor-pointer' : ''}
    ${className}
  `;

  if (linkTo) {
    return (
      <Link to={linkTo} className={cardClasses}>
        <CardContent />
      </Link>
    );
  }

  return (
    <div
      className={cardClasses}
      onClick={() => {
        if (onClick) onClick();
        setIsExpanded(!isExpanded);
      }}
    >
      <CardContent />
    </div>
  );
};

export default StatCard;

