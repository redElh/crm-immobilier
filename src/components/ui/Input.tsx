import React from "react";
import { ChevronDown, ChevronUp } from "react-feather";
import { cn } from "../../lib/utils";
import { useStageChrome } from "../modules/calendar/useStageChrome";
import { useStageScope } from "../dashboard/Stage";

const EyeOpenIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.1 12S6.2 5.8 12 5.8 21.9 12 21.9 12s-4.1 6.2-9.9 6.2S2.1 12 2.1 12Z" />
    <circle cx="12" cy="12" r="2.9" />
  </svg>
)

const EyeClosedIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2.1 12S6.2 5.8 12 5.8 21.9 12 21.9 12s-4.1 6.2-9.9 6.2S2.1 12 2.1 12Z" />
    <path d="M7.2 12h9.6" />
  </svg>
)

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
  prefix?: string;
  revealable?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, icon, suffix, prefix, revealable, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const innerRef = React.useRef<HTMLInputElement>(null)
    const setRef = (node: HTMLInputElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node
    }
    const { staged, dark } = useStageChrome()
    const isAdmin = useStageScope() === 'admin'
    const isNumber = type === 'number'
    const showSteppers = staged && isNumber && !props.disabled && !props.readOnly
    const hasTrailing = Boolean(suffix || (revealable && type === 'password') || showSteppers)
    const stepBy = (dir: 1 | -1) => {
      const el = innerRef.current
      if (!el) return
      if (dir === 1) el.stepUp()
      else el.stepDown()
    }
    const { style: propStyle, ...restProps } = props as any
    const stagedInputClass = staged
      ? dark
        ? isAdmin
          ? 'w-full h-9 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] px-3 py-2 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-rose-400/70 focus:from-rose-400/25 focus:to-violet-500/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_16px_-12px_rgba(0,0,0,0.7),0_6px_18px_-8px_rgba(3,5,14,0.9)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-8px_16px_-12px_rgba(0,0,0,0.6),0_0_0_3px_rgba(244,63,94,0.28),0_10px_30px_-8px_rgba(244,63,94,0.55)] disabled:opacity-50 disabled:cursor-not-allowed'
          : 'w-full h-9 rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] [background-color:transparent] px-3 py-2 text-sm text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-violet-400/70 focus:from-violet-400/25 focus:to-indigo-500/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-8px_16px_-12px_rgba(0,0,0,0.7),0_6px_18px_-8px_rgba(3,5,14,0.9)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-8px_16px_-12px_rgba(0,0,0,0.6),0_0_0_3px_rgba(124,92,255,0.28),0_10px_30px_-8px_rgba(124,92,255,0.55)] disabled:opacity-50 disabled:cursor-not-allowed'
        : isAdmin
          ? 'w-full h-9 rounded-xl border border-orange-900/20 bg-gradient-to-b from-white to-orange-50/80 [background-color:transparent] px-3 py-2 text-sm text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 hover:border-orange-900/30 focus:border-orange-500 shadow-[inset_0_1px_0_rgba(255,255,255,1),0_4px_16px_-8px_rgba(41,37,36,0.16)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_0_0_3px_rgba(249,115,22,0.22),0_8px_24px_-10px_rgba(249,115,22,0.45)] disabled:opacity-50 disabled:cursor-not-allowed'
          : 'w-full h-9 rounded-xl border border-teal-900/15 bg-gradient-to-b from-white to-teal-50/70 [background-color:transparent] px-3 py-2 text-sm text-teal-950 outline-none transition-all duration-200 placeholder:text-teal-900/35 focus:border-teal-500/70 shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.35),0_6px_18px_-10px_rgba(13,148,136,0.45)] focus:shadow-[inset_0_1px_0_rgba(255,255,255,1),inset_0_-6px_14px_-10px_rgba(13,148,136,0.4),0_0_0_3px_rgba(20,184,166,0.25),0_10px_28px_-10px_rgba(13,148,136,0.6)] disabled:opacity-50 disabled:cursor-not-allowed'
      : null
    const resolvedType = revealable && type === 'password' ? (showPassword ? 'text' : 'password') : type
    const isRevealable = revealable && type === 'password'
    return (
      <div className="space-y-1.5 w-full">
        {label && (
          <label className={cn('block mb-1.5', staged ? (dark ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400/85' : isAdmin ? 'text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500' : 'text-[11px] font-bold uppercase tracking-[0.14em] text-teal-900/55') : 'text-sm font-medium text-text')}>
            {label}
            {props.required && <span className="text-error ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex">
          {prefix && (
            <span className={cn("inline-flex items-center px-2.5 text-sm whitespace-nowrap select-none rounded-l-xl border", staged ? (dark ? "text-slate-400 bg-white/[0.04] border-white/10" : isAdmin ? "text-slate-500 bg-white border-orange-900/20" : "text-teal-900/60 bg-white border-teal-900/15") : "text-text-secondary bg-background border-border")}>
              {prefix}
            </span>
          )}
          <div className="relative flex-1">
            {icon && (
              <div className={cn("absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", staged ? (dark ? (isAdmin ? "text-rose-300/60" : "text-violet-300/60") : (isAdmin ? "text-slate-400" : "text-teal-700/60")) : "text-text-secondary")}>
                {icon}
              </div>
            )}
            <input
              type={resolvedType}
              style={{ ...(propStyle || {}), ...(staged ? { colorScheme: dark ? ('dark' as const) : ('light' as const) } : {}) } as any}
              className={cn(
                stagedInputClass
                  ? stagedInputClass
                  : cn(
                      "w-full h-9 px-3 py-2 text-sm rounded-lg border bg-card text-text",
                      "placeholder:text-text-secondary/40",
                      "focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                      "transition-all duration-200 ease-out",
                      "hover:border-text-secondary/30",
                      error ? "border-error focus:ring-error/15 focus:border-error" : "border-border"
                    ),
                icon && "pl-10",
                showSteppers ? (suffix ? "pr-[86px]" : "pr-9") : (suffix || isRevealable) && "pr-10",
                isNumber && staged && "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                prefix && "rounded-l-none",
                error && staged ? "!border-rose-400/60 !shadow-[0_0_0_3px_rgba(251,113,133,0.2)]" : "",
                className
              )}
              ref={setRef}
              {...(restProps as any)}
            />
            {hasTrailing && (
              <div className={cn("absolute inset-y-0 right-0 flex items-center", showSteppers ? "gap-1.5 pl-1 pr-1.5" : "gap-2 pr-3", staged ? (dark ? "text-slate-400" : isAdmin ? "text-slate-500" : "text-teal-900/50") : "text-text-secondary")}>
                {isRevealable && (
                  <button
                    type="button"
                    aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-current opacity-75 transition-opacity duration-200 hover:opacity-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-current/60"
                    onClick={() => setShowPassword(v => !v)}
                  >
                    <div className="relative h-5 w-5 overflow-hidden">
                      <EyeOpenIcon
                        className={`absolute inset-0 transition-all duration-300 ease-out ${showPassword ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`}
                      />
                      <EyeClosedIcon
                        className={`absolute inset-0 transition-all duration-300 ease-out ${showPassword ? 'translate-y-3 opacity-0' : 'translate-y-0 opacity-100'}`}
                      />
                    </div>
                  </button>
                )}
                {suffix && <span className="text-sm leading-none">{suffix}</span>}
                {showSteppers && (
                  <div className={cn("flex flex-col overflow-hidden rounded-md border", staged ? (dark ? "border-white/10 bg-white/[0.04]" : isAdmin ? "border-orange-900/20 bg-white/70" : "border-teal-900/15 bg-white/70") : "border-border bg-background")}>
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Augmenter"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => stepBy(1)}
                      className={cn("flex h-[13px] w-[18px] items-center justify-center transition-colors", staged ? (dark ? "text-slate-300 hover:bg-white/10" : isAdmin ? "text-slate-600 hover:bg-slate-900/5" : "text-teal-800/70 hover:bg-teal-900/10") : "text-text-secondary hover:bg-card")}
                    >
                      <ChevronUp size={10} strokeWidth={2.6} />
                    </button>
                    <span aria-hidden className={cn("h-px w-full", staged ? (dark ? "bg-white/10" : isAdmin ? "bg-slate-900/10" : "bg-teal-900/10") : "bg-border")} />
                    <button
                      type="button"
                      tabIndex={-1}
                      aria-label="Diminuer"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => stepBy(-1)}
                      className={cn("flex h-[13px] w-[18px] items-center justify-center transition-colors", staged ? (dark ? "text-slate-300 hover:bg-white/10" : isAdmin ? "text-slate-600 hover:bg-slate-900/5" : "text-teal-800/70 hover:bg-teal-900/10") : "text-text-secondary hover:bg-card")}
                    >
                      <ChevronDown size={10} strokeWidth={2.6} />
                    </button>
                  </div>
                )}
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
