import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea: React.FC<TextareaProps> = ({ 
  label, 
  error, 
  hint, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {hint && (
        <p className="text-xs text-gray-500">{hint}</p>
      )}
      <textarea
        className={`
          w-full px-3 py-2 border border-gray-300 rounded-lg
          focus:ring-2 focus:ring-purple-500 focus:border-transparent
          transition-colors duration-200 resize-none
          ${error ? 'border-red-500 focus:ring-red-500' : ''}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
