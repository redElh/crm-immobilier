import { forwardRef } from 'react';
import { Check } from 'react-feather';
import { useStageChrome } from '../modules/calendar/useStageChrome';
import { cn } from '../../lib/utils';

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label?: string;
  error?: string;
  onChange?: (checked: boolean, e?: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error, className = '', onChange, ...props }, ref) => {
    const { staged, dark } = useStageChrome();
    const checked = Boolean(props.checked);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked, e);
    };

    // ── Stage 3D checkbox — mirrors EventFormModal CheckSquare (StageModal) ──
    if (staged) {
      return (
        <div className={cn(className)}>
          <label className="group flex cursor-pointer select-none items-center gap-2.5">
            <input type="checkbox" ref={ref} className="sr-only" onChange={handleChange} {...props} />
            <span
              className={cn(
                'flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border transition-all duration-200',
                checked
                  ? 'border-violet-400/60 bg-gradient-to-br from-[#8B7CFF] to-[#5646C9] shadow-[0_0_12px_-2px_rgba(124,92,255,0.8)]'
                  : dark
                    ? 'border-white/15 bg-white/[0.04] group-hover:border-white/25 group-hover:bg-white/[0.08]'
                    : 'border-teal-900/15 bg-white/70 group-hover:border-teal-900/25 group-hover:bg-white',
              )}
              style={
                checked
                  ? dark
                    ? { boxShadow: '0 0 14px -2px rgba(124,92,255,0.85), inset 0 1px 0 rgba(255,255,255,0.35)' }
                    : { background: 'linear-gradient(145deg,#14B8A6,#0D9488)', borderColor: 'rgba(20,184,166,0.55)', boxShadow: '0 0 14px -2px rgba(20,184,166,0.7), inset 0 1px 0 rgba(255,255,255,0.45)' }
                  : undefined
              }
            >
              {checked && <Check size={11} strokeWidth={3.5} className="text-white drop-shadow-sm" />}
            </span>
            {label && (
              <span className={cn('text-sm leading-tight', dark ? 'text-slate-200 group-hover:text-white' : 'text-teal-950 group-hover:text-teal-900')}>
                {label}
              </span>
            )}
          </label>
          {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
        </div>
      );
    }

    return (
      <div className={`${className}`}>
        <label className="flex items-center gap-2 cursor-pointer group">
          <div className="relative flex-shrink-0">
            <input type="checkbox" ref={ref} className="sr-only" onChange={handleChange} {...props} />
            <div
              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                checked ? 'bg-accent border-accent scale-100' : 'border-border group-hover:border-text-secondary/40 scale-100'
              }`}
            >
              {checked && <Check size={10} className="text-white animate-scale-in" />}
            </div>
            <div
              className={`absolute inset-0 rounded-sm transition-all duration-200 ${checked ? 'opacity-0' : 'opacity-0 group-hover:opacity-100 group-hover:bg-accent/5'}`}
            />
          </div>
          {label && <span className="text-sm text-text select-none">{label}</span>}
        </label>
        {error && <p className="mt-1 text-xs text-error">{error}</p>}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';
