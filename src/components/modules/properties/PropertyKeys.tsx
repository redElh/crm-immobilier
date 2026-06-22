import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../../ui/Badge';
import { Select } from '../../ui/Select';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Key, Clock, Eye, EyeOff, Plus, Trash2, Edit2, Save } from 'react-feather';
import type { Property, KeyMovement } from '../../../types/property';
import { useConfidential } from '../confidentiality/ConfidentialContext';
import { ConfidentialValue } from '../confidentiality/ConfidentialField';

interface PropertyKeysProps {
  property: Property;
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

const keysStatusConfig: Record<string, { label: string; className: string }> = {
  available: { label: 'Disponible', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  in_visit: { label: 'En visite', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  unavailable: { label: 'Indisponible', className: 'bg-gray-50 text-gray-700 border-gray-200' },
  lost: { label: 'Perdue', className: 'bg-red-50 text-red-700 border-red-200' },
};

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

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

export function PropertyKeys({ property }: PropertyKeysProps) {
  const { revealed } = useConfidential();
  const [isEditing, setIsEditing] = useState(false);
  const [keys, setKeys] = useState<KeysFormData>(() => initFormData(property.keys));
  const [contactType, setContactType] = useState(keys.contactType);
  const [tiersName, setTiersName] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [history, setHistory] = useState<KeyMovement[]>(keys.history);
  const [newMovement, setNewMovement] = useState({ date: '', action: '', person: '', reason: '' });

  const statusConfig = keys.status ? keysStatusConfig[keys.status] : null;

  const addMovement = () => {
    if (!newMovement.date || !newMovement.action || !newMovement.person) return;
    setHistory(prev => [...prev, { id: Date.now().toString(), ...newMovement, reason: newMovement.reason }]);
    setNewMovement({ date: '', action: '', person: '', reason: '' });
  };

  const handleSave = () => {
    console.log('Saving keys:', { ...keys, history });
    setIsEditing(false);
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">

      {/* Header actions */}
      <motion.div variants={item} className="flex items-center justify-end gap-2">
        {isEditing ? (
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-all active:scale-[0.98]"
          >
            <Save size={14} /> Enregistrer
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium rounded-lg border border-border bg-card text-text hover:bg-background transition-all active:scale-[0.98]"
          >
            <Edit2 size={14} /> Modifier
          </button>
        )}
      </motion.div>

      {/* ZONE 1 : ÉTAT DES CLÉS */}
      <motion.div variants={item} className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key size={16} className="text-accent" />
          <h3 className="font-semibold">État des clés</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {isEditing ? (
            <Select
              label="Statut des clés"
              options={STATUS_OPTIONS}
              value={keys.status}
              onValueChange={(v) => setKeys(prev => ({ ...prev, status: v }))}
            />
          ) : (
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">Statut des clés</label>
              {statusConfig ? <Badge className={statusConfig.className}>{statusConfig.label}</Badge> : <span className="text-sm text-text-secondary/60">Non défini</span>}
            </div>
          )}
          <Select
            label="Lieu de garde"
            options={STORAGE_OPTIONS}
            value={keys.storageLocation}
            onValueChange={(v) => setKeys(prev => ({ ...prev, storageLocation: v }))}
            disabled={!isEditing}
          />
          <Input
            label="Identifiant / Référence"
            value={keys.identifier}
            onChange={(e) => setKeys(prev => ({ ...prev, identifier: e.target.value }))}
            disabled={!isEditing}
          />
        </div>
      </motion.div>

      {/* ZONE 2 : PERSONNE À CONTACTER */}
      <motion.div variants={item} className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key size={16} className="text-accent" />
          <h3 className="font-semibold">Personne à contacter</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            label="Type de personne"
            options={CONTACT_TYPE_OPTIONS}
            value={contactType}
            onValueChange={(v) => { setContactType(v); setKeys(prev => ({ ...prev, contactType: v, contactPerson: '', contactPhone: '' })); }}
            disabled={!isEditing}
          />
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Personne</label>
            {!isEditing && !revealed ? (
              <span className="text-sm text-text-secondary/30 italic">••••••••</span>
            ) : isEditing && contactType === 'tiers' ? (
              <Input
                value={tiersName}
                onChange={(e) => { setTiersName(e.target.value); setKeys(prev => ({ ...prev, contactPerson: e.target.value })); }}
              />
            ) : isEditing ? (
              <Select
                options={[{ value: '', label: 'Sélectionner...' }, ...getPersonOptions(contactType)]}
                value={keys.contactPerson}
                onValueChange={(v) => setKeys(prev => ({ ...prev, contactPerson: v }))}
              />
            ) : (
              <span className="text-sm text-text-secondary">{keys.contactPerson}</span>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Téléphone</label>
            {!isEditing && !revealed ? (
              <span className="text-sm text-text-secondary/30 italic">••••••••</span>
            ) : (
              <Input
                value={keys.contactPhone}
                onChange={(e) => setKeys(prev => ({ ...prev, contactPhone: e.target.value }))}
                disabled={!isEditing}
              />
            )}
          </div>
        </div>
      </motion.div>

      {/* ZONE 3 : EMPLACEMENT PRÉCIS */}
      <motion.div variants={item} className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key size={16} className="text-accent" />
          <h3 className="font-semibold">Emplacement précis</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Emplacement précis</label>
            {!isEditing && !revealed ? (
              <span className="text-sm text-text-secondary/30 italic">••••••••</span>
            ) : (
              <Input
                value={keys.preciseLocation}
                onChange={(e) => setKeys(prev => ({ ...prev, preciseLocation: e.target.value }))}
                placeholder="Boîte à clés code 1234, Tiroir 3, bureau de Myriam"
                disabled={!isEditing}
              />
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Code / Digicode</label>
            {!isEditing && !revealed ? (
              <span className="text-sm text-text-secondary/30 italic">••••••••</span>
            ) : (
              <div className="relative">
                <input
                  type={showCode ? 'text' : 'password'}
                  value={keys.code}
                  onChange={(e) => setKeys(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="1234"
                  disabled={!isEditing}
                  className="w-full h-9 pl-3 pr-9 py-2 text-sm rounded-lg border border-border bg-card text-text placeholder:text-text-secondary/30 focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text transition-colors"
                >
                  {showCode ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ZONE 4 : INSTRUCTIONS */}
      <motion.div variants={item} className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Key size={16} className="text-accent" />
          <h3 className="font-semibold">Instructions</h3>
        </div>
        {!isEditing && !revealed ? (
          <p className="text-sm text-text-secondary/30 italic py-2">••••••••</p>
        ) : (
          <Textarea
            value={keys.instructions}
            onChange={(e) => setKeys(prev => ({ ...prev, instructions: e.target.value }))}
            placeholder="Sonner à l'interphone, demander Monsieur Dupont"
            rows={3}
            disabled={!isEditing}
          />
        )}
      </motion.div>

      {/* HISTORIQUE DES MOUVEMENTS */}
      <motion.div variants={item} className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-accent" />
          <h3 className="font-semibold">Historique des mouvements</h3>
        </div>

        {/* Add movement */}
        {isEditing && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4 p-3 rounded-lg bg-background/50 border border-border/30">
            <input
              type="datetime-local"
              value={newMovement.date}
              onChange={(e) => setNewMovement({ ...newMovement, date: e.target.value })}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all"
            />
            <select
              value={newMovement.action}
              onChange={(e) => setNewMovement({ ...newMovement, action: e.target.value, person: '' })}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all"
            >
              {ACTION_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={newMovement.person}
              onChange={(e) => setNewMovement({ ...newMovement, person: e.target.value })}
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card text-text appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/15 focus:border-accent transition-all"
            >
              <option value="">Personne concernée</option>
              {PERSON_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addMovement}
              className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium rounded-lg bg-accent text-white hover:bg-accent/90 transition-all active:scale-[0.98] disabled:opacity-40"
              disabled={!newMovement.date || !newMovement.action || !newMovement.person}
            >
              <Plus size={14} /> Ajouter
            </button>
          </div>
        )}

        {/* History list */}
        {history.length === 0 ? (
          <p className="text-sm text-text-secondary/60 py-4 text-center">Aucun mouvement enregistré</p>
        ) : (
          <div className="divide-y divide-border/30">
            {history.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-3 text-sm">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-xs text-text-secondary/60 font-mono min-w-[140px]">
                    {new Date(entry.date).toLocaleDateString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  <span className="text-text font-medium">
                    {ACTION_OPTIONS.find(o => o.value === entry.action)?.label || entry.action}
                  </span>
                  <span className="text-text-secondary">
                    {PERSON_OPTIONS.find(o => o.value === entry.person)?.label || entry.person}
                  </span>
                  {entry.reason && (
                    <span className="text-text-secondary/60 text-xs">— {entry.reason}</span>
                  )}
                </div>
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setHistory(prev => prev.filter(h => h.id !== entry.id))}
                    className="text-text-secondary/40 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
