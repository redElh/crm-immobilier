import * as React from 'react';
import { cn } from '../../../lib/utils';
import { useStageChrome } from '../../modules/calendar/useStageChrome';

interface RadioGroupItemProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  value: string;
  checked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, id, value, checked, onChange, disabled, children, ...props }, ref) => {
    const { staged, dark } = useStageChrome();

    if (staged) {
      return (
        <label
          htmlFor={id}
          className={cn(
            'group flex cursor-pointer select-none items-center gap-2.5 rounded-xl border px-3 py-1.5 transition-all duration-200',
            disabled && 'opacity-50 cursor-not-allowed',
            checked
              ? dark
                ? 'border-violet-400/40 bg-white/[0.07] shadow-[0_0_16px_-6px_rgba(124,92,255,0.7),inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'border-teal-500/35 bg-teal-500/10 shadow-[0_0_14px_-6px_rgba(20,184,166,0.6),inset_0_1px_0_rgba(255,255,255,0.85)]'
              : dark
                ? 'border-white/10 bg-white/[0.03] hover:border-white/18 hover:bg-white/[0.06]'
                : 'border-teal-900/10 bg-white/60 hover:border-teal-900/18 hover:bg-white',
            className,
          )}
        >
          <span className="relative flex-shrink-0">
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
            <span
              className={cn(
                'flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 transition-all duration-200',
                checked
                  ? dark
                    ? 'border-violet-400 bg-gradient-to-br from-[#8B7CFF] to-[#5646C9] shadow-[0_0_10px rgba(124,92,255,0.7)]'
                    : 'border-teal-500 bg-gradient-to-br from-teal-400 to-emerald-600 shadow-[0_0_10px rgba(20,184,166,0.6)]'
                  : dark
                    ? 'border-white/20 bg-white/[0.04] group-hover:border-white/30'
                    : 'border-teal-900/20 bg-white group-hover:border-teal-900/30',
              )}
            >
              {checked && <span className="h-[7px] w-[7px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.35)]" />}
            </span>
          </span>
          {children && (
            <span className={cn('text-sm font-medium leading-tight', dark ? 'text-slate-200 group-hover:text-white' : 'text-teal-950 group-hover:text-teal-900')}>
              {children}
            </span>
          )}
        </label>
      );
    }

    return (
      <label htmlFor={id} className={cn('flex items-center gap-2 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed', className)}>
        <div className="relative flex-shrink-0">
          <input type="radio" id={id} value={value} checked={checked} onChange={onChange} disabled={disabled} className="sr-only" ref={ref} {...props} />
          <div
            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${checked ? 'border-accent' : 'border-border group-hover:border-text-secondary/40'}`}
          >
            {checked && <div className="w-2 h-2 rounded-full bg-accent animate-scale-in" />}
          </div>
        </div>
        {children && <span className="text-sm font-medium text-text">{children}</span>}
      </label>
    );
  },
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroupItem };
