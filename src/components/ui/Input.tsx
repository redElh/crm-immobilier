import React from "react";
import { cn } from "../../lib/utils";
import { Icon } from "./Icon"; // Make sure this path is correct

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  isActive?: boolean;
  iconSize?: number; // Optional icon size prop
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, icon, isActive = false, iconSize = 16, ...props }, ref) => {
    return (
      <div className="space-y-1 w-full">
        {label && (
          <label className="text-sm font-medium text-text/80">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon name={icon} className={`w-${iconSize} h-${iconSize} text-gray-400`} />
            </div>
          )}
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              error && "border-red-500 focus-visible:ring-red-400",
              icon && "pl-10",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {isActive && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <div className="h-2 w-2 rounded-full bg-accent animate-pulse"></div>
          </div>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";