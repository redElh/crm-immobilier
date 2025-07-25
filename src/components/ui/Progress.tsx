// Progress.tsx
interface ProgressProps {
  value: number;
  className?: string;
  indicatorColor?: string; // Add this
}

export const Progress = ({ 
  value, 
  className = '', 
  indicatorColor = 'bg-accent' // Default color
}: ProgressProps) => {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 ${className}`}>
      <div 
        className={`h-2.5 rounded-full ${indicatorColor}`} 
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );
};