import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Input } from '../../../../components/ui/Input';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Table } from '../../../../components/ui/Table';
import { useEffect } from 'react';
import { Sofa, Armchair, Coffee, Tv, Lamp, Bath, Bed, Microwave, Box, Warehouse, PenLine, User } from 'lucide-react';

const dynamicIcons = ['refrigerator', 'stove', 'coffee-maker', 'mirror', 'chair', 'dresser'];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const roomIcons: Record<string, React.ReactNode> = {
  salon: <Sofa className="w-5 h-5" />,
  sdb: <Bath className="w-5 h-5" />,
  chambre1: <Bed className="w-5 h-5" />,
  chambre2: <Bed className="w-5 h-5" />,
  chambre3: <Bed className="w-5 h-5" />,
  chambre4: <Bed className="w-5 h-5" />,
  cuisine: <Box className="w-5 h-5" />,
  signatures: <PenLine className="w-5 h-5" />
};

interface InventoryTabProps {
  control: any;
  register: any;
  watch: any;
}

type LucideIcons = { [key: string]: () => Promise<any> };

export function InventoryTab({ control, register, watch }: InventoryTabProps) {
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
  
  const rooms = [
    {
      name: 'salon', label: 'Salon',
      items: [
        { name: 'Canapé', icon: 'sofa' }, { name: 'Fauteuils', icon: 'armchair' },
        { name: 'Table basse', icon: 'coffee' }, { name: 'Table à manger', icon: 'box' },
        { name: 'Vaisselier', icon: 'dresser' }, { name: 'Meuble Télé', icon: 'tv' },
        { name: 'Buffet', icon: 'dresser' }, { name: 'Télévision', icon: 'tv' },
        { name: 'Décoration', icon: 'lamp' }, { name: 'Lampes', icon: 'lamp' }
      ]
    },
    {
      name: 'sdb', label: 'SDB',
      items: [
        { name: 'Meuble rangement', icon: 'dresser' }, { name: 'Porte-serviettes', icon: 'bath' },
        { name: 'Panier à linge', icon: 'box' }, { name: 'Miroir', icon: 'mirror' },
        { name: 'Sèche-cheveux', icon: 'lamp' }, { name: 'Drops de bain', icon: 'bath' },
        { name: 'Serviettes de toilette', icon: 'bath' }
      ]
    },
    {
      name: 'chambre1', label: 'Chambre 1',
      items: [
        { name: 'Lit double', icon: 'bed' }, { name: 'Table chevet', icon: 'box' },
        { name: 'Commode', icon: 'dresser' }, { name: 'Portant à vêtements', icon: 'warehouse' },
        { name: 'Fauteuil', icon: 'armchair' }, { name: 'Miroir', icon: 'mirror' },
        { name: 'Lampes', icon: 'lamp' }, { name: 'Décoration', icon: 'lamp' },
        { name: 'Couette & Oreillers', icon: 'bed' }, { name: 'Linge de lit', icon: 'bed' }
      ]
    },
    {
      name: 'chambre2', label: 'Chambre 2',
      items: [
        { name: 'Lit double', icon: 'bed' }, { name: 'Table chevet', icon: 'box' },
        { name: 'Commode', icon: 'dresser' }, { name: 'Portant à vêtements', icon: 'warehouse' },
        { name: 'Fauteuil', icon: 'armchair' }, { name: 'Miroir', icon: 'mirror' },
        { name: 'Lampes', icon: 'lamp' }, { name: 'Décoration', icon: 'lamp' },
        { name: 'Couette & Oreillers', icon: 'bed' }, { name: 'Linge de lit', icon: 'bed' }
      ]
    },
    {
      name: 'chambre3', label: 'Chambre 3',
      items: [
        { name: 'Lit double', icon: 'bed' }, { name: 'Table chevet', icon: 'box' },
        { name: 'Commode', icon: 'dresser' }, { name: 'Portant à vêtements', icon: 'warehouse' },
        { name: 'Fauteuil', icon: 'armchair' }, { name: 'Miroir', icon: 'mirror' },
        { name: 'Lampes', icon: 'lamp' }, { name: 'Décoration', icon: 'lamp' },
        { name: 'Couette & Oreillers', icon: 'bed' }, { name: 'Linge de lit', icon: 'bed' }
      ]
    },
    {
      name: 'chambre4', label: 'Chambre 4',
      items: [
        { name: 'Lit double', icon: 'bed' }, { name: 'Table chevet', icon: 'box' },
        { name: 'Commode', icon: 'dresser' }, { name: 'Portant à vêtements', icon: 'warehouse' },
        { name: 'Fauteuil', icon: 'armchair' }, { name: 'Miroir', icon: 'mirror' },
        { name: 'Lampes', icon: 'lamp' }, { name: 'Décoration', icon: 'lamp' },
        { name: 'Couette & Oreillers', icon: 'bed' }, { name: 'Linge de lit', icon: 'bed' }
      ]
    },
    {
      name: 'cuisine', label: 'Cuisine',
      items: [
        { name: 'Plaque cuisson Induction', icon: 'stove' }, { name: 'Four', icon: 'stove' },
        { name: 'Micro-onde', icon: 'microwave' }, { name: 'Réfrigérateur', icon: 'refrigerator' },
        { name: 'Congélateur', icon: 'refrigerator' }, { name: 'Hotte', icon: 'stove' },
        { name: 'Cafetière', icon: 'coffee-maker' }, { name: 'Machine à café', icon: 'coffee-maker' },
        { name: 'Table', icon: 'box' }, { name: 'Chaises', icon: 'chair' },
        { name: 'Poubelle', icon: 'box' }, { name: 'Vaisselle', icon: 'box' },
        { name: 'Couverts', icon: 'box' }, { name: 'Ustensiles & Plats', icon: 'box' },
        { name: 'Poêles & Casseroles', icon: 'box' }, { name: 'Carafe', icon: 'box' },
        { name: 'Linge de maison', icon: 'box' }
      ]
    }
  ];

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
      case 'box': return <Box className="w-4 h-4" />;
      default: return <Box className="w-4 h-4" />;
    }
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
          <div className="p-2 rounded-lg bg-accent/10 text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-text">Checklist Inventaire</h2>
            <p className="text-xs text-text-secondary">Équipements et mobilier du bien</p>
          </div>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={rooms.map(room => room.name)} className="space-y-0">
        {rooms.map((room) => (
          <AccordionItem key={room.name} value={room.name} className="border-0 border-t border-border/40">
            <AccordionTrigger className="px-6 py-4 hover:bg-background/50 transition-colors duration-200">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
                  {roomIcons[room.name]}
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
                        const itemId = item.name.toLowerCase().replace(/[ &]/g, '_');
                        return (
                          <tr key={itemId} className="hover:bg-background/30 transition-colors">
                            <td className="pl-6 py-3 font-medium text-text flex items-center gap-2.5">
                              <span className="text-text-secondary">{renderIcon(item.icon)}</span>
                              {item.name}
                            </td>
                            <td className="px-3 py-3">
                              <Input type="number" min="0" {...register(`inventory.${room.name}.${itemId}.quantity`)} className="w-20 mx-auto text-center" />
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex justify-center gap-1.5">
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
              <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
                {roomIcons.signatures}
              </div>
              <span className="font-medium text-text">Signatures</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6 pt-2">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="p-5 rounded-lg bg-background/50 border border-border/30 space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
                    <User className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-sm text-text">Propriétaire</h4>
                </div>
                <Input label="Lieu" {...register('inventorySignatures.owner.location')} />
                <DatePicker label="Date" {...register('inventorySignatures.owner.date')} />
                <Input label="Par" {...register('inventorySignatures.owner.name')} />
              </div>
              <div className="p-5 rounded-lg bg-background/50 border border-border/30 space-y-4">
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="p-1.5 rounded-lg bg-accent/10 text-accent">
                    <User className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-sm text-text">Locataire</h4>
                </div>
                <Input label="Lieu" {...register('inventorySignatures.tenant.location')} />
                <DatePicker label="Date" {...register('inventorySignatures.tenant.date')} />
                <Input label="Par" {...register('inventorySignatures.tenant.name')} />
              </div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
