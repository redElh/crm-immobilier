import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, ChevronRight, ChevronDown, User, Phone, Mail, DollarSign, Trash2, Clock } from 'react-feather';
import { Prospect } from '../../../types/prospect';
import { fetchQualifiedProspects, updateProspectStatus } from '../../../services/prospectService';
import { getQualifiedCountdown } from '../../../utils/qualifiedCountdown';
import { useToast } from '../../ui/Toast';

interface QualificationPocketProps {
  onConvert: (prospect: Prospect) => void;
  refreshTrigger?: number;
  onStatusReverted?: (prospect: Prospect) => void;
  offset?: boolean;
  canWrite?: boolean;
}

export const QualificationPocket = ({ onConvert, refreshTrigger, onStatusReverted, offset, canWrite = true }: QualificationPocketProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [qualified, setQualified] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadQualified = async () => {
    try {
      setLoading(true);
      const data = await fetchQualifiedProspects();
      setQualified(data);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQualified();
  }, [refreshTrigger]);

  const handleRemoveFromPocket = async (prospect: Prospect) => {
    const previousStatus = (prospect.qualificationData as Record<string, unknown>)?.previousStatus as Prospect['status'] | undefined;
    const revertTo = previousStatus || 'Contacté';
    try {
      const updated = await updateProspectStatus(prospect.id, revertTo);
      setQualified(prev => prev.filter(p => p.id !== prospect.id));
      onStatusReverted?.(updated);
      toast('success', `Prospect retourné au statut "${revertTo}"`);
    } catch {
      toast('error', 'Erreur lors du retrait');
    }
  };

  if (qualified.length === 0 && !isOpen) return null;

  return (
    <div className={`fixed right-6 z-40 ${offset ? 'bottom-24' : 'bottom-6'}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 bg-card rounded-xl border border-border/60 shadow-modal overflow-hidden mb-2"
          >
            <div className="px-4 py-3 border-b border-border/40 bg-emerald-50/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Award size={14} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold">Poche de qualification</h3>
                    <p className="text-[10px] text-text-secondary/60">{qualified.length} prospect{qualified.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-6 h-6 rounded-lg flex items-center justify-center text-text-secondary hover:text-text hover:bg-background transition-all"
                >
                  <ChevronDown size={14} />
                </button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-accent border-t-transparent" />
                </div>
              ) : qualified.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Award size={24} className="text-text-secondary/20 mx-auto mb-2" />
                  <p className="text-xs text-text-secondary">Aucun prospect qualifié</p>
                </div>
              ) : (
                qualified.map(prospect => (
                  <div
                    key={prospect.id}
                    className="px-4 py-3 border-b border-border/20 hover:bg-background/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                          <User size={12} className="text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{prospect.civility} {prospect.firstName} {prospect.lastName}</p>
                          <div className="flex items-center gap-1.5">
                            <p className="text-[10px] text-text-secondary/60 truncate">{prospect.origin}</p>
                            {(() => {
                              const cd = getQualifiedCountdown(prospect.qualifiedAt);
                              if (!cd) return null;
                              const colors = {
                                safe: 'text-emerald-600',
                                warning: 'text-amber-600',
                                critical: 'text-red-600',
                                expired: 'text-red-700',
                              };
                              return (
                                <span className={`inline-flex items-center gap-0.5 text-[9px] font-semibold ${colors[cd.urgency]}`}>
                                  <Clock size={8} />
                                  {cd.label}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canWrite && (
                          <button
                            onClick={() => handleRemoveFromPocket(prospect)}
                            className="w-5 h-5 rounded flex items-center justify-center text-text-secondary/40 hover:text-error hover:bg-error/5 transition-all"
                            title="Retirer"
                          >
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-[10px] text-text-secondary/60 mb-2">
                      {prospect.phone && (
                        <span className="flex items-center gap-1"><Phone size={9} />{prospect.phone}</span>
                      )}
                      {prospect.email && (
                        <span className="flex items-center gap-1 truncate"><Mail size={9} />{prospect.email}</span>
                      )}
                    </div>

                    {prospect.maxPrice && (
                      <div className="flex items-center gap-1 text-[10px] text-text-secondary/60 mb-2">
                        <DollarSign size={9} />
                        {prospect.maxPrice.toLocaleString()} {prospect.currency || 'MAD'}
                      </div>
                    )}

                    {canWrite ? (
                      <button
                        onClick={() => onConvert(prospect)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-[11px] font-medium hover:bg-accent/90 transition-all"
                      >
                        Convertir en contact
                        <ChevronRight size={12} />
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-center px-3 py-1.5 rounded-lg bg-border/30 text-text-secondary/60 text-[11px] font-medium">
                        Consultation seule
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 ${
          qualified.length > 0
            ? 'bg-accent text-white ring-4 ring-accent/20'
            : 'bg-card border border-border/60 text-text-secondary'
        }`}
      >
        <div className="relative">
          <Award size={20} />
          {qualified.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-accent rounded-full flex items-center justify-center text-[9px] font-bold">
              {qualified.length}
            </span>
          )}
        </div>
      </button>
    </div>
  );
};
