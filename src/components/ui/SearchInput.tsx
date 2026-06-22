import { Search } from 'react-feather';
import { cn } from "../../lib/utils";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  containerClassName?: string;
}

export const SearchInput = ({ className, containerClassName, ...props }: SearchInputProps) => {
  return (
    <div className={cn("relative", containerClassName)}>
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50" />
      <input
        className={cn("input-field pl-9", className)}
        {...props}
      />
    </div>
  );
};
