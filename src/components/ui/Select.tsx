import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
  options?: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      icon,
      containerClassName = '',
      className = '',
      id,
      disabled,
      children,
      options,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-text-secondary tracking-wide flex justify-between items-center select-none">
            <span>{label}</span>
            {helperText && <span className="text-[11px] text-text-muted font-normal">{helperText}</span>}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <span className="absolute left-3.5 text-text-muted pointer-events-none flex items-center justify-center">
              {icon}
            </span>
          )}
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            className={`w-full h-11 bg-surface-2/70 border border-border/80 rounded-xl text-sm text-text appearance-none transition-all duration-150 ease-out focus:border-glow/60 focus:bg-surface-2 focus:ring-1 focus:ring-glow/30 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
              icon ? 'pl-10 pr-9' : 'pl-3.5 pr-9'
            } ${error ? 'border-danger/60 focus:border-danger focus:ring-danger/20' : ''} ${className}`}
            style={{ colorScheme: 'dark' }}
            {...props}
          >
            {options
              ? options.map(opt => (
                  <option key={opt.value} value={opt.value} className="bg-surface-2 text-text">
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <span className="absolute right-3 text-text-muted pointer-events-none flex items-center justify-center">
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>
        {error && <span className="text-xs text-danger mt-1">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
