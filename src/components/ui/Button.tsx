import type { ButtonHTMLAttributes, ReactNode, AnchorHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';
type Size    = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 active:scale-[0.97] shadow-sm focus-visible:outline-2 focus-visible:outline-indigo-500',
  secondary:
    'bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 active:bg-indigo-100 active:scale-[0.97] shadow-sm',
  ghost:
    'text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 active:scale-[0.97]',
  outline:
    'border border-gray-300 text-gray-700 bg-transparent hover:bg-gray-50 active:bg-gray-100 active:scale-[0.97]',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3.5 py-1.5 text-sm',
  md: 'px-5    py-2.5 text-sm',
  lg: 'px-7    py-3.5 text-base',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
  loading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-[color,background-color,transform,box-shadow] duration-150',
        'focus-visible:outline focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

export function LinkButton({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: LinkButtonProps) {
  return (
    <a
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
        'transition-[color,background-color,transform,box-shadow] duration-150',
        'focus-visible:outline focus-visible:outline-offset-2',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </a>
  );
}
