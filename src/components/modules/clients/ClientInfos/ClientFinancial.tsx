import { InfoField } from "../../../ui/InfoField";
import { Progress } from "../../../ui/Progress";
import { FileText, DollarSign, CreditCard, Calendar, Home, Clock } from "react-feather";
import { Client } from "../../../../types/client";

export const ClientFinancial = ({ client }: { client: Client }) => {
  const financialStatus = calculateFinancialStatus(client.budget, client.contribution);

  const renderTypeSpecificFields = () => {
    switch(client.type) {
      case 'Acheteur':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField 
                label="Type de financement" 
                value={client.financingType || "Non spécifié"} 
                icon={<CreditCard size={16} className="text-premium" />}
              />
              
              {client.loanDuration && (
                <InfoField 
                  label="Durée souhaitée" 
                  value={`${client.loanDuration} ans`} 
                  icon={<Calendar size={16} className="text-premium" />}
                />
              )}
            </div>

            {client.financingType === 'Prêt bancaire' && (
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span>Capacité d'emprunt</span>
                  <span>{financialStatus.percentage}%</span>
                </div>
                <Progress 
                  value={financialStatus.percentage} 
                  className="h-2 bg-white/10"
                  indicatorClass="bg-premium"
                />
                <p className="text-xs text-text/60">
                  {financialStatus.message}
                </p>
              </div>
            )}
          </>
        );
        
      case 'Locataire':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField 
              label="Budget mensuel" 
              value={client.budget ? `€${client.budget.toLocaleString()}` : "Non spécifié"} 
              icon={<DollarSign size={16} className="text-premium" />}
              highlight
            />
            
            <InfoField 
              label="Meublé" 
              value={client.furnished ? "Oui" : "Non"} 
              icon={<Home size={16} className="text-premium" />}
            />
          </div>
        );
        
      case 'Bailleur':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField 
              label="Prix demandé" 
              value={client.budget ? `€${client.budget.toLocaleString()}` : "Non spécifié"} 
              icon={<DollarSign size={16} className="text-premium" />}
              highlight
            />
            
            {client.minRentalDuration && (
              <InfoField 
                label="Durée minimum" 
                value={`${client.minRentalDuration} mois`} 
                icon={<Clock size={16} className="text-premium" />}
              />
            )}
          </div>
        );
        
      case 'Voyageur':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoField 
              label="Budget voyage" 
              value={client.budget ? `€${client.budget.toLocaleString()}` : "Non spécifié"} 
              icon={<DollarSign size={16} className="text-premium" />}
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

      {(client.type === 'Acheteur' || client.type === 'Locataire') && client.contribution && (
        <InfoField 
          label="Apport personnel" 
          value={`€${client.contribution.toLocaleString()}`} 
          icon={<CreditCard size={16} className="text-premium" />}
        />
      )}
    </div>
  );
};

// Helper function remains the same
function calculateFinancialStatus(budget: number | undefined, financing: number | undefined) {
  if (!budget || !financing) {
    return { percentage: 0, message: "Informations incomplètes" };
  }

  const ratio = (financing / budget) * 100;
  let message = "";

  if (ratio > 80) message = "Excellent capacité d'emprunt";
  else if (ratio > 60) message = "Bonne capacité d'emprunt";
  else if (ratio > 40) message = "Capacité d'emprunt moyenne";
  else message = "Capacité d'emprunt limitée";

  return { percentage: Math.min(100, Math.round(ratio)), message };
}