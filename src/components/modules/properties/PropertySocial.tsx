import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '../../ui/Switch';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { HashtagAutocomplete } from './HashtagAutocomplete';
import { Table } from '../../ui/Table';
import { useToast } from '../../ui/Toast';
import type { Property } from '../../../types/property';
import {
  Facebook, Instagram, Linkedin, Share2, Clock, CheckCircle,
  XCircle, AlertCircle, Eye, ExternalLink, Calendar, Image,
  HelpCircle, Plus, Send,
} from 'react-feather';
import {
  type SocialPlatform,
  type SocialAccount,
  type SocialPost,
  type ShareStatus,
  SOCIAL_PLATFORM_LABELS,
  SOCIAL_PLATFORM_COLORS,
  SOCIAL_PLATFORM_BG,
  DEFAULT_FACEBOOK_TEMPLATE,
  DEFAULT_INSTAGRAM_TEMPLATE,
  DEFAULT_LINKEDIN_TEMPLATE,
  TEMPLATE_VARIABLES,
} from '../../../types/social';
import { socialService } from '../../../services/socialService';
import { PermissionLocked } from '../confidentiality/PermissionLocked';
import { usePermission } from '../../../hooks/usePermission';

const BUFFER_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'linkedin'];

function resolveTemplate(text: string | undefined, property: Property): string {
  if (!text) return '';
  const formatPrice = (p: number) => new Intl.NumberFormat('fr-FR').format(p);

  const description = property.description || '';
  const descriptionCourte = description.split('\n')[0]?.substring(0, 120) || '';
  const features = property.features || [];
  const prestations = features.join(' · ');
  const prestationsCourtes = features.slice(0, 3).join(' · ');
  const prestationsListe = features.map(f => `• ${f}`).join('\n');
  const agenceHashtag = '#SquareMeter';

  const vars: Record<string, string> = {
    '{{bien.titre}}': property.title || '',
    '{{bien.ville}}': property.city || '',
    '{{bien.quartier}}': property.district || '',
    '{{bien.prix}}': property.price ? formatPrice(property.price) : '',
    '{{bien.surface}}': property.surface?.toString() || '',
    '{{bien.pieces}}': property.rooms?.toString() || '',
    '{{bien.chambres}}': property.bedrooms?.toString() || '',
    '{{bien.sdb}}': property.bathrooms?.toString() || '',
    '{{bien.terrain}}': property.landSize?.toString() || '',
    '{{bien.prestations}}': prestations,
    '{{bien.prestations_courtes}}': prestationsCourtes,
    '{{bien.prestations_liste}}': prestationsListe,
    '{{bien.description}}': description,
    '{{bien.description_courte}}': descriptionCourte,
    '{{bien.potentiel}}': `Opportunité exceptionnelle dans l'un des quartiers les plus prisés de ${property.city || 'la ville'}.`,
    '{{agent.nom}}': '',
    '{{agent.telephone}}': property.owner?.phone || '',
    '{{agent.email}}': property.owner?.email || '',
    '{{agence.nom}}': 'Square Meter',
    '{{agence.site}}': 'www.squaremeter.com',
    '{{agence.hashtag}}': agenceHashtag,
  };

  let result = text;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(key, value);
  }
  return result;
}

const statusIcons: Record<ShareStatus, React.ReactNode> = {
  published: <CheckCircle size={14} className="text-emerald-500" />,
  pending: <Clock size={14} className="text-amber-500" />,
  scheduled: <Calendar size={14} className="text-blue-500" />,
  failed: <XCircle size={14} className="text-red-500" />,
  draft: <AlertCircle size={14} className="text-text-secondary" />,
};

const statusLabels: Record<ShareStatus, string> = {
  published: 'Publié',
  pending: 'En attente',
  scheduled: 'Programmé',
  failed: 'Échec',
  draft: 'Brouillon',
};

const statusColors: Record<ShareStatus, string> = {
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  draft: 'bg-gray-50 text-gray-700 border-gray-200',
};

const gerantStatusColors: Record<ShareStatus, string> = {
  ...statusColors,
  pending: 'bg-[#F0E2E2] text-[#7D5050] border-[#E0C6C6]',
};

const getStatusIcon = (status: ShareStatus, isGerant: boolean): React.ReactNode => {
  if (status === 'pending') {
    return <Clock size={14} className={isGerant ? 'text-[#905D5D]' : 'text-amber-500'} />;
  }
  return statusIcons[status];
};

const platformIcons: Record<SocialPlatform, React.ReactNode> = {
  facebook: <Facebook size={16} />,
  instagram: <Instagram size={16} />,
  linkedin: <Linkedin size={16} />,
  twitter: <Share2 size={16} />,
  threads: <Share2 size={16} />,
  bluesky: <Share2 size={16} />,
  pinterest: <Share2 size={16} />,
  youtube: <Share2 size={16} />,
  tiktok: <Share2 size={16} />,
  mastodon: <Share2 size={16} />,
};

