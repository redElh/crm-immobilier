interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  [key: string]: any;
}

export const Select = ({ label, options, ...props }: SelectProps) => {
  return (
    <div className="space-y-1">
      {label && <label className="text-sm text-text/80">{label}</label>}
      <select
        className="glass-card w-full p-2 rounded-lg border border-white/10 focus:ring-1 focus:ring-accent focus:outline-none"
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};