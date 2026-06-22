import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/Tabs/Tabs';
import { Icon } from '../../../components/ui/Icon';
import { BackLink } from '../../../components/ui/BackLink';
import { GeneralTab } from './AddPropertyForm/GeneralTab';
import { OwnerTab } from './AddPropertyForm/OwnerTab';
import { PropertyTab } from './AddPropertyForm/PropertyTab';
import { ExteriorTab } from './AddPropertyForm/ExteriorTab';
import { InteriorTab } from './AddPropertyForm/InteriorTab';
import { EquipmentTab } from './AddPropertyForm/EquipmentTab';
import { InventoryTab } from './AddPropertyForm/InventoryTab';
import { PricingTab } from './AddPropertyForm/PricingTab';
import { DiagnosticsTab } from './AddPropertyForm/DiagnosticsTab';
import { ProximitiesTab } from './AddPropertyForm/ProximitiesTab';
import { SeasonalTab } from './AddPropertyForm/SeasonalTab';
import { LandTab } from './AddPropertyForm/LandTab';
import { CommercialTab } from './AddPropertyForm/CommercialTab';
import { LuxuryTab } from './AddPropertyForm/LuxuryTab';
import { MandateTab } from './AddPropertyForm/MandateTab';
import { MarketingTab } from './AddPropertyForm/MarketingTab';
import { TransfertTab } from './AddPropertyForm/TransfertTab';
import { DocumentsTab } from './AddPropertyForm/DocumentsTab';
import { CalendarTab } from './AddPropertyForm/CalendarTab';
import { ReservationsTab } from './AddPropertyForm/ReservationsTab';
import { ContratTab } from './AddPropertyForm/ContratTab';

type TabDef = {
  id: string;
  label: string;
  icon: string;
  show: (type: string, transactionType?: string, furnishing?: string) => boolean;
};

