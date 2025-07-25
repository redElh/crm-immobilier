import { cn } from "../../lib/utils"; // Utilitaire Tailwind merge

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

export const Badge = ({ 
  variant = 'default', 
  className,
  children,
  ...props
}: BadgeProps) => {
  const variants = {
    default: 'bg-white/10 text-text border-white/20',
    primary: 'bg-accent/20 text-accent border-accent/30',
    success: 'bg-green-500/10 text-green-500 border-green-500/20',
    warning: 'bg-premium/10 text-premium border-premium/20',
    error: 'bg-red-500/10 text-red-500 border-red-500/20',
    outline: 'bg-transparent text-text border border-white/20',
    secondary: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  };

  return (
    <div
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-glass text-xs font-medium border",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};