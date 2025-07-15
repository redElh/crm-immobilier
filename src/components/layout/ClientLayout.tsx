import { ReactNode } from 'react';
import { BackLink } from '../ui/BackLink';

export const ClientLayout = ({ children }: { children: ReactNode }) => (
  <div className="max-w-5xl mx-auto px-4 py-6">
    <BackLink href="/clients" className="mb-4" />
    {children}
  </div>
);