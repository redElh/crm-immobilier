import { useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Input } from '../../../../components/ui/Input';
import { DatePicker } from '../../../../components/ui/DatePicker';
import { Icon } from '../../../../components/ui/Icon';
import { Users, Home, Clock, Percent, CreditCard, Clipboard, Calendar } from 'react-feather';
import { SectionCard, Field, FieldGrid } from './stage';

const M = 'mandatSaisonniere';

interface MandatSaisonniereTabProps {
  register: any;
  control: any;
  watch: any;
  setValue: any;
  isGerant?: boolean;
}

const DUREE_OPTIONS = [
  { value: 'un_an', label: 'Un (1) an', sub: 'Renouvelable par tacite reconduction' },
  { value: 'deux_ans', label: 'Deux (2) ans', sub: 'Renouvelable par tacite reconduction' },
  { value: 'determinee', label: 'Durée déterminée', sub: 'À préciser' },
];

export function MandatSaisonniereTab({ register, control, watch, setValue, isGerant = false }: MandatSaisonniereTabProps) {
  const accent = isGerant ? '#905D5D' : undefined;
  const dotCls = isGerant ? 'bg-[#905D5D]' : 'bg-accent';
  const prefilledRef = useRef(false);

  const prefillFromProperty = () => {
    try {
      const v = watch() || {};
      const get = (...paths: string[]) => {
        for (const p of paths) {
          const val = p.split('.').reduce((acc: any, k) => (acc == null ? undefined : acc[k]), v);
          if (val !== undefined && val !== null && String(val).trim() !== '') return val;
        }
        return undefined;
      };
      const owner = v.owner || {};
      const property = v.property || {};
      const patches: Record<string, string> = {};

      const nom = get('owner.firstName', 'mandatSaisonniere.nomPrenom');
      const lastName = get('owner.lastName');
      const fullNom = [nom, lastName].filter(Boolean).join(' ');
      if (fullNom && !get(`${M}.nomPrenom`)) patches.nomPrenom = fullNom;
      if (!patches.nomPrenom && !get(`${M}.nomPrenom`) && (owner.companyName || owner.company)) {
        patches.nomPrenom = owner.companyName || owner.company;
      }

      const addrOwner = get('owner.address');
      if (addrOwner && !get(`${M}.adresseMandant`)) patches.adresseMandant = addrOwner;
      const tel = get('owner.phone1', 'owner.phone', 'owner.mobile');
      if (tel && !get(`${M}.telephone`)) patches.telephone = tel;
      const email = get('owner.email');
      if (email && !get(`${M}.email`)) patches.email = email;
      const cin = get('owner.cin', 'owner.idCard', 'owner.rc');
      if (cin && !get(`${M}.cinPasseportRc`)) patches.cinPasseportRc = cin;

      const ct = get('constructionType') || get('property.constructionType');
      if (ct && !get(`${M}.natureBien`)) {
        patches.natureBien = String(ct).charAt(0).toUpperCase() + String(ct).slice(1);
      }
      const addrBien = [get('property.address'), get('address')].filter(Boolean)[0];
      const cityBien = [get('property.city'), get('city')].filter(Boolean)[0];
      const fullAddr = [addrBien, cityBien].filter(Boolean).join(', ');
      if (fullAddr && !get(`${M}.adresseBien`)) patches.adresseBien = fullAddr;

      const superficie = get('property.surface', 'surface');
      if (superficie !== undefined && !get(`${M}.superficie`)) patches.superficie = String(superficie);
      const pieces = get('bedrooms.total', 'bedrooms_total', 'rooms.total', 'rooms_total');
      if (pieces !== undefined && !get(`${M}.nbPieces`)) patches.nbPieces = String(pieces);
      const chambres = get('bedrooms.count', 'bedrooms_count', 'bedroomsTotal', 'chambres');
      if (chambres !== undefined && !get(`${M}.nbChambres`)) patches.nbChambres = String(chambres);
      const capacite = get('sleepingCapacity', 'capacity');
      if (capacite !== undefined && !get(`${M}.capaciteAccueil`)) patches.capaciteAccueil = String(capacite);
      const etage = get('floor', 'property.floor', 'etage');
      if (etage !== undefined && !get(`${M}.etageNiveau`)) patches.etageNiveau = String(etage);
      const ref = get('reference');
      if (ref && !get(`${M}.referenceInterne`)) patches.referenceInterne = ref;

      Object.entries(patches).forEach(([k, val]) => setValue(`${M}.${k}`, val, { shouldDirty: true }));
    } catch {
      /* prefill is best-effort */
    }
  };

  // Auto-prefill once when the tab opens and the mandat section is still empty
  useEffect(() => {
    const t = setTimeout(() => {
      if (prefilledRef.current) return;
      prefilledRef.current = true;
      const current = watch(M);
      const empty = !current || Object.values(current).every(val =>
        val == null || (typeof val === 'string' && val.trim() === '')
      );
      if (empty) prefillFromProperty();
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <div className={`px-6 py-4 flex items-start gap-3 rounded-2xl border border-border/40 ${isGerant ? 'bg-[#905D5D]/5' : 'bg-accent/5'}`}>
        <div className={`p-2 rounded-lg shrink-0 ${isGerant ? 'bg-[#905D5D]/10 text-[#905D5D]' : 'bg-accent/10 text-accent'}`}>
          <Icon name="file-text" className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text">Mandat de location saisonnière</p>
          <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
            Renseignez les informations du mandat : à l'enregistrement du bien, un PDF pré-rempli sera généré automatiquement et ajouté dans l'onglet « Documents ».
          </p>
        </div>
        <button
          type="button"
          onClick={prefillFromProperty}
          className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            isGerant
              ? 'border-[#905D5D]/30 text-[#905D5D] hover:bg-[#905D5D]/10'
              : 'border-accent/30 text-accent hover:bg-accent/10'
          }`}
        >
          <Icon name="copy" className="w-3 h-3 inline mr-1 -mt-0.5" />
          Compléter depuis le bien
        </button>
      </div>

      <SectionCard value="mandant" title="Le mandant (propriétaire)" icon={Users} subtitle="Informations du propriétaire" defaultOpen>
        <FieldGrid>
          <Field className="md:col-span-2">
            <Input label="Nom & prénom / Dénomination sociale" placeholder="Ex : Karim El Amrani" {...register(`${M}.nomPrenom`)} />
          </Field>
          <Field>
            <Input label="CIN / Passeport / RC" placeholder="N° pièce d'identité" {...register(`${M}.cinPasseportRc`)} />
          </Field>
          <Field>
            <Input label="Nationalité" placeholder="Ex : Marocaine" {...register(`${M}.nationalite`)} />
          </Field>
          <Field className="md:col-span-2">
            <Input label="Adresse du mandant" placeholder="Adresse complète" {...register(`${M}.adresseMandant`)} />
          </Field>
          <Field>
            <Input label="Téléphone" type="tel" placeholder="+212 6 00 00 00 00" {...register(`${M}.telephone`)} />
          </Field>
          <Field>
            <Input label="Email" type="email" placeholder="contact@exemple.com" {...register(`${M}.email`)} />
          </Field>
        </FieldGrid>
      </SectionCard>

      <SectionCard value="bien" title="Désignation du bien" icon={Home} subtitle="Caractéristiques du bien loué" defaultOpen>
        <FieldGrid>
          <Field>
            <Input label="Nature du bien" placeholder="Ex : Appartement meublé" {...register(`${M}.natureBien`)} />
          </Field>
          <Field>
            <Input label="Titre foncier n°" placeholder="Ex : TF 12345" {...register(`${M}.titreFoncier`)} />
          </Field>
          <Field className="md:col-span-2">
            <Input label="Adresse du bien" placeholder="Adresse complète du bien loué" {...register(`${M}.adresseBien`)} />
          </Field>
          <Field>
            <Input label="Superficie" type="number" min="0" placeholder="120" suffix={<span className="text-xs text-text-secondary">m²</span>} {...register(`${M}.superficie`)} />
          </Field>
          <Field>
            <Input label="Référence interne" placeholder="Générée automatiquement si vide" {...register(`${M}.referenceInterne`)} />
          </Field>
          <Field>
            <Input label="Nombre de pièces" type="number" min="0" placeholder="4" {...register(`${M}.nbPieces`)} />
          </Field>
          <Field>
            <Input label="Nombre de chambres" type="number" min="0" placeholder="2" {...register(`${M}.nbChambres`)} />
          </Field>
          <Field>
            <Input label="Capacité d'accueil" type="number" min="0" placeholder="6" suffix={<span className="text-xs text-text-secondary">pers.</span>} {...register(`${M}.capaciteAccueil`)} />
          </Field>
          <Field>
            <Input label="Étage / niveau" placeholder="Ex : 3ème étage, RDC" {...register(`${M}.etageNiveau`)} />
          </Field>
        </FieldGrid>
      </SectionCard>

      <SectionCard value="duree" title="Durée du mandat" icon={Clock} subtitle="Durée convenue et dates clés" defaultOpen>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-text block mb-2">Durée convenue</label>
            <Controller
              name={`${M}.dureeType`}
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DUREE_OPTIONS.map(opt => {
                    const active = field.value === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => field.onChange(active ? '' : opt.value)}
                        className={`text-left p-3.5 rounded-xl border-2 transition-all duration-200 ${
                          active
                            ? isGerant
                              ? 'border-[#905D5D] bg-[#905D5D]/5 shadow-sm'
                              : 'border-accent bg-accent/5 shadow-sm'
                            : 'border-border hover:border-text-secondary/30 bg-card'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-semibold ${active ? (isGerant ? 'text-[#905D5D]' : 'text-accent') : 'text-text'}`}>{opt.label}</span>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? (isGerant ? 'border-[#905D5D]' : 'border-accent') : 'border-border'}`}>
                            {active && <div className={`w-2 h-2 rounded-full ${dotCls}`} />}
                          </div>
                        </div>
                        <p className="text-xs text-text-secondary mt-1">{opt.sub}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            />
          </div>
          <div>
            <Input
              label="Précision de la durée déterminée"
              placeholder="Ex : 6 mois à compter de la signature"
              {...register(`${M}.dureeDeterminee`)}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name={`${M}.dateEffet`}
              control={control}
              render={({ field }) => (
                <DatePicker label="Date d'effet" value={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              name={`${M}.dateEcheance`}
              control={control}
              render={({ field }) => (
                <DatePicker label="Date d'échéance" value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard value="tarifs" title="Tarification & honoraires" icon={Percent} subtitle="Remises et montants de l'agence" defaultOpen>
        <div className="space-y-4">
          <div>
            <Input
              label="Remises tarifaires autorisées (limite)"
              type="number" min="0" max="100"
              placeholder="Ex : 10"
              suffix={<span className="text-xs text-text-secondary">% max</span>}
              {...register(`${M}.remiseLimitePct`)}
            />
            <p className="text-xs text-text-secondary mt-1.5 ml-1">L'agence pourra consentir des remises jusqu'à ce plafond sans accord préalable.</p>
          </div>
          <div className="overflow-x-auto rounded-lg border border-border/30">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-background/50">
                  <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Poste</th>
                  <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider w-56">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                <tr className="hover:bg-background/30 transition-colors">
                  <td className="p-3 font-medium text-text">Commission / honoraires de l'agence</td>
                  <td className="p-3">
                    <Input type="number" min="0" max="100" placeholder="15" suffix={<span className="text-xs text-text-secondary">%</span>} {...register(`${M}.commissionPct`)} />
                  </td>
                </tr>
                <tr className="hover:bg-background/30 transition-colors">
                  <td className="p-3 font-medium text-text">Frais de mise en location</td>
                  <td className="p-3">
                    <Input type="number" min="0" placeholder="1500" suffix={<span className="text-xs text-text-secondary">MAD</span>} {...register(`${M}.miseEnLocationMad`)} />
                  </td>
                </tr>
                <tr className="hover:bg-background/30 transition-colors">
                  <td className="p-3 font-medium text-text">Forfait ménage (par séjour)</td>
                  <td className="p-3">
                    <Input type="number" min="0" placeholder="300" suffix={<span className="text-xs text-text-secondary">MAD</span>} {...register(`${M}.menageMad`)} />
                  </td>
                </tr>
                <tr className="hover:bg-background/30 transition-colors">
                  <td className="p-3 font-medium text-text">État des lieux</td>
                  <td className="p-3">
                    <Input type="number" min="0" placeholder="400" suffix={<span className="text-xs text-text-secondary">MAD</span>} {...register(`${M}.etatLieuxMad`)} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>

      <SectionCard value="depot" title="Dépôt de garantie" icon={CreditCard} subtitle="Montant, pourcentage et délai de restitution" defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Field>
            <Input label="Montant du dépôt" type="number" min="0" placeholder="5000" suffix={<span className="text-xs text-text-secondary">MAD</span>} {...register(`${M}.depotMontantMad`)} />
          </Field>
          <Field>
            <Input label="Ou en pourcentage du loyer" type="number" min="0" max="100" placeholder="25" suffix={<span className="text-xs text-text-secondary">%</span>} {...register(`${M}.depotPourcent`)} />
          </Field>
          <Field>
            <Input label="Restitution sous" type="number" min="0" placeholder="7" suffix={<span className="text-xs text-text-secondary">jours ouvrables</span>} {...register(`${M}.depotDelaiJours`)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard value="annexe1" title="Annexe 1 — État descriptif du bien" icon={Clipboard} subtitle="Équipements et état du bien" defaultOpen>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Cuisine (équipement)" placeholder="Ex : entièrement équipée" {...register(`${M}.equipCuisine`)} />
            <Input label="Électroménager" placeholder="Ex : frigo, four, lave-linge" {...register(`${M}.electromenager`)} />
            <Input label="Mobilier & salon" placeholder={'Ex : canapé 6 places, TV 55"'} {...register(`${M}.mobilierSalon`)} />
            <Input label="Chambres & literie" placeholder="Ex : 2 lits doubles, armoires" {...register(`${M}.chambresLiterie`)} />
            <Input label="Salles de bain" placeholder="Ex : 1 SDB + 1 WC invités" {...register(`${M}.sallesBain`)} />
            <Input label="Climatisation / chauffage" placeholder="Ex : split AC toutes chambres" {...register(`${M}.climatisation`)} />
            <Input label="Piscine / jacuzzi" placeholder="Ex : piscine privée 8x4m" {...register(`${M}.piscineJacuzzi`)} />
            <Input label="Terrasse / jardin" placeholder="Ex : terrasse 20m² vue mer" {...register(`${M}.terrasseJardin`)} />
            <Input label="WiFi & TV" placeholder="Ex : fibre 100 Mo, Netflix" {...register(`${M}.wifiTv`)} />
            <Input label="Parking" placeholder="Ex : place privée n°12" {...register(`${M}.parking`)} />
          </div>
          <div className="rounded-xl border border-border/40 p-4 space-y-3 bg-background/30">
            <Controller
              name={`${M}.lingeFourni`}
              control={control}
              render={({ field }) => (
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-text">Linge de maison fourni :</span>
                  <div className="flex rounded-lg border border-border overflow-hidden">
                    {[{ v: 'oui', l: 'Oui' }, { v: 'non', l: 'Non' }].map(o => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => field.onChange(field.value === o.v ? '' : o.v)}
                        className={`px-4 py-1.5 text-sm transition-colors ${
                          field.value === o.v
                            ? `${isGerant ? 'bg-[#905D5D] text-white' : 'bg-accent text-white'}`
                            : 'bg-card text-text-secondary hover:bg-background'
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            />
            <div className="max-w-[220px]">
              <Input label="Quantité" type="number" min="0" placeholder="Ex : 8" suffix={<span className="text-xs text-text-secondary">jeux</span>} {...register(`${M}.lingeQuantite`)} />
            </div>
          </div>
          <div>
            <Input label="Observations" placeholder="Remarques particulières sur le bien…" {...register(`${M}.observations`)} />
          </div>
        </div>
      </SectionCard>

      <SectionCard value="annexe2" title="Annexe 2 — Calendrier tarifaire" icon={Calendar} subtitle="Tarifs indicatifs par saison" defaultOpen>
        <div className="space-y-3">
          <p className="text-xs text-text-secondary">
            Tarifs indicatifs communiqués au mandataire pour la mise en location (Annexe 2 du mandat).
          </p>
          <div className="overflow-x-auto rounded-lg border border-border/30">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-background/50">
                  <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Saison</th>
                  <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Prix / nuit</th>
                  <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Prix / semaine</th>
                  <th className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Min nuits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {[
                  ['tarifBasse', 'Basse saison'],
                  ['tarifMoyenne', 'Saison moyenne'],
                  ['tarifHaute', 'Haute saison'],
                  ['tarifTresHaute', 'Très haute saison'],
                  ['tarifEvenements', 'Périodes événementielles'],
                ].map(([key, label]) => (
                  <tr key={key} className="hover:bg-background/30 transition-colors">
                    <td className="p-3 font-medium text-text whitespace-nowrap">{label}</td>
                    <td className="p-3 min-w-[160px]">
                      <Input type="number" min="0" placeholder="—" suffix={<span className="text-xs text-text-secondary">MAD</span>} {...register(`${M}.${key}.prixNuit`)} />
                    </td>
                    <td className="p-3 min-w-[160px]">
                      <Input type="number" min="0" placeholder="—" suffix={<span className="text-xs text-text-secondary">MAD</span>} {...register(`${M}.${key}.prixSemaine`)} />
                    </td>
                    <td className="p-3 min-w-[110px]">
                      <Input type="number" min="0" placeholder="—" {...register(`${M}.${key}.minNuits`)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
