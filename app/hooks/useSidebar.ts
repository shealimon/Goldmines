'use client';

import { useState, useEffect } from 'react';

export const useSidebar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setIsMobileOpen(false);
    };

    // Listen for route changes (Next.js 13+)
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
  const closeMobile = () => setIsMobileOpen(false);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return {
    isMobileOpen,
    isCollapsed,
    toggleMobile,
    closeMobile,
    toggleCollapse,
  };
};
