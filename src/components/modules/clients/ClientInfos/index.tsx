import { Tabs } from "../../../ui/Tabs"; // Adjusted path to the correct location
import { ClientCriteria } from "./ClientCriteria";
import { ClientFinancial } from "./ClientFinancial"; // Ensure ClientFinancial uses the same Client type

import { Client } from "../../../../types/client"; // Ensure this path is correct

export const ClientInfos = ({ client }: { client: Client }) => (
  <Tabs defaultValue="criteria" className="glass-card mt-4">
    <Tabs.List className="px-6 pt-4" activeTab="criteria" setActiveTab={() => {}}>
      <Tabs.Trigger value="criteria">Critères</Tabs.Trigger>
      <Tabs.Trigger value="financial">Financier</Tabs.Trigger>
    </Tabs.List>

    <div className="p-6">
      <Tabs.Content value="criteria">
        <ClientCriteria client={client} />
      </Tabs.Content>
      <Tabs.Content value="financial">
        <ClientFinancial client={client} />
      </Tabs.Content>
    </div>
  </Tabs>
);