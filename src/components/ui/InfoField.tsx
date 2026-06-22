import type { ReactNode } from 'react';

interface InfoFieldProps {
  label: string;
  value: string | number | ReactNode;
  icon?: React.ReactNode;
  highlight?: boolean;
  className?: string;
  helperText?: string;
  action?: React.ReactNode;
}

export const InfoField = ({ label, value, icon, highlight, className = '', helperText, action }: InfoFieldProps) => {
  return (
    <div className={`p-4 rounded-xl ${highlight ? 'bg-accent-light border border-accent/20' : 'bg-background'} ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          {icon}
          <span>{label}</span>
        </div>
        {action}
      </div>
      <p className={`text-sm font-medium ${highlight ? 'text-accent' : 'text-text'}`}>
        {typeof value === 'number' ? value.toLocaleString() : typeof value === 'string' ? value : value}
      </p>
      {helperText && <p className="text-xs text-text-secondary/60 mt-0.5">{helperText}</p>}
    </div>
  );
};
