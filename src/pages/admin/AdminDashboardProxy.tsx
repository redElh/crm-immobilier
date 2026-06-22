import { motion } from 'framer-motion'
import { Badge } from '../../components/ui/Badge'
import { Shield, ArrowRight } from 'react-feather'

export default function AdminDashboardProxy() {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Shield size={20} className="text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Vue administrateur</h1>
          <p className="text-sm text-text-secondary mt-1">Ceci est la vue administrateur de la même page</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Utilisateurs', desc: 'Gérer les comptes', to: '/admin/users', color: 'bg-amber-50 text-amber-600' },
          { label: 'Dashboard', desc: 'Voir les statistiques', to: '/admin/dashboard', color: 'bg-accent-light text-accent' },
          { label: 'Paramètres', desc: 'Configuration système', to: '/admin/settings', color: 'bg-violet-50 text-violet-600' },
        ].map((item) => (
          <a
            key={item.to}
            href={item.to}
            className="p-5 rounded-xl border border-border/50 bg-card hover:shadow-card-hover transition-all group"
          >
            <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center mb-3`}>
              <Shield size={18} />
            </div>
            <h3 className="font-semibold text-sm">{item.label}</h3>
            <p className="text-xs text-text-secondary mt-1">{item.desc}</p>
            <div className="mt-3 flex items-center gap-1 text-sm font-medium text-accent">
              <span>Accéder</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </a>
        ))}
      </div>
    </motion.div>
  )
}
