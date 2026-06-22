import { motion, AnimatePresence } from 'framer-motion'
import Card from '../../components/ui/Card'
import { NavLink } from 'react-router-dom'
import { User, Mail, Bell, Paperclip, Download, HelpCircle, ArrowRight } from 'react-feather'

const settingsCategories = [
  { title: "Mon Compte", description: "Profil, sécurité et préférences", icon: User, to: "/settings/compte/profil" },
  { title: "Communication", description: "Signature email, réponses automatiques", icon: Mail, to: "/settings/communication/signature" },
  { title: "Notifications", description: "Configurez vos préférences de notification", icon: Bell, to: "/settings/notifications" },
  { title: "Intégrations", description: "Google Calendar, API", icon: Paperclip, to: "/settings/integrations" },
  { title: "Données", description: "Import, export et sauvegarde", icon: Download, to: "/settings/donnees" },
  { title: "Aide & Support", description: "Centre d'aide, support et à propos", icon: HelpCircle, to: "/settings/aide" },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
        <p className="text-sm text-text-secondary mt-1">Personnalisez votre expérience CRM</p>
      </div>

      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {settingsCategories.map((category) => {
            const Icon = category.icon
            return (
              <motion.div key={category.title} variants={itemVariants} layout>
                <Card className="hover:shadow-card-hover transition-all duration-200 group">
                  <NavLink to={category.to} className="block p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-2.5 rounded-lg bg-accent-light text-accent">
                        <Icon size={18} />
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm">{category.title}</h3>
                    <p className="text-xs text-text-secondary mt-1">{category.description}</p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-accent">
                      <span>Configurer</span>
                      <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </NavLink>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      <div className="flex items-center gap-3 py-4">
        <div className="flex-1 h-px bg-border/50" />
        <p className="text-xs text-text-secondary/60 whitespace-nowrap">CRM Immobilier - Version 1.0.0</p>
        <div className="flex-1 h-px bg-border/50" />
      </div>
    </div>
  )
}
