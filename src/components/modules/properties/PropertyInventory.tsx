import { useMemo, useState, useCallback, useRef, useEffect } from 'react'
import Card from '../../ui/Card'
import { Button } from '../../ui/Button'
import { List, Star, Home, Grid as GridIcon, Coffee, Moon, PenTool, User, Users, CheckCircle, Clock, FileText, Mail, Phone, MapPin, Briefcase, Eye, Download, Send, RefreshCw, X, Printer } from 'react-feather'

const CONDITION_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  good: { label: 'Bon état', color: 'text-green-700', bg: 'bg-green-50' },
  average: { label: 'État moyen', color: 'text-amber-700', bg: 'bg-amber-50' },
  bad: { label: 'Mauvais état', color: 'text-red-700', bg: 'bg-red-50' },
  absent: { label: 'Absent', color: 'text-gray-500', bg: 'bg-gray-50' },
}

const SALON_ITEMS = ['Canapé', 'Fauteuils', 'Table basse', 'Table à manger', 'Vaisselier', 'Meuble Télé', 'Buffet', 'Télévision', 'Décoration', 'Lampes']
const SDB_ITEMS = ['Meuble rangement', 'Porte-serviettes', 'Panier à linge', 'Miroir', 'Sèche-cheveux', 'Drops de bain', 'Serviettes de toilett']
const CHAMBRE_ITEMS = ['Lit double', 'Table chevet', 'Commode', 'Portant à vêtements', 'Fauteuil', 'Miroir', 'Lampes', 'Décoration', 'Couette & Oreillers', 'Linge de lit']
const CUISINE_ITEMS = ['Plaque cuisson Induction', 'Four', 'Micro-onde', 'Réfrigérateur', 'Congélateur', 'Hotte', 'Cafetière', 'Machine à café', 'Table', 'Chaises', 'Poubelle', 'Vaisselle', 'Couverts', 'Ustensiles & Plats', 'Poêles & Casseroles', 'Carafe', 'Linge de maison']

function itemId(itemName: string): string {
  return itemName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[ &]/g, '_')
}

function getRoomIcon(roomName: string) {
  if (roomName.startsWith('salon')) return <Home size={15} />
  if (roomName.startsWith('sdb')) return <GridIcon size={15} />
  if (roomName.startsWith('chambre')) return <Moon size={15} />
  if (roomName.startsWith('cuisine')) return <Coffee size={15} />
  return <List size={15} />
}

