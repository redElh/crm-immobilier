import * as React from "react"
import { cn } from "../../../lib/utils"

interface RadioGroupItemProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string
  value: string
  checked?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  disabled?: boolean
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, id, value, checked, onChange, disabled, children, ...props }, ref) => {
    return (
      <label
        htmlFor={id}
        className={cn(
          "flex items-center gap-2 cursor-pointer select-none",
          disabled && "opacity-50 cursor-not-allowed",
          className,
        )}
      >
        <div className="relative flex-shrink-0">
          <input
            type="radio"
            id={id}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
            ref={ref}
            {...props}
          />
          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            checked
              ? 'border-accent'
              : 'border-border group-hover:border-text-secondary/40'
          }`}>
            {checked && (
              <div className="w-2 h-2 rounded-full bg-accent animate-scale-in" />
            )}
          </div>
        </div>
        {children && (
          <span className="text-sm font-medium text-text">
            {children}
          </span>
        )}
      </label>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroupItem }
