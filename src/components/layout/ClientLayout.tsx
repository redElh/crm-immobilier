import { ReactNode } from 'react';

interface ClientLayoutProps {
  children: ReactNode;
}

export const ClientLayout = ({ children }: ClientLayoutProps) => {
  return (
    <div className="w-full px-4 py-6 space-y-4">
      {children}
    </div>
  );
};
