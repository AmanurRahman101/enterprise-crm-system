import React, { useState, useRef, useEffect } from 'react';

const Tooltip = ({ 
  children, 
  content, 
  position = 'top', // top, bottom, left, right
  delay = 200,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const timeoutRef = useRef(null);
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      adjustPosition();
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const adjustPosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition = position;

    // Check if tooltip goes off-screen and adjust position
    if (position === 'top' && triggerRect.top - tooltipRect.height < 0) {
      newPosition = 'bottom';
    } else if (position === 'bottom' && triggerRect.bottom + tooltipRect.height > viewport.height) {
      newPosition = 'top';
    } else if (position === 'left' && triggerRect.left - tooltipRect.width < 0) {
      newPosition = 'right';
    } else if (position === 'right' && triggerRect.right + tooltipRect.width > viewport.width) {
      newPosition = 'left';
    }

    setTooltipPosition(newPosition);
  };

  const getPositionClasses = () => {
    const baseClasses = 'absolute z-[9999] pointer-events-none';
    const positions = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2'
    };
    return `${baseClasses} ${positions[tooltipPosition]}`;
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-2 h-2 bg-gray-900/95 backdrop-blur-xl border border-teal-500/30 rotate-45';
    const positions = {
      top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-t-0 border-l-0',
      bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-b-0 border-r-0',
      left: 'right-[-4px] top-1/2 -translate-y-1/2 border-l-0 border-b-0',
      right: 'left-[-4px] top-1/2 -translate-y-1/2 border-r-0 border-t-0'
    };
    return `${baseClasses} ${positions[tooltipPosition]}`;
  };

  if (!content) return children;

  return (
    <div 
      className={`relative inline-block ${className}`}
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`${getPositionClasses()} animate-scale-in`}
        >
          <div className="bg-gray-900/95 backdrop-blur-xl text-white text-xs px-3 py-2 rounded-lg border border-teal-500/30 shadow-2xl shadow-black/50 whitespace-nowrap max-w-xs">
            {content}
            <div className={getArrowClasses()} />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;

