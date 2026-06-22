import * as React from "react"
import { cn } from "../../lib/utils"
import { Loader } from 'react-feather'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "danger" | "outline" | "secondary" | "primary"
  size?: "sm" | "md" | "lg"
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  tooltip?: string
  loading?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    className,
    variant = "default",
    size = "md",
    icon,
    iconPosition = "left",
    children,
    tooltip,
    loading = false,
    ...props
  }, ref) => {
    const baseClasses = cn(
      "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150",
      "focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 focus:ring-offset-card",
      "disabled:opacity-50 disabled:pointer-events-none",
      "active:scale-[0.98]",
      {
        "gap-2": children,
        "gap-0": !children
      }
    )

    const variants = {
      default: "bg-accent text-white hover:bg-accent-hover shadow-sm",
      primary: "bg-accent text-white hover:bg-accent-hover shadow-sm",
      danger: "bg-error text-white hover:bg-error/90 shadow-sm",
      outline: "border border-border bg-card text-text hover:bg-background hover:border-text-secondary/30",
      secondary: "bg-background text-text-secondary hover:text-text hover:bg-border/50",
      ghost: "bg-transparent text-text-secondary hover:text-text hover:bg-background"
    }

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-9 px-4 text-sm",
      lg: "h-11 px-5 text-base",
    }

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        title={tooltip}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <Loader size={size === 'sm' ? 14 : 16} className="animate-spin" />
        ) : (
          <>
            {icon && iconPosition === "left" && (
              typeof icon === 'string' ? null : icon
            )}
            {children}
            {icon && iconPosition === "right" && (
              typeof icon === 'string' ? null : icon
            )}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = "Button"
