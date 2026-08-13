import { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import {
  Mail, Phone, User, Users, MapPin, Briefcase, Globe, ChevronRight,
  MessageSquare, Calendar, Heart, Edit3, ExternalLink, Trash2,
  TrendingUp, ShoppingCart, Key, Home, Compass, Star, Hash,
  FileText, CheckCircle, Lock
} from 'react-feather';
import { Contact } from '../../../types/contact';
import { CompletionRing } from '../../ui/CompletionRing';
import { calcContactCompletion } from '../../../utils/contactCompletion';
interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
  onEdit?: (contact: Contact) => void;
  onDelete?: (id: string) => void;
  locked?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
}

const TYPE_CONFIG: Record<string, {
  icon: any;
  label: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
  accentRing: string;
  gradient: string;
  pillBg: string;
}> = {
  Particulier: {
    icon: User,
    label: 'Particulier',
    accent: 'text-blue-600',
    accentBg: 'bg-blue-50',
    accentBorder: 'border-l-blue-500',
    accentRing: 'ring-blue-500/20',
    gradient: 'from-blue-500/5 to-transparent',
    pillBg: 'bg-blue-50/80 text-blue-600 border-blue-100',
  },
  Professionnel: {
    icon: Briefcase,
    label: 'Professionnel',
    accent: 'text-purple-600',
    accentBg: 'bg-purple-50',
    accentBorder: 'border-l-purple-500',
    accentRing: 'ring-purple-500/20',
    gradient: 'from-purple-500/5 to-transparent',
    pillBg: 'bg-purple-50/80 text-purple-600 border-purple-100',
  },
  'Indivision / Succession': {
    icon: Users,
    label: 'Indivision',
    accent: 'text-orange-600',
    accentBg: 'bg-orange-50',
    accentBorder: 'border-l-orange-500',
    accentRing: 'ring-orange-500/20',
    gradient: 'from-orange-500/5 to-transparent',
    pillBg: 'bg-orange-50/80 text-orange-600 border-orange-100',
  },
};

