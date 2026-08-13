import { useNavigate, useParams } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { BackLink } from '../../components/ui/BackLink';
import { PropertyCard } from '../../components/modules/properties/PropertyCard';
import { fetchProperties } from '../../services/propertyService';
import { PROPERTY_TYPE_LABELS, TRANSACTION_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS } from '../../types/property';
import { ConfidentialProvider } from '../../components/modules/confidentiality/ConfidentialContext';
import { ConfidentialBanner } from '../../components/modules/confidentiality/ConfidentialBanner';
import { DraftSection } from '../../components/modules/properties/DraftSection';
import { api } from '../../services/api';
import { usePermission, useRestriction } from '../../hooks/usePermission';
import { Search, Plus, Sliders, X, Grid, List, Lock } from 'react-feather';

const CITY_GROUPS: Record<string, string[]> = {
  Essaouira: [
    'Argana', 'Azlef', 'Douar Laraab', 'Erraounak', 'Ghazoua', 'Medina',
    'Ounagha', 'Arbaa Ida Ougourd', 'Sidi Kaouki', 'Sidi Magdoul',
    'Sidi Ahmed Essayeh', 'Tidzi',
  ],
};

const TOP_CITIES = ['Essaouira', 'Marrakech', 'Agadir'];

const formatPrice = (p: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD', maximumFractionDigits: 0 }).format(p);

const getDisplayPrice = (p: any) => {
  if (p?.prixNetVendeur && p?.honorairesPct && p?.honorairesType === 'inclus') {
    return Math.round(Number(p.prixNetVendeur) * (1 + Number(p.honorairesPct) / 100));
  }
  return p?.prixNetVendeur || p?.price || 0;
};

export default function PropertiesPageWithType() {
  const navigate = useNavigate();
  const { type, agentId } = useParams<{ type: string; agentId: string }>();
  const canRead = usePermission('biens-lecture');
  const canWrite = usePermission('biens-ecriture');
  const restricted = useRestriction('biens-info-privees');
  const [allProperties, setAllProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');

  useEffect(() => {
    api.get<any>('/auth/me')
      .then(u => u && setCurrentUserId(String(u.id)))
      .catch(() => {})
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    setLoading(true);
    fetchProperties({ agent_id: currentUserId })
      .then(setAllProperties)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currentUserId]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [transactionFilter, setTransactionFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [citySubFilter, setCitySubFilter] = useState<string>('all');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [surfaceMin, setSurfaceMin] = useState('');
  const [surfaceMax, setSurfaceMax] = useState('');
  const [bedroomsMin, setBedroomsMin] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const typeLabel = ({ residential: 'Résidentiel', commercial: 'Commercial', land: 'Terrains', vacation: 'Vacances', luxury: 'Luxe' } as Record<string, string>)[type || ''] || '';

  const STATUS_BY_TYPE: Record<string, string[]> = {
    residential: ['for_sale', 'for_rent', 'mandate_pending', 'negotiation', 'under_compromise', 'signing', 'sold', 'rented', 'withdrawn'],
    commercial: ['for_sale_or_rent', 'negotiation', 'under_promise', 'sold_or_rented', 'withdrawn'],
    land: ['for_sale', 'under_promise', 'urbanism', 'sold', 'withdrawn'],
    vacation: ['available', 'option', 'reserved', 'occupied', 'unavailable', 'withdrawn'],
    luxury: ['for_sale_or_rent', 'confidential', 'negotiation', 'sold_or_rented', 'withdrawn'],
  };

  const TRANSACTION_BY_TYPE: Record<string, string[]> = {
    residential: ['vente', 'location_ld'],
    commercial: ['vente', 'location_ld'],
    land: ['vente'],
    vacation: ['location_saisonniere'],
    luxury: ['vente', 'location_ld'],
  };

  function getStatusOptions() {
    const statuses = type ? (STATUS_BY_TYPE[type] || Object.keys(STATUS_LABELS)) : Object.keys(STATUS_LABELS);
    return [
      { value: 'all', label: 'Tous les statuts' },
      ...statuses.map(v => ({ value: v, label: STATUS_LABELS[v] || v })),
    ];
  }

  function getTransactionOptions() {
    if (!type) {
      return [
        { value: 'all', label: 'Toutes les transactions' },
        ...Object.entries(TRANSACTION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
      ];
    }
    const transactions = TRANSACTION_BY_TYPE[type] || [];
    return [
      { value: 'all', label: 'Toutes les transactions' },
      ...transactions.map(v => ({ value: v, label: TRANSACTION_TYPE_LABELS[v as keyof typeof TRANSACTION_TYPE_LABELS] || v })),
    ];
  }

  const statusOptions = getStatusOptions();
  const transactionOptions = getTransactionOptions();

  const typeOptions = [
    { value: 'all', label: 'Tous les types' },
    ...Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const cityOptions = [
    { value: 'all', label: 'Toutes les villes' },
    ...TOP_CITIES.map(c => ({
      value: c,
      label: CITY_GROUPS[c] ? `${c} ▸` : c,
    })),
  ];

  const subCityOptions = cityFilter === 'Essaouira'
    ? [{ value: 'all', label: 'Toutes les localités' }, ...CITY_GROUPS['Essaouira'].map(c => ({ value: c, label: c }))]
    : [];

  const filteredProperties = useMemo(() => {
    return allProperties
      .filter((p: any) => type ? p.propertyType === type : true)
      .filter(p =>
        !searchTerm ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.reference.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(p => statusFilter === 'all' || p.status === statusFilter)
      .filter(p => typeFilter === 'all' || type === undefined || p.propertyType === typeFilter)
      .filter(p => transactionFilter === 'all' || p.transactionType === transactionFilter)
      .filter(p => {
        if (cityFilter === 'all') return true;
        if (cityFilter === 'Essaouira') return citySubFilter === 'all' || p.city === citySubFilter;
        return p.city === cityFilter;
      })
      .filter(p => !priceMin || p.price >= Number(priceMin))
      .filter(p => !priceMax || p.price <= Number(priceMax))
      .filter(p => !surfaceMin || p.surface >= Number(surfaceMin))
      .filter(p => !surfaceMax || p.surface <= Number(surfaceMax))
      .filter(p => !bedroomsMin || (p.bedrooms ?? 0) >= Number(bedroomsMin));
  }, [type, searchTerm, statusFilter, typeFilter, transactionFilter, cityFilter, priceMin, priceMax, surfaceMin, surfaceMax, bedroomsMin, allProperties]);

  const activeFiltersCount = [
    statusFilter !== 'all',
    typeFilter !== 'all' && !type,
    transactionFilter !== 'all',
    cityFilter !== 'all',
    citySubFilter !== 'all',
    priceMin !== '',
    priceMax !== '',
    surfaceMin !== '',
    surfaceMax !== '',
    bedroomsMin !== '',
  ].filter(Boolean).length;

  return (
    <ConfidentialProvider>
    <div className="space-y-6 animate-fade-in">
      <BackLink className="mb-2" />

      {!canRead && (
        <Card className="p-12 text-center">
          <div className="max-w-xs mx-auto">
            <Lock size={32} className="text-text-secondary/20 mx-auto mb-3" />
            <p className="text-text-secondary font-medium">Accès refusé</p>
            <p className="text-xs text-text-secondary/60 mt-1">
              Vous n'avez pas le droit de consulter les biens
            </p>
          </div>
        </Card>
      )}

      {canRead && (
      <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Biens {typeLabel}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {filteredProperties.length} bien{filteredProperties.length !== 1 ? 's' : ''} trouvé{filteredProperties.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canWrite && (
          <Button variant="default" icon={<Plus size={14} />} onClick={() => navigate(`/${agentId}/properties/type/${type}/add`)}>
            Ajouter un bien
          </Button>
        )}
      </div>

      {!loading && allProperties.length > 0 && <ConfidentialBanner />}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
      <>
      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            placeholder="Rechercher par nom, localisation ou référence..."
            className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            className={`btn-secondary h-9 px-3 flex items-center gap-2 text-sm ${showFilters || activeFiltersCount > 0 ? 'ring-2 ring-accent/20 border-accent' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Sliders size={14} />
            Filtres
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-accent text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          <div className="flex rounded-lg border border-border overflow-hidden">
            <button
              className={`p-2 ${viewMode === 'grid' ? 'bg-accent text-white' : 'bg-card text-text-secondary hover:bg-background'}`}
              onClick={() => setViewMode('grid')}
            >
                <Grid size={14} />
            </button>
            <button
              className={`p-2 ${viewMode === 'list' ? 'bg-accent text-white' : 'bg-card text-text-secondary hover:bg-background'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <Card className="p-4 animate-slide-down">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Filtres avancés</span>
            <button className="btn-ghost text-xs flex items-center gap-1" onClick={() => {
              setStatusFilter('all'); setTypeFilter('all'); setTransactionFilter('all'); setCityFilter('all'); setCitySubFilter('all');
              setPriceMin(''); setPriceMax(''); setSurfaceMin(''); setSurfaceMax('');
              setBedroomsMin('');
            }}>
              <X size={12} /> Réinitialiser
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {!type && (
              <Select
                options={typeOptions}
                value={typeFilter}
                onValueChange={setTypeFilter}
              />
            )}
            <Select
              options={statusOptions}
              value={statusFilter}
              onValueChange={setStatusFilter}
            />
            <Select
              options={transactionOptions}
              value={transactionFilter}
              onValueChange={setTransactionFilter}
            />
            <Select
              options={cityOptions}
              value={cityFilter}
              onValueChange={(v) => { setCityFilter(v); setCitySubFilter('all'); }}
            />
            {cityFilter === 'Essaouira' && subCityOptions.length > 0 && (
              <Select
                options={subCityOptions}
                value={citySubFilter}
                onValueChange={setCitySubFilter}
              />
            )}
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Prix min"
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                value={priceMin}
                onChange={(e) => setPriceMin(e.target.value)}
              />
              <span className="text-text-secondary/40 text-xs">-</span>
              <input
                type="number"
                placeholder="Prix max"
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                value={priceMax}
                onChange={(e) => setPriceMax(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Surface min"
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                value={surfaceMin}
                onChange={(e) => setSurfaceMin(e.target.value)}
              />
              <span className="text-text-secondary/40 text-xs">-</span>
              <input
                type="number"
                placeholder="Surface max"
                className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                value={surfaceMax}
                onChange={(e) => setSurfaceMax(e.target.value)}
              />
            </div>
            <input
              type="number"
              placeholder="Chambres min"
              className="w-full h-9 px-3 text-sm rounded-lg border border-border bg-card placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              value={bedroomsMin}
              onChange={(e) => setBedroomsMin(e.target.value)}
            />
          </div>
        </Card>
      )}

      {/* Drafts */}
      <DraftSection propertyType={type} agentSlug={agentId} />

      {/* Results */}
      {filteredProperties.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProperties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="divide-y divide-border/30">
              {filteredProperties.map(property => (
                <div
                  key={property.id}
                  className="flex items-center gap-4 p-4 hover:bg-background/50 transition-colors cursor-pointer"
                  onClick={() => {
                    if (restricted) return;
                    const propType = type || property.propertyType || 'residential';
                    if (agentId) {
                      navigate(`/${agentId}/properties/type/${propType}/${property.id}`);
                    } else {
                      navigate(`/properties/${property.id}`);
                    }
                  }}
                >
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-accent-light to-background flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {property.images?.[0] ? (
                      <img src={property.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-text-secondary/30 text-xs">N/A</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-5 gap-2 items-center">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] text-text-secondary/50">{property.reference}</p>
                        {property.originalPropertyId ? (
                          <span className="inline-flex items-center px-1 py-0.5 text-[8px] font-semibold rounded-full uppercase tracking-wider bg-orange-100 text-orange-700 shrink-0">
                            Copie
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm font-medium truncate">{property.title}</p>
                    </div>
                    <p className="text-xs text-text-secondary hidden md:block">{property.city}</p>
                    <p className="text-xs text-text-secondary hidden md:block">
                      {property.surface} m² · {((property as any).bathroom_count ?? property.bathrooms)} sdb
                      {((property as any).bedrooms_total ?? property.bedrooms) > 0 && ` · ${((property as any).bedrooms_total ?? property.bedrooms)} ch.`}
                    </p>
                    <p className="text-sm font-semibold text-accent">
                      {property.prixSurDemande ? 'Sur demande' : formatPrice(getDisplayPrice(property))}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={"inline-flex items-center px-2 py-0.5 text-[10px] font-medium rounded-md border " + (
                        STATUS_LABELS[property.status] ? STATUS_COLORS[property.status] :
                        'bg-gray-50 text-gray-500 border-gray-200'
                      )}>
                        {STATUS_LABELS[property.status] || property.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )
      ) : (
        <Card className="p-12 text-center">
          <div className="max-w-xs mx-auto">
            <Search size={32} className="text-text-secondary/20 mx-auto mb-3" />
            <p className="text-text-secondary font-medium">Aucun bien trouvé</p>
            <p className="text-xs text-text-secondary/60 mt-1">
              Essayez de modifier vos filtres ou d'ajouter un nouveau bien
            </p>
          </div>
        </Card>
      )}
      </>
      )}
      </>
      )}
    </div>
    </ConfidentialProvider>
  );
}

