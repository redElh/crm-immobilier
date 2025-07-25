import { Controller } from 'react-hook-form';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../../../components/ui/Accordion';
import { Input } from '../../../../components/ui/Input';
import { motion } from 'framer-motion';
import { MotionCard } from '../../../../components/ui/Card';
import { Table } from '../../../../components/ui/Table';
import { useEffect } from 'react';
// Lucide icons we'll use directly
import { 
  Sofa, 
  Armchair, 
  Coffee, 
  Tv, 
  Lamp, 
  Bath, 
  Bed, 
  Microwave,
  Home,
  Circle,
  Box,
  Warehouse,
  PenLine,
  User
} from 'lucide-react';

// Dynamic icons we'll load with createIcons
const dynamicIcons = [
  'refrigerator', 
  'stove',
  'coffee-maker',
  'mirror',
  'chair',
  'dresser'
];

const fadeIn = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

const roomIcons = {
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

type LucideIcons = {
  [key: string]: () => Promise<any>;
};

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
      name: 'salon',
      label: 'Salon',
      items: [
        { name: 'Canapé', icon: 'sofa' },
        { name: 'Fauteuils', icon: 'armchair' },
        { name: 'Table basse', icon: 'coffee' },
        { name: 'Table à manger', icon: 'box' }, // Using box as table placeholder
        { name: 'Vaisselier', icon: 'dresser' },
        { name: 'Meuble Télé', icon: 'tv' },
        { name: 'Buffet', icon: 'dresser' },
        { name: 'Télévision', icon: 'tv' },
        { name: 'Décoration', icon: 'lamp' },
        { name: 'Lampes', icon: 'lamp' }
      ]
    },
    {
      name: 'sdb',
      label: 'SDB',
      items: [
        { name: 'Meuble rangement', icon: 'dresser' },
        { name: 'Porte-serviettes', icon: 'bath' },
        { name: 'Panier à linge', icon: 'box' }, // Placeholder
        { name: 'Miroir', icon: 'mirror' },
        { name: 'Sèche-cheveux', icon: 'lamp' },
        { name: 'Drops de bain', icon: 'bath' },
        { name: 'Serviettes de toilette', icon: 'bath' }
      ]
    },
    {
      name: 'chambre1',
      label: 'Chambre 1',
      items: [
        { name: 'Lit double', icon: 'bed' },
        { name: 'Table chevet', icon: 'box' },
        { name: 'Commode', icon: 'dresser' },
        { name: 'Portant à vêtements', icon: 'warehouse' },
        { name: 'Fauteuil', icon: 'armchair' },
        { name: 'Miroir', icon: 'mirror' },
        { name: 'Lampes', icon: 'lamp' },
        { name: 'Décoration', icon: 'lamp' },
        { name: 'Couette & Oreillers', icon: 'bed' },
        { name: 'Linge de lit', icon: 'bed' }
      ]
    },
    {
      name: 'chambre2',
      label: 'Chambre 2',
      items: [
        { name: 'Lit double', icon: 'bed' },
        { name: 'Table chevet', icon: 'box' },
        { name: 'Commode', icon: 'dresser' },
        { name: 'Portant à vêtements', icon: 'warehouse' },
        { name: 'Fauteuil', icon: 'armchair' },
        { name: 'Miroir', icon: 'mirror' },
        { name: 'Lampes', icon: 'lamp' },
        { name: 'Décoration', icon: 'lamp' },
        { name: 'Couette & Oreillers', icon: 'bed' },
        { name: 'Linge de lit', icon: 'bed' }
      ]
    },
    {
      name: 'chambre3',
      label: 'Chambre 3',
      items: [
        { name: 'Lit double', icon: 'bed' },
        { name: 'Table chevet', icon: 'box' },
        { name: 'Commode', icon: 'dresser' },
        { name: 'Portant à vêtements', icon: 'warehouse' },
        { name: 'Fauteuil', icon: 'armchair' },
        { name: 'Miroir', icon: 'mirror' },
        { name: 'Lampes', icon: 'lamp' },
        { name: 'Décoration', icon: 'lamp' },
        { name: 'Couette & Oreillers', icon: 'bed' },
        { name: 'Linge de lit', icon: 'bed' }
      ]
    },
    {
      name: 'chambre4',
      label: 'Chambre 4',
      items: [
        { name: 'Lit double', icon: 'bed' },
        { name: 'Table chevet', icon: 'box' },
        { name: 'Commode', icon: 'dresser' },
        { name: 'Portant à vêtements', icon: 'warehouse' },
        { name: 'Fauteuil', icon: 'armchair' },
        { name: 'Miroir', icon: 'mirror' },
        { name: 'Lampes', icon: 'lamp' },
        { name: 'Décoration', icon: 'lamp' },
        { name: 'Couette & Oreillers', icon: 'bed' },
        { name: 'Linge de lit', icon: 'bed' }
      ]
    },
    {
      name: 'cuisine',
      label: 'Cuisine',
      items: [
        { name: 'Plaque cuisson Induction', icon: 'stove' },
        { name: 'Four', icon: 'stove' },
        { name: 'Micro-onde', icon: 'microwave' },
        { name: 'Réfrigérateur', icon: 'refrigerator' },
        { name: 'Congélateur', icon: 'refrigerator' },
        { name: 'Hotte', icon: 'stove' },
        { name: 'Cafetière', icon: 'coffee-maker' },
        { name: 'Machine à café', icon: 'coffee-maker' },
        { name: 'Table', icon: 'box' },
        { name: 'Chaises', icon: 'chair' },
        { name: 'Poubelle', icon: 'box' },
        { name: 'Vaisselle', icon: 'box' },
        { name: 'Couverts', icon: 'box' },
        { name: 'Ustensiles & Plats', icon: 'box' },
        { name: 'Poêles & Casseroles', icon: 'box' },
        { name: 'Carafe', icon: 'box' },
        { name: 'Linge de maison', icon: 'box' }
      ]
    }
  ];

  const renderIcon = (iconName: string) => {
    if (dynamicIcons.includes(iconName)) {
      return (
        <i 
          data-lucide={iconName} 
          className="w-4 h-4 inline-block"
          key={iconName}
        ></i>
      );
    }
    
    // Fallback to React components for icons we have
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
      default: return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <MotionCard
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 bg-white rounded-xl shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        Checklist Inventaire
      </h2>

      <Accordion type="multiple" defaultValue={rooms.map(room => room.name)} className="space-y-4">
        {rooms.map((room) => (
          <AccordionItem 
            key={room.name}
            value={room.name} 
            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                  {roomIcons[room.name as keyof typeof roomIcons]}
                </div>
                <span className="font-semibold text-gray-800">{room.label}</span>
              </div>
              <div className="text-sm text-gray-500">
                {room.items.length} élements
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-0 pt-0 pb-0">
              <motion.div
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                <div className="overflow-x-auto">
                  <Table className="min-w-full">
                    <Table.Header className="bg-gray-50">
                      <Table.Row>
                        <Table.Column className="pl-6">Element</Table.Column>
                        <Table.Column align="center">Quantité</Table.Column>
                        <Table.Column align="center">Condition</Table.Column>
                        <Table.Column>Notes</Table.Column>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body className="divide-y divide-gray-200">
                      {room.items.map((item) => {
                        const itemId = item.name.toLowerCase().replace(/[ &]/g, '_');
                        return (
                          <Table.Row key={itemId} className="hover:bg-gray-50">
                            <Table.Cell className="pl-6 py-4 font-medium flex items-center gap-3">
                              
                              {item.name}
                            </Table.Cell>
                            <Table.Cell>
                              <Input
                                type="number"
                                min="0"
                                {...register(`inventory.${room.name}.${itemId}.quantity`)}
                                className="w-20 mx-auto focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                              />
                            </Table.Cell>
                            <Table.Cell>
                              <div className="flex justify-center gap-2">
                                <Controller
                                  name={`inventory.${room.name}.${itemId}.condition`}
                                  control={control}
                                  render={({ field }) => (
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(field.value === 'good' ? '' : 'good')}
                                      className={`p-1 rounded-md ${field.value === 'good' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                      title="Good"
                                    >
                                      ✅
                                    </button>
                                  )}
                                />
                                <Controller
                                  name={`inventory.${room.name}.${itemId}.condition`}
                                  control={control}
                                  render={({ field }) => (
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(field.value === 'average' ? '' : 'average')}
                                      className={`p-1 rounded-md ${field.value === 'average' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                      title="Average"
                                    >
                                      ⚠️
                                    </button>
                                  )}
                                />
                                <Controller
                                  name={`inventory.${room.name}.${itemId}.condition`}
                                  control={control}
                                  render={({ field }) => (
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(field.value === 'bad' ? '' : 'bad')}
                                      className={`p-1 rounded-md ${field.value === 'bad' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                      title="Bad"
                                    >
                                      ❌
                                    </button>
                                  )}
                                />
                                <Controller
                                  name={`inventory.${room.name}.${itemId}.condition`}
                                  control={control}
                                  render={({ field }) => (
                                    <button
                                      type="button"
                                      onClick={() => field.onChange(field.value === 'absent' ? '' : 'absent')}
                                      className={`p-1 rounded-md ${field.value === 'absent' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                      title="Absent"
                                    >
                                      🚫
                                    </button>
                                  )}
                                />
                              </div>
                            </Table.Cell>
                            <Table.Cell>
                              <Input
                                {...register(`inventory.${room.name}.${itemId}.comments`)}
                                placeholder="Ajouter des notes..."
                                className="w-full focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                              />
                            </Table.Cell>
                          </Table.Row>
                        );
                      })}
                    </Table.Body>
                  </Table>
                </div>
              </motion.div>
            </AccordionContent>
          </AccordionItem>
        ))}

        <AccordionItem value="signatures" className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow mt-6">
          <AccordionTrigger className="px-6 py-4 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                {roomIcons.signatures}
              </div>
              <span className="font-semibold text-gray-800">Signatures</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pt-2 pb-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <User className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Properiétaire</h4>
                </div>
                <Input
                  label="Location"
                  {...register('inventorySignatures.owner.location')}
                  className="focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                />
                <Input
                  label="Date"
                  type="date"
                  {...register('inventorySignatures.owner.date')}
                  className="focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                />
                <Input
                  label="Par"
                  {...register('inventorySignatures.owner.name')}
                  className="focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                />
              </div>

              <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                    <User className="w-5 h-5" />
                  </div>
                  <h4 className="font-semibold text-gray-800">Locataire</h4>
                </div>
                <Input
                  label="Location"
                  {...register('inventorySignatures.tenant.location')}
                  className="focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                />
                <Input
                  label="Date"
                  type="date"
                  {...register('inventorySignatures.tenant.date')}
                  className="focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                />
                <Input
                  label="Par"
                  {...register('inventorySignatures.tenant.name')}
                  className="focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 rounded-md"
                />
              </div>
            </motion.div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </MotionCard>
  );
}
