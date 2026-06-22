import { InfoField } from "../../../ui/InfoField";
import { Home, MapPin, Maximize2, Grid, Clock, User, Briefcase, CheckCircle, AlertCircle, Calendar, Sliders, Eye, Sun, Tag, Star, Layers, Compass, DollarSign } from "react-feather";
import { Client } from "../../../../types/client";

const renderTagList = (items: string[] | undefined, label: string) => {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-medium text-text mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item} className="px-2 py-1 text-xs rounded-lg bg-accent/10 text-accent border border-accent/20">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const renderCategorieGroup = (items: string[] | undefined, label: string) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="mb-3">
      <p className="text-xs font-medium text-text-secondary mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => (
          <span key={item} className="px-2 py-0.5 text-xs rounded bg-background border border-border text-text-secondary">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const renderProximites = (client: Client) => {
  const p = client.proximites;
  if (!p) return null;
  const hasAny = p.transports?.length || p.commerces?.length || p.education?.length || p.sante?.length || p.loisirs?.length;
  if (!hasAny) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <MapPin size={16} className="text-accent" />
        Proximités
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {renderCategorieGroup(p.transports, 'Transports')}
        {renderCategorieGroup(p.commerces, 'Commerces & Services')}
        {renderCategorieGroup(p.education, 'Éducation')}
        {renderCategorieGroup(p.sante, 'Santé & Sport')}
        {renderCategorieGroup(p.loisirs, 'Loisirs & Nature')}
      </div>
    </div>
  );
};

const renderPrestations = (client: Client) => {
  const p = client.prestations;
  if (!p) return null;
  const hasAny = p.exterieur?.length || p.confort?.length || p.electromenager?.length || p.multimedia?.length || p.sport?.length;
  if (!hasAny) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Star size={16} className="text-accent" />
        Prestations
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {renderCategorieGroup(p.exterieur, 'Extérieur & Sécurité')}
        {renderCategorieGroup(p.confort, 'Confort & Équipement')}
        {renderCategorieGroup(p.electromenager, 'Électroménager & Mobilier')}
        {renderCategorieGroup(p.multimedia, 'Multimédia & Communication')}
        {renderCategorieGroup(p.sport, 'Sport & Loisirs')}
      </div>
    </div>
  );
};

