import Card from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'
import { BackLink } from '../../../components/ui/BackLink'
import { BookOpen, Video, HelpCircle, Mail, Phone, ChevronRight } from 'react-feather'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'

const helpItems = [
  { icon: BookOpen, title: 'Documentation CRM', description: 'Consultez notre documentation complète' },
  { icon: Video, title: 'Tutoriels vidéos', description: 'Accédez aux tutoriels vidéo' },
  { icon: HelpCircle, title: 'FAQ', description: 'Questions fréquemment posées' },
]

export default function AidePage() {
  const navigate = useNavigate()
  const location = useLocation()
  const settingsPrefix = location.pathname.startsWith('/admin')
    ? `/admin/${location.pathname.split('/')[2]}/settings`
    : '/settings'

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <BackLink />
      <h1 className="text-2xl font-semibold tracking-tight">Aide & Support</h1>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <BookOpen size={18} />
          </div>
          <h3 className="font-semibold">Centre d'aide</h3>
        </div>

        <div className="divide-y divide-border/30">
          {helpItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.title}
                className="flex items-center gap-4 py-4 w-full text-left hover:opacity-80 transition-opacity group"
              >
                <div className="p-2 rounded-lg bg-background text-text-secondary shrink-0">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{item.description}</p>
                </div>
                <ChevronRight size={16} className="text-text-secondary group-hover:translate-x-0.5 transition-transform shrink-0" />
              </button>
            )
          })}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <Mail size={18} />
          </div>
          <h3 className="font-semibold">Contacter le support</h3>
        </div>

        <Button variant="default" className="w-full mb-5" icon={<Mail size={14} />}>
          Envoyer un message au support
        </Button>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/30">
            <div className="p-2 rounded-lg bg-accent-light text-accent">
              <Mail size={14} />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Email</p>
              <p className="text-sm font-medium">support@squaremeter.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border/30">
            <div className="p-2 rounded-lg bg-accent-light text-accent">
              <Phone size={14} />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Téléphone</p>
              <p className="text-sm font-medium">+212 5 22 12 34 56</p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-lg bg-accent-light text-accent">
            <HelpCircle size={18} />
          </div>
          <h3 className="font-semibold">À propos</h3>
        </div>

        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium">CRM Immobilier — Version 1.0.0</p>
          <p className="text-xs text-text-secondary">© 2026 Square Meter. Tous droits réservés.</p>
        </div>

        <div className="flex gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(`${settingsPrefix}/terms`)}>Conditions d'utilisation</Button>
          <Button variant="ghost" size="sm" onClick={() => navigate(`${settingsPrefix}/privacy`)}>Politique de confidentialité</Button>
        </div>
      </Card>
    </motion.div>
  )
}
