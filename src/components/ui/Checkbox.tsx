import { forwardRef } from 'react';
import { Check } from 'react-feather';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (checked: boolean, e?: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked, e);
    };

    return (
      <div className={`${className}`}>
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              ref={ref}
              className="sr-only"
              onChange={handleChange}
              {...props}
            />
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
              props.checked
                ? 'bg-accent border-accent scale-100'
                : 'border-border group-hover:border-text-secondary/40 scale-100'
            }`}>
              {props.checked && (
                <Check size={10} className="text-white animate-scale-in" />
              )}
            </div>
            <div className={`absolute inset-0 rounded-sm transition-all duration-200 ${
              props.checked
                ? 'opacity-0'
                : 'opacity-0 group-hover:opacity-100 group-hover:bg-accent/5'
            }`} />
          </div>
          {label && <span className="text-sm text-text select-none">{label}</span>}
        </label>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
