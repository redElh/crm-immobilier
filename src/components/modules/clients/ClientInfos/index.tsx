import { ClientCriteria } from "./ClientCriteria";
import { ClientFinancial } from "./ClientFinancial";
import { Client } from "../../../../types/client";

interface ClientInfosProps {
  client: Client; // Using the imported Client type
}

export const ClientInfos = ({ client }: ClientInfosProps) => {
  // Add validation to ensure required fields exist
  if (!client) {
    return <div className="glass-card mt-4 p-6 text-text/60">Aucune donnée client</div>;
  }

  return (
    <div className="glass-card mt-4 p-6">

    
          <ClientCriteria client={client} />
        
          <ClientFinancial client={client} />
    </div>       
  );
};