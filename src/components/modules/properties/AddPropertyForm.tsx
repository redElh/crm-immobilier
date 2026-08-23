import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
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
import { MandatSaisonniereTab } from './AddPropertyForm/MandatSaisonniereTab';

import { useCompletionScore } from '../../../hooks/useCompletionScore';
import { getPropertyTabs } from '../../../utils/propertyTabs';
import { saveDraft, getDraft, deleteDraft } from '../../../services/draftStorage';
import { mockProperties } from '../../../data/mockProperties';
import {
  addProperty,
  updateProperty,
  generateReference,
  fetchPropertyById,
} from '../../../services/propertyService'
import { createClient } from '../../../services/clientService'
import { useToast } from '../../../components/ui/Toast'
import { usePermission } from '../../../hooks/usePermission'
import { api } from '../../../services/api'
import { uploadFiles, uploadFileReplacing } from '../../../services/uploadService'
import {
  generateMandatSaisonnierPdf,
  mandatSaisonnierHasContent,
} from '../../../services/mandatSaisonnierePdf'

type TabDef = {
  id: string;
  label: string;
  icon: string;
  show: () => boolean;
};

const TAB_ICONS: Record<string, string> = {
  general: 'info',
  owner: 'user',
  pricing: 'dollar-sign',
  property: 'home',
  exterior: 'tree',
  interior: 'layout',
  equipment: 'settings',
  inventory: 'list',
  proximities: 'map-pin',
  mandate: 'file',
  transfert: 'share-2',
  documents: 'folder',
  seasonal: 'settings',
  land: 'map',
  commercial: 'briefcase',
  luxury: 'lock',
  marketing: 'share-2',
  mandat_saisonniere: 'file-text',
};

const ALL_TAB_IDS = Object.keys(TAB_ICONS);

const GERANT_BUTTON_CLASSES = 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white shadow-[0_10px_24px_rgba(144,93,93,0.35)]'

// Stable identity of the auto-generated seasonal rental mandate document
const MANDAT_DOC_ID = 'mandat-location-saisonniere';
const MANDAT_DOC_NAME = 'Mandat de location saisonnière.pdf';

const getTabs = (type: string, furnishing?: string, constructionType?: string): TabDef[] =>
  getPropertyTabs(type, furnishing, constructionType).map((tab) => ({
    id: tab.id,
    label: tab.label,
    icon: TAB_ICONS[tab.id] || 'info',
    show: () => true,
  }));

