import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Plus, Edit3, Trash2, Copy, Clock, Tag } from 'react-feather'
import { Button } from '../../../components/ui/Button'
import Card from '../../../components/ui/Card'
import { Badge } from '../../../components/ui/Badge'
import { mockTemplates } from '../../../types/messages'
import type { MessageTemplate } from '../../../types/messages'

const categoryColors: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'outline' | 'secondary'> = {
  'Visites': 'primary',
  'Propositions': 'success',
  'Suivi': 'warning',
  'Mandats': 'primary',
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Hier'
  if (days < 7) return d.toLocaleDateString('fr-FR', { weekday: 'long' })
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getSubjectPreview(subject: string): string {
  return subject.replace(/\{\{.*?\}\}/g, '...')
}

const availableVariables = [
  '{{client.prenom}}',
  '{{client.nom}}',
  '{{bien.titre}}',
  '{{bien.adresse}}',
  '{{agent.prenom}}',
  '{{agent.nom}}',
  '{{date_visite}}',
  '{{heure_visite}}',
]

export default function TemplatesPage() {
  const navigate = useNavigate()
  const [templates, setTemplates] = useState<MessageTemplate[]>(mockTemplates)

  const handleDelete = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent-light/30 flex items-center justify-center">
            <FileText size={18} className="text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">Modèles de messages</h1>
            <p className="text-sm text-text-secondary/70">
              {templates.length} modèle{templates.length !== 1 ? 's' : ''} disponible{templates.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button
          variant="default"
          icon={<Plus size={16} />}
          onClick={() => navigate('/messages/templates/new')}
        >
          Nouveau modèle
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <FileText size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-medium">Aucun modèle</p>
          <p className="text-xs text-text-secondary/60 mt-1">Créez votre premier modèle de message</p>
          <Button
            variant="default"
            icon={<Plus size={16} />}
            className="mt-4"
            onClick={() => navigate('/messages/templates/new')}
          >
            Créer un modèle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {templates.map(template => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-5 flex flex-col h-full">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-text truncate">{template.name}</h3>
                    <p className="text-xs text-text-secondary/60 mt-0.5 truncate">
                      {getSubjectPreview(template.subject)}
                    </p>
                  </div>
                  <Badge variant={categoryColors[template.category] || 'default'} size="sm">
                    {template.category}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-text-secondary/50 mt-auto mb-4">
                  <Clock size={12} />
                  <span>Mis à jour {formatDate(template.lastUpdated)}</span>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-border/30">
                  <button
                    onClick={() => navigate(`/messages/templates/${template.id}/edit`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text bg-background hover:bg-border/30 rounded-lg transition-colors"
                  >
                    <Edit3 size={13} />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-error bg-background hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                    Supprimer
                  </button>
                  <button
                    onClick={() => navigate(`/messages/compose?templateId=${template.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent bg-accent-light/20 hover:bg-accent-light/40 rounded-lg transition-colors ml-auto"
                  >
                    <Copy size={13} />
                    Utiliser
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Tag size={15} className="text-text-secondary/60" />
          <h3 className="text-sm font-semibold text-text">Variables disponibles</h3>
        </div>
        <p className="text-xs text-text-secondary/50 mb-3">
          Insérez ces variables dans le sujet ou le corps de vos modèles pour personnaliser les messages.
        </p>
        <div className="flex flex-wrap gap-2">
          {availableVariables.map(variable => (
            <code
              key={variable}
              className="px-2.5 py-1 text-xs font-mono bg-background border border-border/50 rounded-md text-accent"
            >
              {variable}
            </code>
          ))}
        </div>
      </Card>
    </div>
  )
}
