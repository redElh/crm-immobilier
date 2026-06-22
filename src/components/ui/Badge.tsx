import { cn } from "../../lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge = ({
  variant = 'default',
  size = 'sm',
  className,
  children,
  ...props
}: BadgeProps) => {
  const variants = {
    default: 'bg-background text-text-secondary border-border/50',
    primary: 'bg-accent-light text-accent border-accent/20',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    error: 'bg-red-50 text-red-700 border-red-200',
    outline: 'bg-transparent text-text-secondary border-border',
    secondary: 'bg-background text-text-secondary border-border/50'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <div
      className={cn(
        "inline-flex items-center font-medium rounded-md border",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
