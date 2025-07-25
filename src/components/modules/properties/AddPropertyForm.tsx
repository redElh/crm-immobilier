// properties/AddPropertyForm.tsx
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs/Tabs';
import { Icon } from '../../../components/ui/Icon';
import { BackLink } from '../../../components/ui/BackLink';
import { GeneralTab } from './AddPropertyForm/GeneralTab';
import { OwnerTab } from './AddPropertyForm/OwnerTab';
import { PropertyTab } from './AddPropertyForm/PropertyTab';
import { ExteriorTab } from './AddPropertyForm/ExteriorTab';
import { InteriorTab } from './AddPropertyForm/InteriorTab';
import { EquipmentTab } from './AddPropertyForm/EquipmentTab';
import { InventoryTab } from './AddPropertyForm/InventoryTab';

export default function AddPropertyForm() {
  const { type } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, control, watch, setValue } = useForm();
  
  
  const currentTab = watch('currentTab') || 'general';
  const ownerType = watch('ownerType');
  const furnishing = watch('furnishing'); // Add this line to watch furnishing

  const onSubmit = (data: any) => {
    console.log('Form data:', data);
    navigate(`/properties/add/?type=${type || 'residential'}`);
  };

  return (
    <div className="p-6">
      <div className="mb-4">
        <BackLink />
      </div>

      <h1 className="text-2xl font-bold mb-6">Ajouter un nouveau bien</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={currentTab} onValueChange={(tab) => setValue('currentTab', tab)}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="general">
              <Icon name="info" className="w-4 h-4 mr-2" />
              Général
            </TabsTrigger>
            <TabsTrigger value="owner">
              <Icon name="user" className="w-4 h-4 mr-2" />
              Propriétaire
            </TabsTrigger>
            <TabsTrigger value="property">
              <Icon name="home" className="w-4 h-4 mr-2" />
              Caractéristiques
            </TabsTrigger>
            <TabsTrigger value="exterior">
              <Icon name="tree" className="w-4 h-4 mr-2" />
              Extérieur
            </TabsTrigger>
            <TabsTrigger value="interior">
              <Icon name="layout" className="w-4 h-4 mr-2" />
              Intérieur
            </TabsTrigger>
            <TabsTrigger value="equipment">
              <Icon name="settings" className="w-4 h-4 mr-2" />
              Équipements
            </TabsTrigger>
            {furnishing === 'meuble' && (
              <TabsTrigger value="inventory">
                <Icon name="list" className="w-4 h-4 mr-2" />
                Inventaire
              </TabsTrigger>
            )}
          </TabsList>

          {/* Onglet Général */}
          <TabsContent value="general">
            <GeneralTab register={register} control={control} watch={watch} />
          </TabsContent>

          {/* Onglet Propriétaire */}
          <TabsContent value="owner">
            <OwnerTab control={control} register={register} watch={watch}/>
          </TabsContent>

          {/* Onglet Caractéristiques du bien */}
          <TabsContent value="property">
            <PropertyTab control={control} register={register} />
          </TabsContent>

          {/* Onglet Extérieur */}
          <TabsContent value="exterior">
            <ExteriorTab control={control} register={register} watch={watch} />
          </TabsContent>

          {/* Onglet Intérieur */}
          <TabsContent value='interior'>
            <InteriorTab control={control} register={register} watch={watch}/>
          </TabsContent>
          {/* Onglet Équipements */}
          <TabsContent value="equipment">
            <EquipmentTab control={control} register={register} watch={watch}/>
          </TabsContent>

          {/* Onglet Inventaire */}
          {furnishing === 'meuble' && (
          <TabsContent value="inventory">
            <InventoryTab control={control} register={register} watch={watch}/>
          </TabsContent>
          )}



        </Tabs>

        <div className="flex justify-end gap-4 mt-8">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            Annuler
          </Button>
          <Button type="submit">Enregistrer</Button>
        </div>
      </form>
    </div>
  );
}