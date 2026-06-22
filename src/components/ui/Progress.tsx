interface ProgressProps {
  value: number;
  className?: string;
  indicatorColor?: string;
}

export const Progress = ({ value, className = '', indicatorColor = 'bg-accent' }: ProgressProps) => {
  return (
    <div className={`w-full bg-border/50 rounded-full h-2 ${className}`}>
      <div className={`h-2 rounded-full transition-all duration-500 ${indicatorColor}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
};
