import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { useStageChrome } from '../modules/calendar/useStageChrome';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', ...props }, ref) => {
    const { staged, dark } = useStageChrome()
    const stagedClass = staged
      ? dark
        ? 'w-full min-h-[80px] rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] px-3 py-2.5 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-violet-400/70 focus:from-violet-400/25 focus:to-indigo-500/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_16px_-12px_rgba(0,0,0,0.7),0_6px_18px_-8px_rgba(3,5,14,0.9)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-8px_16px_-12px_rgba(0,0,0,0.6),0_0_0_3px_rgba(124,92,255,0.28),0_10px_30px_-8px_rgba(124,92,255,0.55)] disabled:opacity-50 disabled:cursor-not-allowed'
        : 'w-full min-h-[80px] rounded-xl border border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] px-3 py-2.5 text-sm text-teal-950 outline-none transition-all duration-200 placeholder:text-teal-900/35 focus:border-teal-500/70 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.35),0_6px_18px_-10px_rgba(13,148,136,0.45)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.4),0_0_0_3px_rgba(20,184,166,0.25),0_10px_28px_-10px_rgba(13,148,136,0.6)] disabled:opacity-50 disabled:cursor-not-allowed'
      : null
    return (
      <div className="space-y-1.5">
        {label && (
          <label className={cn('block mb-1.5', staged ? (dark ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : 'text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55') : 'text-sm font-medium text-text')}>
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            stagedClass
              ? stagedClass
              : cn(`w-full min-h-[80px] px-3 py-2 text-sm rounded-lg border bg-card
            placeholder:text-text-secondary/40
            focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent
            hover:border-text-secondary/30
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200 ease-out
            ${error ? 'border-error focus:ring-error/15 focus:border-error' : 'border-border'}`),
            error && staged ? '!border-rose-400/60' : '',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-xs text-error flex items-center gap-1">
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

Textarea.displayName = 'Textarea';