const MANDAT_CONFIG: Record<string, { text: string; bg: string; border: string; icon: any; gradient: string }> = {
  Vendeur: { text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-100', icon: TrendingUp, gradient: 'from-amber-500/5' },
  Bailleur: { text: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100', icon: Key, gradient: 'from-teal-500/5' },
  Acheteur: { text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: ShoppingCart, gradient: 'from-emerald-500/5' },
  Locataire: { text: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-100', icon: Home, gradient: 'from-violet-500/5' },
  Voyageur: { text: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-100', icon: Compass, gradient: 'from-sky-500/5' },
};

function getInitials(civility: string, firstName: string, lastName: string): string {
  const f = firstName?.[0] || '';
  const l = lastName?.[0] || '';
  return `${f}${l}`.toUpperCase();
}

function InfoPill({ icon: Icon, label, value, accent }: { icon: any; label?: string; value: string; accent: string }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon size={11} className={`${accent} shrink-0 opacity-60`} />
      {label && <span className="text-[10px] text-text-secondary/60 shrink-0">{label}:</span>}
      <span className="text-[11px] text-text-secondary truncate">{value}</span>
    </div>
  );
}

const MiniTag = ({ label, colorClass }: { label: string; colorClass: string }) => (
  <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-medium rounded border ${colorClass}`}>
    {label}
  </span>
);

const SectionLabel = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 mt-2.5 mb-1.5">
    <div className="h-px flex-1 bg-border/40" />
    <span className="text-[9px] font-semibold text-text-secondary/40 uppercase tracking-wider">{label}</span>
    <div className="h-px flex-1 bg-border/40" />
  </div>
);

export const ContactCard = ({ contact, onClick, onEdit, onDelete, locked = false, canEdit = true, canDelete = true, canExport = true }: ContactCardProps) => {
  const [liked, setLiked] = useState(false);
  const shakeControls = useAnimation();
  const fullName = `${contact.civility} ${contact.firstName} ${contact.lastName}`;
  const config = TYPE_CONFIG[contact.type] || TYPE_CONFIG['Particulier'];
  const completion = calcContactCompletion(contact);

  const uniqueClientTypes = Array.from(new Set(contact.mandats.map((m) => m.clientType)));
  const activeMandats = contact.mandats.filter((m) => m.status === 'Actif');
  const pendingMandats = contact.mandats.filter((m) => m.status === 'En attente');
  const expiredMandats = contact.mandats.filter((m) => m.status === 'Expiré');

  const initials = getInitials(contact.civility, contact.firstName, contact.lastName);
  const fullAddress = [contact.adresse, contact.codePostal, contact.ville, contact.pays].filter(Boolean).join(', ');
  const hasLanguages = contact.langueParlee && contact.langueParlee.length > 0;
  const hasPrivateNote = !!contact.commentairePrive;

  const handleCardClick = () => {
    if (locked) {
      shakeControls.start({
        x: [0, -10, 10, -7, 7, -4, 4, 0],
        transition: { duration: 0.45 },
      });
      return;
    }
    onClick?.();
  };

  return (
    <motion.div
      animate={shakeControls}
      onClick={handleCardClick}
      className={`bg-card rounded-xl border border-border/50 shadow-card hover:shadow-card-hover cursor-pointer transition-all duration-300 group relative flex flex-col overflow-hidden border-l-[3px] ${config.accentBorder} hover:-translate-y-0.5 ${locked ? 'cursor-not-allowed' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />

      <div className="relative p-4 pb-0">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-11 h-11 rounded-xl ${config.accentBg} flex items-center justify-center ring-2 ${config.accentRing} shrink-0 transition-transform duration-300 group-hover:scale-105`}>
              <span className={`text-sm font-bold ${config.accent}`}>{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-semibold text-sm truncate">{fullName}</h3>
                {locked && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold rounded-md bg-amber-50 text-amber-600 border border-amber-100">
                    <Lock size={8} />
                    Verrouillé
                  </span>
                )}
                {activeMandats.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-semibold rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CheckCircle size={8} />
                    {activeMandats.length} actif{activeMandats.length > 1 ? 's' : ''}
                  </span>
                )}
                {hasPrivateNote && (
                  <span className="inline-flex items-center px-1 py-0.5 text-[9px] rounded bg-amber-50 text-amber-600 border border-amber-100" title="Note privée">
                    <Lock size={8} />
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className={`text-[10px] font-medium ${config.accent}`}>{config.label}</span>
                {contact.profession && (
                  <>
                    <span className="text-text-secondary/30">·</span>
                    <span className="text-[10px] text-text-secondary">{contact.profession}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <CompletionRing percent={completion} size={36} strokeWidth={3} showLabel={true} />
          </div>
        </div>

        {/* Phone & Email row */}
        <div className="flex items-center gap-3 text-xs text-text-secondary mb-3">
          {contact.mobile && (
            <div className="flex items-center gap-1.5 min-w-0">
              <Phone size={12} className="shrink-0 opacity-60" />
              <span className="truncate">{contact.mobile}</span>
            </div>
          )}
          {contact.emailPrincipal && (
            <>
              <span className="text-text-secondary/30">·</span>
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail size={12} className="shrink-0 opacity-60" />
                <span className="truncate">{contact.emailPrincipal}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="relative px-4 pb-3 flex-1">
        {/* Identity & Location */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          {fullAddress && (
            <InfoPill icon={MapPin} label="Adresse" value={fullAddress} accent={config.accent} />
          )}
          {contact.nationalite && (
            <InfoPill icon={Globe} label="Nationalité" value={contact.nationalite} accent={config.accent} />
          )}
          {contact.situationFamiliale && (
            <InfoPill
              icon={User}
              label="Situation"
              value={`${contact.situationFamiliale}${contact.nombreEnfants !== undefined ? ` · ${contact.nombreEnfants} enfant${contact.nombreEnfants > 1 ? 's' : ''}` : ''}`}
              accent={config.accent}
            />
          )}
          {contact.moyenContactPrefere && (
            <InfoPill icon={MessageSquare} label="Préféré" value={contact.moyenContactPrefere} accent={config.accent} />
          )}
          {contact.numeroFiscal && (
            <InfoPill icon={Hash} label="N° fiscal" value={contact.numeroFiscal} accent={config.accent} />
          )}
          {contact.dateNaissance && (
            <InfoPill icon={Calendar} label="Né(e) le" value={new Date(contact.dateNaissance).toLocaleDateString('fr-FR')} accent={config.accent} />
          )}
          {contact.regimeMatrimonial && (
            <InfoPill icon={FileText} label="Régime" value={contact.regimeMatrimonial} accent={config.accent} />
          )}
          {contact.prescripteur && (
            <InfoPill icon={Star} label="Prescripteur" value={contact.prescripteur} accent={config.accent} />
          )}
        </div>

        {/* Languages */}
        {hasLanguages && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {contact.langueParlee.map((lang) => (
              <MiniTag key={lang} label={lang} colorClass={`${config.pillBg}`} />
            ))}
          </div>
        )}

        {/* Mandats section */}
        {uniqueClientTypes.length > 0 && (
          <>
            <SectionLabel label="Mandats" />
            <div className="flex flex-wrap gap-1.5">
              {uniqueClientTypes.map((ct) => {
                const mc = MANDAT_CONFIG[ct] || { text: 'text-text-secondary', bg: 'bg-background', border: 'border-border', icon: null, gradient: '' };
                const Icon = mc.icon;
                const count = contact.mandats.filter((m) => m.clientType === ct).length;
                const activeCount = contact.mandats.filter((m) => m.clientType === ct && m.status === 'Actif').length;
                return (
                  <span
                    key={ct}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-md ${mc.bg} ${mc.text} border ${mc.border} font-medium`}
                  >
                    {Icon && <Icon size={9} />}
                    {ct}
                    {count > 1 && <span className="opacity-60">×{count}</span>}
                    {activeCount > 0 && (
                      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[7px] font-bold">
                        {activeCount}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>

            {/* Mandat status summary */}
            {(activeMandats.length > 0 || pendingMandats.length > 0 || expiredMandats.length > 0) && (
              <div className="flex items-center gap-3 mt-2 text-[10px] text-text-secondary/60">
                {activeMandats.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{activeMandats.length} actif{activeMandats.length > 1 ? 's' : ''}</span>
                  </div>
                )}
                {pendingMandats.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>{pendingMandats.length} en attente</span>
                  </div>
                )}
                {expiredMandats.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span>{expiredMandats.length} expiré{expiredMandats.length > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="relative px-4 py-2.5 border-t border-border/30 flex items-center justify-between bg-background/30">
        <button
          className="flex items-center gap-1 text-[11px] font-medium text-text-secondary hover:text-accent transition-colors group/btn"
          onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
        >
          {locked ? (
            <>
              <Lock size={11} />
              Verrouillé
            </>
          ) : (
            <>
              Voir fiche
              <ChevronRight size={12} className="transition-transform group-hover/btn:translate-x-0.5" />
            </>
          )}
        </button>
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${liked ? 'text-red-500 bg-red-50' : 'text-text-secondary hover:text-text hover:bg-background'}`}
          >
            <Heart size={13} />
          </button>
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit?.(contact); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
            >
              <Edit3 size={13} />
            </button>
          )}
          {canExport && (
            <button
              onClick={(e) => { e.stopPropagation(); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
            >
              <ExternalLink size={13} />
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(contact.id); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-error hover:bg-error/5 transition-all"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
