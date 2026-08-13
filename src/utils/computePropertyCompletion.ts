import type { Property } from '../types/property'

const SEUIL = 70

function filled(val: any): boolean {
  if (val === undefined || val === null) return false
  if (typeof val === 'string') return val.trim() !== ''
  if (typeof val === 'number') return val > 0
  if (Array.isArray(val)) return val.length > 0
  if (typeof val === 'boolean') return val
  return true
}

export function computePropertyCompletion(p: Property): number {
  const checks: [number, () => boolean][] = [
    [8, () => filled(p.title)],
    [5, () => filled(p.transactionType)],
    [5, () => filled(p.status)],
    [6, () => filled(p.description)],
    [6, () => filled(p.images) || filled(p.photos)],
    [5, () => filled(p.features)],
    [5, () => filled(p.address)],
    [5, () => filled(p.city)],
    [3, () => filled(p.latitude) && filled(p.longitude)],
    [2, () => filled(p.location)],
    [10, () => filled(p.price)],
    [5, () => filled(p.devise)],
    [5, () => filled(p.prixNetVendeur) || filled(p.honorairesPct) || filled(p.loyerHC) || filled(p.mandateRemuneration)],
    [8, () => filled(p.surface)],
    [5, () => filled(p.rooms)],
    [4, () => filled(p.bedrooms)],
    [3, () => filled(p.yearBuilt)],
    [5, () => filled(p.owner?.name)],
    [2, () => filled(p.owner?.phone)],
    [1, () => filled(p.owner?.email)],
    [5, () => filled(p.documents)],
    [3, () => filled(p.bathrooms)],
  ]

  const totalWeight = checks.reduce((s, c) => s + c[0], 0)
  const filledWeight = checks.filter(c => c[1]()).reduce((s, c) => s + c[0], 0)

  return Math.round((filledWeight / totalWeight) * 100)
}

export function isSufficient(p: Property): boolean {
  return computePropertyCompletion(p) >= SEUIL
}

export { SEUIL }
