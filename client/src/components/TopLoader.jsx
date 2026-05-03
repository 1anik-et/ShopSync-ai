import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './TopLoader.css';

const TopLoader = () => {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  const startLoader = () => {
    setVisible(true);
    setProgress(15);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) {
          clearInterval(interval);
          return prev;
        }
        return prev + Math.random() * 15;
      });
    }, 150);

    // After simulated page load time, rip to 100% and fade
    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setProgress(0), 400); // reset state after invisible transition
      }, 400);
    }, 500);
  };

  useEffect(() => {
    startLoader();
    window.scrollTo(0, 0); // Autoscroll to top on new route
  }, [location.pathname]);

  // Expose a global event listener for manual triggers (e.g. clicking logo on home page)
  useEffect(() => {
    const handleTrigger = () => startLoader();
    window.addEventListener('trigger-top-loader', handleTrigger);
    return () => window.removeEventListener('trigger-top-loader', handleTrigger);
  }, []);

  return (
    <div className="top-loader-container" style={{ opacity: visible ? 1 : 0, transition: visible ? 'none' : 'opacity 0.4s ease' }}>
      <div className="top-loader-bar" style={{ width: `${progress}%`, transition: progress === 0 ? 'none' : 'width 0.2s ease-out' }}></div>
    </div>
  );
};

export default TopLoader;