export default function AddPropertyForm() {
  const canWrite = usePermission('biens-ecriture')
  const canSeeTransfert = usePermission('biens-transfert')
  const [isGerant, setIsGerant] = useState(false)

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => u && setIsGerant(u.role === 'gerant'))
      .catch(() => {})
  }, [])

  const [searchParams, setSearchParams] = useSearchParams();
  const { agentId, adminId, type: paramType, id: paramId } = useParams<{ agentId?: string; adminId?: string; type?: string; id?: string }>();
  const userId = adminId || agentId || 'unknown';
  const type = paramType || searchParams.get('type') || 'residential';
  const draftId = searchParams.get('draftId');
  const navigate = useNavigate();
  const { register, handleSubmit, control, watch, setValue, reset } = useForm<any>({
    defaultValues: {
      clientSearch: '',
      clientId: '',
      ownerType: 'particulier',
    },
  });

  const currentTab = watch('currentTab') || 'general';
  const furnishing = watch('furnishing');
  const transactionType = watch('transactionType');
  const constructionType = watch('constructionType');

  const allValues = watch();
  const score = useCompletionScore(allValues, type, transactionType, furnishing, constructionType);

  const tabs = getTabs(type, furnishing, constructionType).filter((t) => t.id !== 'transfert' || canSeeTransfert);

  // Restore tab from URL (persists across refresh)
  const getInitialTab = useCallback(() => {
    const t = searchParams.get('tab');
    return t && ALL_TAB_IDS.includes(t) ? t : 'general';
  }, [searchParams]);

  useEffect(() => {
    if (draftId) {
      const draft = getDraft(userId, draftId);
      if (draft) {
        reset(draft.data);
        requestAnimationFrame(() => requestAnimationFrame(() => restoreScrollPosition(getInitialTab())));
      }
    }
  }, [draftId, reset, userId]);

  // Initialize tab from URL on first render
  useEffect(() => {
    const tabFromUrl = getInitialTab();
    setValue('currentTab', tabFromUrl);
    const ttFromUrl = searchParams.get('transactionType');
    if (ttFromUrl) {
      setValue('transactionType', ttFromUrl);
    }
  }, []);

  // Auto-set transactionType for vacation properties
  useEffect(() => {
    if (type === 'vacation') {
      setValue('transactionType', 'location_saisonniere');
    }
  }, [type]);

  const editId = paramId || searchParams.get('editId');
  const assignedTo = searchParams.get('assignedTo')
  const assignedType = searchParams.get('assignedType')

  useEffect(() => {
    if (editId) {
      (async () => {
        try {
          const property = await fetchPropertyById(editId)
          reset({
            ...property,
            property: {
              address: property.address,
              city: property.city,
              state: property.propertyState,
              surface: property.surface,
              facadeWidth: property.facadeWidth,
              depth: property.depth,
              pondereSurface: property.pondereSurface,
              ceilingHeight: property.ceilingHeight,
              chargesAnnuelles: property.chargesAnnuelles,
              rooms: property.rooms,
              landSize: property.landSize,

              buildableSurface: property.buildableSurface,
              cadastralReference: property.cadastralReference,
              constructionYear: property.yearBuilt,
              bedrooms: property.bedrooms,
              beds: property.beds,
              description: property.description,
            },
            location: {
              type: property.location,
              exposition: property.exposition,
              currentUse: property.currentUse,
              buildable: property.buildable,
              avna: property.avna,
              latitude: property.latitude,
              longitude: property.longitude,
            },
            mandate: Object.fromEntries(
              Object.entries(property)
                .filter(([k]) => k.startsWith('mandate_'))
                .map(([k, v]) => [k.replace('mandate_', ''), v])
            ),
            owner: {
              lastName: property.owner_lastName || property.owner?.lastName || '',
              firstName: property.owner_firstName || property.owner?.firstName || '',
              email: property.owner_email || property.owner?.email || '',
              phone: property.owner_phone || property.owner?.phone || '',
              address: property.owner_address || property.owner?.address || '',
              profession: property.owner_profession || property.owner?.profession || '',
            },
            company: {
              name: property.company_name || property.company?.name || '',
              legalForm: property.company_legalForm || property.company?.legalForm || '',
              siren: property.company_siren || property.company?.siren || '',
              address: property.company_address || property.company?.address || '',
            },
            saleInfo: {
              motivation: property.saleInfo?.motivation || '',
              purchaseDate: property.saleInfo?.purchaseDate || '',
              listingDuration: property.saleInfo?.listingDuration || '',
              otherProperties: property.saleInfo?.otherProperties || false,
              otherPropertiesDescription: property.saleInfo?.otherPropertiesDescription || '',
            },
            bathroom: {
              count: property.bathroom_count,
              shower: property.bathroom_shower,
              bathtub: property.bathroom_bathtub,
              toiletType: property.bathroom_toiletType,
              parentalSuiteCount: property.bathroom_parentalSuiteCount,
            },
            livingRoom: {
              count: property.livingRoom_count,
              terraceAccess: property.livingRoom_terraceAccess,
              poolAccess: property.livingRoom_poolAccess,
              airConditioned: property.livingRoom_airConditioned,
              bright: property.livingRoom_bright,
              fiber: property.livingRoom_fiber,
              details: property.livingRoom_details,
            },
            bedrooms: {
              total: property.bedrooms_total,
              groundFloor: property.bedrooms_groundFloor,
              parentalSuite: property.bedrooms_parentalSuite,
              airConditioned: property.bedrooms_airConditioned,
              bright: property.bedrooms_bright,
              tv: property.bedrooms_tv,
              exteriorAccess: property.bedrooms_exteriorAccess,
              poolAccess: property.bedrooms_poolAccess,
              details: property.bedrooms_details,
            },
            seasonalPriceMin: property.seasonalPriceMin,
            seasonalPriceMax: property.seasonalPriceMax,
            seasonalPriceWeek: property.seasonalPriceWeek,
            seasonalPriceMonth: property.seasonalPriceMonth,
            sleepingCapacity: property.sleepingCapacity,
            priceGrid: convertGridToForm(property.priceGrid),
            options: convertOptionsToForm(property.options),
            contrat: property.contrat || {},
            reservations: property.reservations || [],
            calendarStatuses: property.calendarStatuses || {},
            blockedDates: property.blockedDates || [],
            currentTab: getInitialTab(),
          })
          requestAnimationFrame(() => requestAnimationFrame(() => restoreScrollPosition(getInitialTab())));
        } catch {
          const property = mockProperties[editId]
          if (property) {
            const p = property as any
            reset({
              ...p,
              property: {
                address: p.address,
                city: p.city,
                state: p.propertyState,
                surface: p.surface,
                facadeWidth: p.facadeWidth,
                depth: p.depth,
                pondereSurface: p.pondereSurface,
                ceilingHeight: p.ceilingHeight,
                chargesAnnuelles: p.chargesAnnuelles,
                rooms: p.rooms,
                landSize: p.landSize,
                buildableSurface: p.buildableSurface,
                cadastralReference: p.cadastralReference,
                constructionYear: p.yearBuilt,
                bedrooms: p.bedrooms,
                beds: p.beds,
                description: p.description,
              },
              location: {
                type: p.location,
                exposition: p.exposition,
                currentUse: p.currentUse,
                buildable: p.buildable,
                avna: p.avna,
                latitude: p.latitude,
                longitude: p.longitude,
              },
              mandate: Object.fromEntries(
                Object.entries(p)
                  .filter(([k]) => k.startsWith('mandate_'))
                  .map(([k, v]) => [k.replace('mandate_', ''), v])
              ),
              owner: {
                lastName: p.owner_lastName || p.owner?.lastName || '',
                firstName: p.owner_firstName || p.owner?.firstName || '',
                email: p.owner_email || p.owner?.email || '',
                phone: p.owner_phone || p.owner?.phone || '',
                address: p.owner_address || p.owner?.address || '',
                profession: p.owner_profession || p.owner?.profession || '',
              },
              company: {
                name: p.company_name || p.company?.name || '',
                legalForm: p.company_legalForm || p.company?.legalForm || '',
                siren: p.company_siren || p.company?.siren || '',
                address: p.company_address || p.company?.address || '',
              },
              saleInfo: {
                motivation: p.saleInfo?.motivation || '',
                purchaseDate: p.saleInfo?.purchaseDate || '',
                listingDuration: p.saleInfo?.listingDuration || '',
                otherProperties: p.saleInfo?.otherProperties || false,
                otherPropertiesDescription: p.saleInfo?.otherPropertiesDescription || '',
              },
              bathroom: {
                count: p.bathroom_count,
                shower: p.bathroom_shower,
                bathtub: p.bathroom_bathtub,
                toiletType: p.bathroom_toiletType,
                parentalSuiteCount: p.bathroom_parentalSuiteCount,
              },
              livingRoom: {
                count: p.livingRoom_count,
                terraceAccess: p.livingRoom_terraceAccess,
                poolAccess: p.livingRoom_poolAccess,
                airConditioned: p.livingRoom_airConditioned,
                bright: p.livingRoom_bright,
                fiber: p.livingRoom_fiber,
                details: p.livingRoom_details,
              },
              bedrooms: {
                total: p.bedrooms_total,
                groundFloor: p.bedrooms_groundFloor,
                parentalSuite: p.bedrooms_parentalSuite,
                airConditioned: p.bedrooms_airConditioned,
                bright: p.bedrooms_bright,
                tv: p.bedrooms_tv,
                exteriorAccess: p.bedrooms_exteriorAccess,
                poolAccess: p.bedrooms_poolAccess,
                details: p.bedrooms_details,
              },
              seasonalPriceMin: p.seasonalPriceMin,
              seasonalPriceMax: p.seasonalPriceMax,
              seasonalPriceWeek: p.seasonalPriceWeek,
              seasonalPriceMonth: p.seasonalPriceMonth,
              sleepingCapacity: p.sleepingCapacity,
              priceGrid: convertGridToForm(p.priceGrid),
              options: convertOptionsToForm(p.options),
              contrat: p.contrat || {},
              reservations: p.reservations || [],
            calendarStatuses: p.calendarStatuses || {},
            blockedDates: p.blockedDates || [],
            currentTab: getInitialTab(),
          })
          requestAnimationFrame(() => requestAnimationFrame(() => restoreScrollPosition(getInitialTab())));
          }
        }
      })()
    }
  }, [editId, reset]);

  const [savedDraftId, setSavedDraftId] = useState<string | undefined>(draftId || undefined);

  // Sync URL tab param → form state on browser back/forward
  const urlTab = searchParams.get('tab');
  useEffect(() => {
    if (urlTab && tabs.some(t => t.id === urlTab) && urlTab !== currentTab) {
      setValue('currentTab', urlTab);
    }
  }, [urlTab]);

  const doSaveDraft = (data: any) => {
    const draft = saveDraft(userId, type, { ...data, _draftId: savedDraftId }, score.overall);
    if (!savedDraftId) setSavedDraftId(draft.id);
    return draft;
  };

  // Auto-save existing draft on form changes (debounced 2s)
  useEffect(() => {
    if (!savedDraftId) return;
    const timer = setTimeout(() => {
      doSaveDraft(allValues);
    }, 2000);
    return () => clearTimeout(timer);
  }, [allValues, savedDraftId]);

  const { toast } = useToast()

  const PERIOD_NAMES: Record<string, string> = {
    basse_saison: 'Basse saison',
    saison_intermediaire: 'Saison intermédiaire',
    haute_saison: 'Haute saison',
    evenements: 'Événements',
  };

  const OPTION_NAMES: Record<string, string> = {
    menage_fin_de_sejour: 'Ménage fin de séjour',
    petit_dejeuner: 'Petit-déjeuner',
    parking_prive: 'Parking privé',
    panier_de_bienvenue: 'Panier de bienvenue',
    lit_bebe: 'Lit bébé',
    location_serviettes_plage: 'Location serviettes plage',
  };

  const toFrDate = (iso: string): string => {
    if (!iso) return '';
    if (iso.includes('/')) return iso;
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const fromFrDate = (fr: string): string => {
    if (!fr) return '';
    if (fr.includes('-')) return fr;
    const [d, m, y] = fr.split('/');
    return `${y}-${m}-${d}`;
  };

  const convertGridToSave = (priceGrid: any) => {
    if (!priceGrid || typeof priceGrid !== 'object') return priceGrid;
    if (Array.isArray(priceGrid)) return priceGrid;
    return Object.entries(priceGrid)
      .filter(([_, v]: [string, any]) => v && (v.start || v.end || v.price))
      .map(([key, v]: [string, any], i) => ({
        id: `p${i + 1}`,
        name: PERIOD_NAMES[key] || key,
        startDate: toFrDate(v.start || ''),
        endDate: toFrDate(v.end || ''),
        pricePerNight: Number(v.price) || 0,
        minNights: Number(v.minNights) || 0,
      }));
  };

  const convertOptionsToSave = (options: any) => {
    if (!options || typeof options !== 'object') return options;
    if (Array.isArray(options)) return options;
    return Object.entries(options)
      .filter(([_, v]: [string, any]) => v && (v.enabled || v.price))
      .map(([key, v]: [string, any], i) => ({
        id: `o${i + 1}`,
        name: OPTION_NAMES[key] || key,
        price: Number(v.price) || 0,
        type: 'unique' as const,
      }));
  };

  const convertGridToForm = (priceGrid: any) => {
    if (!priceGrid) return {};
    if (!Array.isArray(priceGrid)) return priceGrid;
    const result: any = {};
    for (const row of priceGrid) {
      const key = Object.entries(PERIOD_NAMES).find(([_, v]) => v === row.name)?.[0] || `period_${row.id}`;
      result[key] = { start: fromFrDate(row.startDate || ''), end: fromFrDate(row.endDate || ''), price: row.pricePerNight, minNights: row.minNights };
    }
    return result;
  };

  const convertOptionsToForm = (options: any) => {
    if (!options) return {};
    if (!Array.isArray(options)) return options;
    const result: any = {};
    for (const opt of options) {
      const key = Object.entries(OPTION_NAMES).find(([_, v]) => v === opt.name)?.[0] || `option_${opt.id}`;
      result[key] = { enabled: true, price: opt.price };
    }
    return result;
  };

  const clientTypeFromTransaction = (tx?: string) => {
    if (tx === 'location_ld' || tx === 'location_saisonniere') return 'bailleur';
    return 'vendeur';
  };

  const attachMandatSaisonnier = async (payload: any, forcedRef?: string) => {
    if (type !== 'vacation') return;
    const m = payload?.mandatSaisonniere;
    if (!m || !mandatSaisonnierHasContent(m)) return;
    try {
      toast('info', 'Génération du mandat de location saisonnière…');
      const blob = await generateMandatSaisonnierPdf({
        ...m,
        referenceInterne: forcedRef || m.referenceInterne || payload?.reference || '',
      });
      const suffix = forcedRef || m.referenceInterne ? ` - ${forcedRef || m.referenceInterne}` : '';
      const file = new File([blob], `Mandat de location saisonniere${suffix}.pdf`, { type: 'application/pdf' });
      const tree: any[] = Array.isArray(payload.documents?.fileTree) ? [...payload.documents.fileTree] : [];
      // Reuse the previously generated mandat document: update it in place instead of piling up copies
      const idx = tree.findIndex(
        (n) => n?.type === 'file' && (n?.id === MANDAT_DOC_ID || n?.name === MANDAT_DOC_NAME)
      );
      const existing = idx >= 0 ? tree[idx] : null;
      const url =
        existing?.url
          ? await uploadFileReplacing(file, existing.url)
          : (await uploadFiles([file]))[0];
      if (!url) throw new Error("Échec de l'envoi du mandat");
      const now = new Date().toISOString();
      const node = {
        ...(existing || {}),
        id: MANDAT_DOC_ID,
        name: MANDAT_DOC_NAME,
        type: 'file',
        url,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      };
      if (idx >= 0) tree[idx] = node;
      else tree.push(node);
      payload.documents = { ...(payload.documents || {}), fileTree: tree };
      toast(
        'success',
        existing
          ? 'Mandat de location saisonnière mis à jour dans les documents'
          : 'Mandat de location saisonnière généré et ajouté aux documents'
      );
    } catch {
      toast('error', "La génération du mandat PDF a échoué — le bien sera enregistré sans ce document");
    }
  };

  const onSubmit = async (data: any) => {
    if (savedDraftId) deleteDraft(userId, savedDraftId);

    // Strip images to avoid duplication with photos on update
    delete data.images;

    // Strip empty strings from date fields before sending to the backend
    if (data.mandate) {
      if (!data.mandate.startDate) delete data.mandate.startDate
      if (!data.mandate.endDate) delete data.mandate.endDate
    }

    try {
      // If this is a new property with owner info but no linked client, create the client
      if (!editId && !data.clientId) {
        const hasOwnerInfo = data.owner?.lastName || data.owner?.firstName || data.company?.name;
        if (hasOwnerInfo) {
          const clientPayload: Record<string, unknown> = {
            clientType: clientTypeFromTransaction(data.transactionType || transactionType),
            firstName: data.owner?.firstName || '',
            lastName: data.owner?.lastName || '',
            email: data.owner?.email || '',
            phone: data.owner?.phone || '',
            address: data.owner?.address || data.company?.address || '',
            profession: data.owner?.profession || '',
            companyName: data.company?.name || '',
            legalForm: data.company?.legalForm || '',
            siren: data.company?.siren || '',
            agentId: assignedTo && assignedType ? assignedTo : (agentId || ''),
          };
          const created = await createClient(clientPayload);
          data.clientId = created.id;
        }
      }

      const submitData = { ...data, propertyType: type, ...(type === 'vacation' ? { transactionType: 'location_saisonniere' } : {}) };
      if (type === 'vacation') {
        submitData.priceGrid = convertGridToSave(data.priceGrid);
        submitData.options = convertOptionsToSave(data.options);
      }

      if (editId) {
        await attachMandatSaisonnier(submitData, submitData?.reference)
        await updateProperty(editId, submitData)
        toast('success', 'Bien modifié avec succès')
        navigate(`/${userId}/properties/type/${type}/${editId}`, { replace: true })
      } else {
        const ref = await generateReference(type)
        submitData.reference = ref
        await attachMandatSaisonnier(submitData, ref)
        const targetAgentId = assignedTo && assignedType ? assignedTo : (agentId || '')
        await addProperty({ ...submitData, reference: ref, agentId: targetAgentId })

        window.dispatchEvent(new CustomEvent('sq:triggered-notifs-changed'))

        toast('success', assignedTo && assignedType
          ? `Bien attribué avec succès à ${assignedType === 'admin' ? "l'admin" : "l'agent"}`
          : 'Bien ajouté avec succès')

        navigate('..', { replace: true })
      }
    } catch (e: any) {
      toast('error', e.message || 'Erreur lors de la sauvegarde')
    }
  };

  const handleSaveDraft = () => {
    doSaveDraft(watch());
  };

  const setTab = (tab: string) => setValue('currentTab', tab);
  const scrollPositions = useRef<Record<string, number>>({});
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Persist scroll positions across refresh (sessionStorage)
  const scrollStorageKey = `sq-addprop-scroll:${editId || draftId || `new-${type}`}`;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(scrollStorageKey);
      if (raw) scrollPositions.current = { ...JSON.parse(raw) };
    } catch {}
  }, [scrollStorageKey]);

  const saveScrollPosition = useCallback(() => {
    if (contentRef.current) {
      scrollPositions.current[currentTab] = contentRef.current.scrollTop;
      try {
        sessionStorage.setItem(scrollStorageKey, JSON.stringify(scrollPositions.current));
      } catch {}
    }
  }, [currentTab, scrollStorageKey]);

  const restoreScrollPosition = useCallback((tab: string) => {
    requestAnimationFrame(() => {
      if (contentRef.current && scrollPositions.current[tab] != null) {
        contentRef.current.scrollTop = scrollPositions.current[tab];
      }
    });
  }, []);

  // Restore the scroll position of the initial tab after the form/data is rendered
  useEffect(() => {
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => {
      restoreScrollPosition(getInitialTab());
    }));
    return () => cancelAnimationFrame(raf);
  }, [getInitialTab, restoreScrollPosition]);

  const handleTabChange = useCallback((tab: string) => {
    saveScrollPosition();
    setTab(tab);
    restoreScrollPosition(tab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      return next;
    }, { replace: true });
  }, [saveScrollPosition, restoreScrollPosition, setTab, setSearchParams]);

  const handleBackClick = useCallback(() => {
    const idx = tabs.findIndex(t => t.id === currentTab);
    if (idx > 0) {
      saveScrollPosition();
      const prevTab = tabs[idx - 1].id;
      setValue('currentTab', prevTab);
      restoreScrollPosition(prevTab);
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', prevTab);
        return next;
      }, { replace: true });
    } else {
      navigate(-1);
    }
  }, [currentTab, tabs, saveScrollPosition, restoreScrollPosition, setValue, navigate, setSearchParams]);

  const tabComponents: Record<string, React.ReactNode> = {
    general: <GeneralTab register={register} control={control} watch={watch} propertyType={type} setFormValue={setValue} isGerant={isGerant} />,
    owner: <OwnerTab control={control} register={register} watch={watch} setValue={setValue} transactionType={transactionType} isGerant={isGerant} />,
    property: <PropertyTab control={control} register={register} propertyType={type} isGerant={isGerant} watch={watch} setValue={setValue} />,
    exterior: <ExteriorTab control={control} register={register} propertyType={type} isGerant={isGerant} />,
    interior: <InteriorTab control={control} register={register} watch={watch} propertyType={type} isGerant={isGerant} />,
    equipment: <EquipmentTab control={control} register={register} watch={watch} isGerant={isGerant} />,
    inventory: <InventoryTab control={control} register={register} watch={watch} setValue={setValue} propertyType={type} isGerant={isGerant} />,
    pricing: <PricingTab register={register} control={control} watch={watch} propertyType={type} isGerant={isGerant} />,
    proximities: <ProximitiesTab register={register} control={control} isGerant={isGerant} />,
    mandate: <MandateTab register={register} control={control} watch={watch} setValue={setValue} propertyType={type} adminId={adminId} agentId={agentId} editId={editId} assignedTo={assignedTo} assignedType={assignedType} isGerant={isGerant} />,
    documents: <DocumentsTab register={register} control={control} propertyType={type} setFormValue={setValue} isGerant={isGerant} />,
    calendar: <CalendarTab register={register} control={control} watch={watch} isGerant={isGerant} />,
    seasonal: <SeasonalTab register={register} control={control} watch={watch} isGerant={isGerant} />,
    mandat_saisonniere: <MandatSaisonniereTab register={register} control={control} watch={watch} setValue={setValue} isGerant={isGerant} />,
    land: <LandTab register={register} control={control} isGerant={isGerant} />,
    commercial: <CommercialTab register={register} control={control} isGerant={isGerant} />,
    luxury: <LuxuryTab register={register} control={control} isGerant={isGerant} />,
    marketing: <MarketingTab register={register} control={control} isGerant={isGerant} />,
    transfert: <TransfertTab control={control} setValue={setValue} isGerant={isGerant} />,
  };

  const labelMap: Record<string, string> = {
    residential: 'Résidentiel',
    vacation: 'Vacances',
    commercial: 'Commercial',
    land: 'Terrain',
    luxury: 'Luxe',
  };

  if (!canWrite) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <BackLink onClick={handleBackClick} />
        </div>
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center mx-auto mb-3">
              <Icon name="lock" className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold text-text">Accès restreint</h1>
            <p className="text-sm text-text-secondary mt-1">Vous n'avez pas la permission d'ajouter ou modifier des biens.</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={handleBackClick}>Retour</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <BackLink onClick={handleBackClick} />
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className={`p-2.5 rounded-xl ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
          <Icon name="home" className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text">{editId ? 'Modifier un bien' : 'Ajouter un bien'} - {labelMap[type] || type}</h1>
          <p className="text-sm text-text-secondary mt-0.5">{editId ? 'Modifiez les informations du bien' : 'Remplissez les informations du bien immobilier'}</p>
        </div>
        <div className="flex items-center gap-3">
          {savedDraftId ? (
            <span className="flex items-center gap-1.5 px-3 py-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg">
              <Icon name="check" className="w-4 h-4" />
              Auto-sauvegardé
            </span>
          ) : (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-3 py-2 text-sm rounded-lg border border-border/60 hover:bg-border/20 transition-colors"
            >
              <Icon name="save" className="w-4 h-4 inline mr-1" />
              Brouillon
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          accentClass={isGerant ? 'text-[#905D5D]' : ''}
          accentBgClass={isGerant ? 'bg-[#905D5D]' : ''}
        >
          <TabsList className="w-full flex-wrap">
            {tabs.map(({ id, label }) => (
              <TabsTrigger key={id} value={id} className="whitespace-nowrap">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div ref={contentRef} className="mt-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 320px)' }}>
            {tabComponents[currentTab] || <div className="p-6 text-text-secondary">Section en cours de développement</div>}
          </div>
        </Tabs>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/60">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" onClick={handleBackClick}>
              Annuler
            </Button>
            {!savedDraftId && (
              <Button type="button" variant="outline" onClick={handleSaveDraft}>
                <Icon name="save" className="w-4 h-4" />
                Enregistrer comme brouillon
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentTab !== 'general' && (
              <Button type="button" variant="outline" onClick={() => {
                const idx = tabs.findIndex(t => t.id === currentTab);
                if (idx > 0) handleTabChange(tabs[idx - 1].id);
              }}>
                <Icon name="arrow-left" className="w-4 h-4" />
                Précédent
              </Button>
            )}
            {editId || currentTab === tabs[tabs.length - 1].id ? (
              <Button type="submit" className={isGerant ? GERANT_BUTTON_CLASSES : ''}>
                Enregistrer
              </Button>
            ) : (
              <Button type="button" className={isGerant ? GERANT_BUTTON_CLASSES : ''} onClick={() => {
                const idx = tabs.findIndex(t => t.id === currentTab);
                if (idx < tabs.length - 1) handleTabChange(tabs[idx + 1].id);
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
