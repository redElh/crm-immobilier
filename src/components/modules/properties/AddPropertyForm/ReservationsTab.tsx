import { useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../../../../components/ui/Icon';
import { Button } from '../../../../components/ui/Button';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { MotionCard } from '../../../../components/ui/Card';
import { VoyageurFormModal } from '../../clients/VoyageurFormModal';
import { Client } from '../../../../types/client';

interface ReservationsTabProps {
  register: any;
  control: any;
  watch: any;
}

type ReservationStatus = 'option' | 'confirme' | 'annule' | 'occupe';

interface Reservation {
  id: string;
  voyageur: string;
  email: string;
  telephone: string;
  arrivee: string;
  depart: string;
  nuits: number;
  montant: number;
  status: ReservationStatus;
}

const statusConfig: Record<ReservationStatus, { label: string; color: string; bg: string }> = {
  option: { label: 'Option', color: 'text-amber-700', bg: 'bg-amber-100' },
  confirme: { label: 'Confirmé', color: 'text-green-700', bg: 'bg-green-100' },
  annule: { label: 'Annulé', color: 'text-red-700', bg: 'bg-red-100' },
  occupe: { label: 'Occupé', color: 'text-blue-700', bg: 'bg-blue-100' },
};

const MOCK_VOYAGEURS: { name: string; email: string; telephone: string }[] = [
  { name: 'Jean Dupont', email: 'jean.dupont@email.com', telephone: '+212 6 00 00 00 01' },
  { name: 'Marie Martin', email: 'marie.martin@email.com', telephone: '+212 6 00 00 00 02' },
  { name: 'Ahmed Benali', email: 'ahmed.benali@email.com', telephone: '+212 6 00 00 00 03' },
  { name: 'Sophie Laurent', email: 'sophie.laurent@email.com', telephone: '+212 6 00 00 00 04' },
  { name: 'Pierre Petit', email: 'pierre.petit@email.com', telephone: '+212 6 00 00 00 05' },
];

export function ReservationsTab({ register, control, watch }: ReservationsTabProps) {
  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: '1',
      voyageur: 'Jean Dupont',
      email: 'jean.dupont@email.com',
      telephone: '+212 6 00 00 00 01',
      arrivee: '2026-07-15',
      depart: '2026-07-22',
      nuits: 7,
      montant: 3500,
      status: 'confirme',
    },
    {
      id: '2',
      voyageur: 'Marie Martin',
      email: 'marie.martin@email.com',
      telephone: '+212 6 00 00 00 02',
      arrivee: '2026-08-01',
      depart: '2026-08-08',
      nuits: 7,
      montant: 4200,
      status: 'option',
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Reservation>>({});
  const [voyageurSearch, setVoyageurSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedVoyageur, setSelectedVoyageur] = useState<string | null>(null);
  const [showVoyageurModal, setShowVoyageurModal] = useState(false);

  const filteredVoyageurs = voyageurSearch.length > 0
    ? MOCK_VOYAGEURS.filter(v =>
        v.name.toLowerCase().includes(voyageurSearch.toLowerCase()) ||
        v.email.toLowerCase().includes(voyageurSearch.toLowerCase())
      )
    : [];

  const deleteReservation = (id: string) => {
    setReservations(prev => prev.filter(r => r.id !== id));
  };

  const changeStatus = (id: string, status: ReservationStatus) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const openNew = () => {
    setEditId(null);
    setForm({ voyageur: '', email: '', telephone: '', arrivee: '', depart: '', nuits: 1, montant: 0, status: 'option' });
    setVoyageurSearch('');
    setSelectedVoyageur(null);
    setShowForm(true);
  };

  const openEdit = (r: Reservation) => {
    setEditId(r.id);
    setForm({ ...r });
    setVoyageurSearch(r.voyageur);
    setSelectedVoyageur(r.voyageur);
    setShowForm(true);
  };

  const selectVoyageur = (v: { name: string; email: string; telephone: string }) => {
    setForm(f => ({ ...f, voyageur: v.name, email: v.email, telephone: v.telephone }));
    setVoyageurSearch(v.name);
    setSelectedVoyageur(v.name);
    setShowSuggestions(false);
  };

  const handleVoyageurSearchChange = (value: string) => {
    setVoyageurSearch(value);
    setForm(f => ({ ...f, voyageur: value }));
    setSelectedVoyageur(null);
    setShowSuggestions(true);
  };

  const handleVoyageurCreated = (client: Omit<Client, 'id'>) => {
    const newVoyageur = {
      name: client.name || `${client.attributPrincipal || ''}`.trim() || 'Nouveau voyageur',
      email: client.email || '',
      telephone: client.phone || '',
    };
    if (client.name) newVoyageur.name = client.name;
    if (client.email) newVoyageur.email = client.email;
    if (client.phone) newVoyageur.telephone = client.phone;
    selectVoyageur(newVoyageur);
    setShowVoyageurModal(false);
  };

  const saveReservation = () => {
    if (!form.voyageur || !form.arrivee || !form.depart) return;
    const nuits = form.nuits || Math.ceil((new Date(form.depart).getTime() - new Date(form.arrivee).getTime()) / (1000 * 60 * 60 * 24));
    const data: Reservation = {
      id: editId || Date.now().toString(),
      voyageur: form.voyageur || '',
      email: form.email || '',
      telephone: form.telephone || '',
      arrivee: form.arrivee || '',
      depart: form.depart || '',
      nuits,
      montant: form.montant || 0,
      status: (form.status as ReservationStatus) || 'option',
    };
    if (editId) {
      setReservations(prev => prev.map(r => r.id === editId ? data : r));
    } else {
      setReservations(prev => [...prev, data]);
    }
    setShowForm(false);
    setEditId(null);
  };

  const totalReservations = reservations.length;
  const totalRevenue = reservations.reduce((sum, r) => sum + (r.status !== 'annule' ? r.montant : 0), 0);

  return (
    <MotionCard
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-0 overflow-hidden"
    >
      <div className="px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-text">Réservations</h3>
            <p className="text-sm text-text-secondary mt-0.5">
              {totalReservations} réservation{totalReservations > 1 ? 's' : ''} · {totalRevenue.toLocaleString('fr-FR')} MAD
            </p>
          </div>
          <Button type="button" onClick={openNew}>
            <Icon name="plus" className="w-4 h-4" />
            Nouvelle réservation
          </Button>
        </div>

        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 rounded-lg bg-background/50 border border-border/30"
          >
            <h4 className="font-medium text-sm text-text mb-4">
              {editId ? 'Modifier la réservation' : 'Nouvelle réservation'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Voyageur</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
                      placeholder="Nom du voyageur"
                      value={voyageurSearch}
                      onChange={e => handleVoyageurSearchChange(e.target.value)}
                      onFocus={() => voyageurSearch.length > 0 && setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    />
                    {showSuggestions && filteredVoyageurs.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card rounded-lg border border-border/50 shadow-dropdown py-1 max-h-48 overflow-y-auto">
                        {filteredVoyageurs.map(v => (
                          <button
                            key={v.email}
                            type="button"
                            className="w-full px-3 py-2 text-sm text-left hover:bg-background transition-colors"
                            onMouseDown={() => selectVoyageur(v)}
                          >
                            <span className="font-medium text-text">{v.name}</span>
                            <span className="text-xs text-text-secondary block">{v.email}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {showSuggestions && voyageurSearch.length > 0 && filteredVoyageurs.length === 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card rounded-lg border border-border/50 shadow-dropdown py-3 px-3">
                        <p className="text-xs text-text-secondary mb-2">Aucun voyageur trouvé</p>
                        <button
                          type="button"
                          className="text-xs text-accent font-medium hover:underline"
                          onMouseDown={() => setShowVoyageurModal(true)}
                        >
                          Créer un nouveau voyageur
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center text-text-secondary hover:text-accent hover:border-accent transition-all shrink-0"
                    title="Créer un nouveau voyageur"
                    onClick={() => setShowVoyageurModal(true)}
                  >
                    <Icon name="plus" className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Email</label>
                <input
                  className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
                  placeholder="email@exemple.com"
                  value={form.email || ''}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Téléphone</label>
                <input
                  className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-text placeholder:text-text-secondary/40 focus:outline-none focus:border-accent transition-colors"
                  placeholder="+212 6 XX XX XX XX"
                  value={form.telephone || ''}
                  onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Statut</label>
                <select
                  className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  value={form.status || 'option'}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as ReservationStatus }))}
                >
                  <option value="option">Option</option>
                  <option value="confirme">Confirmé</option>
                  <option value="annule">Annulé</option>
                  <option value="occupe">Occupé</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Arrivée</label>
                <DatePicker
                  value={form.arrivee || ''}
                  onChange={e => setForm(f => ({ ...f, arrivee: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Départ</label>
                <DatePicker
                  value={form.depart || ''}
                  onChange={e => setForm(f => ({ ...f, depart: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Nuitées</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  value={form.nuits || 1}
                  onChange={e => setForm(f => ({ ...f, nuits: Number(e.target.value) }))}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">Montant (MAD)</label>
                <input
                  type="number"
                  className="w-full rounded-lg border border-border/60 bg-card px-3 py-2 text-sm text-text focus:outline-none focus:border-accent transition-colors"
                  value={form.montant || 0}
                  onChange={e => setForm(f => ({ ...f, montant: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <Button type="button" onClick={saveReservation}>
                {editId ? 'Mettre à jour' : 'Ajouter'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditId(null); }}>
                Annuler
              </Button>
            </div>
          </motion.div>
        )}

        <div className="overflow-x-auto rounded-lg border border-border/30">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-background/50">
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Voyageur</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Contact</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Arrivée</th>
                <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Départ</th>
                <th className="p-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Nuitées</th>
                <th className="p-3 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Montant</th>
                <th className="p-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Statut</th>
                <th className="p-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-text-secondary">
                    Aucune réservation pour le moment
                  </td>
                </tr>
              ) : (
                reservations.map(r => {
                  const cfg = statusConfig[r.status];
                  return (
                    <tr key={r.id} className="hover:bg-background/30 transition-colors">
                      <td className="p-3 font-medium text-text">{r.voyageur}</td>
                      <td className="p-3">
                        <div className="text-text">{r.email}</div>
                        <div className="text-xs text-text-secondary">{r.telephone}</div>
                      </td>
                      <td className="p-3 text-text">{r.arrivee}</td>
                      <td className="p-3 text-text">{r.depart}</td>
                      <td className="p-3 text-center text-text">{r.nuits}</td>
                      <td className="p-3 text-right text-text font-medium">{r.montant.toLocaleString('fr-FR')} MAD</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <select
                            className="text-xs rounded border border-border/30 bg-card px-1.5 py-1 text-text focus:outline-none"
                            value={r.status}
                            onChange={e => changeStatus(r.id, e.target.value as ReservationStatus)}
                          >
                            <option value="option">Option</option>
                            <option value="confirme">Confirmé</option>
                            <option value="annule">Annulé</option>
                            <option value="occupe">Occupé</option>
                          </select>
                          <button
                            type="button"
                            className="p-1 px-2 rounded hover:bg-background/50 text-xs text-text-secondary hover:text-text transition-colors"
                            onClick={() => openEdit(r)}
                            title="Modifier"
                          >
                            Éditer
                          </button>
                          <button
                            type="button"
                            className="p-1 rounded hover:bg-background/50 text-text-secondary hover:text-red-600 transition-colors"
                            onClick={() => deleteReservation(r.id)}
                            title="Supprimer"
                          >
                            <Icon name="trash-2" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {(['option', 'confirme', 'annule', 'occupe'] as ReservationStatus[]).map(s => {
            const count = reservations.filter(r => r.status === s).length;
            const cfg = statusConfig[s];
            return (
              <div key={s} className={`rounded-lg border border-border/30 p-4 ${cfg.bg}/30`}>
                <div className={`text-2xl font-bold ${cfg.color}`}>{count}</div>
                <div className="text-sm text-text-secondary mt-0.5">{cfg.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {showVoyageurModal && (
        <VoyageurFormModal
          onClose={() => setShowVoyageurModal(false)}
          onSubmit={handleVoyageurCreated}
        />
      )}
    </MotionCard>
  );
}
