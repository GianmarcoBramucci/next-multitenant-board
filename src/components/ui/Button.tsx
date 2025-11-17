import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2
    font-medium rounded-lg
    transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
  `;

  const variants = {
    primary: `
      text-white
      shadow-sm hover:shadow-md
      focus:ring-blue-500
    `,
    secondary: `
      text-white
      shadow-sm hover:shadow-md
      focus:ring-gray-500
    `,
    outline: `
      bg-transparent
      border-2
      hover:bg-opacity-5
      focus:ring-blue-500
    `,
    ghost: `
      bg-transparent
      hover:bg-opacity-10
      focus:ring-blue-500
    `,
    danger: `
      text-white
      shadow-sm hover:shadow-md
      focus:ring-red-500
    `,
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--primary)',
      ...(disabled || isLoading ? {} : {
        '&:hover': { backgroundColor: 'var(--primary-dark)' }
      })
    },
    secondary: {
      backgroundColor: 'var(--secondary)',
    },
    outline: {
      borderColor: 'var(--primary)',
      color: 'var(--primary)',
    },
    ghost: {
      color: 'var(--primary)',
    },
    danger: {
      backgroundColor: 'var(--error)',
    },
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      style={variantStyles[variant]}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
