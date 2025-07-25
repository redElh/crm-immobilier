import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"
import { cn } from "../../../lib/utils"

const radioGroupVariants = cva(
  "flex items-center space-x-2",
  {
    variants: {
      variant: {
        default: "",
        horizontal: "flex-row space-x-4",
        vertical: "flex-col space-y-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface RadioGroupProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof radioGroupVariants> {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  // Explicitly type children as RadioGroupItem elements
  children?: React.ReactElement<RadioGroupItemProps>[]
}

// Define the expected props for RadioGroupItem children
interface RadioGroupItemProps {
  value: string
  disabled?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  checked?: boolean
  id: string
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  ({ className, variant, value, onValueChange, disabled, children, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled && onValueChange) {
        onValueChange(event.target.value)
      }
    }

    return (
      <div
        className={cn(radioGroupVariants({ variant, className }))}
        ref={ref}
        {...props}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement<RadioGroupItemProps>(child)) {
            return React.cloneElement(child, {
              onChange: handleChange,
              checked: child.props.value === value,
              disabled: disabled || child.props.disabled,
            })
          }
          return child
        })}
      </div>
    )
  }
)
RadioGroup.displayName = "RadioGroup"

export { RadioGroup }