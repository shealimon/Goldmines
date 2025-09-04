'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import Notification from './Notification';

interface NotificationData {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationContextType {
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    console.log('🔔 NOTIFICATION CREATED:', { message, type });
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification: NotificationData = { id, message, type };
    
    setNotifications(prev => {
      const updated = [...prev, newNotification];
      console.log('🔔 NOTIFICATIONS ARRAY:', updated);
      return updated;
    });
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      
      {/* Render notifications with stacking */}
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            position: 'fixed',
            bottom: `${20 + (index * 100)}px`,
            right: '20px',
            zIndex: 9999 + index,
            maxWidth: '400px',
            minWidth: '300px'
          }}
        >
          <Notification
            id={notification.id}
            message={notification.message}
            type={notification.type}
            onClose={() => removeNotification(notification.id)}
          />
        </div>
      ))}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
