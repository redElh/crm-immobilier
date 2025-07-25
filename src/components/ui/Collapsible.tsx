// components/ui/Collapsible.tsx
import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleProps {
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export const Collapsible: React.FC<CollapsibleProps> = ({
  children,
  defaultOpen = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`w-full ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === CollapsibleTrigger) {
            return React.cloneElement(child, { 
              isOpen,
              onToggle: () => setIsOpen(!isOpen) 
            } as any);
          }
          if (child.type === CollapsibleContent && !isOpen) {
            return null;
          }
        }
        return child;
      })}
    </div>
  );
};

interface CollapsibleTriggerProps {
  children: ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

export const CollapsibleTrigger: React.FC<CollapsibleTriggerProps> = ({
  children,
  isOpen,
  onToggle,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`flex items-center justify-between w-full ${className}`}
    >
      {children}
      {isOpen ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      )}
    </button>
  );
};

interface CollapsibleContentProps {
  children: ReactNode;
  className?: string;
}

export const CollapsibleContent: React.FC<CollapsibleContentProps> = ({
  children,
  className = '',
}) => {
  return <div className={className}>{children}</div>;
};