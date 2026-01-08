import React, { useState } from 'react';

const FloatingActionButton = ({ actions = [], position = 'bottom-right' }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const handleMainClick = () => {
    if (actions.length === 1) {
      actions[0].onClick();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const handleActionClick = (action) => {
    action.onClick();
    setIsExpanded(false);
  };

  if (actions.length === 0) return null;

  return (
    <>
      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsExpanded(false)}
        />
      )}

      <div className={`fixed ${positionClasses[position]} z-50`}>
        {/* Action Menu Items */}
        {isExpanded && actions.length > 1 && (
          <div className="absolute bottom-20 right-0 flex flex-col-reverse gap-3 mb-2 animate-slide-up">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-3 group"
                style={{
                  animation: `slideUp 0.3s ease-out ${index * 0.05}s both`
                }}
              >
                {/* Tooltip Label */}
                <div className="bg-gray-900/95 backdrop-blur-xl text-white text-sm px-3 py-2 rounded-lg shadow-lg border border-teal-500/30 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </div>

                {/* Action Button */}
                <button
                  onClick={() => handleActionClick(action)}
                  className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 text-teal-400 rounded-full shadow-lg hover:shadow-xl hover:shadow-teal-500/30 transition-all transform hover:scale-110 flex items-center justify-center border border-teal-500/30"
                  title={action.label}
                >
                  {action.icon}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={handleMainClick}
          className={`w-14 h-14 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-full shadow-lg hover:shadow-2xl hover:shadow-teal-500/50 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center group ${
            isExpanded ? 'rotate-45' : ''
          }`}
          title={actions.length === 1 ? actions[0].label : 'Quick Actions'}
        >
          {actions.length === 1 ? (
            actions[0].icon
          ) : (
            <svg
              className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-45' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          )}
        </button>

        {/* Pulse animation ring */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full animate-ping opacity-20"></div>
        </div>
      </div>
    </>
  );
};

export default FloatingActionButton;

