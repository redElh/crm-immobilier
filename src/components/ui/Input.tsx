import React from "react";
import { cn } from "../../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  prefix?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, icon, suffix, prefix, ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-text">
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex">
          {prefix && (
            <span className="inline-flex items-center px-2.5 text-sm text-text-secondary bg-background border border-r-0 border-border rounded-l-lg whitespace-nowrap select-none">
              {prefix}
            </span>
          )}
          <div className="relative flex-1">
            {icon && (
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-secondary">
                {icon}
              </div>
            )}
            <input
              type={type}
              className={cn(
                "w-full h-9 px-3 py-2 text-sm rounded-lg border bg-card",
                "placeholder:text-text-secondary/40",
                "focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200 ease-out",
                "hover:border-text-secondary/30",
                error
                  ? "border-error focus:ring-error/15 focus:border-error"
                  : "border-border",
                icon && "pl-10",
                suffix && "pr-10",
                prefix && "rounded-l-none",
                className
              )}
              ref={ref}
              {...props}
            />
            {suffix && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-secondary">
                {suffix}
              </div>
            )}
            <div className="absolute inset-0 rounded-lg pointer-events-none ring-0 transition-shadow duration-200 focus-within:ring-2 focus-within:ring-accent/15" />
          </div>
        </div>
        {error && (
          <p className="text-xs text-error flex items-center gap-1 mt-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
