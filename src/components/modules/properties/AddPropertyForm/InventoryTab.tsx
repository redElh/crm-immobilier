import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer } from 'react-feather';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { MotionCard } from '../../../../components/ui/Card';
import { Search, FileText, Send, Download, RefreshCw, Eye, Check, Clock, User, Building, Mail, Phone, MapPin, Briefcase, FileSignature, ChevronRight, Users, Home, List, Globe, Sofa, Armchair, Coffee, Tv, Lamp, Bath, Bed, Microwave, Warehouse } from 'lucide-react';
import { fetchClients } from '../../../../services/clientService';
import { fetchContacts } from '../../../../services/contactService';

const dynamicIcons = ['refrigerator', 'stove', 'coffee-maker', 'mirror', 'chair', 'dresser'];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const itemAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 }
};

interface InventoryTabProps {
  control: any;
  register: any;
  watch: any;
  setValue?: (name: string, value: any) => void;
  propertyType?: string;
  isGerant?: boolean;
}

type LucideIcons = { [key: string]: () => Promise<any> };

interface LocataireClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  profession: string;
}

const SALON_ITEMS = [
  { name: 'Canapé', icon: 'sofa' }, { name: 'Fauteuils', icon: 'armchair' },
  { name: 'Table basse', icon: 'coffee' }, { name: 'Table à manger', icon: 'box' },
  { name: 'Vaisselier', icon: 'dresser' }, { name: 'Meuble Télé', icon: 'tv' },
  { name: 'Buffet', icon: 'dresser' }, { name: 'Télévision', icon: 'tv' },
  { name: 'Décoration', icon: 'lamp' }, { name: 'Lampes', icon: 'lamp' }
];

const SDB_ITEMS = [
  { name: 'Meuble rangement', icon: 'dresser' }, { name: 'Porte-serviettes', icon: 'bath' },
  { name: 'Panier à linge', icon: 'box' }, { name: 'Miroir', icon: 'mirror' },
  { name: 'Sèche-cheveux', icon: 'lamp' }, { name: 'Drops de bain', icon: 'bath' },
  { name: 'Serviettes de toilette', icon: 'bath' }
];

const CHAMBRE_ITEMS = [
  { name: 'Lit double', icon: 'bed' }, { name: 'Table chevet', icon: 'box' },
  { name: 'Commode', icon: 'dresser' }, { name: 'Portant à vêtements', icon: 'warehouse' },
  { name: 'Fauteuil', icon: 'armchair' }, { name: 'Miroir', icon: 'mirror' },
  { name: 'Lampes', icon: 'lamp' }, { name: 'Décoration', icon: 'lamp' },
  { name: 'Couette & Oreillers', icon: 'bed' }, { name: 'Linge de lit', icon: 'bed' }
];

const CUISINE_ITEMS = [
  { name: 'Plaque cuisson Induction', icon: 'stove' }, { name: 'Four', icon: 'stove' },
  { name: 'Micro-onde', icon: 'microwave' }, { name: 'Réfrigérateur', icon: 'refrigerator' },
  { name: 'Congélateur', icon: 'refrigerator' }, { name: 'Hotte', icon: 'stove' },
  { name: 'Cafetière', icon: 'coffee-maker' }, { name: 'Machine à café', icon: 'coffee-maker' },
  { name: 'Table', icon: 'box' }, { name: 'Chaises', icon: 'chair' },
  { name: 'Poubelle', icon: 'box' }, { name: 'Vaisselle', icon: 'box' },
  { name: 'Couverts', icon: 'box' }, { name: 'Ustensiles & Plats', icon: 'box' },
  { name: 'Poêles & Casseroles', icon: 'box' }, { name: 'Carafe', icon: 'box' },
  { name: 'Linge de maison', icon: 'box' }
];

