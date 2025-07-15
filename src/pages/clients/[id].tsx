import { ClientLayout } from "../../components/layout/ClientLayout";
import { ClientInfos } from "../../components/modules/clients/ClientInfos";
import { ClientHeader } from "../../components/modules/clients/ClientHeader";
import { ClientTimeline } from "../../components/modules/clients/ClientTimeline";
import { useParams } from "react-router-dom";

export default function ClientPage() {
  const { id } = useParams();
  const { data: client } = useFetchClient(id); // Hook personnalisé

  return (
    <ClientLayout>
      <div className="space-y-4">
        <ClientHeader client={client} />
        <ClientInfos client={client} />
        <ClientTimeline events={client.events} />
      </div>
    </ClientLayout>
  );
}

function useFetchClient(id: string | undefined): { data: any; } {
  throw new Error("Function not implemented.");
}
