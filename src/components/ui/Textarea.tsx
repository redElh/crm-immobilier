import { forwardRef } from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  className?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className={`mb-4 ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-text mb-1">
            {label}
            {props.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
            error ? 'border-red-500' : 'border-border'
          }`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';