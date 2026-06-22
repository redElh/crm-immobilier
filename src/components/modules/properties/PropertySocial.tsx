import { useState } from 'react';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { Heart, Share2, MessageCircle, ThumbsUp, Facebook, Instagram, Twitter, Linkedin } from 'react-feather';

const mockShares = {
  facebook: 12,
  instagram: 8,
  whatsapp: 5,
  linkedin: 3,
};

const mockLikes = 24;

const socialPlatforms = [
  { name: 'Facebook', icon: Facebook, color: 'text-blue-600', bg: 'bg-blue-50', shares: 12 },
  { name: 'Instagram', icon: Instagram, color: 'text-pink-600', bg: 'bg-pink-50', shares: 8 },
  { name: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', shares: 5 },
  { name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700', bg: 'bg-blue-50', shares: 3 },
];

export const PropertySocial = () => {
  const [liked, setLiked] = useState(false);

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Heart size={20} className={liked ? 'text-red-500 fill-red-500' : 'text-text-secondary'} />
            <span className="text-2xl font-bold">{mockLikes}</span>
          </div>
          <p className="text-xs text-text-secondary">J'aime</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => setLiked(!liked)}
          >
            <ThumbsUp size={12} className={liked ? 'text-accent' : ''} />
            {liked ? "Vous aimez" : "J'aime"}
          </Button>
        </div>

        <div className="bg-card rounded-xl border border-border/50 shadow-card p-5 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Share2 size={20} className="text-accent" />
            <span className="text-2xl font-bold">
              {Object.values(mockShares).reduce((a, b) => a + b, 0)}
            </span>
          </div>
          <p className="text-xs text-text-secondary">Partages</p>
          <Button variant="ghost" size="sm" className="mt-2">
            <Share2 size={12} />
            Partager
          </Button>
        </div>
      </div>

      {/* Social platforms */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <h3 className="font-semibold mb-4">Partage automatique</h3>
        <div className="grid grid-cols-2 gap-3">
          {socialPlatforms.map((platform) => {
            const Icon = platform.icon;
            return (
              <div
                key={platform.name}
                className={`${platform.bg} rounded-xl p-4 flex items-center justify-between cursor-pointer hover:shadow-sm transition-all`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={platform.color} />
                  <div>
                    <p className="text-sm font-medium">{platform.name}</p>
                    <p className="text-xs text-text-secondary">{platform.shares} partages</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <Share2 size={12} />
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Auto-publish */}
      <div className="bg-card rounded-xl border border-border/50 shadow-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Publication automatique</h3>
            <p className="text-xs text-text-secondary mt-1">
              Publier automatiquement sur les réseaux sociaux lors de l'ajout ou de la modification du bien
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-secondary bg-background px-2 py-1 rounded">Activé</span>
          </div>
        </div>
      </div>
    </div>
  );
};
