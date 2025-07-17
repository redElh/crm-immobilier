import { InfoField } from "../../../ui/InfoField";
import { TagSystem } from "../../../ui/TagSystem";
import { Home, MapPin, Maximize2, MessageSquare, Tag, Grid } from "react-feather";
import { Client } from "../../../../types/client"; // Ensure this path is correct

export const ClientCriteria = ({ client }: { client: Client }) => {
  /*const propertyTypes = [
    "Appartement", "Maison", "Loft", "Terrain", 
    "Local commercial", "Immeuble"
  ];*/

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoField 
          label="Type de bien recherché" 
          value={client.propertyType || "Non spécifié"}
          icon={<Home size={16} className="text-accent" />}
        />
        
        <InfoField 
          label="Secteur géographique" 
          value={client.area || "Non spécifié"} 
          icon={<MapPin size={16} className="text-accent" />}
        />
        
        <InfoField 
          label="Surface minimum" 
          value={client.minSurface ? `${client.minSurface} m²` : "Non spécifié"} 
          icon={<Maximize2 size={16} className="text-accent" />}
        />
        
        <InfoField 
          label="Nombre de pièces" 
          value={client.rooms || "Non spécifié"} 
          icon={<Grid size={16} className="text-accent" />}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          <Tag size={16} className="text-accent" />
          Critères spécifiques
        </h3>
        <TagSystem 
          tags={client.specificCriteria || []} 
          suggestions={["Ascenseur", "Parking", "Balcon", "Terrasse", "Cave"]}
          onTagsChange={(newTags) => console.log('Tags updated:', newTags)}
        />
      </div>

      <div className="pt-2">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          <MessageSquare size={16} className="text-accent" />
          Commentaires
        </h3>
        <p className="text-sm text-text/80 bg-white/5 p-3 rounded-glass">
          {client.comments || "Aucun commentaire pour le moment"}
        </p>
      </div>
    </div>
  );
};