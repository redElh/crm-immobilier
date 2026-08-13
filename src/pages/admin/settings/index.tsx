import { motion, AnimatePresence } from 'framer-motion'
import Card from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { NavLink, useParams } from 'react-router-dom'
import { Settings, User, Mail, Bell, Paperclip, Users, Download, HelpCircle, ArrowRight } from 'react-feather'

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

export default function AdminSettingsPage() {
  const { adminId } = useParams<{ adminId: string }>()

  const settingsCategories = [
    { title: "Mon Compte", description: "Profil, sécurité et préférences", icon: User, to: `/admin/${adminId}/settings/compte/profil` },
    { title: "Communication", description: "Signature email, réponses automatiques", icon: Mail, to: `/admin/${adminId}/settings/communication/signature` },
    { title: "Notifications", description: "Configurez vos préférences de notification", icon: Bell, to: `/admin/${adminId}/settings/notifications` },
    { title: "Intégrations", description: "Google Calendar, API", icon: Paperclip, to: `/admin/${adminId}/settings/integrations` },
    { title: "Équipe", description: "Gestion des membres et permissions", icon: Users, to: `/admin/${adminId}/settings/equipe`, badge: "Admin" },
    { title: "Données", description: "Import, export et sauvegarde", icon: Download, to: `/admin/${adminId}/settings/donnees` },
    { title: "Aide & Support", description: "Centre d'aide, support et à propos", icon: HelpCircle, to: `/admin/${adminId}/settings/aide` },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <Settings size={20} className="text-amber-700" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Paramètres</h1>
          <p className="text-sm text-text-secondary mt-1">Personnalisez votre expérience CRM</p>
        </div>
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
                      <div className="p-2.5 rounded-lg bg-amber-100 text-amber-700">
                        <Icon size={18} />
                      </div>
                      {category.badge && (
                        <Badge variant="secondary" size="sm">{category.badge}</Badge>
                      )}
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
