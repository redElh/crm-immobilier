import React, { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'react-feather';

interface CollapsibleProps { children: ReactNode; defaultOpen?: boolean; className?: string; }

export const Collapsible: React.FC<CollapsibleProps> = ({ children, defaultOpen = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`w-full ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          if (child.type === CollapsibleTrigger) return React.cloneElement(child, { isOpen, onToggle: () => setIsOpen(!isOpen) } as any);
          if (child.type === CollapsibleContent && !isOpen) return null;
        }
        return child;
      })}
    </div>
  );
};

export const CollapsibleTrigger: React.FC<{ children: ReactNode; isOpen?: boolean; onToggle?: () => void; className?: string; }> = ({ children, isOpen, onToggle, className = '' }) => {
  return (
    <button type="button" onClick={onToggle} className={`flex items-center justify-between w-full text-sm font-medium ${className}`}>
      {children}
      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
    </button>
  );
};

export const CollapsibleContent: React.FC<{ children: ReactNode; className?: string; }> = ({ children, className = '' }) => {
  return <div className={`pt-2 ${className}`}>{children}</div>;
};
