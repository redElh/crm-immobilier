import type { Property } from '../../../types/property';

export type MandatStatus = 'Non défini' | 'En attente de signature' | 'actif' | 'expire' | 'resilie' | 'termine';

export interface AdminProperty extends Property {
  agentId: string;
  mandateStatus: MandatStatus;
  mandateStartDate: string;
  mandateEndDate: string;
}

export const ADMINS = [
  { id: 'admin-1', name: 'Sophie Laurent', initials: 'SL', color: 'bg-indigo-500' },
  { id: 'admin-2', name: 'Marc Dubois', initials: 'MD', color: 'bg-cyan-500' },
];

export const AGENTS = [
  { id: 'agent-1', name: 'Myriam ABABOU', initials: 'MA', color: 'bg-violet-500' },
  { id: 'agent-2', name: 'Karim Eloui', initials: 'KE', color: 'bg-blue-500' },
  { id: 'agent-3', name: 'Yasmine AATIC', initials: 'YA', color: 'bg-emerald-500' },
  { id: 'agent-4', name: 'Dimitri DJEDJE', initials: 'DD', color: 'bg-amber-500' },
  { id: 'agent-5', name: 'Hayat OUAKRIM', initials: 'HO', color: 'bg-rose-500' },
];

export const CITIES = ['Marrakech', 'Rabat', 'Casablanca', 'Tanger', 'Agadir', 'Essaouira', 'Fes', 'Oujda'];
