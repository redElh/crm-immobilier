import { useState } from "react";
import { X, Plus } from "react-feather";

interface TagSystemProps {
  tags: string[];
  suggestions?: string[];
  onTagsChange?: (tags: string[]) => void;
}

export const TagSystem = ({ tags, suggestions = [], onTagsChange }: TagSystemProps) => {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAddTag = (tag: string) => {
    if (!tags.includes(tag)) {
      const newTags = [...tags, tag];
      onTagsChange?.(newTags);
    }
    setInputValue("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    onTagsChange?.(newTags);
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map(tag => (
          <div 
            key={tag} 
            className="flex items-center bg-accent/10 text-accent text-xs px-3 py-1 rounded-full"
          >
            {tag}
            <button 
              onClick={() => handleRemoveTag(tag)}
              className="ml-1.5 hover:text-accent/70"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Ajouter un critère..."
          className="w-full text-sm bg-white/5 border border-white/10 rounded-glass px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {inputValue && (
          <button
            onClick={() => handleAddTag(inputValue)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-accent hover:text-accent/70"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-card/80 backdrop-blur-glass rounded-glass shadow-lg border border-white/10 overflow-hidden">
          {suggestions
            .filter(suggestion => 
              suggestion.toLowerCase().includes(inputValue.toLowerCase()) && 
              !tags.includes(suggestion)
            )
            .map(suggestion => (
              <div
                key={suggestion}
                className="px-3 py-2 text-sm hover:bg-accent/10 cursor-pointer"
                onMouseDown={() => handleAddTag(suggestion)}
              >
                {suggestion}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};