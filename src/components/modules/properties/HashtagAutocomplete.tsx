interface HashtagAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function HashtagAutocomplete({ value, onChange, className = '' }: HashtagAutocompleteProps) {
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
