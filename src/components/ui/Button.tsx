import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'pill' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      children,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 ease-out select-none whitespace-nowrap active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glow/50 disabled:opacity-40 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer';

    const variants = {
      primary:
        'bg-glow text-void font-semibold hover:bg-glow/90 shadow-sm shadow-glow/20 border border-transparent',
      secondary:
        'bg-surface-2 text-glow hover:bg-glow/20 border border-glow/25 shadow-sm',
      ghost:
        'bg-transparent text-text-muted hover:text-text hover:bg-surface-2 border border-transparent',
      outline:
        'bg-surface border border-border text-text hover:border-glow/30 hover:bg-surface-2 shadow-sm',
      danger:
        'bg-danger-muted text-danger hover:bg-danger/25 border border-danger/30 shadow-sm',
      pill:
        'bg-surface-2 text-text-secondary hover:text-text hover:bg-surface-3 border border-border rounded-full',
    };

    const sizes = {
      sm: 'px-3.5 py-2 text-xs rounded-xl gap-1.5 min-h-[36px]',
      md: 'px-5 py-2.5 text-sm rounded-xl gap-4 min-h-[42px]',
      lg: 'px-6 py-3.5 text-base rounded-2xl gap-3.5 min-h-[48px]',
      icon: 'p-3.5 rounded-xl min-w-[40px] min-h-[40px] flex-shrink-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {icon && iconPosition === 'left' && <span className="flex-shrink-0 flex items-center">{icon}</span>}
        {children && <span>{children}</span>}
        {icon && iconPosition === 'right' && <span className="flex-shrink-0 flex items-center">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