export default function PropertyInventory({ property, isGerant = false }: { property: any; isGerant?: boolean }) {
  const [showDocumentPreview, setShowDocumentPreview] = useState(false)
  const printStyleRef = useRef<HTMLStyleElement | null>(null)
  const documentContentRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (showDocumentPreview) {
      const style = document.createElement('style');
      style.id = 'inventory-print-styles';
      style.textContent = `
        @media print {
          body > *:not(#inventory-document-preview) { display: none !important; }
          #inventory-document-preview { position: fixed !important; top: 0 !important; left: 0 !important; width: 100% !important; height: 100% !important; z-index: 9999 !important; background: white !important; }
          #inventory-document-preview .print-toolbar { display: none !important; }
          #inventory-document-preview .print-scroll { overflow: visible !important; }
          #inventory-document-preview .print-card { box-shadow: none !important; border-radius: 0 !important; margin: 0 !important; max-width: 100% !important; }
          #inventory-document-preview .print-padding { padding: 20px 30px !important; }
        }
      `;
      document.head.appendChild(style);
      printStyleRef.current = style;
    } else {
      if (printStyleRef.current) {
        printStyleRef.current.remove();
        printStyleRef.current = null;
      }
    }
    return () => {
      if (printStyleRef.current) {
        printStyleRef.current.remove();
        printStyleRef.current = null;
      }
    };
  }, [showDocumentPreview]);

  const isVacation = property?.propertyType === 'vacation'
  const personLabel = isVacation ? 'Voyageur' : 'Locataire'

  const inventory = property?.inventory || {}
  const livingCount = Math.max(0, parseInt(property?.livingRoom_count) || 0)
  const bathroomCount = Math.max(0, parseInt(property?.bathroom_count) || 0)
  const bedroomCount = Math.max(0, parseInt(property?.bedrooms_total) || 0)
  const kitchenCount = Math.max(0, parseInt(property?.kitchen?.count) || 0)

  const rooms = useMemo(() => [
    ...Array.from({ length: livingCount }, (_, i) => ({
      name: `salon_${i + 1}`, label: `Salon${livingCount > 1 ? ` ${i + 1}` : ''}`, items: SALON_ITEMS,
    })),
    ...Array.from({ length: bathroomCount }, (_, i) => ({
      name: `sdb_${i + 1}`, label: `SDB${bathroomCount > 1 ? ` ${i + 1}` : ''}`, items: SDB_ITEMS,
    })),
    ...Array.from({ length: bedroomCount }, (_, i) => ({
      name: `chambre_${i + 1}`, label: `Chambre ${i + 1}`, items: CHAMBRE_ITEMS,
    })),
    ...Array.from({ length: kitchenCount }, (_, i) => ({
      name: `cuisine_${i + 1}`, label: `Cuisine${kitchenCount > 1 ? ` ${i + 1}` : ''}`, items: CUISINE_ITEMS,
    })),
  ], [livingCount, bathroomCount, bedroomCount, kitchenCount])

  const stats = useMemo(() => {
    let total = 0, filled = 0
    rooms.forEach(room => {
      room.items.forEach(item => {
        total++
        const data = inventory[room.name]?.[itemId(item)]
        if (data?.quantity || data?.condition || data?.comments) filled++
      })
    })
    return { total, filled }
  }, [rooms, inventory])

  const CONDITION_LABELS: Record<string, string> = { good: 'Bon état', average: 'État moyen', bad: 'Mauvais état', absent: 'Absent' }

  const buildDocumentHtml = useCallback(() => {
    const sig = property?.inventorySignature || {}
    const selectedLocataire = sig.selectedLocataire || null
    const ownerType = property?.ownerType || 'particulier'
    const ownerFirstName = property?.owner_firstName || property?.owner?.firstName || ''
    const ownerLastName = property?.owner_lastName || property?.owner?.lastName || ''
    const ownerName = ownerType === 'particulier'
      ? [ownerFirstName, ownerLastName].filter(Boolean).join(' ') || 'Non renseigné'
      : ''
    const companyName = property?.owner_companyName || property?.owner?.companyName || ''
    const ownerAddress = property?.owner_address || property?.owner?.address || ''
    const ownerPhone = property?.owner_phone || property?.owner?.phone || ''
    const ownerEmail = property?.owner_email || property?.owner?.email || ''
    const companySiren = property?.owner_companySiren || property?.owner?.companySiren || ''
    const companyAddress = property?.owner_companyAddress || property?.owner?.companyAddress || ''
    const propertyTitle = property?.title || ''
    const propertyAddress = property?.address || ''
    const propertyCity = property?.city || ''
    const now = new Date()
    const dateStr = now.toLocaleDateString('fr-FR')
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

    const ownerInfo = ownerType === 'particulier'
      ? [ownerAddress, ownerPhone, ownerEmail].filter(Boolean).join(' · ')
      : [companyAddress, companySiren].filter(Boolean).join(' · ')

    const roomRows = rooms.map(room => {
      const roomItems = room.items
      const filledItems = roomItems.filter(item => {
        const data = inventory[room.name]?.[itemId(item)]
        return data?.quantity || data?.condition || data?.comments
      })
      const displayItems = filledItems.length > 0 ? filledItems : roomItems

      const itemRows = displayItems.map(item => {
        const data = inventory[room.name]?.[itemId(item)] || {}
        let conditionBadge = '<span style="color:#6b7280">—</span>'
        if (data.condition === 'good') conditionBadge = '<span style="display:inline-flex;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:#ecfdf5;color:#047857">Bon</span>'
        else if (data.condition === 'average') conditionBadge = '<span style="display:inline-flex;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:#fffbeb;color:#b45309">Moyen</span>'
        else if (data.condition === 'bad') conditionBadge = '<span style="display:inline-flex;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:#fef2f2;color:#b91c1c">Mauvais</span>'
        else if (data.condition === 'absent') conditionBadge = '<span style="display:inline-flex;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:#f9fafb;color:#6b7280">Absent</span>'

        return `<tr>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:500;font-size:12px">${item}</td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;font-size:12px">${data.quantity || '—'}</td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;font-size:12px">${conditionBadge}</td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px;color:#6b7280">${data.comments || 'Rien à signaler'}</td>
        </tr>`
      }).join('')

      return `<div style="margin-bottom:24px">
        <h3 style="font-size:15px;font-weight:700;margin:0 0 8px 0;color:#1f2937">${room.label}
          <span style="font-size:12px;font-weight:400;color:#6b7280;margin-left:8px">(${displayItems.length} élément${displayItems.length > 1 ? 's' : ''})</span>
        </h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
          <thead>
            <tr style="background:#f9fafb">
              <th style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Élément</th>
              <th style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;width:80px">Quantité</th>
              <th style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em;width:120px">Condition</th>
              <th style="padding:6px 10px;border-bottom:1px solid #e5e7eb;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">Notes</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>`
    }).join('')

    const addressLine = [propertyAddress, propertyCity].filter(Boolean).join(', ') || '—'

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Inventaire - ${propertyTitle || 'Document'}</title>
  <style>
    body { margin:0; padding:0; font-family:system-ui,-apple-system,sans-serif; color:#1f2937; }
    @page { margin:15mm; }
  </style>
</head>
<body>
  <div style="padding:20px 30px;border-bottom:2px solid rgba(99,102,241,0.2);background:linear-gradient(135deg,rgba(99,102,241,0.05),transparent)">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
      <div style="padding:8px;border-radius:8px;background:rgba(99,102,241,0.1)">
        <span style="font-size:20px">🏠</span>
      </div>
      <div>
        <h1 style="font-size:18px;font-weight:700;margin:0;letter-spacing:-0.025em">SQUARE METER</h1>
        <p style="font-size:10px;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase;margin:0">Immobilier</p>
      </div>
    </div>
    <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb">
      <h2 style="font-size:20px;font-weight:700;margin:0">Inventaire du bien</h2>
    </div>
  </div>
  <div style="padding:16px 30px;background:#f9fafb;border-bottom:1px solid #e5e7eb">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
      <div><span style="color:#6b7280">Bien :</span> <span style="font-weight:500;margin-left:8px">${propertyTitle || '—'}</span></div>
      <div><span style="color:#6b7280">Date :</span> <span style="font-weight:500;margin-left:8px">${dateStr}</span></div>
      <div style="grid-column:1/-1"><span style="color:#6b7280">Adresse :</span> <span style="font-weight:500;margin-left:8px">${addressLine}</span></div>
    </div>
  </div>
  <div style="padding:20px 30px">
    ${roomRows || '<p style="text-align:center;color:#6b7280;padding:40px 0">Aucune pièce à inventorier</p>'}
  </div>
  <div style="padding:20px 30px;border-top:2px solid rgba(99,102,241,0.2);background:linear-gradient(135deg,rgba(99,102,241,0.05),transparent)">
    <h3 style="font-size:15px;font-weight:700;margin:0 0 16px 0">Signatures</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
      <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;background:white">
        <h4 style="font-weight:600;font-size:13px;margin:0 0 12px 0">Propriétaire</h4>
        <p style="font-weight:500;font-size:13px;margin:0 0 4px 0">${ownerName}</p>
        <p style="font-size:12px;color:#6b7280;margin:0">${ownerInfo || '—'}</p>
        <div style="margin-top:16px;padding-top:12px;border-top:1px dashed #d1d5db">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px">
            <div><p style="font-size:11px;color:#6b7280;margin:0 0 4px 0">Signature</p><div style="height:32px;border-bottom:1px solid #d1d5db"></div></div>
            <div><p style="font-size:11px;color:#6b7280;margin:0 0 4px 0">Lieu</p><div style="height:32px;border-bottom:1px solid #d1d5db"></div></div>
            <div style="grid-column:1/-1"><p style="font-size:11px;color:#6b7280;margin:0 0 4px 0">Date</p><div style="height:32px;border-bottom:1px solid #d1d5db"></div></div>
          </div>
        </div>
      </div>
      <div style="padding:16px;border:1px solid #e5e7eb;border-radius:8px;background:white">
        <h4 style="font-weight:600;font-size:13px;margin:0 0 12px 0">${personLabel}</h4>
        <p style="font-weight:500;font-size:13px;margin:0 0 4px 0">${selectedLocataire?.name || '—'}</p>
        <p style="font-size:12px;color:#6b7280;margin:0">${selectedLocataire ? [selectedLocataire.address, selectedLocataire.email, selectedLocataire.phone].filter(Boolean).join(' · ') : 'Non sélectionné'}</p>
        <div style="margin-top:16px;padding-top:12px;border-top:1px dashed #d1d5db">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px">
            <div><p style="font-size:11px;color:#6b7280;margin:0 0 4px 0">Signature</p><div style="height:32px;border-bottom:1px solid #d1d5db"></div></div>
            <div><p style="font-size:11px;color:#6b7280;margin:0 0 4px 0">Lieu</p><div style="height:32px;border-bottom:1px solid #d1d5db"></div></div>
            <div style="grid-column:1/-1"><p style="font-size:11px;color:#6b7280;margin:0 0 4px 0">Date</p><div style="height:32px;border-bottom:1px solid #d1d5db"></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div style="padding:8px 30px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
    <p style="font-size:11px;margin:0;color:#6b7280">Document généré le ${dateStr} à ${timeStr}</p>
  </div>
</body>
</html>`
  }, [property, rooms, inventory])

  const handleDownloadPdf = useCallback(() => {
    const html = buildDocumentHtml()
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => { win.print() }, 500)
    }
  }, [buildDocumentHtml])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12">
        <List size={32} className="mx-auto text-text-secondary/20 mb-3" />
        <p className="text-sm font-medium text-text-secondary">Aucune pièce renseignée</p>
        <p className="text-xs text-text-secondary/60 mt-1">
          Renseignez le nombre de pièces dans l'onglet Intérieur pour générer l'inventaire
        </p>
      </div>
    )
  }

  if (stats.filled === 0) {
    return (
      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
              <List size={15} />
            </div>
            <div>
              <h3 className="font-semibold">Inventaire du bien</h3>
              <p className="text-xs text-text-secondary">{rooms.length} pièce(s) · {stats.total} élément(s)</p>
            </div>
          </div>
          <p className="text-sm text-text-secondary text-center py-6">
            L'inventaire n'a pas encore été rempli. Modifiez le bien pour accéder à la checklist.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
              <List size={15} />
            </div>
            <div>
              <h3 className="font-semibold">Inventaire du bien</h3>
              <p className="text-xs text-text-secondary">{stats.filled}/{stats.total} élément(s) renseigné(s)</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Star size={12} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
            <span className={`text-xs font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>{stats.total > 0 ? Math.round((stats.filled / stats.total) * 100) : 0}%</span>
          </div>
        </div>

        <div className="space-y-4">
          {rooms.map(room => {
            const roomData = inventory[room.name] || {}
            const filledItems = room.items.filter(item => {
              const data = roomData[itemId(item)]
              return data?.quantity || data?.condition || data?.comments
            })
            if (filledItems.length === 0) return null

            return (
              <div key={room.name} className="border border-border/40 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-background/50 border-b border-border/40">
                  {getRoomIcon(room.name)}
                  <span className="font-medium text-sm">{room.label}</span>
                  <span className="text-xs text-text-secondary bg-background/80 px-2 py-0.5 rounded-full">{filledItems.length} élément(s)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/30">
                        <th className="text-left px-4 py-2 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Élément</th>
                        <th className="text-center px-3 py-2 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-20">Qté</th>
                        <th className="text-center px-3 py-2 text-[11px] font-semibold text-text-secondary uppercase tracking-wider w-28">Condition</th>
                        <th className="text-left px-3 py-2 text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filledItems.map(item => {
                        const data = roomData[itemId(item)] || {}
                        const condition = data.condition ? (isGerant && data.condition === 'average' ? { label: 'État moyen', color: 'text-[#905D5D]', bg: 'bg-[#F0E2E2]' } : CONDITION_CONFIG[data.condition]) : null
                        return (
                          <tr key={item} className="border-b border-border/20 last:border-0">
                            <td className="px-4 py-2.5 font-medium text-text">{item}</td>
                            <td className="px-3 py-2.5 text-center text-text-secondary">{data.quantity || '—'}</td>
                            <td className="px-3 py-2.5 text-center">
                              {condition ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${condition.color} ${condition.bg}`}>
                                  {condition.label}
                                </span>
                              ) : (
                                <span className="text-text-secondary/40">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-text-secondary text-xs">{data.comments || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Signatures de l'inventaire */}
      {(() => {
        const sig = property?.inventorySignature || {}
        const ownerStatus = sig.owner?.status || 'pending'
        const tenantStatus = sig.tenant?.status || 'pending'
        const docGenerated = sig.documentGenerated || false
        const selectedLocataire = sig.selectedLocataire || null

        const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
          signed: { label: 'Signé', color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle },
          sent: { label: 'Envoyé', color: 'text-blue-700', bg: 'bg-blue-50', icon: FileText },
          pending: { label: 'En attente', color: isGerant ? 'text-[#905D5D]' : 'text-amber-700', bg: isGerant ? 'bg-[#E7D5D5]' : 'bg-amber-50', icon: Clock },
        }

        const ownerCfg = statusConfig[ownerStatus] || statusConfig.pending
        const tenantCfg = statusConfig[tenantStatus] || statusConfig.pending

        const ownerType = property?.ownerType || 'particulier'
        const ownerFirstName = property?.owner_firstName || property?.owner?.firstName || ''
        const ownerLastName = property?.owner_lastName || property?.owner?.lastName || ''
        const ownerName = ownerType === 'particulier'
          ? [ownerFirstName, ownerLastName].filter(Boolean).join(' ') || 'Non renseigné'
          : ''
        const companyName = property?.owner_companyName || property?.owner?.companyName || ''
        const ownerAddress = property?.owner_address || property?.owner?.address || ''
        const ownerPhone = property?.owner_phone || property?.owner?.phone || ''
        const ownerProfession = property?.owner_profession || property?.owner?.profession || ''
        const ownerEmail = property?.owner_email || property?.owner?.email || ''
        const companyLegalForm = property?.owner_companyLegalForm || property?.owner?.companyLegalForm || ''
        const companySiren = property?.owner_companySiren || property?.owner?.companySiren || ''
        const companyAddress = property?.owner_companyAddress || property?.owner?.companyAddress || ''

        return (
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className={`p-2 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                <PenTool size={15} />
              </div>
              <div>
                <h3 className="font-semibold">Signatures de l'inventaire</h3>
                <p className="text-xs text-text-secondary">L'inventaire sera envoyé aux parties pour signature électronique</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Document status */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                <div className={`p-1.5 rounded-lg ${docGenerated ? 'bg-emerald-50 text-emerald-600' : (isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-50 text-amber-500')}`}>
                  <FileText size={14} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-text-secondary">Document</p>
                  <p className="text-sm font-medium text-text">{docGenerated ? 'Généré' : 'Non généré'}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${docGenerated ? 'bg-emerald-50 text-emerald-700' : (isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-50 text-amber-700')}`}>
                  {docGenerated ? <CheckCircle size={10} /> : <Clock size={10} />}
                  {docGenerated ? 'Prêt' : 'En attente'}
                </span>
              </div>

              {/* Propriétaire */}
              <div className="border border-border/40 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-background/50 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <User size={14} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                    <span className="font-medium text-sm">Propriétaire</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${ownerCfg.color} ${ownerCfg.bg}`}>
                    <ownerCfg.icon size={10} />
                    {ownerCfg.label}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {ownerType === 'particulier' ? (
                    <>
                      <div className="flex items-center gap-3">
                        <User size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Nom complet</p>
                          <p className="text-xs font-medium text-text">{ownerName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Adresse</p>
                          <p className="text-xs font-medium text-text">{ownerAddress || 'Non renseignée'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Téléphone</p>
                          <p className="text-xs font-medium text-text">{ownerPhone || 'Non renseigné'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Briefcase size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Profession</p>
                          <p className="text-xs font-medium text-text">{ownerProfession || 'Non renseignée'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Email</p>
                          <p className="text-xs font-medium text-text">{ownerEmail || 'Non renseigné'}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <User size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Dénomination sociale</p>
                          <p className="text-xs font-medium text-text">{companyName || 'Non renseignée'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Briefcase size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Forme sociale</p>
                          <p className="text-xs font-medium text-text">{companyLegalForm || 'Non renseignée'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <List size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">N° SIREN</p>
                          <p className="text-xs font-medium text-text">{companySiren || 'Non renseigné'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Adresse</p>
                          <p className="text-xs font-medium text-text">{companyAddress || 'Non renseignée'}</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Locataire */}
              <div className="border border-border/40 rounded-lg overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-background/50 border-b border-border/40">
                  <div className="flex items-center gap-2">
                    <Users size={14} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                    <span className="font-medium text-sm">{personLabel} concerné</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tenantCfg.color} ${tenantCfg.bg}`}>
                    <tenantCfg.icon size={10} />
                    {tenantCfg.label}
                  </span>
                </div>
                <div className="p-4">
                  {selectedLocataire ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <User size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Nom complet</p>
                          <p className="text-xs font-medium text-text">{selectedLocataire.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Adresse</p>
                          <p className="text-xs font-medium text-text">{selectedLocataire.address || 'Non renseignée'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Téléphone</p>
                          <p className="text-xs font-medium text-text">{selectedLocataire.phone || 'Non renseigné'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Briefcase size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Profession</p>
                          <p className="text-xs font-medium text-text">{selectedLocataire.profession || 'Non renseignée'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail size={12} className="text-text-secondary shrink-0" />
                        <div>
                          <p className="text-[11px] text-text-secondary">Email</p>
                          <p className="text-xs font-medium text-text">{selectedLocataire.email || 'Non renseigné'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary text-center py-4">Aucun {personLabel.toLowerCase()} sélectionné</p>
                  )}
                </div>
              </div>

              {/* Statut global */}
              <div className="border border-border/40 rounded-lg overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-background/50 border-b border-border/40">
                  <PenTool size={14} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
                  <span className="font-medium text-sm">Statut global</span>
                </div>
                <div className="p-4 grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-background/80 border border-border/30 text-center space-y-1.5">
                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${docGenerated ? 'bg-emerald-50 text-emerald-600' : (isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-50 text-amber-500')}`}>
                      <FileText size={16} />
                    </div>
                    <p className="text-[11px] text-text-secondary">Document</p>
                    <p className={`text-xs font-semibold ${docGenerated ? 'text-emerald-600' : (isGerant ? 'text-[#905D5D]' : 'text-amber-500')}`}>
                      {docGenerated ? 'Prêt' : 'En attente'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/80 border border-border/30 text-center space-y-1.5">
                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${ownerCfg.bg} ${ownerCfg.color}`}>
                      <User size={16} />
                    </div>
                    <p className="text-[11px] text-text-secondary">Propriétaire</p>
                    <p className={`text-xs font-semibold ${ownerCfg.color}`}>
                      {ownerCfg.label}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-background/80 border border-border/30 text-center space-y-1.5">
                    <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${tenantCfg.bg} ${tenantCfg.color}`}>
                      <Users size={16} />
                    </div>
                    <p className="text-[11px] text-text-secondary">{personLabel}</p>
                    <p className={`text-xs font-semibold ${tenantCfg.color}`}>
                      {tenantCfg.label}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border/30">
                  <Button
                    type="button"
                    size="sm"
                    variant="default"
                    icon={<Send size={13} />}
                    disabled={!docGenerated}
                  >
                    Envoyer les liens de signature
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={<Eye size={13} />}
                    disabled={!docGenerated}
                    onClick={() => setShowDocumentPreview(true)}
                  >
                    Voir le document
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={<RefreshCw size={13} />}
                    disabled={!docGenerated}
                  >
                    Régénérer les liens
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={<Download size={13} />}
                    disabled={!docGenerated}
                    onClick={handleDownloadPdf}
                  >
                    Télécharger le PDF
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )
      })()}

      {/* Document Preview Modal */}
      {showDocumentPreview && (
        <div id="inventory-document-preview" className="fixed inset-0 z-50 flex flex-col bg-gray-100">
          <div className="print-toolbar flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                <FileText size={16} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text">Aperçu de l'inventaire</h3>
                <p className="text-xs text-text-secondary">{property?.title || 'Document généré'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" size="sm" variant="outline" icon={<Download size={13} />} onClick={handleDownloadPdf}>
                Télécharger le PDF
              </Button>
              <Button type="button" size="sm" variant="outline" icon={<Printer size={13} />} onClick={handlePrint}>
                Imprimer
              </Button>
              <Button type="button" size="sm" variant="ghost" icon={<X size={14} />} onClick={() => setShowDocumentPreview(false)}>
                Fermer
              </Button>
            </div>
          </div>
          <div className="print-scroll flex-1 overflow-y-auto">
            <div ref={documentContentRef} className="print-card max-w-4xl mx-auto my-8 bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden"
              dangerouslySetInnerHTML={{ __html: buildDocumentHtml() }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
