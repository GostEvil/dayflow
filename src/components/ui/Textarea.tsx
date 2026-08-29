import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      containerClassName = '',
      className = '',
      id,
      disabled,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className={`flex flex-col space-y-1.5 w-full ${containerClassName}`}>
        {label && (
          <label htmlFor={textareaId} className="text-xs font-medium text-text-secondary tracking-wide flex justify-between items-center select-none">
            <span>{label}</span>
            {helperText && <span className="text-[11px] text-text-muted font-normal">{helperText}</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          disabled={disabled}
          className={`w-full bg-surface-2/70 border border-border/80 rounded-xl px-3.5 py-3 text-sm text-text placeholder:text-text-muted/60 transition-all duration-150 ease-out focus:border-glow/60 focus:bg-surface-2 focus:ring-1 focus:ring-glow/30 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed resize-none ${
            error ? 'border-danger/60 focus:border-danger focus:ring-danger/20' : ''
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-danger mt-1">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
