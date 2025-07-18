import {Client} from '../../types/client';

// Sample data - replace with your API calls
const sampleClients: Client[] = [
  {
    id: '1',
    name: 'Pierre Martin',
    type: 'Acheteur',
    status: 'Actif',
    phone: '+33 6 12 34 56 78',
    email: 'pierre.martin@example.com',
    budget: 450000,
    propertyType: 'Appartement',
    area: 'Paris',
    minSurface: 60,
    rooms: '2',
    specificCriteria: ['Balcon', 'Ascenseur'],
    comments: 'Intéressé par les biens avec balcon et ascenseur',
    contribution: 100000,
    financingType: 'Prêt bancaire',
    loanDuration: 20,
    currentSituation: 'Locataire',
    moveInDate: '2024-01-01',
    mustHaveFeatures: 'Balcon, Ascenseur',
    urgency: 'Haute',
    lastContact: '2023-06-15',
    events: [
      {
        id: 'event-1',
        type: 'email',
        date: '2023-06-15T10:00:00Z',
        summary: 'Premier contact par email',
        agent: 'John Doe'
      }
    ],
    createdAt: '2023-06-01',
    updatedAt: '2023-06-15',
    createdBy: 'system', // Added required field
    // Add any other required fields from your Client interface
  },
  // Add more sample clients as needed
];

export { sampleClients };