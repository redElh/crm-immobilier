interface InfoFieldProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export const InfoField = ({ label, value, icon, highlight }: InfoFieldProps) => {
  return (
    <div className={`p-3 rounded-glass ${highlight ? 'bg-premium/5 border border-premium/10' : 'bg-white/5'}`}>
      <div className="flex items-center gap-2 text-sm text-text/60 mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className={`text-sm ${highlight ? 'font-medium text-premium' : 'text-text'}`}>
        {value}
      </p>
    </div>
  );
};