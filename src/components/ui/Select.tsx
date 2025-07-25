interface SelectProps {
  label?: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  [key: string]: any; // For any additional HTML select element props
}

export const Select = ({ 
  label, 
  options, 
  onValueChange,
  ...props 
}: SelectProps) => {
  return (
    <div className="space-y-1 space-x-3">
      {label && <label className="text-sm font-medium text-text/80">{label}</label>}
      <select
        className="glass-card w-35 p-2 rounded-lg border border-white/10 focus:ring-1 focus:ring-accent focus:outline-none"
        onChange={(e) => onValueChange?.(e.target.value)}
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