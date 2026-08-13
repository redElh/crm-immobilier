export type PortalPartnerGroupId = 'maroc' | 'autres';

export interface PortalPartner {
  label: string;
  key: string;
  image: string;
  group: PortalPartnerGroupId;
}

export const PORTAL_PARTNER_GROUPS: Array<{ id: PortalPartnerGroupId; label: string; partners: PortalPartner[] }> = [
  {
    id: 'maroc',
    label: 'Partenaires • Maroc',
    partners: [
      { label: 'JamesEdition', key: 'jamesedition', image: 'JamesEdition.png', group: 'maroc' },
      { label: 'Kyero', key: 'kyero', image: 'Kyero.png', group: 'maroc' },
      { label: 'M2 Square Meter', key: 'm2_square_meter', image: 'M2-Square-Meter.jpg', group: 'maroc' },
      { label: 'MLS Worldwide', key: 'mls_worldwide', image: 'MLS-Worldwide.png', group: 'maroc' },
      { label: 'Mubawab.ma', key: 'mubawab', image: 'Mubawab.png', group: 'maroc' },
      { label: 'Only-Luxury.com', key: 'only-luxury', image: 'Only-luxury.png', group: 'maroc' },
      { label: 'Properstar', key: 'properstar', image: 'Properstar.png', group: 'maroc' },
    ],
  },
  {
    id: 'autres',
    label: 'Partenaires • Autres',
    partners: [
      { label: 'Arlet (Paper)', key: 'arletpaper', image: 'Arlet(Paper).png', group: 'autres' },
      { label: 'BabaCasa', key: 'babacasa', image: 'BabaCasa.png', group: 'autres' },
      { label: 'Bien avec Vue', key: 'bien_avec_vue', image: 'Bien-avec-vue.svg', group: 'autres' },
      { label: 'Flatway', key: 'flatway', image: 'Flatway.png', group: 'autres' },
      { label: 'GoFlint', key: 'goflint', image: 'GoFlint.png', group: 'autres' },
      { label: 'Green-Acres', key: 'green-acres', image: 'Green-Acres.png', group: 'autres' },
      { label: 'Havelia', key: 'havelia', image: 'Havelia.png', group: 'autres' },
      { label: 'Immo Gratuit', key: 'immo_gratuit', image: 'Immo-Gratuit.png', group: 'autres' },
      { label: 'Kazaki', key: 'kazaki', image: 'Kazaki.png', group: 'autres' },
      { label: 'Leroiloc.com', key: 'ieroiloc', image: 'Ieroiloc.png', group: 'autres' },
      { label: 'LocalCommercial.net', key: 'localcommercial', image: 'localcommercial.png', group: 'autres' },
      { label: 'LuxuryEstate.com', key: 'luxuryestate', image: 'LuxuryEstate.png', group: 'autres' },
      { label: 'Monbien.fr', key: 'monbien', image: 'Monbien.png', group: 'autres' },
      { label: 'StaysCo', key: 'staysco', image: 'StaysCo.png', group: 'autres' },
      { label: 'Superimmo', key: 'superimmo', image: 'Superimmo.png', group: 'autres' },
      { label: 'Sustainable Real Estate', key: 'substainable_real_estate', image: 'Sustainable-Real-Estate.png', group: 'autres' },
      { label: 'Trovi.co', key: 'trovi.co', image: 'Trovi.png', group: 'autres' },
      { label: 'Vizzit', key: 'vizzit', image: 'Vizzit.png', group: 'autres' },
      { label: 'Zefir', key: 'zefir', image: 'Zefir.png', group: 'autres' },
      { label: 'Zilek', key: 'zilek', image: 'Zilek.png', group: 'autres' },
    ],
  },
];

export const PORTAL_PARTNERS: PortalPartner[] = PORTAL_PARTNER_GROUPS.flatMap(group => group.partners);
