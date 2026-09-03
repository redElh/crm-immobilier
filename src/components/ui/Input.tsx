import React from "react";
import { cn } from "../../lib/utils";
import { useStageChrome } from "../modules/calendar/useStageChrome";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  prefix?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, icon, suffix, prefix, ...props }, ref) => {
    const { staged, dark } = useStageChrome()
    const stagedInputClass = staged
      ? dark
        ? 'w-full h-9 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] px-3 py-2 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-violet-400/70 focus:from-violet-400/25 focus:to-indigo-500/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_16px_-12px_rgba(0,0,0,0.7),0_6px_18px_-8px_rgba(3,5,14,0.9)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-8px_16px_-12px_rgba(0,0,0,0.6),0_0_0_3px_rgba(124,92,255,0.28),0_10px_30px_-8px_rgba(124,92,255,0.55)] disabled:opacity-50 disabled:cursor-not-allowed'
        : 'w-full h-9 rounded-xl border border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] px-3 py-2 text-sm text-teal-950 outline-none transition-all duration-200 placeholder:text-teal-900/35 focus:border-teal-500/70 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.35),0_6px_18px_-10px_rgba(13,148,136,0.45)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.4),0_0_0_3px_rgba(20,184,166,0.25),0_10px_28px_-10px_rgba(13,148,136,0.6)] disabled:opacity-50 disabled:cursor-not-allowed'
      : null
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className={cn('block mb-1.5', staged ? (dark ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55') : 'text-sm font-medium text-text')}>
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex">
          {prefix && (
            <span className={cn("inline-flex items-center px-2.5 text-sm whitespace-nowrap select-none rounded-l-xl border", staged ? (dark ? "text-slate-400 bg-white/[0.04] border-white/10" : "text-teal-900/60 bg-white border-teal-900/15") : "text-text-secondary bg-background border-border")}>
              {prefix}
            </span>
          )}
          <div className="relative flex-1">
            {icon && (
              <div className={cn("absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", staged ? (dark ? "text-violet-300/60" : "text-teal-700/60") : "text-text-secondary")}>
                {icon}
              </div>
            )}
            <input
              type={type}
              className={cn(
                stagedInputClass
                  ? stagedInputClass
                  : cn(
                      "w-full h-9 px-3 py-2 text-sm rounded-lg border bg-card",
                      "placeholder:text-text-secondary/40",
                      "focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all duration-200 ease-out",
                      "hover:border-text-secondary/30",
                      error ? "border-error focus:ring-error/15 focus:border-error" : "border-border"
                    ),
                icon && "pl-10",
                suffix && "pr-10",
                prefix && "rounded-l-none",
                error && staged ? "!border-rose-400/60 !shadow-[0_0_0_3px_rgba(251,113,133,0.2)]" : "",
                className
              )}
              ref={ref}
              {...props}
            />
            {suffix && (
              <div className={cn("absolute inset-y-0 right-0 pr-3 flex items-center", staged ? (dark ? "text-slate-400" : "text-teal-900/50") : "text-text-secondary")}>
                {suffix}
              </div>
            )}
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
