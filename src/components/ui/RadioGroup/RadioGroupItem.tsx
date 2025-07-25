import * as React from "react"
import { cn } from "../../../lib/utils"

interface RadioGroupItemProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  value: string
  checked?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void // Fix the type here
  disabled?: boolean
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, id, value, checked, onChange, disabled, children, ...props }, ref) => {
    return (
      <div className="flex items-center space-x-2">
        <input
          type="radio"
          id={id}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={cn(
            "h-4 w-4 text-primary focus:ring-primary border-gray-300",
            className
          )}
          ref={ref}
          {...props}
        />
        {children && (
          <label htmlFor={id} className="text-sm font-medium text-gray-700">
            {children}
          </label>
        )}
      </div>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroupItem }