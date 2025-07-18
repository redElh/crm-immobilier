import { ClientLayout } from "../../components/layout/ClientLayout";
import { ClientInfos } from "../../components/modules/clients/ClientInfos";
import { ClientHeader } from "../../components/modules/clients/ClientHeader";
import { ClientTimeline } from "../../components/modules/clients/ClientTimeline";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import or define the sampleClients data
import { sampleClients } from "./index"; // Adjust the import path as needed

// Add mock events data to the sample clients
// In your enhancedClients mapping, add all required fields:
const enhancedClients = sampleClients.map(client => ({
  ...client,
  email: `${client.name.replace(' ', '.').toLowerCase()}@example.com`,
  // Add all required fields for ClientInfos
  area: client.area || "Paris", // Example default value
  minSurface: client.minSurface || 50, // Example default value
  rooms: client.rooms || "3", // Example default value
  specificCriteria: client.specificCriteria || ["Parking", "Balcon"], // Example
  comments: client.comments || "Client intéressé par les biens récents",
  // Financial fields
  contribution: client.contribution || 100000, // Example
  financingType: client.financingType || "Prêt bancaire", // Example
  loanDuration: client.loanDuration || 20, // Example
  documents: client.documents || [], // Example
  lastContact: client.lastContact || new Date().toISOString(),
  // Timeline events
  events: [
    {
      id: `event-${client.id}-1`,
      type: 'email',
      date: client.lastContact ? new Date(client.lastContact).toISOString() : new Date().toISOString(),
      summary: `Premier contact avec ${client.name}`,
      agent: "John Doe"
    }
  ]
}));


export default function ClientPage() {
  const { id } = useParams();
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      const foundClient = enhancedClients.find(c => c.id === id);
      setClient(foundClient || null);
      setLoading(false);
      setShowContent(true);
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <ClientLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </ClientLayout>
    );
  }

  if (!client) {
    return (
      <ClientLayout>
        <div className="text-center py-12">
          <p className="text-text/60">Client non trouvé</p>
        </div>
      </ClientLayout>
    );
  }

  return (
    <ClientLayout backToType={client?.type.toLowerCase()}>
      <AnimatePresence>
        {showContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="space-y-4"
          >
            <ClientHeader client={client} />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
            >
              <ClientInfos client={client} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <ClientTimeline events={client.events} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ClientLayout>
  );
}