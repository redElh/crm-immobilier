import Card from '../../ui/Card'
import { InfoField } from '../../ui/InfoField'
import { Globe, Facebook, Instagram, Linkedin, Youtube, Camera, Film, FileText, Volume2 } from 'react-feather'

export default function PropertyMarketing({ property }: { property: any }) {
  const p = property

  const sections: { title: string; icon: React.ReactNode; fields: React.ReactNode[] }[] = []

  const linkFields: React.ReactNode[] = []
  if (p.marketingLinks) {
    const urlLabels: Record<string, [React.ReactNode, string]> = {
      website: [<Globe size={14} />, 'Site web'],
      facebook: [<Facebook size={14} />, 'Facebook'],
      instagram: [<Instagram size={14} />, 'Instagram'],
      linkedin: [<Linkedin size={14} />, 'LinkedIn'],
      youtube: [<Youtube size={14} />, 'YouTube'],
      virtualTour: [<Camera size={14} />, 'Visite virtuelle'],
    }
    Object.entries(p.marketingLinks).forEach(([key, url]) => {
      if (!url) return
      const [icon, label] = urlLabels[key] || [<Globe size={14} />, key]
      linkFields.push(
        <InfoField
          key={key}
          label={label}
          value={
            <a href={url as string} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block">
              {url as string}
            </a>
          }
          icon={icon}
        />
      )
    })
  }
  if (linkFields.length > 0) sections.push({ title: 'Liens & Réseaux', icon: <Globe size={15} />, fields: linkFields })

  const vidFields: React.ReactNode[] = []
  if (p.marketingVideos?.length > 0) {
    vidFields.push(
      <div key="videos" className="col-span-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {p.marketingVideos.map((url: string, i: number) => (
            <div key={i} className="rounded-lg border border-border/50 overflow-hidden">
              <video src={url} controls className="w-full aspect-video object-cover" />
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (p.marketingFiles?.length > 0) {
    vidFields.push(
      <div key="files">
        <p className="text-sm text-text-secondary">Documents:</p>
        <div className="flex flex-wrap gap-2 mt-1">
          {p.marketingFiles.map((url: string, i: number) => (
            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
              <FileText size={14} className="inline mr-1" />
              Fichier {i + 1}
            </a>
          ))}
        </div>
      </div>
    )
  }
  if (vidFields.length > 0) sections.push({ title: 'Médias & Documents', icon: <Film size={15} />, fields: vidFields })

  if (sections.length === 0) return <p className="text-center text-text-secondary py-8">Aucun contenu marketing renseigné</p>

  return (
    <div className="space-y-5">
      {sections.map(s => (
        <Card key={s.title} className="p-5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">{s.icon}{s.title}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{s.fields}</div>
        </Card>
      ))}
    </div>
  )
}