const getTabs = (type: string, transactionType?: string, furnishing?: string): TabDef[] => {
  const baseTabs: TabDef[] = [
    { id: 'general', label: 'Général', icon: 'info', show: () => true },
    { id: 'owner', label: 'Propriétaire', icon: 'user', show: () => true },
  ];

  const typeSpecificTabs: Record<string, TabDef[]> = {
    residential: [
      {
        id: 'pricing', label: 'Prix et Honoraires', icon: 'dollar-sign',
        show: () => true,
      },
      {
        id: 'property', label: 'Caractéristiques', icon: 'home',
        show: () => true,
      },
      {
        id: 'diagnostics', label: 'Diagnostics', icon: 'file-text',
        show: () => true,
      },
      {
        id: 'exterior', label: 'Extérieur', icon: 'tree',
        show: () => true,
      },
      {
        id: 'interior', label: 'Intérieur', icon: 'layout',
        show: () => true,
      },
      {
        id: 'equipment', label: 'Équipements', icon: 'settings',
        show: () => true,
      },
      {
        id: 'proximities', label: 'Proximités', icon: 'map-pin',
        show: () => true,
      },
      {
        id: 'mandate', label: 'Mandat', icon: 'file',
        show: () => true,
      },
      {
        id: 'transfert', label: 'Transfert', icon: 'share-2',
        show: () => true,
      },
      {
        id: 'documents', label: 'Documents', icon: 'folder',
        show: () => true,
      },
      {
        id: 'inventory', label: 'Inventaire', icon: 'list',
        show: (_t, _tt, f) => f === 'meuble',
      },
    ],
    vacation: [
      {
        id: 'pricing', label: 'Prix', icon: 'dollar-sign',
        show: () => true,
      },
      {
        id: 'property', label: 'Caractéristiques', icon: 'home',
        show: () => true,
      },
      {
        id: 'exterior', label: 'Extérieur', icon: 'tree',
        show: () => true,
      },
      {
        id: 'interior', label: 'Intérieur', icon: 'layout',
        show: () => true,
      },
      {
        id: 'equipment', label: 'Équipements', icon: 'settings',
        show: () => true,
      },
      {
        id: 'seasonal', label: 'Grille & Options', icon: 'settings',
        show: () => true,
      },
      {
        id: 'disponibilites', label: 'Disponibilités', icon: 'calendar',
        show: () => true,
      },
      {
        id: 'proximities', label: 'Proximités', icon: 'map-pin',
        show: () => true,
      },
      {
        id: 'reservations', label: 'Réservations', icon: 'book',
        show: () => true,
      },
      {
        id: 'contrat', label: 'Contrat', icon: 'file-text',
        show: () => true,
      },
      {
        id: 'transfert', label: 'Transfert', icon: 'share-2',
        show: () => true,
      },
      {
        id: 'documents', label: 'Documents', icon: 'folder',
        show: () => true,
      },
      {
        id: 'inventory', label: 'Inventaire', icon: 'list',
        show: (_t, _tt, f) => f === 'meuble',
      },
    ],
    commercial: [
      {
        id: 'pricing', label: 'Prix et Honoraires', icon: 'dollar-sign',
        show: () => true,
      },
      {
        id: 'property', label: 'Caractéristiques', icon: 'home',
        show: () => true,
      },
      {
        id: 'exterior', label: 'Extérieur', icon: 'tree',
        show: () => true,
      },
      {
        id: 'equipment', label: 'Équipements', icon: 'settings',
        show: () => true,
      },
      {
        id: 'interior', label: 'Intérieur', icon: 'layout',
        show: () => true,
      },
      {
        id: 'diagnostics', label: 'Diagnostics', icon: 'file-text',
        show: () => true,
      },
      {
        id: 'proximities', label: 'Proximités', icon: 'map-pin',
        show: () => true,
      },
      {
        id: 'mandate', label: 'Mandat', icon: 'file',
        show: () => true,
      },
      {
        id: 'commercial', label: 'Juridique', icon: 'briefcase',
        show: () => true,
      },
      {
        id: 'transfert', label: 'Transfert', icon: 'share-2',
        show: () => true,
      },
      {
        id: 'documents', label: 'Documents', icon: 'folder',
        show: () => true,
      },
    ],
    land: [
      {
        id: 'pricing', label: 'Prix', icon: 'dollar-sign',
        show: () => true,
      },
      {
        id: 'property', label: 'Caractéristiques', icon: 'home',
        show: () => true,
      },
      {
        id: 'land', label: 'Constructibilité', icon: 'map',
        show: () => true,
      },
      {
        id: 'proximities', label: 'Proximités', icon: 'map-pin',
        show: () => true,
      },
      {
        id: 'diagnostics', label: 'Diagnostics', icon: 'file-text',
        show: () => true,
      },
      {
        id: 'transfert', label: 'Transfert', icon: 'share-2',
        show: () => true,
      },
      {
        id: 'documents', label: 'Documents', icon: 'folder',
        show: () => true,
      },
      {
        id: 'mandate', label: 'Mandat', icon: 'file',
        show: () => true,
      },
    ],
    luxury: [
      {
        id: 'pricing', label: 'Prix', icon: 'dollar-sign',
        show: () => true,
      },
      {
        id: 'property', label: 'Caractéristiques', icon: 'home',
        show: () => true,
      },
      {
        id: 'exterior', label: 'Extérieur', icon: 'tree',
        show: () => true,
      },
      {
        id: 'interior', label: 'Intérieur', icon: 'layout',
        show: () => true,
      },
      {
        id: 'proximities', label: 'Proximités', icon: 'map-pin',
        show: () => true,
      },
      {
        id: 'diagnostics', label: 'Diagnostics', icon: 'file-text',
        show: () => true,
      },
      {
        id: 'luxury', label: 'Confidentialité', icon: 'lock',
        show: () => true,
      },
      {
        id: 'mandate', label: 'Mandat', icon: 'file',
        show: () => true,
      },
      {
        id: 'transfert', label: 'Transfert', icon: 'share-2',
        show: () => true,
      },
      {
        id: 'documents', label: 'Documents', icon: 'folder',
        show: () => true,
      },
      {
        id: 'marketing', label: 'Marketing', icon: 'share-2',
        show: () => true,
      },
    ],
  };

  const tabs = typeSpecificTabs[type] || typeSpecificTabs.residential;
  return [...baseTabs, ...tabs.filter(t => t.show(type, transactionType, furnishing))];
};

