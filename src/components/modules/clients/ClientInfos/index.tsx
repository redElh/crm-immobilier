import { ClientCriteria } from "./ClientCriteria";
import { ClientFinancial } from "./ClientFinancial";
import { Client } from "../../../../types/client";

export const ClientInfos = ({ client }: { client: Client }) => {
  if (!client) {
    return <div className="bg-card rounded-xl border border-border/50 shadow-card mt-4 p-6 text-text-secondary text-sm">Aucune donnée client</div>;
  }

  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-card mt-4 p-5 space-y-6">
      <ClientCriteria client={client} />
      <ClientFinancial client={client} />
    </div>
  );
};
