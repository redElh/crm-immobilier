interface HashtagAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  stage?: boolean;
  dark?: boolean;
}

export function HashtagAutocomplete({ value, onChange, className = '', stage = false, dark = true }: HashtagAutocompleteProps) {
  if (stage) {
    return (
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full min-h-[200px] resize-y rounded-xl border px-3.5 py-3 font-mono text-xs leading-relaxed transition-all duration-200 focus:outline-none focus:ring-2 ${
            dark
              ? 'text-slate-100 placeholder:text-slate-600 focus:border-indigo-400/50 focus:ring-indigo-400/15'
              : 'text-slate-700 placeholder:text-slate-400 focus:border-indigo-500/50 focus:ring-indigo-500/15'
          }`}
          style={{
            backgroundColor: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.70)',
            borderColor: dark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.12)',
            boxShadow: dark
              ? 'inset 0 2px 8px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)'
              : 'inset 0 2px 6px rgba(15,23,42,0.05)',
          }}
          placeholder="Contenu du post…"
        />
        <div className={`pointer-events-none absolute bottom-2 right-2 select-none text-right text-[10px] leading-tight ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
          <div>Écrivez vos propres #hashtags</div>
          <div>dans le texte du post ci-dessus</div>
        </div>
      </div>
    );
  }
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full min-h-[200px] px-3 py-2 text-xs font-mono leading-relaxed rounded-lg border bg-card
          placeholder:text-text-secondary/40
          focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent
          hover:border-text-secondary/30
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 ease-out
          border-border resize-y
          ${className}`}
      />

      <div className="absolute bottom-2 right-2 text-[10px] text-text-secondary/40 pointer-events-none select-none text-right leading-tight">
        <div>Écrivez vos propres #hashtags</div>
        <div>dans le texte du post ci-dessus</div>
      </div>
    </div>
  );
}
