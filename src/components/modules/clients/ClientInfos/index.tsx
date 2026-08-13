import { ClientCriteria } from "./ClientCriteria";
import { ClientFinancial } from "./ClientFinancial";
import { Client } from "../../../../types/client";

export const ClientInfos = ({ client, isGerant = false }: { client: Client; isGerant?: boolean }) => {
  if (!client) {
    return <div className="bg-card rounded-xl border border-border/50 shadow-card mt-4 p-6 text-text-secondary text-sm">Aucune donnée client</div>;
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card mt-4 p-5 space-y-6">
      <ClientCriteria client={client} isGerant={isGerant} />
      <ClientFinancial client={client} isGerant={isGerant} />
    </div>
  );
};
