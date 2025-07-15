import { InfoField } from "../../../ui/InfoField";
import { Progress } from "../../../ui/Progress";
import { FileText, DollarSign, CreditCard, Calendar } from "react-feather";

import { Client } from "../../../../types/client"; // Ensure this path is correct

export const ClientFinancial = ({ client }: { client: Client }) => {
  const financialStatus = calculateFinancialStatus(client.budget, client.financing);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoField 
          label="Budget maximum" 
          value={client.budget ? `€${client.budget.toLocaleString()}` : "Non spécifié"} 
          icon={<DollarSign size={16} className="text-premium" />}
          highlight
        />
        
        <InfoField 
          label="Apport personnel" 
          value={client.contribution ? `€${client.contribution.toLocaleString()}` : "Non spécifié"} 
          icon={<CreditCard size={16} className="text-premium" />}
        />
        
        <InfoField 
          label="Type de financement" 
          value={client.financingType || "Non spécifié"} 
          icon={<CreditCard size={16} className="text-premium" />}
        />
        
        <InfoField 
          label="Durée souhaitée" 
          value={client.loanDuration ? `${client.loanDuration} ans` : "Non spécifié"} 
          icon={<Calendar size={16} className="text-premium" />}
        />
      </div>

      <div className="space-y-2">
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

      <div className="pt-2">
        <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
          <FileText size={16} className="text-premium" />
          Documents financiers
        </h3>
        <div className="flex flex-wrap gap-2">
          {client.documents && client.documents.length > 0 ? (
            (client.documents ?? []).map((doc, index) => (
              <a 
                key={index} 
                href={doc.url} 
                className="text-xs flex items-center gap-1 bg-white/5 px-3 py-1.5 rounded-glass hover:bg-premium/10 transition-colors"
              >
                <FileText size={12} />
                {doc.name}
              </a>
            ))
          ) : (
            <p className="text-sm text-text/60">Aucun document joint</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper function
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