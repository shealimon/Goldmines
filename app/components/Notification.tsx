'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

interface NotificationProps {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export default function Notification({ 
  id, 
  message, 
  type, 
  onClose, 
  duration = 4000 
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match transition duration
  }, [onClose]);

  useEffect(() => {
    console.log('🔔 NOTIFICATION COMPONENT MOUNTED:', { message, type, id });
    // Show notification immediately
    setIsVisible(true);
    
    // Auto-hide after duration
    const timer = setTimeout(() => {
      console.log('🔔 NOTIFICATION AUTO-HIDING:', id);
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleClose, message, type, id]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  return (
    <div
      className={`
        w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100' 
          : 'translate-x-full opacity-0'
        }
      `}
      style={{
        position: 'relative',
        zIndex: 10000
      }}
    >
      <div className={`
        ${getStyles()}
        border rounded-lg shadow-lg p-4
        backdrop-blur-sm
      `}>
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-5">
              {message}
            </p>
          </div>
          <div className="flex-shrink-0">
            <button
              onClick={handleClose}
              className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
