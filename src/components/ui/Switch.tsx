import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

const switchVariants = cva(
  "inline-flex items-center rounded-full transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        destructive: "data-[state=checked]:bg-destructive data-[state=unchecked]:bg-input",
        outline: "border border-input data-[state=checked]:bg-accent data-[state=unchecked]:bg-background",
        secondary: "data-[state=checked]:bg-secondary data-[state=unchecked]:bg-input",
        ghost: "data-[state=checked]:bg-accent data-[state=unchecked]:bg-background",
      },
      size: {
        default: "h-6 w-11",
        sm: "h-5 w-9",
        lg: "h-7 w-14",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform duration-200 ease-in-out will-change-transform",
  {
    variants: {
      size: {
        default: "h-5 w-5 translate-x-0.5 data-[state=checked]:translate-x-[1.625rem]",
        sm: "h-4 w-4 translate-x-0.5 data-[state=checked]:translate-x-[1.125rem]",
        lg: "h-6 w-6 translate-x-0.5 data-[state=checked]:translate-x-[1.875rem]",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface SwitchProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof switchVariants> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, variant, size, checked, defaultChecked, onCheckedChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false)

    const handleClick = () => {
      const newChecked = !(checked ?? isChecked)
      if (onCheckedChange) {
        onCheckedChange(newChecked)
      }
      if (checked === undefined) {
        setIsChecked(newChecked)
      }
    }

    const currentChecked = checked ?? isChecked

    return (
      <button
        type="button"
        role="switch"
        aria-checked={currentChecked}
        data-state={currentChecked ? "checked" : "unchecked"}
        className={switchVariants({ variant, size, className })}
        onClick={handleClick}
        ref={ref}
        {...props}
      >
        <span 
          className={thumbVariants({ size })}
          data-state={currentChecked ? "checked" : "unchecked"}
        />
      </button>
    )
  }
)

Switch.displayName = "Switch"

export { Switch }