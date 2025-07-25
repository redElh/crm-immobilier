// src/components/ui/Tabs/Tab.tsx
import * as React from "react";
import { TabsTrigger } from "./Tabs";

interface TabProps {
  children: React.ReactNode;
  label: string;
  value: string;
  disabled?: boolean;
}

export const Tab = ({ children, label, value, disabled }: TabProps) => {
  return (
    <>
      <TabsTrigger value={value} disabled={disabled}>
        {label}
      </TabsTrigger>
      {children}
    </>
  );
};