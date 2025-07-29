// components/ui/Button.tsx
import * as React from "react"
import { cn } from "../../lib/utils"
import { Icon } from "./Icon"

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
      "inline-flex items-center justify-center font-medium rounded-md transition-colors",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent/50",
      "disabled:opacity-50 disabled:pointer-events-none",
      {
        "gap-2": children, // Only add gap if there are children (text)
        "gap-0": !children // No gap for icon-only buttons
      }
    )

    const variants = {
      default: "bg-accent text-white hover:bg-accent/90 shadow hover:shadow-md",
      ghost: "bg-transparent text-text hover:bg-accent/10",
      danger: "bg-red-600 text-white hover:bg-red-700 shadow hover:shadow-md",
      outline: "border border-accent text-accent hover:bg-accent/10",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow hover:shadow-md"
    }

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    }

    const iconSizes: Record<'sm' | 'md' | 'lg', 'sm' | 'md'> = {
      sm: "sm",
      md: "sm",
      lg: "md"
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        title={tooltip}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <span className="animate-spin">
            {/* Add your loading spinner icon here */}
            <Icon name="spinner" size={iconSizes[size]} />
          </span>
        ) : (
          <>
            {icon && iconPosition === "left" && (
              <Icon 
                name={icon} 
                size={iconSizes[size] as 'sm' | 'md'}
                className={children ? "mr-1" : ""}
              />
            )}
            {children}
            {icon && iconPosition === "right" && (
              <Icon 
                name={icon} 
                size={iconSizes[size]}
                className={children ? "ml-1" : ""}
              />
            )}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = "Button"