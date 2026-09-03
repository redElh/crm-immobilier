import * as React from "react"
import { useStageChrome } from "../modules/calendar/useStageChrome"

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  checkedClass?: string
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, checked, defaultChecked, onCheckedChange, checkedClass, disabled, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(defaultChecked ?? false)
    const currentChecked = checked ?? isChecked
    const { staged, dark } = useStageChrome()

    const handleClick = () => {
      if (disabled) return
      const newChecked = !currentChecked
      if (onCheckedChange) onCheckedChange(newChecked)
      if (checked === undefined) setIsChecked(newChecked)
    }

    if (staged) {
      return (
        <button
          type="button"
          role="switch"
          aria-checked={currentChecked}
          data-state={currentChecked ? "checked" : "unchecked"}
          onClick={handleClick}
          ref={ref}
          disabled={disabled}
          className={`relative inline-flex h-[22px] w-[42px] shrink-0 cursor-pointer items-center rounded-full border transition-all duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
            dark ? 'border-white/10' : 'border-teal-900/15'
          } ${className || ''}`}
          style={{
            background: currentChecked
              ? 'linear-gradient(90deg, #34D399, #059669)'
              : dark ? 'rgba(148,163,184,0.22)' : 'rgba(100,116,139,0.25)',
            boxShadow: currentChecked
              ? dark ? '0 0 16px -2px rgba(52,211,153,0.65), inset 0 1px 0 rgba(255,255,255,0.35)' : '0 0 14px -2px rgba(16,185,129,0.5), inset 0 1px 0 rgba(255,255,255,0.9)'
              : dark ? 'inset 0 1px 0 rgba(255,255,255,0.08)' : 'inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
          {...props}
        >
          <span
            data-state={currentChecked ? "checked" : "unchecked"}
            className="pointer-events-none absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-md transition-all duration-200"
            style={{
              left: currentChecked ? '22px' : '2px',
              boxShadow: currentChecked ? '0 2px 8px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.9)' : '0 1px 4px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      )
    }

    return (
      <button
        type="button"
        role="switch"
        aria-checked={currentChecked}
        data-state={currentChecked ? "checked" : "unchecked"}
        onClick={handleClick}
        ref={ref}
        disabled={disabled}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-accent/20 focus:ring-offset-2 focus:ring-offset-card disabled:cursor-not-allowed disabled:opacity-50 hover:scale-105 active:scale-95 ${
          currentChecked ? (checkedClass || 'bg-accent') : 'bg-border hover:bg-border/80'
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
