import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Select } from '../../ui/Select';
import { DatePicker } from '../../ui/DatePicker';
import { TimePicker } from '../../ui/TimePicker';
import { Key, Clock, Eye, EyeOff, Plus, Trash2, Edit2, Save, Shield, MapPin, Lock, FileText, User, Phone } from 'react-feather';
import type { Property, KeyMovement } from '../../../types/property';
import { useConfidential } from '../confidentiality/ConfidentialContext';
import { updateProperty } from '../../../services/propertyService';
import { useToast } from '../../ui/Toast';
import { useStageFormClasses } from '../calendar/StageModal';
import { useStageChrome } from '../calendar/useStageChrome';
import {
  OrbIcon, TiltCard, StageBadge, StageButton,
  STAGE_HUES, SLATE_HUE,
} from '../../dashboard/Stage';

interface PropertyKeysProps {
  property: Property;
  onUpdated?: (property: Property) => void;
  isGerant?: boolean;
}

type KeysFormData = {
  status: string;
  storageLocation: string;
  identifier: string;
  contactType: string;
  contactPerson: string;
  contactPhone: string;
  preciseLocation: string;
  code: string;
  instructions: string;
  history: KeyMovement[];
};

const STATUS_OPTIONS = [
  { value: '', label: 'Sélectionner...' },
  { value: 'available', label: 'Disponible' },
  { value: 'in_visit', label: 'En visite' },
  { value: 'unavailable', label: 'Indisponible' },
  { value: 'lost', label: 'Perdue' },
];

const STORAGE_OPTIONS = [
  { value: '', label: 'Sélectionner...' },
  { value: 'agence', label: 'Agence' },
  { value: 'boite_clefs', label: 'Boîte à clés' },
  { value: 'proprietaire', label: 'Chez le propriétaire' },
  { value: 'gardien', label: 'Chez le gardien' },
  { value: 'autre_agence', label: 'Autre agence' },
  { value: 'sur_place', label: 'Sur place (code/digicode)' },
];

const CONTACT_TYPE_OPTIONS = [
  { value: '', label: 'Sélectionner...' },
  { value: 'agent', label: "Agent de l'agence" },
  { value: 'client', label: 'Client (contact)' },
  { value: 'tiers', label: 'Tiers' },
];

const ACTION_OPTIONS = [
  { value: '', label: 'Sélectionner...' },
  { value: 'prise_agent', label: 'Prise par agent' },
  { value: 'remise_agence', label: "Remise à l'agence" },
  { value: 'prise_client', label: 'Prise par client' },
  { value: 'retour_proprietaire', label: 'Retour propriétaire' },
  { value: 'donnee_conffrere', label: 'Donnée à confrère' },
  { value: 'perdue', label: 'Perdue' },
];

const badgeForStatus: Record<string, 'ok' | 'warn' | 'neutral' | 'danger'> = {
  available: 'ok',
  in_visit: 'warn',
  unavailable: 'neutral',
  lost: 'danger',
};

const PERSON_OPTIONS = [
  { value: 'agent_1', label: 'Karim Eloui' },
  { value: 'agent_2', label: 'Fatima Zahra' },
  { value: 'agent_3', label: 'Ahmed Benali' },
  { value: 'client_1', label: 'Sophie Martin' },
  { value: 'client_2', label: 'Thomas Dubois' },
  { value: 'proprietaire', label: 'Le propriétaire' },
];

function getPersonOptions(contactType: string) {
  if (contactType === 'agent') return PERSON_OPTIONS.filter(o => o.value.startsWith('agent_'));
  if (contactType === 'client') return PERSON_OPTIONS.filter(o => o.value.startsWith('client_'));
  return [];
}

function initFormData(keys: Property['keys']): KeysFormData {
  return {
    status: keys?.status ?? '',
    storageLocation: keys?.storageLocation ?? '',
    identifier: keys?.identifier ?? '',
    contactType: keys?.contactType ?? '',
    contactPerson: keys?.contactPerson ?? '',
    contactPhone: keys?.contactPhone ?? '',
    preciseLocation: keys?.preciseLocation ?? '',
    code: keys?.code ?? '',
    instructions: keys?.instructions ?? '',
    history: keys?.history ?? [],
  };
}

