import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  hint, 
  prefix, 
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
      <div className="relative">
        {prefix && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">{prefix}</span>
          </div>
        )}
        <input
          className={`
            w-full px-3 py-2 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-purple-500 focus:border-transparent
            transition-colors duration-200
            ${prefix ? 'pl-20' : ''}
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
