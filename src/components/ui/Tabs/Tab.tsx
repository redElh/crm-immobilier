// Tab.tsx
import * as React from "react";
import { Tabs } from "./Tabs";

interface TabProps {
  children: React.ReactNode;
  label: string;
  value: string;
  disabled?: boolean;
}

export const Tab = ({ children, label, value, disabled }: TabProps) => {
  return (
    <>
      <Tabs.Trigger value={value} disabled={disabled}>
        {label}
      </Tabs.Trigger>
      {children}
    </>
  );
};