interface InfoFieldProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  highlight?: boolean;
  className?: string;
  helperText?: string;
  action?: React.ReactNode; // Add this
}

export const InfoField = ({ 
  label, 
  value, 
  icon, 
  highlight, 
  className = '', 
  helperText,
  action // Add this
}: InfoFieldProps) => {
  return (
    <div className={`p-3 rounded-glass ${highlight ? 'bg-premium/5 border border-premium/10' : 'bg-white/5'} ${className}`}>
      <div className="flex items-center justify-between gap-2"> {/* Updated this line */}
        <div className="flex items-center gap-2 text-sm text-text/60 mb-1">
          {icon}
          <span>{label}</span>
        </div>
        {action} {/* Add action button here */}
      </div>
      <p className={`text-sm ${highlight ? 'font-medium text-premium' : 'text-text'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {helperText && (
        <p className="text-xs mt-1 text-text/60">{helperText}</p>
      )}
    </div>
  );
};