// src/components/ui/Tabs/index.tsx
import * as React from "react";

interface TabsProps {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  className?: string;
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  className?: string;
}

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({
  value: "",
  onValueChange: () => {},
});

export const Tabs = ({ children, value, onValueChange, className = "" }: TabsProps) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = "" }: TabsListProps) => {
  return <div className={`flex border-b border-gray-200 mb-4 ${className}`}>{children}</div>;
};

export const TabsTrigger = ({
  children,
  value,
  disabled = false,
  className = "",
}: TabsTriggerProps) => {
  const { value: currentValue, onValueChange } = React.useContext(TabsContext);

  return (
    <button
      onClick={() => onValueChange(value)}
      disabled={disabled}
      className={`px-4 py-2 text-sm font-medium relative ${
        currentValue === value ? "text-accent" : "text-gray-500 hover:text-gray-700"
      } ${className}`}
    >
      {children}
      {currentValue === value && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
      )}
    </button>
  );
};

export const TabsContent = ({ children, value, className = "" }: TabsContentProps) => {
  const { value: currentValue } = React.useContext(TabsContext);

  return currentValue === value ? <div className={className}>{children}</div> : null;
};