export default function AddPropertyForm() {
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || 'residential';
  const navigate = useNavigate();
  const { register, handleSubmit, control, watch, setValue } = useForm();

  const currentTab = watch('currentTab') || 'general';
  const furnishing = watch('furnishing');
  const transactionType = watch('transactionType');

  const tabs = getTabs(type, transactionType, furnishing);

  const onSubmit = (data: any) => {
    console.log('Form data:', { ...data, propertyType: type });
  };

  const setTab = (tab: string) => setValue('currentTab', tab);

  const tabComponents: Record<string, React.ReactNode> = {
    general: <GeneralTab register={register} control={control} watch={watch} propertyType={type} />,
    owner: <OwnerTab control={control} register={register} watch={watch} />,
    property: <PropertyTab control={control} register={register} propertyType={type} />,
    exterior: <ExteriorTab control={control} register={register} propertyType={type} />,
    interior: <InteriorTab control={control} register={register} watch={watch} propertyType={type} />,
    equipment: <EquipmentTab control={control} register={register} watch={watch} />,
    inventory: <InventoryTab control={control} register={register} watch={watch} />,
    pricing: <PricingTab register={register} control={control} watch={watch} propertyType={type} />,
    diagnostics: <DiagnosticsTab register={register} control={control} watch={watch} propertyType={type} />,
    proximities: <ProximitiesTab register={register} control={control} />,
    mandate: <MandateTab register={register} control={control} watch={watch} propertyType={type} />,
    documents: <DocumentsTab register={register} control={control} propertyType={type} />,
    calendar: <CalendarTab register={register} control={control} watch={watch} />,
    disponibilites: <CalendarTab register={register} control={control} watch={watch} />,
    seasonal: <SeasonalTab register={register} control={control} watch={watch} />,
    reservations: <ReservationsTab register={register} control={control} watch={watch} />,
    contrat: <ContratTab register={register} control={control} watch={watch} propertyType={type} />,
    land: <LandTab register={register} control={control} />,
    commercial: <CommercialTab register={register} control={control} />,
    luxury: <LuxuryTab register={register} control={control} />,
    marketing: <MarketingTab register={register} control={control} />,
    transfert: <TransfertTab register={register} control={control} />,
  };

  const labelMap: Record<string, string> = {
    residential: 'Résidentiel',
    vacation: 'Vacances',
    commercial: 'Commercial',
    land: 'Terrain',
    luxury: 'Luxe',
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <BackLink />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
          <Icon name="home" className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text">Ajouter un bien - {labelMap[type] || type}</h1>
          <p className="text-sm text-text-secondary mt-0.5">Remplissez les informations du bien immobilier</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={currentTab} onValueChange={setTab}>
          <TabsList className="w-full flex-wrap">
            {tabs.map(({ id, label }) => (
              <TabsTrigger key={id} value={id} className="whitespace-nowrap">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-2">
            {tabComponents[currentTab] || <div className="p-6 text-text-secondary">Section en cours de développement</div>}
          </div>
        </Tabs>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/60">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Annuler
          </Button>
          <div className="flex items-center gap-3">
            {currentTab !== 'general' && (
              <Button type="button" variant="outline" onClick={() => {
                const idx = tabs.findIndex(t => t.id === currentTab);
                if (idx > 0) setTab(tabs[idx - 1].id);
              }}>
                <Icon name="arrow-left" className="w-4 h-4" />
                Précédent
              </Button>
            )}
            {currentTab === tabs[tabs.length - 1].id ? (
              <Button type="submit">Enregistrer</Button>
            ) : (
              <Button type="button" onClick={() => {
                const idx = tabs.findIndex(t => t.id === currentTab);
                if (idx < tabs.length - 1) {
                  setTab(tabs[idx + 1].id);
                }
              }}>
                Suivant
                <Icon name="arrow-right" className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
