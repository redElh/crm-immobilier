import * as React from "react"
import { cn } from "../../lib/utils"
import { Icon } from "./Icon" // Import the Icon component

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "ghost" | "danger" | "outline"
  size?: "sm" | "md" | "lg"
  icon?: string // Add icon prop
  iconPosition?: "left" | "right" // Add icon position prop
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", icon, iconPosition = "left", children, ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 gap-2"

    const variants = {
      default: "bg-accent text-white hover:bg-accent/90",
      ghost: "bg-transparent text-text hover:bg-accent/10",
      danger: "bg-red-600 text-white hover:bg-red-700",
      outline: "border border-accent text-accent hover:bg-accent/10",
    }

    const sizes = {
      sm: "text-sm px-3 py-1.5",
      md: "text-base px-4 py-2",
      lg: "text-lg px-6 py-3",
    }

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        {...props}
      >
        {icon && iconPosition === "left" && <Icon name={icon} size={size} />}
        {children}
        {icon && iconPosition === "right" && <Icon name={icon} size={size} />}
      </button>
    )
  }
)

Button.displayName = "Button"