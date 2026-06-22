import { ReactNode } from 'react';
import { BackLink } from '../ui/BackLink';

interface ClientLayoutProps {
  children: ReactNode;
  backToType?: string;
}

export const ClientLayout = ({ children, backToType }: ClientLayoutProps) => {
  const backLinkPath = backToType 
    ? `/clients/type/${backToType}` 
    : '/clients';

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <BackLink to={backLinkPath} />
      {children}
    </div>
  );
};
