import * as React from "react"

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, defaultChecked, onCheckedChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false)
    const currentChecked = checked ?? isChecked

    const handleClick = () => {
      const newChecked = !currentChecked
      if (onCheckedChange) onCheckedChange(newChecked)
      if (checked === undefined) setIsChecked(newChecked)
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={currentChecked}
        data-state={currentChecked ? "checked" : "unchecked"}
        onClick={handleClick}
        ref={ref}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 focus:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50 hover:scale-105 active:scale-95 ${
          currentChecked ? 'bg-accent' : 'bg-border hover:bg-border/80'
        } ${className || ''}`}
        {...props}
      >
        <span
          data-state={currentChecked ? "checked" : "unchecked"}
          className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-all duration-200 ease-out ${
            currentChecked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    )
  }
)

Switch.displayName = "Switch"
export { Switch }
