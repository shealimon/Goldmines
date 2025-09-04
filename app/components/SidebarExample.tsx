'use client';

import React from 'react';
import { DashboardLayout } from './DashboardLayout';

// Example usage component
export const SidebarExample: React.FC = () => {
  return (
    <DashboardLayout savedCount={15} marketingIsNew={true}>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Dashboard Content
        </h1>
        <p className="text-gray-600">
          This is your main dashboard content. The sidebar is now integrated!
        </p>
        
        <div className="mt-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Sidebar Features
          </h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• Fixed left sidebar (260px width on desktop)</li>
            <li>• Collapsible on medium screens and up</li>
            <li>• Mobile slide-over menu</li>
            <li>• Active route highlighting</li>
            <li>• NEW badge on Marketing Ideas</li>
            <li>• Count badge on Saved Ideas (15)</li>
            <li>• Keyboard accessible</li>
            <li>• Responsive design</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SidebarExample;
