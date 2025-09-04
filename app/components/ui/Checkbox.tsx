import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  label, 
  error, 
  hint, 
  className = '', 
  ...props 
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            className={`
              h-4 w-4 text-purple-600 border-gray-300 rounded
              focus:ring-purple-500 focus:ring-2
              ${error ? 'border-red-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        <div className="ml-3 text-sm">
          {label && (
            <label className="text-gray-700 cursor-pointer">
              {label}
            </label>
          )}
          {hint && (
            <p className="text-xs text-gray-500 mt-1">{hint}</p>
          )}
        </div>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
