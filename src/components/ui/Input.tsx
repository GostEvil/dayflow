import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
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
      type = 'text',
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-text-secondary tracking-wide flex justify-between items-center select-none">
            <span>{label}</span>
            {helperText && <span className="text-[11px] text-text-muted font-normal">{helperText}</span>}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {icon && (
            <span className="absolute left-4 text-text-muted pointer-events-none flex items-center justify-center">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            className={`w-full h-11 bg-surface-2 border border-border/80 rounded-xl text-sm text-text placeholder:text-text-muted/60 transition-all duration-150 ease-out focus:border-glow/60 focus:bg-surface-2 focus:ring-1 focus:ring-glow/30 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed ${
              icon ? 'pl-12 pr-4' : 'px-4'
            } ${error ? 'border-danger/60 focus:border-danger focus:ring-danger/20' : ''} ${className}`}
            style={{ colorScheme: 'dark' }}
            {...props}
          />
        </div>
        {error && <span className="text-xs text-danger mt-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
