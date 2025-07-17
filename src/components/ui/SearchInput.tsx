import { Input } from "./Input";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { cn } from "../../lib/utils";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  containerClassName?: string;
}

export const SearchInput = ({
  className,
  containerClassName,
  ...props
}: SearchInputProps) => {
  return (
    <div className={cn("relative", containerClassName)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 mt-1">
        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 mt-6" />
      </div>
      <Input
        type="search"
        className={cn("pl-10","mt-6", className)}
        {...props}
      />
    </div>
  );
};