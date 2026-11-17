import { Search, X } from 'react-feather';
import { cn } from "../../lib/utils";
import { useStageChrome } from '../modules/calendar/useStageChrome';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  containerClassName?: string;
}

export const SearchInput = ({ className, containerClassName, ...props }: SearchInputProps) => {
  const { staged, dark } = useStageChrome();
  const { value, onChange, ...restProps } = props;

  const stagedInputClass = staged
    ? dark
      ? 'w-full h-10 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] pl-9 pr-9 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-violet-400/70 focus:from-violet-400/25 focus:to-indigo-500/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_16px_-12px_rgba(0,0,0,0.7),0_6px_18px_-8px_rgba(3,5,14,0.9)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-8px_16px_-12px_rgba(0,0,0,0.6),0_0_0_3px_rgba(124,92,255,0.28),0_10px_30px_-8px_rgba(124,92,255,0.55)]'
      : 'w-full h-10 rounded-xl border border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] pl-9 pr-9 text-sm text-teal-950 outline-none transition-all duration-200 placeholder:text-teal-900/35 focus:border-teal-500/70 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.35),0_6px_18px_-10px_rgba(13,148,136,0.45)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.4),0_0_0_3px_rgba(20,184,166,0.25),0_10px_28px_-10px_rgba(13,148,136,0.6)]'
    : null;

  const hasValue = value !== undefined && value !== null && String(value).length > 0;

  return (
    <div className={cn("relative", containerClassName)}>
      <Search size={14} className={cn("absolute left-3 top-1/2 -translate-y-1/2 z-10", staged ? (dark ? 'text-violet-300/60' : 'text-teal-700/60') : 'text-text-secondary/50')} />
      <input
        value={value}
        onChange={onChange}
        style={staged ? { colorScheme: dark ? 'dark' : 'light' } : undefined}
        className={cn(stagedInputClass ? stagedInputClass : 'input-field pl-9', className)}
        {...restProps}
      />
      {hasValue && (
        <button
          type="button"
          aria-label="Effacer la recherche"
          onClick={(e) => {
            e.stopPropagation();
            onChange?.({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
          }}
          className={cn(
            'absolute right-1.5 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition-colors',
            staged
              ? dark ? 'text-slate-400 hover:bg-white/10 hover:text-white' : 'text-teal-900/40 hover:bg-teal-900/5 hover:text-teal-900'
              : 'text-text-secondary hover:bg-background hover:text-text'
          )}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
};