const renderMandat = (client: Client) => {
  if (!client.numeroMandat) return null;
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Layers size={16} className="text-accent" />
        Mandat de recherche
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoField label="Numéro de mandat" value={client.numeroMandat || 'Non spécifié'} icon={<Tag size={16} className="text-accent" />} />
        {client.statutMandat && <InfoField label="Statut" value={client.statutMandat} icon={<Clock size={16} className="text-accent" />} />}
        {client.typeMandat && <InfoField label="Type" value={client.typeMandat} icon={<Compass size={16} className="text-accent" />} />}
        {client.dateSignature && <InfoField label="Date signature" value={new Date(client.dateSignature).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-accent" />} />}
        {client.dateExpiration && <InfoField label="Date expiration" value={new Date(client.dateExpiration).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-accent" />} />}
        {client.agentDesigne && <InfoField label="Agent désigné" value={client.agentDesigne} icon={<User size={16} className="text-accent" />} />}
        {client.conjoint && <InfoField label="Conjoint" value={client.conjoint} icon={<User size={16} className="text-accent" />} />}
        {client.societe && <InfoField label="Société" value={client.societe} icon={<Briefcase size={16} className="text-accent" />} />}
        {client.typeRemuneration && <InfoField label="Type rémunération" value={client.typeRemuneration} icon={<DollarSign size={16} className="text-accent" />} />}
        {client.montantRemuneration && <InfoField label="Montant" value={`${client.montantRemuneration.toLocaleString()} ${client.devise || 'MAD'}`} icon={<DollarSign size={16} className="text-accent" />} />}
      </div>
    </div>
  );
};

export const ClientCriteria = ({ client }: { client: Client }) => {
  const renderTypeSpecificFields = () => {
    switch(client.type) {
      case 'Acheteur':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <InfoField label="Situation actuelle" value={client.currentSituation || "Non spécifié"} icon={<User size={16} className="text-accent" />} />
              <InfoField label="Urgence" value={client.urgency || "Non spécifié"} icon={<Clock size={16} className="text-accent" />} />
              {client.moveInDate && (
                <InfoField label="Date souhaitée d'emménagement" value={new Date(client.moveInDate).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-accent" />} />
              )}
              {client.classification && (
                <InfoField label="Classification" value={client.classification} icon={<Sliders size={16} className="text-accent" />} />
              )}
              {client.categorie && (
                <InfoField label="Catégorie" value={client.categorie} icon={<Tag size={16} className="text-accent" />} />
              )}
              {client.attributPrincipal && (
                <InfoField label="Attribut principal" value={client.attributPrincipal} icon={<Star size={16} className="text-accent" />} />
              )}
            </div>
            {renderTagList(client.attributsPersonnalises, 'Attributs personnalisés')}
            
            {client.criteres && client.criteres.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle size={16} className="text-accent" />
                  Critères
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {client.criteres.map(c => (
                    <span key={c} className="px-2 py-1 text-xs rounded-lg bg-accent/10 text-accent border border-accent/20">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {client.vue && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoField label="Vue" value={client.vue} icon={<Eye size={16} className="text-accent" />} />
                {client.exposition && <InfoField label="Exposition" value={client.exposition} icon={<Sun size={16} className="text-accent" />} />}
                {client.etat && <InfoField label="État" value={client.etat} icon={<Home size={16} className="text-accent" />} />}
                {client.standing && <InfoField label="Standing" value={client.standing} icon={<Star size={16} className="text-accent" />} />}
                {client.disponibilite && <InfoField label="Disponibilité" value={client.disponibilite} icon={<Clock size={16} className="text-accent" />} />}
              </div>
            )}

            {renderProximites(client)}
            {renderPrestations(client)}
            {renderMandat(client)}
          </>
        );
        
      case 'Locataire':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {client.currentAddress && (
                <InfoField label="Adresse actuelle" value={client.currentAddress} icon={<MapPin size={16} className="text-accent" />} />
              )}
              <InfoField label="Situation professionnelle" value={client.employmentStatus || "Non spécifié"} icon={<Briefcase size={16} className="text-accent" />} />
              {client.moveInDate && (
                <InfoField label="Date souhaitée d'emménagement" value={new Date(client.moveInDate).toLocaleDateString('fr-FR')} icon={<Calendar size={16} className="text-accent" />} />
              )}
              <InfoField label="Garant disponible" value={client.guarantor ? "Oui" : "Non"} icon={client.guarantor ? <CheckCircle size={16} className="text-success" /> : <AlertCircle size={16} className="text-warning" />} />
            </div>
          </>
        );
        
      case 'Bailleur':
        case 'Vendeur':
        case 'Voyageur':
        default:
          return null;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-medium text-lg mb-4">Critères du client</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoField label="Type de bien recherché" value={client.propertyType || "Non spécifié"} icon={<Home size={16} className="text-accent" />} />
        <InfoField label={client.type === 'Voyageur' ? "Destination" : "Secteur géographique"} value={client.area || (client.secteur || "Non spécifié")} icon={<MapPin size={16} className="text-accent" />} />
        {(client.minSurface || client.surfaceMax) && (
          <InfoField label="Surface" value={`${client.minSurface || '?'} ~ ${client.surfaceMax || '?'} m²`} icon={<Maximize2 size={16} className="text-accent" />} />
        )}
        {client.rooms && (
          <InfoField label="Nombre de pièces" value={client.rooms} icon={<Grid size={16} className="text-accent" />} />
        )}
        {(client.prixMin || client.prixMax) && (
          <InfoField label="Budget" value={`${(client.prixMin || 0).toLocaleString()} ~ ${(client.prixMax || 0).toLocaleString()} ${client.devise || 'MAD'}`} icon={<DollarSign size={16} className="text-accent" />} />
        )}
        {(client.pieces || client.chambres) && (
          <InfoField label="Pièces / Chambres" value={`${client.pieces || '?'} pièces / ${client.chambres || '?'} chambres`} icon={<Grid size={16} className="text-accent" />} />
        )}
      </div>

      {renderTypeSpecificFields()}

      {client.notes && (
        <div className="pt-2">
          <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Tag size={16} className="text-accent" />
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