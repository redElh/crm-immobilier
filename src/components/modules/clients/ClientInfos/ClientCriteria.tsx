import { InfoField } from "../../../ui/InfoField";
import { TagSystem } from "../../../ui/TagSystem";
import { Home, MapPin, Maximize2, MessageSquare, Tag, Grid, Clock, User, Briefcase, CheckCircle, AlertCircle, Calendar } from "react-feather";
import { Client } from "../../../../types/client";

export const ClientCriteria = ({ client }: { client: Client }) => {
  const renderTypeSpecificFields = () => {
    switch(client.type) {
      case 'Acheteur':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <InfoField 
                label="Situation actuelle" 
                value={client.currentSituation || "Non spécifié"}
                icon={<User size={16} className="text-accent" />}
              />
              <InfoField 
                label="Urgence" 
                value={client.urgency || "Non spécifié"}
                icon={<Clock size={16} className="text-accent" />}
              />
              {client.moveInDate && (
                <InfoField 
                  label="Date souhaitée d'emménagement" 
                  value={new Date(client.moveInDate).toLocaleDateString()}
                  icon={<Calendar size={16} className="text-accent" />}
                />
              )}
            </div>
            
            {client.mustHaveFeatures && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <CheckCircle size={16} className="text-accent" />
                  Caractéristiques indispensables
                </h3>
                <p className="text-sm text-text/80 bg-white/5 p-3 rounded-glass">
                  {client.mustHaveFeatures}
                </p>
              </div>
            )}
          </>
        );
        
      case 'Locataire':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {client.currentAddress && (
                <InfoField 
                  label="Adresse actuelle" 
                  value={client.currentAddress}
                  icon={<MapPin size={16} className="text-accent" />}
                />
              )}
              <InfoField 
                label="Situation professionnelle" 
                value={client.employmentStatus || "Non spécifié"}
                icon={<Briefcase size={16} className="text-accent" />}
              />
              {client.moveInDate && (
                <InfoField 
                  label="Date souhaitée d'emménagement" 
                  value={new Date(client.moveInDate).toLocaleDateString()}
                  icon={<Calendar size={16} className="text-accent" />}
                />
              )}
              <InfoField 
                label="Garant disponible" 
                value={client.guarantor ? "Oui" : "Non"}
                icon={client.guarantor ? 
                  <CheckCircle size={16} className="text-success" /> : 
                  <AlertCircle size={16} className="text-warning" />}
              />
            </div>
          </>
        );
        
      case 'Bailleur':
        case 'Propriétaire':
        case 'Voyageur':
        default:
          return null;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-medium text-lg mb-4">Critères du client</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoField 
          label="Type de bien recherché" 
          value={client.propertyType || "Non spécifié"}
          icon={<Home size={16} className="text-accent" />}
        />
        
        <InfoField 
          label={client.type === 'Voyageur' ? "Destination" : "Secteur géographique"} 
          value={client.area || "Non spécifié"} 
          icon={<MapPin size={16} className="text-accent" />}
        />
        
        {client.minSurface && (
          <InfoField 
            label="Surface" 
            value={`${client.minSurface} m²`} 
            icon={<Maximize2 size={16} className="text-accent" />}
          />
        )}
        
        {client.rooms && (
          <InfoField 
            label="Nombre de pièces" 
            value={client.rooms} 
            icon={<Grid size={16} className="text-accent" />}
          />
        )}
      </div>

      {renderTypeSpecificFields()}

      {client.notes && (
        <div className="pt-2">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <MessageSquare size={16} className="text-accent" />
            Notes
          </h3>
          <p className="text-sm text-text/80 bg-white/5 p-3 rounded-glass">
            {client.notes}
          </p>
        </div>
      )}
    </div>
  );
};