import * as React from "react";

// Main Tabs component
const TabsRoot = ({ children, activeTab, onChange, className = '' }: TabsProps) => {
  const childrenArray = React.Children.toArray(children);
  const list = childrenArray.find((child: any) => child.type === List);
  const content = childrenArray.filter((child: any) => child.type === Content);

  return (
    <div className={`w-full ${className}`}>
      {list && React.cloneElement(list as React.ReactElement<ListProps>, { 
        activeTab, 
        setActiveTab: onChange 
      })}
      {content.find((child: any) => child.props.value === activeTab)}
    </div>
  );
};

// List component
const List = ({ children, activeTab, setActiveTab, className = "" }: ListProps) => {
  return (
    <div className={`flex border-b border-white/10 mb-4 ${className}`}>
      {React.Children.map(children, (child: any) =>
        React.cloneElement(child, {
          isActive: child.props.value === activeTab,
          onClick: () => setActiveTab(child.props.value),
        })
      )}
    </div>
  );
};

// Trigger component
const Trigger = ({ 
  children, 
  isActive, 
  onClick, 
  className = "",
  value,
  disabled
}: TriggerProps) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium relative ${
        isActive ? 'text-accent' : 'text-text/60 hover:text-text'
      } ${className}`}
    >
      {children}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
      )}
    </button>
  );
};

// Content component
const Content = ({ children, className = "", value }: ContentProps) => {
  return <div className={className}>{children}</div>;
};

// Export all components
export const Tabs = Object.assign(TabsRoot, {
  List,
  Trigger,
  Content
});

// Interfaces
interface TabsProps {
  children: React.ReactNode;
  activeTab: string;
  onChange: (tabValue: string) => void;
  className?: string;
}

interface ListProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (value: string) => void;
  className?: string;
}

interface TriggerProps {
  value: string;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

interface ContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}