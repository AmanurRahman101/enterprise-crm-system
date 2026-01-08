import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';

const RouteLoadingBar = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  useEffect(() => {
    // Start loading when route changes
    setLoading(true);
    setProgress(0);

    // Simulate loading progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 50);

    // Complete loading after a short delay
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 200);
    }, 300);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(completeTimer);
    };
  }, [location.pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-1">
      <div
        className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 transition-all duration-200 ease-out shadow-lg shadow-teal-500/50"
        style={{ 
          width: `${progress}%`,
          transition: progress === 100 ? 'width 0.2s ease-out, opacity 0.2s ease-out' : 'width 0.2s ease-out',
          opacity: progress === 100 ? 0 : 1
        }}
      />
    </div>
  );
};

export default RouteLoadingBar;

