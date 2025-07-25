// components/ui/TagInput.tsx
import React, { useState, useRef, KeyboardEvent } from 'react';

interface TagInputProps {
  value?: string[];
  onChange?: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Add a tag...',
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTags = [...value, inputValue.trim()];
      onChange?.(newTags);
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      const newTags = value.slice(0, -1);
      onChange?.(newTags);
    }
  };

  const removeTag = (index: number) => {
    const newTags = value.filter((_, i) => i !== index);
    onChange?.(newTags);
  };

  return (
    <div
      className={`flex flex-wrap items-center gap-2 p-2 border rounded-md focus-within:ring-2 focus-within:ring-primary ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <div
          key={index}
          className="flex items-center gap-1 px-2 py-1 text-sm bg-gray-100 rounded-full"
        >
          <span>{tag}</span>
          <button
            type="button"
            className="text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
          >
            ×
          </button>
        </div>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[100px] outline-none bg-transparent"
      />
    </div>
  );
};