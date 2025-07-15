import * as React from "react";

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export const Tabs = ({ defaultValue, children }: TabsProps) => {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  const childrenArray = React.Children.toArray(children);
  const list = childrenArray.find((child: any) => child.type === TabsList);
  const content = childrenArray.filter((child: any) => child.type === TabsContent);

  return (
    <div className="w-full">
      {list && React.cloneElement(list as React.ReactElement<TabsListProps>, { activeTab, setActiveTab })}
      {content.find((child: any) => child.props.value === activeTab)}
    </div>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (value: string) => void;
  className?: string;
}

const TabsList = ({ children, activeTab, setActiveTab, className = "" }: TabsListProps) => {
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


interface TabTriggerProps {
  value: string;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

const TabTrigger = ({ children, isActive, onClick, className = "" }: TabTriggerProps) => {
  return (
    <button
      onClick={onClick}
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


interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

const TabsContent = ({ children, className = "" }: TabsContentProps) => {
  return <div className={className}>{children}</div>;
};

// Attach sub-components
Tabs.List = TabsList;
Tabs.Trigger = TabTrigger;
Tabs.Content = TabsContent;