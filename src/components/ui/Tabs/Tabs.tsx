import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
}>({ value: "", onValueChange: () => {} });

export const Tabs = ({ children, value, onValueChange, className = "" }: {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={`w-full ${className}`}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={`flex gap-1 border-b border-border/40 mb-6 ${className}`}>
      {children}
    </div>
  );
};

export const TabsTrigger = ({ children, value, disabled = false, className = "" }: {
  children: React.ReactNode;
  value: string;
  disabled?: boolean;
  className?: string;
}) => {
  const { value: currentValue, onValueChange } = React.useContext(TabsContext);
  const isActive = currentValue === value;

  return (
    <button
      onClick={() => onValueChange(value)}
      disabled={disabled}
      className={`relative px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'text-accent'
          : 'text-text-secondary hover:text-text'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
    >
      {children}
      {isActive && (
        <motion.div
          layoutId="tab-indicator"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full"
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      )}
    </button>
  );
};

export const TabsContent = ({ children, value, className = "" }: {
  children: React.ReactNode;
  value: string;
  className?: string;
}) => {
  const { value: currentValue } = React.useContext(TabsContext);

  return (
    <AnimatePresence mode="wait">
      {currentValue === value && (
        <motion.div
          key={value}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
