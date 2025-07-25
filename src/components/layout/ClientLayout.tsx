import { ReactNode } from 'react';
import { BackLink } from '../ui/BackLink';

interface ClientLayoutProps {
  children: ReactNode;
  backToType?: string;  // <-- New prop
}

export const ClientLayout = ({ children, backToType }: ClientLayoutProps) => {
  const backLinkPath = backToType 
    ? `/clients/type/${backToType}` 
    : '/clients';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <BackLink  className="mb-4" />
      {children}
    </div>
  );
};