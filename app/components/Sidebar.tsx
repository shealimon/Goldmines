'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Lightbulb, 
  Megaphone, 
  BookOpen,
  Bookmark, 
  Settings, 
  LogOut, 
  Crown,
  X,
  Menu
} from 'lucide-react';

interface SidebarProps {
  savedCount?: number;
  marketingIsNew?: boolean;
  collapsed?: boolean;
  onCollapse?: () => void;
}

interface SidebarItemProps {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  isActive: boolean;
  badge?: {
    type: 'new' | 'count';
    value: string | number;
  };
  collapsed?: boolean;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  collapsed?: boolean;
}

// Section component
const Section: React.FC<SectionProps> = ({ title, children, collapsed }) => {
  if (collapsed) return <>{children}</>;
  
  return (
    <div className="mb-6">
      <h3 className="px-3 mb-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
        {title}
      </h3>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
};

// Sidebar item component
const SidebarItem: React.FC<SidebarItemProps> = ({ 
  href, 
  icon: Icon, 
  label, 
  isActive, 
  badge, 
  collapsed 
}) => {
  return (
    <Link
      href={href}
      className={`
        group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200
        ${isActive 
          ? 'bg-gray-100 text-gray-900' 
          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }
        ${collapsed ? 'justify-center' : ''}
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon className={`h-5 w-5 ${collapsed ? '' : 'mr-3'} flex-shrink-0`} />
      
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{label}</span>
          
          {badge && (
            <span className={`
              ml-2 px-2 py-0.5 text-xs font-medium rounded-full
              ${badge.type === 'new' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-gray-200 text-gray-600'
              }
            `}>
              {badge.value}
            </span>
          )}
        </>
      )}
    </Link>
  );
};

// Main Sidebar component
export const Sidebar: React.FC<SidebarProps> = ({ 
  savedCount = 0, 
  marketingIsNew = false, 
  collapsed = false,
  onCollapse 
}) => {
  const pathname = usePathname();

  const navigation = [
    {
      section: 'MAIN',
      items: [
        {
          href: '/dashboard',
          icon: Home,
          label: 'Dashboard',
        },
      ],
    },
    {
      section: 'IDEAS',
      items: [
        {
          href: '/ideas/business',
          icon: Lightbulb,
          label: 'Business Ideas',
        },
        {
          href: '/ideas/marketing',
          icon: Megaphone,
          label: 'Marketing Ideas',
          badge: marketingIsNew ? { type: 'new' as const, value: 'NEW' } : undefined,
        },
        {
          href: '/dashboard?tab=case-studies',
          icon: BookOpen,
          label: 'Case Studies',
        },
        {
          href: '/ideas/saved',
          icon: Bookmark,
          label: 'Saved Ideas',
          badge: savedCount > 0 ? { type: 'count' as const, value: savedCount } : undefined,
        },
      ],
    },
    {
      section: 'ACCOUNT',
      items: [
        {
          href: '/settings',
          icon: Settings,
          label: 'Settings',
        },
        {
          href: '/logout',
          icon: LogOut,
          label: 'Logout',
        },
        {
          href: '/upgrade',
          icon: Crown,
          label: 'Upgrade to Pro',
        },
      ],
    },
  ];

  return (
    <div className={`
      fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-50 border-r border-gray-200
      ${collapsed ? 'w-16' : 'w-64'}
      transition-all duration-300 ease-in-out
    `}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">G</span>
            </div>
            <span className="text-xl font-bold">
              <span className="text-purple-600">GOLD</span>
              <span className="text-gray-900">MINES</span>
            </span>
          </div>
        )}
        
        {onCollapse && (
          <button
            onClick={onCollapse}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <Menu className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-6">
          {navigation.map((section) => (
            <Section key={section.section} title={section.section} collapsed={collapsed}>
              {section.items.map((item) => {
                // Special handling for case studies - check if we're on a case study page
                const isCaseStudyActive = item.href === '/dashboard?tab=case-studies' && 
                  (pathname === '/dashboard' || pathname.startsWith('/case-studies/'));
                
                return (
                  <SidebarItem
                    key={item.href}
                    href={item.href}
                    icon={item.icon}
                    label={item.label}
                    isActive={pathname === item.href || isCaseStudyActive}
                    badge={item.badge}
                    collapsed={collapsed}
                  />
                );
              })}
            </Section>
          ))}
        </div>
      </nav>
    </div>
  );
};

// Mobile sidebar toggle component
export const MobileSidebarToggle: React.FC<{
  isOpen: boolean;
  onToggle: () => void;
}> = ({ isOpen, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      aria-expanded={isOpen}
      aria-controls="mobile-sidebar"
    >
      {isOpen ? (
        <X className="h-6 w-6 text-gray-600" />
      ) : (
        <Menu className="h-6 w-6 text-gray-600" />
      )}
    </button>
  );
};

// Mobile sidebar overlay
export const MobileSidebarOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
      onClick={onClose}
      aria-hidden="true"
    />
  );
};

// Mobile sidebar wrapper
export const MobileSidebar: React.FC<SidebarProps & {
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose, ...props }) => {
  return (
    <>
      <MobileSidebarOverlay isOpen={isOpen} onClose={onClose} />
      <div
        id="mobile-sidebar"
        className={`
          fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar {...props} />
      </div>
    </>
  );
};

export default Sidebar;
