'use client';

import React, { useState } from 'react';
import { Sidebar, MobileSidebar, MobileSidebarToggle } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  savedCount?: number;
  marketingIsNew?: boolean;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  savedCount = 0,
  marketingIsNew = false,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          savedCount={savedCount}
          marketingIsNew={marketingIsNew}
          collapsed={isCollapsed}
          onCollapse={toggleCollapse}
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
        savedCount={savedCount}
        marketingIsNew={marketingIsNew}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-xl font-bold">
              <span className="text-purple-600">GOLD</span>
              <span className="text-gray-900">MINES</span>
            </span>
          </div>
          <MobileSidebarToggle
            isOpen={isMobileSidebarOpen}
            onToggle={toggleMobileSidebar}
          />
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