interface PropertySocialProps {
  property: Property;
  onShowPreviewChange?: (v: boolean) => void;
  onShowVariablesChange?: (v: boolean) => void;
  onPreviewTextChange?: (text: string) => void;
  isGerant?: boolean;
}

export const PropertySocial = ({ property, onShowPreviewChange, onShowVariablesChange, onPreviewTextChange, isGerant = false }: PropertySocialProps) => {
  const { toast } = useToast();
  const canPublish = usePermission('biens-commercial-publier');

  const [connectedAccounts, setConnectedAccounts] = useState<SocialAccount[]>([
    { id: 'fb-1', platform: 'facebook', label: 'Facebook', connected: false, status: 'disconnected' },
    { id: 'ig-1', platform: 'instagram', label: 'Instagram', connected: false, status: 'disconnected' },
    { id: 'li-1', platform: 'linkedin', label: 'LinkedIn', connected: false, status: 'disconnected' },
  ]);

  const [autoPublish, setAutoPublish] = useState(true);
  const [schedulePublish, setSchedulePublish] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [sharingMode, setSharingMode] = useState<'manual' | 'scheduled'>('manual');

  const [templates, setTemplates] = useState<Partial<Record<SocialPlatform, string>>>({
    facebook: DEFAULT_FACEBOOK_TEMPLATE,
    instagram: DEFAULT_INSTAGRAM_TEMPLATE,
    linkedin: DEFAULT_LINKEDIN_TEMPLATE,
  });

  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform>('facebook');
  const [previewText, setPreviewText] = useState('');
  const [localShowPreview, setLocalShowPreview] = useState(false);
  const [localShowVariables, setLocalShowVariables] = useState(false);

  const showPreview = localShowPreview;
  const showVariables = localShowVariables;
  const setShowPreview = (v: boolean) => {
    setLocalShowPreview(v);
    onShowPreviewChange?.(v);
  };
  const setShowVariables = (v: boolean) => {
    setLocalShowVariables(v);
    onShowVariablesChange?.(v);
  };
  const [publishing, setPublishing] = useState(false);

  const [shareHistory, setShareHistory] = useState<SocialPost[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [bufferProfiles, setBufferProfiles] = useState<any[]>([]);
  const [bufferLoading, setBufferLoading] = useState(false);
  const [bufferReady, setBufferReady] = useState(false);

  const selectedAccounts = connectedAccounts.filter(a => a.connected);

  useEffect(() => {
    if (property) {
      const text = resolveTemplate(templates[selectedPlatform], property);
      setPreviewText(text);
      onPreviewTextChange?.(text);
    }
  }, [templates, selectedPlatform, property, onPreviewTextChange]);

  const handleTemplateChange = (platform: SocialPlatform, value: string) => {
    setTemplates(prev => ({ ...prev, [platform]: value }));
  };

  const insertVariable = (variable: string) => {
    setTemplates(prev => ({
      ...prev,
      [selectedPlatform]: (prev[selectedPlatform] || '') + variable,
    }));
  };

  const toggleAccount = (accountId: string) => {
    setConnectedAccounts(prev =>
      prev.map(a =>
        a.id === accountId ? { ...a, connected: !a.connected, status: a.connected ? 'disconnected' : 'connected' } : a
      )
    );
  };

  const handlePublish = useCallback(async () => {
    const text = resolveTemplate(templates[selectedPlatform], property);
    const platformAccountIds = selectedAccounts
      .filter(a => a.platform === selectedPlatform)
      .map(a => a.profileId)
      .filter(Boolean) as string[];

    if (platformAccountIds.length === 0) {
      toast('error', `Aucun compte ${SOCIAL_PLATFORM_LABELS[selectedPlatform]} connecté`);
      return;
    }

    setPublishing(true);
    try {
      const scheduledAt = schedulePublish && scheduledDate && scheduledTime
        ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
        : undefined;

      const payload = {
        profileIds: platformAccountIds,
        text,
        mediaUrls: property.images?.filter(Boolean) || [],
        scheduledAt,
        postType: 'post',
        platform: selectedPlatform,
      };

      const result = await socialService.createPost(payload);

      const newPost: SocialPost = {
        id: `post-${Date.now()}`,
        propertyId: property.id,
        platform: selectedPlatform,
        text,
        status: scheduledAt ? 'scheduled' : 'published',
        scheduledAt,
        publishedAt: scheduledAt ? undefined : new Date().toISOString(),
        mode: scheduledAt ? 'scheduled' : 'manual',
        clicks: 0,
        impressions: 0,
      };

      setShareHistory(prev => [newPost, ...prev]);
      toast('success', scheduledAt
        ? `Publication programmée sur ${SOCIAL_PLATFORM_LABELS[selectedPlatform]}`
        : `Publié sur ${SOCIAL_PLATFORM_LABELS[selectedPlatform]}`
      );
    } catch (err: any) {
      toast('error', `Erreur : ${err.message}`);
    } finally {
      setPublishing(false);
    }
  }, [selectedPlatform, templates, selectedAccounts, schedulePublish, scheduledDate, scheduledTime, property, toast]);

  const loadBufferProfiles = async () => {
    setBufferLoading(true);
    try {
      const profiles = await socialService.getProfiles();
      setBufferProfiles(profiles);
      setConnectedAccounts(prev => prev.map(acc => {
        const match = profiles.find((p: any) => p.platform === acc.platform);
        if (match) {
          return { ...acc, connected: true, status: 'connected' as const, profileName: match.profileName, profileId: match.id };
        }
        return { ...acc, connected: false, status: 'disconnected' as const };
      }));
      setBufferReady(true);
    } catch (err: any) {
      setConnectedAccounts(prev => prev.map(a => ({ ...a, connected: false, status: 'disconnected' as const })));
      toast('error', `Buffer : ${err.message}`);
    } finally {
      setBufferLoading(false);
    }
  };

  useEffect(() => {
    loadBufferProfiles();
  }, []);

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const platformAccounts = selectedAccounts.filter(a => a.platform === selectedPlatform);

  return (
    <PermissionLocked allowed={canPublish} label="Publication sociale verrouillée">
    <div className="space-y-5">
      {/* Section 1: Social Sharing Settings */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Share2 size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
          <h3 className="font-semibold">Partage Social</h3>
        </div>
        <p className="text-xs text-text-secondary mb-4">
          Publiez automatiquement vos biens sur les réseaux sociaux
        </p>

        {bufferLoading && (
          <div className="text-xs text-text-secondary mb-3 flex items-center gap-1.5">
            <div className={`w-3 h-3 border-2 border-t-transparent rounded-full animate-spin ${isGerant ? 'border-[#905D5D]' : 'border-accent'}`} />
            Connexion à Buffer...
          </div>
        )}

        <div className="space-y-2 mb-4">
          <p className="text-sm font-medium text-text-secondary">Connecter vos comptes sociaux :</p>
          {connectedAccounts.map(account => {
            const bg = SOCIAL_PLATFORM_BG[account.platform];
            const color = SOCIAL_PLATFORM_COLORS[account.platform];
            return (
              <div
                key={account.id}
                className={`${bg} rounded-xl p-3 flex items-center justify-between`}
              >
                <div className="flex items-center gap-3">
                  <span className={color}>{platformIcons[account.platform]}</span>
                  <div>
                    <p className="text-sm font-medium">{SOCIAL_PLATFORM_LABELS[account.platform]}</p>
                    {account.connected ? (
                      <p className="text-xs text-emerald-700 flex items-center gap-1">
                        <CheckCircle size={11} />
                        Connecté{account.profileName ? ` - ${account.profileName}` : ''}
                      </p>
                    ) : (
                      <p className={`text-xs flex items-center gap-1 ${isGerant ? 'text-[#905D5D]' : 'text-amber-700'}`}>
                        <AlertCircle size={11} />
                        Non connecté
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant={account.connected ? 'outline' : 'ghost'}
                  size="sm"
                  onClick={() => toggleAccount(account.id)}
                >
                  {account.connected ? 'Déconnecter' : 'Connecter'}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-text-secondary">Publication automatique :</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-text-secondary" />
              <span className="text-sm">Publier automatiquement lors de l'ajout ou de la modification du bien</span>
            </div>
            <Switch checked={autoPublish} onCheckedChange={setAutoPublish} checkedClass={isGerant ? 'bg-[#905D5D]' : undefined} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-text-secondary" />
              <span className="text-sm">Programmer la publication</span>
            </div>
            <Switch checked={schedulePublish} onCheckedChange={setSchedulePublish} checkedClass={isGerant ? 'bg-[#905D5D]' : undefined} />
          </div>

          <AnimatePresence>
            {schedulePublish && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 pl-6"
              >
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                  className={`h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/15' : 'focus:ring-accent/15'}`}
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className={`h-9 px-3 text-sm rounded-lg border border-border bg-card focus:outline-none focus:ring-2 ${isGerant ? 'focus:ring-[#905D5D]/15' : 'focus:ring-accent/15'}`}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Section 2: Post Templates */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Image size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
          <h3 className="font-semibold">Contenu du post</h3>
        </div>
        <p className="text-xs text-text-secondary mb-4">
          Personnalisez le message pour chaque plateforme
        </p>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {BUFFER_PLATFORMS.map(platform => {
            const isActive = selectedPlatform === platform;
            const color = SOCIAL_PLATFORM_COLORS[platform];
            const bg = SOCIAL_PLATFORM_BG[platform];
            return (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  isActive
                    ? isGerant ? 'border-[#905D5D]/30 bg-[#905D5D]/15 text-[#905D5D]' : 'border-accent/30 bg-accent-light text-accent'
                    : 'border-border/50 bg-background text-text-secondary hover:border-text-secondary/30'
                }`}
              >
                <span className={color}>{platformIcons[platform]}</span>
                {SOCIAL_PLATFORM_LABELS[platform]}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <div className="relative">
            <HashtagAutocomplete
              value={templates[selectedPlatform] || ''}
              onChange={value => handleTemplateChange(selectedPlatform, value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="ghost"
              size="sm"
              icon={<Eye size={12} />}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Masquer aperçu' : 'Aperçu'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus size={12} />}
              onClick={() => setShowVariables(!showVariables)}
            >
              Variables
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<HelpCircle size={12} />}
              onClick={() => setTemplates(prev => ({
                ...prev,
                [selectedPlatform]: prev[selectedPlatform] === DEFAULT_FACEBOOK_TEMPLATE
                  ? DEFAULT_INSTAGRAM_TEMPLATE
                  : DEFAULT_FACEBOOK_TEMPLATE,
              }))}
            >
              Réinitialiser
            </Button>
          </div>



          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <div className="flex items-center gap-2">
              {platformAccounts.length === 0 ? (
                <Badge variant="warning" size="sm">
                  <AlertCircle size={11} className="mr-1" />
                  Aucun compte connecté pour cette plateforme
                </Badge>
              ) : (
                platformAccounts.map(a => (
                  <Badge key={a.id} variant="success" size="sm">
                    <CheckCircle size={11} className="mr-1" />
                    {a.profileName}
                  </Badge>
                ))
              )}
            </div>
            <div className="flex items-center gap-2">
              <AnimatePresence>
                {schedulePublish && scheduledDate && scheduledTime && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs text-text-secondary flex items-center gap-1"
                  >
                    <Calendar size={12} />
                    {formatDate(scheduledDate)} à {scheduledTime}
                  </motion.div>
                )}
              </AnimatePresence>
              <Button
                variant="default"
                size="sm"
                icon={schedulePublish ? <Calendar size={14} /> : <Send size={14} />}
                onClick={handlePublish}
                loading={publishing}
                disabled={platformAccounts.length === 0}
                className={isGerant ? 'bg-[#905D5D] hover:bg-[#7D5050] border-[#905D5D] hover:border-[#7D5050] text-white' : ''}
              >
                {schedulePublish ? 'Programmer' : 'Publier maintenant'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Sharing Activity Tracking */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Clock size={16} className={isGerant ? 'text-[#905D5D]' : 'text-accent'} />
          <h3 className="font-semibold">Activité de partage</h3>
        </div>
        <p className="text-xs text-text-secondary mb-4">
          Suivi des publications sur les réseaux sociaux
        </p>

        {shareHistory.length === 0 ? (
          <div className="text-center py-8 text-text-secondary/60">
            <Share2 size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Aucune publication pour ce bien</p>
            <p className="text-xs mt-1">Utilisez le panneau ci-dessus pour créer votre première publication</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Column>Plateforme</Table.Column>
                  <Table.Column>Date</Table.Column>
                  <Table.Column>Statut</Table.Column>
                  <Table.Column align="center">Clics</Table.Column>
                  <Table.Column align="center">Impressions</Table.Column>
                  <Table.Column align="center">Actions</Table.Column>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {shareHistory.map(post => (
                  <Table.Row key={post.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <span className={SOCIAL_PLATFORM_COLORS[post.platform]}>
                          {platformIcons[post.platform]}
                        </span>
                        <span className="font-medium">{SOCIAL_PLATFORM_LABELS[post.platform]}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <span className="text-text-secondary">
                        {post.publishedAt ? formatDate(post.publishedAt) : post.scheduledAt ? formatDate(post.scheduledAt) : '-'}
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge className={isGerant ? gerantStatusColors[post.status] : statusColors[post.status]}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(post.status, isGerant)}
                          {statusLabels[post.status]}
                        </span>
                      </Badge>
                    </Table.Cell>
                    <Table.Cell align="center">{post.clicks ?? '-'}</Table.Cell>
                    <Table.Cell align="center">{post.impressions ?? '-'}</Table.Cell>
                    <Table.Cell align="center">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="sm" icon={<ExternalLink size={12} />} tooltip="Voir sur le réseau" />
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        )}
      </div>
    </div>
    </PermissionLocked>
  );
};
