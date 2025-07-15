import { useState } from "react";
import { Button } from "./Button";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface FilterDropdownProps {
  options: {
    value: string;
    label: string;
  }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export const FilterDropdown = ({
  options,
  value,
  onChange,
  label = "Filter",
  className = "",
}: FilterDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <ul className="max-h-60 overflow-auto rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 focus:outline-none">
            {options.map((option) => (
              <li
                key={option.value}
                className={`cursor-pointer select-none px-4 py-2 hover:bg-gray-100 ${
                  value === option.value ? "bg-gray-100 font-medium" : ""
                }`}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};