export function PropertyKeys({ property, onUpdated, isGerant = false }: PropertyKeysProps) {
  const { revealed } = useConfidential();
  const { toast } = useToast();
  const { input, label: stageLabel } = useStageFormClasses();
  const { staged, dark } = useStageChrome();
  const ctrl = (extra?: string) => (staged ? input(extra) : undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [keys, setKeys] = useState<KeysFormData>(() => initFormData(property.keys));
  const [contactType, setContactType] = useState(keys.contactType);
  const [tiersName, setTiersName] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [history, setHistory] = useState<KeyMovement[]>(keys.history);
  const [newMovement, setNewMovement] = useState({ date: '', action: '', person: '', reason: '' });
  const [saving, setSaving] = useState(false);

  const addMovement = () => {
    if (!newMovement.date || !newMovement.action || !newMovement.person) return;
    setHistory(prev => [...prev, { id: Date.now().toString(), ...newMovement, reason: newMovement.reason }]);
    setNewMovement({ date: '', action: '', person: '', reason: '' });
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await updateProperty(property.id, {
        keys: { ...keys, history },
      });
      if (onUpdated) onUpdated(updated);
      toast('success', 'Clés mises à jour avec succès');
      setIsEditing(false);
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la sauvegarde des clés');
    } finally {
      setSaving(false);
    }
  }, [property.id, keys, history, onUpdated, toast]);

  // exact calendar 3D glass skin — ensures Clés matches add/modify event modal
  const fieldCtrl = ctrl;
  const labelCls = stageLabel;

  const SectionHeader = ({ icon, title, subtitle }: { icon: any; title: string; subtitle?: string }) => (
    <div className="flex items-center gap-3 mb-4">
      <OrbIcon icon={icon} hue={STAGE_HUES.amber} size={32} radius={10} />
      <div>
        <h3 className={`text-[13px] font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h3>
        {subtitle && <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{subtitle}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div
        initial={staged ? { opacity: 0, y: 12 } : undefined}
        animate={staged ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`${staged ? 'stage-glass' : 'bg-card border border-border/50 shadow-card rounded-2xl'} p-5 flex items-center justify-between gap-3 relative overflow-hidden`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <OrbIcon icon={Key} hue={STAGE_HUES.amber} size={40} radius={12} />
          <div className="min-w-0">
            <h2 className={`text-[15px] font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>Gestion des clés</h2>
            <p className={`text-xs mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{property.reference} · {isEditing ? 'Mode édition' : 'Consultation'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <StageButton variant="glass" size="sm" onClick={() => setIsEditing(false)}>Annuler</StageButton>
              <StageButton variant="primary" size="sm" icon={<Save size={13} />} onClick={handleSave} className={saving ? 'opacity-50 pointer-events-none' : ''}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </StageButton>
            </>
          ) : (
            <StageButton variant="glass" size="sm" icon={<Edit2 size={13} />} onClick={() => setIsEditing(true)}>
              Modifier
            </StageButton>
          )}
        </div>
      </motion.div>

      {/* ZONE 1 : ÉTAT DES CLÉS */}
      <motion.div initial={staged ? { opacity: 0, y: 12 } : undefined} animate={staged ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className={`${staged ? 'stage-glass' : 'bg-card border border-border/50 shadow-card rounded-2xl'} p-5 relative overflow-hidden`}>
        <SectionHeader icon={Key} title="État des clés" subtitle="Statut et lieu de stockage" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isEditing ? (
            <div>
              <label className={labelCls}>Statut des clés</label>
              <Select
                options={STATUS_OPTIONS}
                value={keys.status}
                onValueChange={(v) => setKeys(prev => ({ ...prev, status: v }))}
                className={fieldCtrl('h-10')}
              />
            </div>
          ) : (
            <div>
              <label className={labelCls}>Statut des clés</label>
              {keys.status ? <StageBadge variant={badgeForStatus[keys.status] || 'neutral'}>{STATUS_OPTIONS.find(o=>o.value===keys.status)?.label}</StageBadge> : <span className={`text-sm ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Non défini</span>}
            </div>
          )}
          {isEditing ? (
            <div>
              <label className={labelCls}>Lieu de garde</label>
              <Select
                options={STORAGE_OPTIONS}
                value={keys.storageLocation}
                onValueChange={(v) => setKeys(prev => ({ ...prev, storageLocation: v }))}
                className={fieldCtrl('h-10')}
              />
            </div>
          ) : (
            <div>
              <label className={labelCls}>Lieu de garde</label>
              <span className={`mt-1 inline-flex items-center px-3 py-2 rounded-xl border text-sm font-medium backdrop-blur-sm ${dark ? 'text-slate-200' : 'text-slate-700'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                {keys.storageLocation ? STORAGE_OPTIONS.find(o=>o.value===keys.storageLocation)?.label : <span className={dark ? 'text-slate-500' : 'text-slate-400'}>—</span>}
              </span>
            </div>
          )}
          {isEditing ? (
            <div>
              <label className={labelCls}>Identifiant / Référence</label>
              <input
                value={keys.identifier}
                onChange={(e) => setKeys(prev => ({ ...prev, identifier: e.target.value }))}
                className={fieldCtrl('h-10')}
                placeholder="Ex: Trousseau A12"
              />
            </div>
          ) : (
            <div>
              <label className={labelCls}>Identifiant / Référence</label>
              <span className={`mt-1 inline-flex items-center px-3 py-2 rounded-xl border text-sm font-medium backdrop-blur-sm min-w-[120px] ${dark ? 'text-slate-200' : 'text-slate-700'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                {keys.identifier || <span className={dark ? 'text-slate-500' : 'text-slate-400'}>—</span>}
              </span>
            </div>
          )}
        </div>
      </motion.div>

      {/* ZONE 2 : PERSONNE À CONTACTER */}
      <motion.div initial={staged ? { opacity: 0, y: 12 } : undefined} animate={staged ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className={`${staged ? 'stage-glass' : 'bg-card border border-border/50 shadow-card rounded-2xl'} p-5 relative overflow-hidden`}>
        <SectionHeader icon={User} title="Personne à contacter" subtitle="Interlocuteur pour l'accès" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isEditing ? (
            <div>
              <label className={labelCls}>Type de personne</label>
              <Select
                options={CONTACT_TYPE_OPTIONS}
                value={contactType}
                onValueChange={(v) => { setContactType(v); setKeys(prev => ({ ...prev, contactType: v, contactPerson: '', contactPhone: '' })); }}
                className={fieldCtrl('h-10')}
              />
            </div>
          ) : (
            <div>
              <label className={labelCls}>Type de personne</label>
              <span className={`mt-1 inline-flex items-center px-3 py-2 rounded-xl border text-sm font-medium backdrop-blur-sm ${dark ? 'text-slate-200' : 'text-slate-700'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                {CONTACT_TYPE_OPTIONS.find(o=>o.value===contactType)?.label || <span className={dark ? 'text-slate-500' : 'text-slate-400'}>—</span>}
              </span>
            </div>
          )}
          <div>
            <label className={labelCls}>Personne</label>
            {!isEditing && !revealed ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm backdrop-blur-sm ${dark ? 'text-slate-300' : 'text-slate-400'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}><Shield size={12} /> ••••••••</span>
            ) : isEditing && contactType === 'tiers' ? (
              <input
                value={tiersName}
                onChange={(e) => { setTiersName(e.target.value); setKeys(prev => ({ ...prev, contactPerson: e.target.value })); }}
                className={fieldCtrl('h-10')}
                placeholder="Nom du tiers"
              />
            ) : isEditing ? (
              <Select
                options={[{ value: '', label: 'Sélectionner...' }, ...getPersonOptions(contactType)]}
                value={keys.contactPerson}
                onValueChange={(v) => setKeys(prev => ({ ...prev, contactPerson: v }))}
                className={fieldCtrl('h-10')}
              />
            ) : (
              <span className={`inline-flex items-center px-3 py-2 rounded-xl border text-sm font-medium backdrop-blur-sm w-full ${dark ? 'text-slate-200' : 'text-slate-700'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>{keys.contactPerson || <span className={dark ? 'text-slate-500' : 'text-slate-400'}>—</span>}</span>
            )}
          </div>
          <div>
            <label className={labelCls}>Téléphone</label>
            {!isEditing && !revealed ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm backdrop-blur-sm ${dark ? 'text-slate-300' : 'text-slate-400'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}><Phone size={12} /> ••••••••</span>
            ) : isEditing ? (
              <input
                value={keys.contactPhone}
                onChange={(e) => setKeys(prev => ({ ...prev, contactPhone: e.target.value }))}
                className={fieldCtrl('h-10')}
                placeholder="06 12 34 56 78"
              />
            ) : (
              <span className={`inline-flex items-center px-3 py-2 rounded-xl border text-sm font-medium backdrop-blur-sm ${dark ? 'text-slate-200' : 'text-slate-700'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                {keys.contactPhone || <span className={dark ? 'text-slate-500' : 'text-slate-400'}>—</span>}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ZONE 3 : EMPLACEMENT PRÉCIS */}
      <motion.div initial={staged ? { opacity: 0, y: 12 } : undefined} animate={staged ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className={`${staged ? 'stage-glass' : 'bg-card border border-border/50 shadow-card rounded-2xl'} p-5 relative overflow-hidden`}>
        <SectionHeader icon={MapPin} title="Emplacement précis" subtitle="Localisation exacte et code d'accès" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Emplacement précis</label>
            {!isEditing && !revealed ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm w-full backdrop-blur-sm ${dark ? 'text-slate-300' : 'text-slate-400'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}><Shield size={12} /> ••••••••</span>
            ) : isEditing ? (
              <input
                value={keys.preciseLocation}
                onChange={(e) => setKeys(prev => ({ ...prev, preciseLocation: e.target.value }))}
                placeholder="Boîte à clés code 1234, Tiroir 3..."
                className={fieldCtrl('h-10')}
              />
            ) : (
              <span className={`inline-flex items-center px-3 py-2 rounded-xl border text-sm font-medium backdrop-blur-sm w-full ${dark ? 'text-slate-200' : 'text-slate-700'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                {keys.preciseLocation || <span className={dark ? 'text-slate-500' : 'text-slate-400'}>—</span>}
              </span>
            )}
          </div>
          <div>
            <label className={labelCls}>Code / Digicode</label>
            {!isEditing && !revealed ? (
              <span className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm w-full backdrop-blur-sm ${dark ? 'text-slate-300' : 'text-slate-400'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}><Lock size={12} /> ••••••••</span>
            ) : isEditing ? (
              <div className="relative group">
                <input
                  type={showCode ? 'text' : 'password'}
                  value={keys.code}
                  onChange={(e) => setKeys(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="1234"
                  disabled={!isEditing}
                  className={fieldCtrl('h-10 pr-10')}
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors ${dark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                >
                  {showCode ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            ) : (
              <span className={`inline-flex items-center px-3 py-2 rounded-xl border text-sm font-medium backdrop-blur-sm w-full ${dark ? 'text-slate-200' : 'text-slate-700'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
                {keys.code ? '••••' : <span className={dark ? 'text-slate-500' : 'text-slate-400'}>—</span>}
                <span className={`ml-2 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{keys.code ? '(masqué)' : ''}</span>
              </span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ZONE 4 : INSTRUCTIONS */}
      <motion.div initial={staged ? { opacity: 0, y: 12 } : undefined} animate={staged ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className={`${staged ? 'stage-glass' : 'bg-card border border-border/50 shadow-card rounded-2xl'} p-5 relative overflow-hidden`}>
        <SectionHeader icon={FileText} title="Instructions" subtitle="Consignes d'accès" />
        {!isEditing && !revealed ? (
          <p className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm backdrop-blur-sm ${dark ? 'text-slate-300' : 'text-slate-400'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}><Shield size={12} /> ••••••••</p>
        ) : isEditing ? (
          <textarea
            value={keys.instructions}
            onChange={(e) => setKeys(prev => ({ ...prev, instructions: e.target.value }))}
            placeholder="Sonner à l'interphone, demander Monsieur Dupont..."
            rows={3}
            className={fieldCtrl('min-h-[88px] py-3 resize-none')}
          />
        ) : (
          <div className={`px-3.5 py-3 rounded-xl border text-sm leading-relaxed whitespace-pre-wrap min-h-[72px] backdrop-blur-sm ${dark ? 'text-slate-200' : 'text-slate-700'}`} style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
            {keys.instructions || <span className={dark ? 'text-slate-500' : 'text-slate-400'}>Aucune instruction</span>}
          </div>
        )}
      </motion.div>

      {/* HISTORIQUE DES MOUVEMENTS */}
      <motion.div initial={staged ? { opacity: 0, y: 12 } : undefined} animate={staged ? { opacity: 1, y: 0 } : undefined} transition={{ delay: 0.25, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className={`${staged ? 'stage-glass' : 'bg-card border border-border/50 shadow-card rounded-2xl'} p-5 relative overflow-hidden`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <OrbIcon icon={Clock} hue={STAGE_HUES.sky} size={32} radius={10} />
            <div>
              <h3 className={`text-[13px] font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Historique des mouvements</h3>
              <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{history.length} mouvement{history.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {history.length > 0 && <StageBadge variant="neutral">{history.length}</StageBadge>}
        </div>

        {/* Add movement — calendar-grade pickers with 3D glass */}
        {isEditing && (() => {
          const [dPart, tPart] = newMovement.date ? newMovement.date.split('T') : ['', ''];
          return (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-4 p-3 rounded-xl border" style={{ borderColor: dark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)', background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.55)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <DatePicker
                value={dPart}
                onChange={e => {
                  const d = e.target.value;
                  const t = tPart || '09:00';
                  setNewMovement({ ...newMovement, date: d ? `${d}T${t}` : '' });
                }}
                placeholder="Date"
                className={fieldCtrl('h-10')}
              />
              <TimePicker
                value={tPart}
                onChange={e => {
                  const t = e.target.value;
                  const d = dPart || new Date().toISOString().slice(0, 10);
                  setNewMovement({ ...newMovement, date: d ? `${d}T${t}` : '' });
                }}
                placeholder="Heure"
                className={fieldCtrl('h-10')}
              />
              <Select
                options={ACTION_OPTIONS}
                value={newMovement.action}
                onValueChange={(v) => setNewMovement({ ...newMovement, action: v, person: '' })}
                placeholder="Action"
                className={fieldCtrl('h-10')}
              />
              <Select
                options={[{ value: '', label: 'Personne concernée' }, ...PERSON_OPTIONS]}
                value={newMovement.person}
                onValueChange={(v) => setNewMovement({ ...newMovement, person: v })}
                placeholder="Personne"
                className={fieldCtrl('h-10')}
              />
              <StageButton variant="primary" size="sm" icon={<Plus size={13} />} onClick={addMovement} className={!newMovement.date || !newMovement.action || !newMovement.person ? 'opacity-40 pointer-events-none' : ''}>
                Ajouter
              </StageButton>
            </div>
          );
        })()}

        {/* History list */}
        {history.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-10 rounded-xl border border-dashed ${dark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/50'}`}>
            <OrbIcon icon={Clock} hue={SLATE_HUE} size={40} radius={12} className="opacity-40 mb-2" />
            <p className={`text-sm font-medium ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Aucun mouvement enregistré</p>
            <p className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>L'historique apparaîtra ici après ajout</p>
          </div>
        ) : (
          <div className={`divide-y ${dark ? 'divide-white/5' : 'divide-slate-200'}`}>
            {history.map((entry) => (
              <div key={entry.id} className={`flex items-center justify-between py-3 gap-3 group rounded-xl px-2 -mx-2 transition-colors ${dark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border text-[11px] font-medium shrink-0 ${dark ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                    <Clock size={10} className={dark ? 'text-slate-500' : 'text-slate-400'} />
                    {new Date(entry.date).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <StageBadge variant="neutral">{ACTION_OPTIONS.find(o => o.value === entry.action)?.label || entry.action}</StageBadge>
                  <span className={`text-sm font-medium truncate ${dark ? 'text-white' : 'text-slate-900'}`}>
                    {PERSON_OPTIONS.find(o => o.value === entry.person)?.label || entry.person}
                  </span>
                  {entry.reason && (
                    <span className={`text-xs truncate ${dark ? 'text-slate-400' : 'text-slate-500'}`}>— {entry.reason}</span>
                  )}
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setHistory(prev => prev.filter(h => h.id !== entry.id))}
                    className={`p-1.5 rounded-lg transition-colors shrink-0 ${dark ? 'text-slate-500 hover:text-red-300 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-500 hover:bg-red-50'}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
