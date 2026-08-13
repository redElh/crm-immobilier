import type { Prospect } from '../types/prospect';

export function calcProspectCompletion(prospect: Prospect): number {
  const check = (v: any) => v !== undefined && v !== null && String(v).trim() !== '';
  const fields = [
    prospect.firstName, prospect.lastName, prospect.email, prospect.phone,
    prospect.mobile, prospect.spokenLanguage, prospect.origin, prospect.type,
    prospect.categories, prospect.propertyTypes?.length > 0 ? 'x' : '',
    prospect.location, prospect.rooms, prospect.bedrooms, prospect.minSurface,
    prospect.maxPrice, prospect.currency, prospect.viewType, prospect.viewDetail,
    prospect.meansOfContact?.length > 0 ? 'x' : '', prospect.message,
    prospect.civility, prospect.date,
  ];
  const filled = fields.filter(f => check(f)).length;
  return Math.round((filled / fields.length) * 100);
}
