import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../../../components/ui/Icon';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { MotionCard } from '../../../../components/ui/Card';
import { VoyageurFormModal } from '../../clients/VoyageurFormModal';
import { Client } from '../../../../types/client';
import { fetchReservations } from '../../../../services/reservationService';

interface ReservationsTabProps {
  register?: any;
  control?: any;
  watch?: any;
  propertyId?: string | null;
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

const statusLabels: Record<ReservationStatus, string> = {
  option: 'Option',
  confirme: 'Confirmé',
  annule: 'Annulé',
  occupe: 'Occupé',
};

const statusColors: Record<ReservationStatus, string> = {
  option: 'bg-amber-100 text-amber-700',
  confirme: 'bg-emerald-100 text-emerald-700',
  annule: 'bg-red-100 text-red-700',
  occupe: 'bg-blue-100 text-blue-700',
};

const statusDotColors: Record<ReservationStatus, string> = {
  option: 'bg-amber-500',
  confirme: 'bg-emerald-500',
  annule: 'bg-red-400',
  occupe: 'bg-blue-500',
};

const MOCK_VOYAGEURS: { name: string; email: string; telephone: string }[] = [
  { name: 'Jean Dupont', email: 'jean.dupont@email.com', telephone: '+212 6 00 00 00 01' },
  { name: 'Marie Martin', email: 'marie.martin@email.com', telephone: '+212 6 00 00 00 02' },
  { name: 'Ahmed Benali', email: 'ahmed.benali@email.com', telephone: '+212 6 00 00 00 03' },
  { name: 'Sophie Laurent', email: 'sophie.laurent@email.com', telephone: '+212 6 00 00 00 04' },
  { name: 'Pierre Petit', email: 'pierre.petit@email.com', telephone: '+212 6 00 00 00 05' },
];

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function ReservationsTab({ register, control, watch, propertyId }: ReservationsTabProps) {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    if (propertyId) {
      fetchReservations({ property_id: String(propertyId) })
        .then(data => {
          if (!Array.isArray(data)) { setReservations([]); return; }
          setReservations(data.map((r: any) => ({
            id: r.id,
            voyageur: r.clientName || '',
            email: r.email || '',
            telephone: r.phone || '',
            arrivee: r.startDate || '',
            depart: r.endDate || '',
            nuits: r.nights || 0,
            montant: r.grandTotal || 0,
            status: r.status === 'confirmed' ? 'confirme' : r.status === 'cancelled' ? 'annule' : r.status === 'occupied' ? 'occupe' : 'option',
          })));
        })
        .catch(() => {});
    }
  }, [propertyId]);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Reservation>>({});
  const [voyageurSearch, setVoyageurSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedVoyageur, setSelectedVoyageur] = useState<string | null>(null);
  const [showVoyageurModal, setShowVoyageurModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredVoyageurs = voyageurSearch.length > 0
    ? MOCK_VOYAGEURS.filter(v =>
        v.name.toLowerCase().includes(voyageurSearch.toLowerCase()) ||
        v.email.toLowerCase().includes(voyageurSearch.toLowerCase())
      )
    : [];

  const deleteReservation = (id: string) => {
    setReservations(prev => prev.filter(r => r.id !== id));
    setOpenMenuId(null);
  };

  const changeStatus = (id: string, status: ReservationStatus) => {
    setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    setOpenMenuId(null);
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
    setOpenMenuId(null);
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

        <div className="space-y-1.5">
          {reservations.length === 0 ? (
            <p className="text-sm text-text-secondary text-center py-6">
              Aucune réservation pour le moment
            </p>
          ) : (
            reservations.map(r => (
              <div
                key={r.id}
                className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-background cursor-pointer hover:bg-border/30 transition-colors"
                onClick={() => openEdit(r)}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${statusDotColors[r.status]}`} />
                  <div>
                    <span className="font-medium text-text">{r.voyageur}</span>
                    <span className="text-xs text-text-secondary ml-2">{r.email}</span>
                    {r.telephone && <span className="text-xs text-text-secondary ml-2">{r.telephone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-secondary">
                    {formatDateShort(r.arrivee)} → {formatDateShort(r.depart)} · {r.nuits} nuits
                  </span>
                  <span className="text-xs font-medium text-text">{r.montant.toLocaleString('fr-FR')} MAD</span>
                  <Badge className={statusColors[r.status]} size="sm">{statusLabels[r.status]}</Badge>
                  <div className="relative">
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-background/60 text-text-secondary hover:text-text transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === r.id ? null : r.id);
                      }}
                    >
                      <Icon name="more-vertical" className="w-4 h-4" />
                    </button>
                    <AnimatePresence>
                      {openMenuId === r.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="absolute z-30 right-0 top-full mt-1 w-40 bg-card rounded-lg border border-border/50 shadow-dropdown py-1"
                        >
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-sm text-left hover:bg-background transition-colors"
                            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                          >
                            Modifier
                          </button>
                          <div className="px-3 py-1.5 text-[10px] font-medium text-text-secondary/60 uppercase tracking-wider">Changer le statut</div>
                          {(['option', 'confirme', 'annule', 'occupe'] as ReservationStatus[]).filter(s => s !== r.status).map(s => (
                            <button
                              key={s}
                              type="button"
                              className="w-full px-3 py-1.5 text-sm text-left hover:bg-background transition-colors flex items-center gap-2"
                              onClick={(e) => { e.stopPropagation(); changeStatus(r.id, s); }}
                            >
                              <span className={`w-2 h-2 rounded-full ${statusDotColors[s]}`} />
                              {statusLabels[s]}
                            </button>
                          ))}
                          <div className="border-t border-border/30 my-1" />
                          <button
                            type="button"
                            className="w-full px-3 py-2 text-sm text-left hover:bg-background transition-colors text-red-600"
                            onClick={(e) => { e.stopPropagation(); deleteReservation(r.id); }}
                          >
                            Supprimer
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {(['option', 'confirme', 'annule', 'occupe'] as ReservationStatus[]).map(s => {
            const count = reservations.filter(r => r.status === s).length;
            const cfg = statusColors[s];
            return (
              <div key={s} className={`rounded-lg border border-border/30 p-4 ${cfg}/30`}>
                <div className="text-2xl font-bold" style={{ color: statusDotColors[s].replace('bg-', '') }}>{count}</div>
                <div className="text-sm text-text-secondary mt-0.5">{statusLabels[s]}</div>
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
