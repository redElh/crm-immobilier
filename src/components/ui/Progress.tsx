interface ProgressProps {
  value: number;
  className?: string;
  indicatorClass?: string;
}

export const Progress = ({ value, className, indicatorClass }: ProgressProps) => {
  return (
    <div className={`w-full overflow-hidden rounded-full ${className}`}>
      <div 
        className={`h-full transition-all duration-300 ${indicatorClass || 'bg-accent'}`}
        style={{ width: `${value}%` }}
      />
    </div>
  );
};