export function InventoryTab({ control, register, watch, setValue: setFormValue, propertyType, isGerant = false }: InventoryTabProps) {
  useEffect(() => {
    const loadIcons = async () => {
      const { createIcons } = await import('lucide');
      createIcons({
        icons: dynamicIcons.reduce<LucideIcons>((acc, icon) => {
          acc[icon] = () => import(`lucide-react/dist/esm/icons/${icon}`);
          return acc;
        }, {})
      });
    };
    loadIcons();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [locataires, setLocataires] = useState<LocataireClient[]>([]);
  const printStyleRef = useRef<HTMLStyleElement | null>(null);
  const documentContentRef = useRef<HTMLDivElement | null>(null);

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

  const isVacation = propertyType === 'vacation';
  const mandatType = isVacation ? 'Voyageur' : 'Locataire';
  const personLabel = isVacation ? 'Voyageur' : 'Locataire';

  useEffect(() => {
    Promise.all([
      fetchClients({ type: mandatType.toLowerCase() }),
      fetchContacts({ include_copies: 'true' }),
    ]).then(([clients, contacts]) => {
      const contactList = Array.isArray(contacts) ? contacts : [];
      const contactMap = new Map<string, any>();
      contactList.forEach(c => contactMap.set(c.id, c));

      const filtered = (Array.isArray(clients) ? clients : []).map(c => {
        const linkedContact = contactMap.get(c.contactId) || contactMap.get(c.originalClientId) || null;
        return {
          id: String(c.id),
          name: [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '',
          email: c.email || '',
          phone: c.phone || '',
          address: c.address || (linkedContact ? [linkedContact.adresse, linkedContact.codePostal, linkedContact.ville].filter(Boolean).join(', ') : ''),
          profession: c.profession || linkedContact?.profession || '',
        };
      });
      setLocataires(filtered);
    }).catch(() => {});
  }, [mandatType]);

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = { good: 'Bon état', average: 'État moyen', bad: 'Mauvais état', absent: 'Absent' };
    return labels[condition] || condition || '';
  };

  const allFormValues = watch();

  const getInventoryItemData = useCallback((roomName: string, item: { name: string }) => {
    const itemId = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[ &]/g, '_');
    const data = allFormValues.inventory?.[roomName]?.[itemId];
    return {
      quantity: data?.quantity || '',
      condition: data?.condition || '',
      comments: data?.comments || '',
    };
  }, [allFormValues]);

  type RoomData = { name: string; label: string; items: { name: string; icon: string }[] };
  const buildDocumentHtml = useCallback((_propertyTitle: string, _ownerName: string, _ownerType: string, _ownerAddr: string, _ownerPhone: string, _ownerEmail: string, _companyAddr: string, _companySiren: string, _locataire: LocataireClient | null, _rooms: RoomData[], _propertyAddress: string, _propertyCity: string) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR');
    const timeStr = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const roomRows = _rooms.map(room => {
      const roomItems = room.items;
      const filledItems = roomItems.filter(item => {
        const data = getInventoryItemData(room.name, item);
        return data.quantity || data.condition || data.comments;
      });
      const displayItems = filledItems.length > 0 ? filledItems : roomItems;

      const itemRows = displayItems.map(item => {
        const data = getInventoryItemData(room.name, item);
        let conditionBadge = '<span style="color:#6b7280">—</span>';
        if (data.condition === 'good') conditionBadge = '<span style="display:inline-flex;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:#ecfdf5;color:#047857">Bon</span>';
        else if (data.condition === 'average') conditionBadge = '<span style="display:inline-flex;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:#fffbeb;color:#b45309">Moyen</span>';
        else if (data.condition === 'bad') conditionBadge = '<span style="display:inline-flex;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:#fef2f2;color:#b91c1c">Mauvais</span>';
        else if (data.condition === 'absent') conditionBadge = '<span style="display:inline-flex;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;background:#f9fafb;color:#6b7280">Absent</span>';

        return `<tr>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;font-weight:500;font-size:12px">${item.name}</td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;font-size:12px">${data.quantity || '—'}</td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;text-align:center;font-size:12px">${conditionBadge}</td>
          <td style="padding:6px 10px;border:1px solid #e5e7eb;font-size:12px;color:#6b7280">${data.comments || 'Rien à signaler'}</td>
        </tr>`;
      }).join('');

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
      </div>`;
    }).join('');

    const ownerInfo = _ownerType === 'particulier'
      ? [_ownerAddr, _ownerPhone, _ownerEmail].filter(Boolean).join(' · ')
      : [_companyAddr, _companySiren].filter(Boolean).join(' · ');

    const locataireName = _locataire?.name || '—';
    const locataireInfo = _locataire
      ? [_locataire.address, _locataire.email, _locataire.phone].filter(Boolean).join(' · ')
      : 'Non sélectionné';

    const addressLine = [_propertyAddress, _propertyCity].filter(Boolean).join(', ') || '—';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Inventaire - ${_propertyTitle || 'Document'}</title>
  <style>
    body { margin:0; padding:0; font-family:system-ui,-apple-system,sans-serif; color:#1f2937; }
    @page { margin:15mm; }
    table { page-break-inside:auto; }
    tr { page-break-inside:avoid; page-break-after:auto; }
  </style>
</head>
<body>
  <div style="max-width:800px;margin:0 auto">
    <div style="border-bottom:2px solid #4F46E5;padding:24px 32px;background:linear-gradient(135deg,#f5f3ff,transparent)">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <div style="width:36px;height:36px;border-radius:8px;background:#4F46E5;color:white;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700">▣</div>
        <div>
          <h1 style="font-size:18px;font-weight:700;margin:0;color:#1f2937">SQUARE METER</h1>
          <p style="font-size:11px;margin:0;color:#6b7280;letter-spacing:0.1em;text-transform:uppercase">Immobilier</p>
        </div>
      </div>
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb">
        <h2 style="font-size:20px;font-weight:700;margin:0;color:#1f2937">Inventaire du bien</h2>
      </div>
    </div>

    <div style="padding:16px 32px;border-bottom:1px solid #e5e7eb;background:#f9fafb">
      <table style="width:100%;border:none;font-size:13px">
        <tr><td style="color:#6b7280;width:60px;border:none;padding:2px 0">Bien :</td><td style="font-weight:500;border:none;padding:2px 0">${_propertyTitle || '—'}</td></tr>
        <tr><td style="color:#6b7280;border:none;padding:2px 0">Adresse :</td><td style="font-weight:500;border:none;padding:2px 0">${addressLine}</td></tr>
        <tr><td style="color:#6b7280;border:none;padding:2px 0">Date :</td><td style="font-weight:500;border:none;padding:2px 0">${dateStr}</td></tr>
      </table>
    </div>

    <div style="padding:24px 32px">
      ${roomRows || '<div style="text-align:center;padding:32px;color:#6b7280"><p style="font-weight:500;margin:0">Aucune pièce à inventorier</p></div>'}
    </div>

    <div style="padding:24px 32px;border-top:2px solid #4F46E5;background:linear-gradient(135deg,#f5f3ff,transparent)">
      <h3 style="font-size:15px;font-weight:700;margin:0 0 16px 0;color:#1f2937">Signatures</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div style="padding:16px;border-radius:8px;border:1px solid #e5e7eb">
          <h4 style="font-weight:600;font-size:13px;margin:0 0 8px 0;color:#1f2937">Propriétaire</h4>
          <p style="font-weight:500;font-size:13px;margin:0;color:#1f2937">${_ownerName}</p>
          <p style="font-size:12px;margin:4px 0 0 0;color:#6b7280">${ownerInfo || '—'}</p>
          <div style="margin-top:12px;padding-top:8px;border-top:1px dashed #e5e7eb">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
              <div><p style="font-size:11px;margin:0;color:#6b7280">Signature</p><div style="margin-top:2px;height:28px;border-bottom:1px solid #d1d5db"></div></div>
              <div><p style="font-size:11px;margin:0;color:#6b7280">Lieu</p><div style="margin-top:2px;height:28px;border-bottom:1px solid #d1d5db"></div></div>
              <div style="grid-column:1/-1"><p style="font-size:11px;margin:0;color:#6b7280">Date</p><div style="margin-top:2px;height:28px;border-bottom:1px solid #d1d5db"></div></div>
            </div>
          </div>
        </div>
        <div style="padding:16px;border-radius:8px;border:1px solid #e5e7eb">
          <h4 style="font-weight:600;font-size:13px;margin:0 0 8px 0;color:#1f2937">${personLabel}</h4>
          <p style="font-weight:500;font-size:13px;margin:0;color:#1f2937">${locataireName}</p>
          <p style="font-size:12px;margin:4px 0 0 0;color:#6b7280">${locataireInfo}</p>
          <div style="margin-top:12px;padding-top:8px;border-top:1px dashed #e5e7eb">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px">
              <div><p style="font-size:11px;margin:0;color:#6b7280">Signature</p><div style="margin-top:2px;height:28px;border-bottom:1px solid #d1d5db"></div></div>
              <div><p style="font-size:11px;margin:0;color:#6b7280">Lieu</p><div style="margin-top:2px;height:28px;border-bottom:1px solid #d1d5db"></div></div>
              <div style="grid-column:1/-1"><p style="font-size:11px;margin:0;color:#6b7280">Date</p><div style="margin-top:2px;height:28px;border-bottom:1px solid #d1d5db"></div></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div style="padding:8px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center">
      <p style="font-size:11px;margin:0;color:#6b7280">Document généré le ${dateStr} à ${timeStr}</p>
    </div>
  </div>
</body>
</html>`;
  }, [getInventoryItemData]);

  const ownerType = watch('ownerType');
  const ownerFirstName = watch('owner.firstName');
  const ownerLastName = watch('owner.lastName');
  const ownerAddress = watch('owner.address');
  const ownerPhone = watch('owner.phone');
  const ownerProfession = watch('owner.profession');
  const ownerEmail = watch('owner.email');
  const companyName = watch('company.name');
  const companyLegalForm = watch('company.legalForm');
  const companySiren = watch('company.siren');
  const companyAddress = watch('company.address');

  const selectedLocataire = watch('inventorySignature.selectedLocataire');
  const ownerStatus = watch('inventorySignature.owner.status') || 'pending';
  const tenantStatus = watch('inventorySignature.tenant.status') || 'pending';
  const documentGenerated = watch('inventorySignature.documentGenerated');

  const propertyTitle = watch('propertyTitle');
  const propertyAddress = watch('property.address');
  const propertyCity = watch('property.city');

  const rawLivingCount = watch('livingRoom.count');
  const rawBathroomCount = watch('bathroom.count');
  const rawBedroomCount = watch('bedrooms.total');
  const rawKitchenCount = watch('kitchen.count');

  const livingCount = Math.max(0, parseInt(rawLivingCount) || 0);
  const bathroomCount = Math.max(0, parseInt(rawBathroomCount) || 0);
  const bedroomCount = Math.max(0, parseInt(rawBedroomCount) || 0);
  const kitchenCount = Math.max(0, parseInt(rawKitchenCount) || 0);

  const hasNoCounts = livingCount === 0 && bathroomCount === 0 && bedroomCount === 0 && kitchenCount === 0;

  const rooms = useMemo(() => [
    ...Array.from({ length: livingCount }, (_, i) => ({
      name: `salon_${i + 1}`,
      label: `Salon${livingCount > 1 ? ` ${i + 1}` : ''}`,
      items: SALON_ITEMS
    })),
    ...Array.from({ length: bathroomCount }, (_, i) => ({
      name: `sdb_${i + 1}`,
      label: `SDB${bathroomCount > 1 ? ` ${i + 1}` : ''}`,
      items: SDB_ITEMS
    })),
    ...Array.from({ length: bedroomCount }, (_, i) => ({
      name: `chambre_${i + 1}`,
      label: `Chambre ${i + 1}`,
      items: CHAMBRE_ITEMS
    })),
    ...Array.from({ length: kitchenCount }, (_, i) => ({
      name: `cuisine_${i + 1}`,
      label: `Cuisine${kitchenCount > 1 ? ` ${i + 1}` : ''}`,
      items: CUISINE_ITEMS
    })),
  ], [livingCount, bathroomCount, bedroomCount, kitchenCount]);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return locataires;
    const q = searchQuery.toLowerCase();
    return locataires.filter(
      c => c.name.toLowerCase().includes(q) ||
           c.email.toLowerCase().includes(q) ||
           c.phone.includes(q)
    );
  }, [searchQuery, locataires]);

  const totalItems = rooms.reduce((sum, r) => sum + r.items.length, 0);
  const totalRooms = rooms.length;

  const renderIcon = (iconName: string) => {
    if (dynamicIcons.includes(iconName)) {
      return <i data-lucide={iconName} className="w-4 h-4 inline-block" key={iconName}></i>;
    }
    switch (iconName) {
      case 'sofa': return <Sofa className="w-4 h-4" />;
      case 'armchair': return <Armchair className="w-4 h-4" />;
      case 'coffee': return <Coffee className="w-4 h-4" />;
      case 'tv': return <Tv className="w-4 h-4" />;
      case 'lamp': return <Lamp className="w-4 h-4" />;
      case 'bath': return <Bath className="w-4 h-4" />;
      case 'bed': return <Bed className="w-4 h-4" />;
      case 'microwave': return <Microwave className="w-4 h-4" />;
      case 'warehouse': return <Warehouse className="w-4 h-4" />;
      case 'box': return <BoxIcon className="w-4 h-4" />;
      default: return <BoxIcon className="w-4 h-4" />;
    }
  };

  const getRoomIcon = (roomName: string) => {
    if (roomName.startsWith('salon')) return <Sofa className="w-5 h-5" />;
    if (roomName.startsWith('sdb')) return <Bath className="w-5 h-5" />;
    if (roomName.startsWith('chambre')) return <Bed className="w-5 h-5" />;
    if (roomName.startsWith('cuisine')) return <BoxIcon className="w-5 h-5" />;
    return <BoxIcon className="w-5 h-5" />;
  };

  const ownerName = ownerType === 'particulier'
    ? [ownerFirstName, ownerLastName].filter(Boolean).join(' ') || 'Non renseigné'
    : companyName || 'Non renseigné';

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleDownloadPdf = useCallback(() => {
    const html = buildDocumentHtml(
      propertyTitle,
      ownerName,
      ownerType,
      ownerAddress,
      ownerPhone,
      ownerEmail,
      companyAddress,
      companySiren,
      selectedLocataire,
      rooms,
      propertyAddress,
      propertyCity
    );
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 500);
    }
  }, [buildDocumentHtml, propertyTitle, ownerName, ownerType, ownerAddress, ownerPhone, ownerEmail, companyAddress, companySiren, selectedLocataire, rooms, propertyAddress, propertyCity]);

  const statusConfig = {
    pending: { label: 'En attente', icon: Clock, color: isGerant ? 'text-[#905D5D]' : 'text-amber-500', bg: isGerant ? 'bg-[#E7D5D5]' : 'bg-amber-50', badge: 'warning' as const },
    sent: { label: 'Envoyé', icon: Send, color: 'text-blue-500', bg: 'bg-blue-50', badge: 'primary' as const },
    signed: { label: 'Signé', icon: Check, color: 'text-emerald-500', bg: 'bg-emerald-50', badge: 'success' as const },
  };

  const getStatusBadge = (status: string) => {
    const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
        <cfg.icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  return (
    <MotionCard
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-0 overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
            <List className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-text">Checklist Inventaire</h2>
            <p className="text-xs text-text-secondary">Équipements et mobilier du bien</p>
          </div>
        </div>
      </div>

      {hasNoCounts && (
        <div className="px-6 py-8 text-center">
          <Home className="w-10 h-10 mx-auto text-text-secondary/20 mb-3" />
          <p className="text-sm font-medium text-text-secondary">Aucune pièce renseignée</p>
          <p className="text-xs text-text-secondary/60 mt-1">
            Renseignez d'abord le nombre de pièces dans l'onglet <span className={`font-medium ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>Intérieur</span>
          </p>
        </div>
      )}

      <Accordion type="multiple" defaultValue={[...rooms.map(room => room.name), 'signatures']} className="space-y-0">
        {rooms.map((room) => (
          <AccordionItem key={room.name} value={room.name} className="border-0 border-t border-border/40">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                  {getRoomIcon(room.name)}
                </div>
                <span className="font-medium text-text">{room.label}</span>
                <span className="text-xs text-text-secondary bg-background/80 px-2 py-0.5 rounded-full">{room.items.length} éléments</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pb-0">
              <motion.div variants={container} initial="hidden" animate="show">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-background/50 border-y border-border/40">
                        <th className="pl-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Élément</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Quantité</th>
                        <th className="px-3 py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider">Condition</th>
                        <th className="pr-6 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {room.items.map((item) => {
                        const itemId = item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[ &]/g, '_');
                        return (
                          <tr key={itemId} className="hover:bg-background/30 transition-colors">
                            <td className="pl-6 py-3 font-medium text-text flex items-center gap-2.5">
                              <span className="text-text-secondary">{renderIcon(item.icon)}</span>
                              {item.name}
                            </td>
                            <td className="px-3 py-3 text-center align-middle">
                              <Input type="number" min="0" {...register(`inventory.${room.name}.${itemId}.quantity`)} className="w-20 mx-auto text-center" />
                            </td>
                            <td className="px-3 py-3 text-center align-middle">
                              <div className="inline-flex gap-1.5">
                                {(['good', 'average', 'bad', 'absent'] as const).map((condition) => {
                                  const labels = { good: 'Bon', average: 'Moyen', bad: 'Mauvais', absent: 'Absent' };
                                  const colors = {
                                    good: 'data-[active=true]:bg-success/15 data-[active=true]:text-success data-[active=true]:border-success/30',
                                    average: 'data-[active=true]:bg-premium/15 data-[active=true]:text-premium data-[active=true]:border-premium/30',
                                    bad: 'data-[active=true]:bg-error/15 data-[active=true]:text-error data-[active=true]:border-error/30',
                                    absent: 'data-[active=true]:bg-text-secondary/10 data-[active=true]:text-text-secondary data-[active=true]:border-text-secondary/30',
                                  };
                                  const icons = { good: '✓', average: '!', bad: '✕', absent: '—' };
                                  return (
                                    <Controller
                                      key={condition}
                                      name={`inventory.${room.name}.${itemId}.condition`}
                                      control={control}
                                      render={({ field }) => (
                                        <button
                                          type="button"
                                          onClick={() => field.onChange(field.value === condition ? '' : condition)}
                                          data-active={field.value === condition}
                                          className={`w-7 h-7 rounded-md text-xs font-medium border transition-all duration-150
                                            hover:scale-110 active:scale-95
                                            border-border/50 text-text-secondary hover:border-text-secondary/50
                                            ${colors[condition]}`}
                                          title={labels[condition]}
                                        >
                                          {icons[condition]}
                                        </button>
                                      )}
                                    />
                                  );
                                })}
                              </div>
                            </td>
                            <td className="pr-6 py-3">
                              <Input {...register(`inventory.${room.name}.${itemId}.comments`)} placeholder="Notes..." />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        ))}

        <AccordionItem value="signatures" className="border-0 border-t border-border/40">
          <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                {<FileSignature className="w-5 h-5" />}
              </div>
              <span className="font-medium text-text">Signatures de l'inventaire</span>
              <Badge variant="secondary" size="sm" className="ml-1">Nouveau</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-5 px-6 pb-6"
            >
              {/* Document Preview */}
              <motion.div variants={itemAnim} className="rounded-xl border border-border/40 bg-gradient-to-br from-card to-background/50 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
                  <div className={`p-2 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-text">Aperçu de l'inventaire</h4>
                    <p className="text-xs text-text-secondary">L'inventaire sera envoyé aux parties pour signature électronique</p>
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 text-text-secondary">
                          <Home className="w-3.5 h-3.5" />
                          <span className="font-medium">{totalRooms} pièces</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 text-text-secondary">
                          <List className="w-3.5 h-3.5" />
                          <span className="font-medium">{totalRooms} catégories</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 text-text-secondary">
                          <BoxIcon className="w-3.5 h-3.5" />
                          <span className="font-medium">{totalItems} éléments</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        icon={<FileText className="w-3.5 h-3.5" />}
                        onClick={() => setFormValue?.('inventorySignature.documentGenerated', true)}
                      >
                        Générer l'inventaire
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        icon={<Eye className="w-3.5 h-3.5" />}
                        disabled={!documentGenerated}
                        onClick={() => setShowDocumentPreview(true)}
                      >
                        Voir le document
                      </Button>
                    </div>
                  </div>
                  {documentGenerated && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-border/30"
                    >
                      <div className="flex items-center gap-2 text-xs text-emerald-600">
                        <Check className="w-3.5 h-3.5" />
                        Inventaire généré avec succès
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              {/* Propriétaire */}
              <motion.div variants={itemAnim} className="rounded-xl border border-border/40 bg-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-text">Propriétaire</h4>
                    </div>
                  </div>
                  {getStatusBadge(ownerStatus)}
                </div>
                <div className="p-5">
                  <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-3"
                  >
                    {ownerType === 'particulier' ? (
                      <>
                        <motion.div variants={itemAnim} className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                          <User className="w-4 h-4 text-text-secondary shrink-0" />
                          <div>
                            <p className="text-xs text-text-secondary">Nom complet</p>
                            <p className="text-sm font-medium text-text">{ownerName}</p>
                          </div>
                        </motion.div>
                        <motion.div variants={itemAnim} className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                          <MapPin className="w-4 h-4 text-text-secondary shrink-0" />
                          <div>
                            <p className="text-xs text-text-secondary">Adresse</p>
                            <p className="text-sm font-medium text-text">{ownerAddress || 'Non renseignée'}</p>
                          </div>
                        </motion.div>
                        <motion.div variants={itemAnim} className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                          <Phone className="w-4 h-4 text-text-secondary shrink-0" />
                          <div>
                            <p className="text-xs text-text-secondary">Téléphone</p>
                            <p className="text-sm font-medium text-text">{ownerPhone || 'Non renseigné'}</p>
                          </div>
                        </motion.div>
                        <motion.div variants={itemAnim} className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                          <Briefcase className="w-4 h-4 text-text-secondary shrink-0" />
                          <div>
                            <p className="text-xs text-text-secondary">Profession</p>
                            <p className="text-sm font-medium text-text">{ownerProfession || 'Non renseignée'}</p>
                          </div>
                        </motion.div>
                        <motion.div variants={itemAnim} className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                          <Mail className="w-4 h-4 text-text-secondary shrink-0" />
                          <div>
                            <p className="text-xs text-text-secondary">Email</p>
                            <p className="text-sm font-medium text-text">{ownerEmail || 'Non renseigné'}</p>
                          </div>
                        </motion.div>
                      </>
                    ) : (
                      <>
                        <motion.div variants={itemAnim} className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                          <Building className="w-4 h-4 text-text-secondary shrink-0" />
                          <div>
                            <p className="text-xs text-text-secondary">Dénomination sociale</p>
                            <p className="text-sm font-medium text-text">{companyName || 'Non renseignée'}</p>
                          </div>
                        </motion.div>
                        <motion.div variants={itemAnim} className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                          <Briefcase className="w-4 h-4 text-text-secondary shrink-0" />
                          <div>
                            <p className="text-xs text-text-secondary">Forme sociale</p>
                            <p className="text-sm font-medium text-text">{companyLegalForm || 'Non renseignée'}</p>
                          </div>
                        </motion.div>
                        <motion.div variants={itemAnim} className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                          <Globe className="w-4 h-4 text-text-secondary shrink-0" />
                          <div>
                            <p className="text-xs text-text-secondary">N° SIREN</p>
                            <p className="text-sm font-medium text-text">{companySiren || 'Non renseigné'}</p>
                          </div>
                        </motion.div>
                        <motion.div variants={itemAnim} className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
                          <MapPin className="w-4 h-4 text-text-secondary shrink-0" />
                          <div>
                            <p className="text-xs text-text-secondary">Adresse</p>
                            <p className="text-sm font-medium text-text">{companyAddress || 'Non renseignée'}</p>
                          </div>
                        </motion.div>
                      </>
                    )}
                    <motion.div variants={itemAnim} className="pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        icon={<Send className="w-3.5 h-3.5" />}
                        disabled={!documentGenerated}
                        className="w-full sm:w-auto"
                      >
                        Envoyer le lien de signature
                      </Button>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>

              {/* Locataire */}
              <motion.div variants={itemAnim} className="rounded-xl border border-border/40 bg-card overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-text">{personLabel} concerné</h4>
                    </div>
                  </div>
                  {selectedLocataire && getStatusBadge(tenantStatus)}
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      Rechercher un {personLabel.toLowerCase()}
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary/50" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowResults(true);
                          }}
                          onFocus={() => setShowResults(true)}
                          placeholder="Nom, prénom ou email..."
                          className={`w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/40 focus:outline-none focus:ring-2 transition-all duration-200 ${isGerant ? 'focus:ring-[#905D5D]/15 focus:border-[#905D5D]' : 'focus:ring-accent/15 focus:border-accent'}`}
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="default"
                        icon={<Search className="w-3.5 h-3.5" />}
                        onClick={() => setShowResults(true)}
                      >
                        Rechercher
                      </Button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showResults && searchQuery.length > 0 && filteredClients.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.98 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="rounded-lg border border-border/40 bg-card shadow-dropdown overflow-hidden"
                      >
                        <div className="px-4 py-2 bg-background/50 border-b border-border/30">
                          <span className="text-xs font-medium text-text-secondary">
                            {filteredClients.length} résultat{filteredClients.length > 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="max-h-48 overflow-y-auto divide-y divide-border/20">
                          {filteredClients.map((client, idx) => (
                            <motion.button
                              key={client.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.1, delay: idx * 0.03 }}
                              type="button"
                              onClick={() => {
                                setFormValue?.('inventorySignature.selectedLocataire', client);
                                setSearchQuery(client.name);
                                setShowResults(false);
                              }}
                              className={`w-full text-left px-4 py-3 transition-colors ${isGerant ? 'hover:bg-[#905D5D]/10' : 'hover:bg-accent-light/50'} ${
                                selectedLocataire?.id === client.id ? isGerant ? 'bg-[#905D5D]/10' : 'bg-accent-light' : ''
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full shrink-0 ${
                                  selectedLocataire?.id === client.id ? isGerant ? 'bg-[#905D5D]' : 'bg-accent' : 'bg-text-secondary/30'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-text truncate">{client.name}</p>
                                  <div className="flex items-center gap-3 text-xs text-text-secondary mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <Mail className="w-3 h-3" />
                                      {client.email}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Phone className="w-3 h-3" />
                                      {client.phone}
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-text-secondary/40 shrink-0" />
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {showResults && searchQuery.length > 0 && filteredClients.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="py-6 text-center"
                      >
                        <Search className="w-8 h-8 mx-auto text-text-secondary/20 mb-2" />
                        <p className="text-sm text-text-secondary">Aucun {personLabel.toLowerCase()} trouvé</p>
                        <p className="text-xs text-text-secondary/60 mt-0.5">Essayez de modifier votre recherche</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence>
                    {selectedLocataire && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                      >
                        <div className={`p-4 rounded-lg border space-y-3 ${isGerant ? 'bg-[#905D5D]/10 border-[#905D5D]/20' : 'bg-accent-light/50 border-accent/10'}`}>
                          <div className={`flex items-center gap-2 text-xs font-medium mb-2 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`}>
                            <Check className="w-3.5 h-3.5" />
                            {personLabel} sélectionné
                          </div>
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-text-secondary shrink-0" />
                            <div>
                              <p className="text-xs text-text-secondary">Nom complet</p>
                              <p className="text-sm font-medium text-text">{selectedLocataire.name}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-text-secondary shrink-0" />
                            <div>
                              <p className="text-xs text-text-secondary">Adresse</p>
                              <p className="text-sm font-medium text-text">{selectedLocataire.address || 'Non renseignée'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-text-secondary shrink-0" />
                            <div>
                              <p className="text-xs text-text-secondary">Téléphone</p>
                              <p className="text-sm font-medium text-text">{selectedLocataire.phone || 'Non renseigné'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Briefcase className="w-4 h-4 text-text-secondary shrink-0" />
                            <div>
                              <p className="text-xs text-text-secondary">Profession</p>
                              <p className="text-sm font-medium text-text">{selectedLocataire.profession || 'Non renseignée'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="w-4 h-4 text-text-secondary shrink-0" />
                            <div>
                              <p className="text-xs text-text-secondary">Email</p>
                              <p className="text-sm font-medium text-text">{selectedLocataire.email || 'Non renseigné'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            icon={<Send className="w-3.5 h-3.5" />}
                            disabled={!documentGenerated}
                            className="w-full sm:w-auto"
                          >
                            Envoyer le lien de signature
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {!selectedLocataire && !searchQuery && (
                    <div className="py-4 text-center">
                      <Users className="w-8 h-8 mx-auto text-text-secondary/20 mb-2" />
                      <p className="text-sm text-text-secondary">Aucun {personLabel.toLowerCase()} sélectionné</p>
                      <p className="text-xs text-text-secondary/60 mt-0.5">Recherchez et sélectionnez un locataire</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Global Status */}
              <motion.div variants={itemAnim} className="rounded-xl border border-border/40 bg-gradient-to-br from-card to-background/50 overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/30">
                  <div className={`p-2 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                    <FileSignature className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-text">Statut global</h4>
                  </div>
                </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-background/80 border border-border/30 text-center space-y-2">
                      <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
                        documentGenerated ? 'bg-emerald-50 text-emerald-600' : (isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-50 text-amber-500')
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Document</p>
                        <p className="text-sm font-semibold text-text">Prêt</p>
                      </div>
                      <div className={`text-lg font-bold ${
                        documentGenerated ? 'text-emerald-500' : (isGerant ? 'text-[#905D5D]' : 'text-amber-500')
                      }`}>
                        {documentGenerated ? '✅' : '⏳'}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-background/80 border border-border/30 text-center space-y-2">
                      <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
                        ownerStatus === 'signed' ? 'bg-emerald-50 text-emerald-600' :
                        ownerStatus === 'sent' ? 'bg-blue-50 text-blue-500' :
                        (isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-50 text-amber-500')
                      }`}>
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Propriétaire</p>
                        <p className="text-sm font-semibold text-text">
                          {ownerStatus === 'signed' ? 'Signé' :
                           ownerStatus === 'sent' ? 'Envoyé' :
                           'En attente'}
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${
                        ownerStatus === 'signed' ? 'text-emerald-500' :
                        ownerStatus === 'sent' ? 'text-blue-500' :
                        (isGerant ? 'text-[#905D5D]' : 'text-amber-500')
                      }`}>
                        {ownerStatus === 'signed' ? '✅' :
                         ownerStatus === 'sent' ? '📧' :
                         '⏳'}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-background/80 border border-border/30 text-center space-y-2">
                      <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
                        tenantStatus === 'signed' ? 'bg-emerald-50 text-emerald-600' :
                        tenantStatus === 'sent' ? 'bg-blue-50 text-blue-500' :
                        (isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-50 text-amber-500')
                      }`}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">{personLabel}</p>
                        <p className="text-sm font-semibold text-text">
                          {tenantStatus === 'signed' ? 'Signé' :
                           tenantStatus === 'sent' ? 'Envoyé' :
                           'En attente'}
                        </p>
                      </div>
                      <div className={`text-lg font-bold ${
                        tenantStatus === 'signed' ? 'text-emerald-500' :
                        tenantStatus === 'sent' ? 'text-blue-500' :
                        (isGerant ? 'text-[#905D5D]' : 'text-amber-500')
                      }`}>
                        {tenantStatus === 'signed' ? '✅' :
                         tenantStatus === 'sent' ? '📧' :
                         '⏳'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-border/30">
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      icon={<Send className="w-3.5 h-3.5" />}
                      disabled={!documentGenerated}
                    >
                      Envoyer les liens de signature
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      icon={<Eye className="w-3.5 h-3.5" />}
                      disabled={!documentGenerated}
                      onClick={() => setShowDocumentPreview(true)}
                    >
                      Voir le document
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      icon={<RefreshCw className="w-3.5 h-3.5" />}
                      disabled={!documentGenerated}
                    >
                      Régénérer les liens
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      icon={<Download className="w-3.5 h-3.5" />}
                      disabled={!documentGenerated}
                      onClick={handleDownloadPdf}
                    >
                      Télécharger le PDF
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <AnimatePresence>
        {showDocumentPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            id="inventory-document-preview"
            className="fixed inset-0 z-50 flex flex-col bg-gray-100"
          >
            <div className="print-toolbar flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shadow-sm shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text">Aperçu de l'inventaire</h3>
                  <p className="text-xs text-text-secondary">{propertyTitle || 'Document généré'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={handleDownloadPdf}
                >
                  Télécharger le PDF
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  icon={<Printer className="w-3.5 h-3.5" />}
                  onClick={handlePrint}
                >
                  Imprimer
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  icon={<X className="w-4 h-4" />}
                  onClick={() => setShowDocumentPreview(false)}
                >
                  Fermer
                </Button>
              </div>
            </div>

            <div className="print-scroll flex-1 overflow-y-auto">
              <div ref={documentContentRef} className="print-card max-w-4xl mx-auto my-8 bg-white rounded-xl shadow-card border border-gray-200 overflow-hidden">
                <div className={`print-padding px-10 py-8 border-b-2 bg-gradient-to-br to-transparent ${isGerant ? 'border-[#905D5D]/20 from-[#905D5D]/5' : 'border-accent/20 from-accent/5'}`}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`p-2 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                      <Home className="w-5 h-5" />
                    </div>
                    <div>
                      <h1 className="text-lg font-bold text-text tracking-tight">SQUARE METER</h1>
                      <p className="text-xs text-text-secondary tracking-widest uppercase">Immobilier</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h2 className="text-xl font-bold text-text">Inventaire du bien</h2>
                  </div>
                </div>

                <div className="print-padding px-10 py-6 border-b border-gray-100 bg-gray-50/50">
                  <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    <div>
                      <span className="text-text-secondary">Bien :</span>
                      <span className="ml-2 font-medium text-text">{propertyTitle || '—'}</span>
                    </div>
                    <div>
                      <span className="text-text-secondary">Date :</span>
                      <span className="ml-2 font-medium text-text">
                        {new Date().toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-text-secondary">Adresse :</span>
                      <span className="ml-2 font-medium text-text">
                        {[propertyAddress, propertyCity].filter(Boolean).join(', ') || '—'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="print-padding px-10 py-6 space-y-8">
                  {rooms.length === 0 && (
                    <div className="py-12 text-center text-text-secondary">
                      <p className="font-medium">Aucune pièce à inventorier</p>
                      <p className="text-sm mt-1">Renseignez d'abord les pièces dans l'onglet Intérieur</p>
                    </div>
                  )}
                  {rooms.map((room) => {
                    const roomItems = room.items;
                    const filledItems = roomItems.filter(item => {
                      const data = getInventoryItemData(room.name, item);
                      return data.quantity || data.condition || data.comments;
                    });
                    const displayItems = filledItems.length > 0 ? filledItems : roomItems;
                    return (
                      <div key={room.name}>
                        <div className="flex items-center gap-2.5 mb-3">
                          <div className={`p-1 rounded-lg ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
                            {getRoomIcon(room.name)}
                          </div>
                          <h3 className="text-base font-bold text-text">
                            {room.label}
                            <span className="ml-2 text-xs font-normal text-text-secondary">
                              ({displayItems.length} élément{displayItems.length > 1 ? 's' : ''})
                            </span>
                          </h3>
                        </div>
                        <div className="rounded-lg border border-gray-200 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Élément</th>
                                <th className="px-3 py-2.5 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider w-20">Quantité</th>
                                <th className="px-3 py-2.5 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider w-32">Condition</th>
                                <th className="px-4 py-2.5 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Notes</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {displayItems.map((item) => {
                                const data = getInventoryItemData(room.name, item);
                                return (
                                  <tr key={item.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[ &]/g, '_')} className="hover:bg-gray-50/50">
                                    <td className="px-4 py-2.5 font-medium text-text">{item.name}</td>
                                    <td className="px-3 py-2.5 text-center text-text">{data.quantity || '—'}</td>
                                    <td className="px-3 py-2.5 text-center">
                                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                        data.condition === 'good' ? 'bg-emerald-50 text-emerald-700' :
                                        data.condition === 'average' ? (isGerant ? 'bg-[#E7D5D5] text-[#905D5D]' : 'bg-amber-50 text-amber-700') :
                                        data.condition === 'bad' ? 'bg-red-50 text-red-700' :
                                        data.condition === 'absent' ? 'bg-gray-50 text-gray-500' :
                                        'text-text-secondary'
                                      }`}>
                                        {getConditionLabel(data.condition) || '—'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-2.5 text-text-secondary">{data.comments || 'Rien à signaler'}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`print-padding px-10 py-6 border-t-2 bg-gradient-to-br to-transparent ${isGerant ? 'border-[#905D5D]/20 from-[#905D5D]/5' : 'border-accent/20 from-accent/5'}`}>
                  <div className="flex items-center gap-2.5 mb-4">
                    <FileSignature className={`w-4 h-4 ${isGerant ? 'text-[#905D5D]' : 'text-accent'}`} />
                    <h3 className="text-base font-bold text-text">Signatures</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-white border border-gray-200">
                      <h4 className="font-semibold text-sm text-text mb-3">Propriétaire</h4>
                      <div className="space-y-1.5 text-sm">
                        <p className="font-medium text-text">{ownerName}</p>
                        <p className="text-text-secondary">
                          {ownerType === 'particulier'
                            ? [ownerAddress, ownerPhone, ownerEmail].filter(Boolean).join(' · ')
                            : [companyAddress, companySiren].filter(Boolean).join(' · ') || '—'
                          }
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-text-secondary">Signature</p>
                            <div className="mt-1 h-8 border-b border-gray-300" />
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Lieu</p>
                            <div className="mt-1 h-8 border-b border-gray-300" />
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-text-secondary">Date</p>
                            <div className="mt-1 h-8 border-b border-gray-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-white border border-gray-200">
                      <h4 className="font-semibold text-sm text-text mb-3">{personLabel}</h4>
                      <div className="space-y-1.5 text-sm">
                        <p className="font-medium text-text">
                          {selectedLocataire?.name || '—'}
                        </p>
                        <p className="text-text-secondary">
                          {selectedLocataire
                            ? [selectedLocataire.address, selectedLocataire.email, selectedLocataire.phone].filter(Boolean).join(' · ')
                            : 'Non sélectionné'
                          }
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-text-secondary">Signature</p>
                            <div className="mt-1 h-8 border-b border-gray-300" />
                          </div>
                          <div>
                            <p className="text-xs text-text-secondary">Lieu</p>
                            <div className="mt-1 h-8 border-b border-gray-300" />
                          </div>
                          <div className="col-span-2">
                            <p className="text-xs text-text-secondary">Date</p>
                            <div className="mt-1 h-8 border-b border-gray-300" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="print-padding px-10 py-3 bg-gray-50 border-t border-gray-200 text-center">
                  <p className="text-xs text-text-secondary">
                    Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MotionCard>
  );
}

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}
