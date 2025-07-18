import { forwardRef } from 'react';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  className?: string;
  onChange?: (checked: boolean) => void; // Our custom onChange
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
    };

    return (
      <div className={`mb-4 ${className}`}>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            ref={ref}
            className={`h-4 w-4 rounded border ${
              error ? 'border-red-500' : 'border-border'
            } text-primary focus:ring-primary`}
            onChange={handleChange}
            {...props}
          />
          {label && (
            <span className="text-sm font-medium text-text">
              {label}
              {props.required && <span className="text-red-500">*</span>}
            </span>
          )}
        </label>
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';