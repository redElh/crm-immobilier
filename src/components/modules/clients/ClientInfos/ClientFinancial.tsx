import { InfoField } from "../../../ui/InfoField";
import { Progress } from "../../../ui/Progress";
import { DollarSign, CreditCard, Calendar, Home, Clock, TrendingUp, AlertCircle, Briefcase } from "react-feather";
import { Client } from "../../../../types/client";

export const ClientFinancial = ({ client, isGerant = false }: { client: Client; isGerant?: boolean }) => {
  const devise = client.devise || 'MAD';
  const financialStatus = calculateFinancialStatus(client.prixMax || client.budget, client.contribution);

  const renderTypeSpecificFields = () => {
    switch(client.type) {
      case 'Acheteur':
        const isPretBancaire = client.financingType === 'Pret bancaire';
        const isAutre = client.financingType === 'Autre';
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField 
                label="Type de financement" 
                value={client.financingType || "Non spécifié"} 
                icon={<CreditCard size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />}
              />
              {client.loanDuration && (
                <InfoField 
                  label="Durée souhaitée" 
                  value={`${client.loanDuration} ans`} 
                  icon={<Calendar size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />}
                />
              )}
            </div>

            {/* Revenus & Charges — Prêt bancaire */}
            {isPretBancaire && (client.revenusMensuelsNets || client.chargesCredit) && (
              <div className="border-t border-border/30 pt-4 mt-4">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Revenus & Charges</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.revenusMensuelsNets !== undefined && (
                    <InfoField label="Revenus mensuels nets" value={`${client.revenusMensuelsNets.toLocaleString('fr-FR')} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />} />
                  )}
                  {client.revenusSupplementaires !== undefined && client.revenusSupplementaires > 0 && (
                    <InfoField label="Revenus supplémentaires" value={`${client.revenusSupplementaires.toLocaleString('fr-FR')} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />} />
                  )}
                  {client.chargesCredit !== undefined && client.chargesCredit > 0 && (
                    <InfoField label="Charges de crédit" value={`${client.chargesCredit.toLocaleString('fr-FR')} ${devise}`} icon={<AlertCircle size={16} className={isGerant ? 'text-[#905D5D]' : 'text-amber-500'} />} />
                  )}
                  {client.chargesFixes !== undefined && client.chargesFixes > 0 && (
                    <InfoField label="Charges fixes" value={`${client.chargesFixes.toLocaleString('fr-FR')} ${devise}`} icon={<AlertCircle size={16} className={isGerant ? 'text-[#905D5D]' : 'text-amber-500'} />} />
                  )}
                </div>
              </div>
            )}

            {/* Détails du prêt — Prêt bancaire */}
            {isPretBancaire && (
              <div className="border-t border-border/30 pt-4 mt-4">
                <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Détails du prêt</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {client.montantPretSouhaite !== undefined && client.montantPretSouhaite > 0 && (
                    <InfoField label="Montant souhaité" value={`${client.montantPretSouhaite.toLocaleString('fr-FR')} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />} />
                  )}
                  {client.tauxEnvisage !== undefined && (
                    <InfoField label="Taux envisagé" value={`${client.tauxEnvisage} %`} icon={<TrendingUp size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />} />
                  )}
                  {client.taeg !== undefined && (
                    <InfoField label="TAEG" value={`${client.taeg} %`} icon={<TrendingUp size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />} />
                  )}
                  {client.assuranceEmprunteur !== undefined && (
                    <InfoField label="Assurance emprunteur" value={`${client.assuranceEmprunteur} %`} icon={<CreditCard size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />} />
                  )}
                  {client.banqueSollicitee && (
                    <InfoField label="Banque sollicitée" value={client.banqueSollicitee} icon={<Briefcase size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />} />
                  )}
                  {client.statutFinancement && (
                    <InfoField label="Statut" value={client.statutFinancement} icon={<CreditCard size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />} />
                  )}
                </div>
              </div>
            )}

            {client.contribution !== undefined && client.contribution > 0 && (
              <InfoField 
                label="Apport personnel" 
                value={`${client.contribution.toLocaleString('fr-FR')} ${devise}`} 
                icon={<CreditCard size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />}
              />
            )}

            {client.capaciteEmprunt !== undefined && client.capaciteEmprunt > 0 && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="flex items-center gap-1.5">
                    <TrendingUp size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />
                    Capacité d'emprunt estimée
                  </span>
                  <span className="font-semibold">{client.capaciteEmprunt.toLocaleString('fr-FR')} {devise}</span>
                </div>
                <Progress 
                  value={financialStatus.percentage} 
                  className="h-2 bg-white/10"
                  indicatorColor={isGerant ? 'bg-[#905D5D]' : 'bg-premium'}
                />
                <p className="text-xs text-text/60">
                  {financialStatus.message}
                </p>
              </div>
            )}

            {/* Autre financement */}
            {isAutre && client.descriptionAutreFinancement && (
              <div className="border-t border-border/30 pt-4 mt-4">
                <InfoField label="Description" value={client.descriptionAutreFinancement} icon={<CreditCard size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />} />
                {client.montantTotal !== undefined && client.montantTotal > 0 && (
                  <InfoField label="Montant" value={`${client.montantTotal.toLocaleString('fr-FR')} ${devise}`} icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />} />
                )}
              </div>
            )}
          </>
        );
        
      case 'Locataire':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField 
              label="Budget mensuel" 
              value={client.budget ? `${client.budget.toLocaleString('fr-FR')} ${devise}` : "Non spécifié"} 
              icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />}
              highlight
            />
            <InfoField 
              label="Meublé" 
              value={client.furnished ? "Oui" : "Non"} 
              icon={<Home size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />}
            />
          </div>
        );
        
      case 'Bailleur':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField 
              label="Prix demandé" 
              value={client.budget ? `${client.budget.toLocaleString('fr-FR')} ${devise}` : "Non spécifié"} 
              icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />}
              highlight
            />
            {client.minRentalDuration && (
              <InfoField 
                label="Durée minimum" 
                value={`${client.minRentalDuration} mois`} 
                icon={<Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />}
              />
            )}
          </div>
        );
        
      case 'Voyageur':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField 
              label="Budget voyage" 
              value={client.budget ? `${client.budget.toLocaleString('fr-FR')} ${devise}` : "Non spécifié"} 
              icon={<DollarSign size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />}
              highlight
            />
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="font-medium text-lg mb-4">Informations financières</h2>
      
      {renderTypeSpecificFields()}

      {(client.type === 'Acheteur' || client.type === 'Locataire') && client.contribution !== undefined && client.contribution > 0 && client.type !== 'Acheteur' && (
        <InfoField 
          label="Apport personnel" 
          value={`${client.contribution.toLocaleString('fr-FR')} ${devise}`} 
          icon={<CreditCard size={16} className={isGerant ? 'text-[#905D5D]' : 'text-premium'} />}
        />
      )}
    </div>
  );
};

function calculateFinancialStatus(budget: number | undefined, financing: number | undefined) {
  if (!budget || !financing) {
    return { percentage: 0, message: "Informations financières incomplètes" };
  }

  const ratio = (financing / budget) * 100;
  let message = "";

  if (ratio > 80) message = "Excellent capacité d'emprunt";
  else if (ratio > 60) message = "Bonne capacité d'emprunt";
  else if (ratio > 40) message = "Capacité d'emprunt moyenne";
  else message = "Capacité d'emprunt limitée";

  return { percentage: Math.min(100, Math.round(ratio)), message };
}