import { Mail, Phone, User, MapPin, Briefcase, Globe } from 'react-feather';
import { Contact } from '../../../types/contact';

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
}

const typeColors: Record<string, string> = {
  Particulier: 'bg-blue-50 text-blue-700 border-blue-200',
  Professionnel: 'bg-purple-50 text-purple-700 border-purple-200',
  'Indivision / Succession': 'bg-orange-50 text-orange-700 border-orange-200',
};

const mandatColors: Record<string, { text: string; bg: string }> = {
  Vendeur: { text: 'text-amber-700', bg: 'bg-amber-50' },
  Bailleur: { text: 'text-accent', bg: 'bg-accent-light' },
  Acheteur: { text: 'text-emerald-700', bg: 'bg-emerald-50' },
  Locataire: { text: 'text-violet-700', bg: 'bg-violet-50' },
  Voyageur: { text: 'text-rose-700', bg: 'bg-rose-50' },
};

export const ContactCard = ({ contact, onClick }: ContactCardProps) => {
  const fullName = `${contact.civility} ${contact.firstName} ${contact.lastName}`;
  const activeMandats = contact.mandats.filter((m) => m.status === 'Actif');
  const typeColor = typeColors[contact.type] || 'bg-background text-text-secondary border-border';

  return (
    <div
      className="bg-card rounded-xl border border-border/50 shadow-card hover:shadow-card-hover p-4 cursor-pointer transition-all duration-200 group"
      onClick={onClick}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-lg bg-accent-light flex items-center justify-center flex-shrink-0">
          <User size={16} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm truncate">{fullName}</h3>
            <span className={`shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeColor}`}>
              {contact.type === 'Indivision / Succession' ? 'Indivision' : contact.type}
            </span>
          </div>
          <p className="text-xs text-text-secondary truncate">{contact.emailPrincipal}</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Phone size={12} />
          <span>{contact.mobile}</span>
        </div>
        {contact.telephoneFixe && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Phone size={12} />
            <span>{contact.telephoneFixe}</span>
          </div>
        )}
        {contact.profession && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Briefcase size={12} />
            <span className="truncate">{contact.profession}</span>
          </div>
        )}
        {(contact.ville || contact.pays) && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <MapPin size={12} />
            <span className="truncate">{[contact.ville, contact.pays].filter(Boolean).join(', ')}</span>
          </div>
        )}
        {contact.situationFamiliale && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Globe size={12} />
            <span>{contact.situationFamiliale}{contact.nombreEnfants !== undefined ? ` · ${contact.nombreEnfants} enfant${contact.nombreEnfants > 1 ? 's' : ''}` : ''}</span>
          </div>
        )}
      </div>

      {activeMandats.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-border/30">
          {activeMandats.map((m) => {
            const colors = mandatColors[m.clientType] || { text: 'text-text-secondary', bg: 'bg-background' };
            return (
              <span
                key={m.id}
                className={`px-2 py-0.5 text-[11px] rounded-md ${colors.bg} ${colors.text} border border-current/20 font-medium`}
              >
                {m.clientType}
              </span>
            );
          })}
        </div>
      )}

      {contact.originalProspectId && (
        <p className="mt-2 text-[11px] text-text-secondary/50">Issu d'un prospect</p>
      )}
    </div>
  );
};
