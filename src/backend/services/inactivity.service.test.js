// Pure logic extracted from inactivity.service.js for testability
const DAYS_TO_INACTIVE = 30
const DAYS_TO_SUSPENSION_WARNING = 60
const DAYS_TO_SUSPENSION = 90
const DAYS_TO_DELETION_WARNING = 150
const DAYS_TO_DELETION = 180

function getDaysSinceLastLogin(lastLoginAt) {
  if (!lastLoginAt) return null
  return Math.floor((Date.now() - new Date(lastLoginAt).getTime()) / (1000 * 60 * 60 * 24))
}

function getInactivityLevel(lastLoginAt) {
  const days = getDaysSinceLastLogin(lastLoginAt)
  if (days === null) return { level: 'unknown', days: null }
  if (days >= DAYS_TO_DELETION) return { level: 'scheduled_deletion', days, threshold: DAYS_TO_DELETION }
  if (days >= DAYS_TO_SUSPENSION) return { level: 'suspendu', days, threshold: DAYS_TO_SUSPENSION }
  if (days >= DAYS_TO_SUSPENSION_WARNING) return { level: 'warning', days, threshold: DAYS_TO_SUSPENSION_WARNING }
  if (days >= DAYS_TO_INACTIVE) return { level: 'inactif', days, threshold: DAYS_TO_INACTIVE }
  return { level: 'actif', days, threshold: DAYS_TO_INACTIVE }
}

describe('getDaysSinceLastLogin', () => {
  it('returns null for null input', () => {
    expect(getDaysSinceLastLogin(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(getDaysSinceLastLogin(undefined)).toBeNull()
  })

  it('returns 0 for today', () => {
    expect(getDaysSinceLastLogin(new Date())).toBe(0)
  })

  it('returns ~30 for 30 days ago', () => {
    const past = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    expect(getDaysSinceLastLogin(past)).toBe(30)
  })

  it('returns ~60 for 60 days ago', () => {
    const past = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    expect(getDaysSinceLastLogin(past)).toBe(60)
  })
})

describe('getInactivityLevel', () => {
  it('returns unknown for null', () => {
    expect(getInactivityLevel(null).level).toBe('unknown')
  })

  it('returns actif for today', () => {
    expect(getInactivityLevel(new Date()).level).toBe('actif')
  })

  it('returns actif for 15 days', () => {
    expect(getInactivityLevel(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)).level).toBe('actif')
  })

  it('returns inactif at 30 days (30j threshold)', () => {
    const r = getInactivityLevel(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    expect(r.level).toBe('inactif')
    expect(r.days).toBe(30)
  })

  it('returns inactif for 45 days', () => {
    expect(getInactivityLevel(new Date(Date.now() - 45 * 24 * 60 * 60 * 1000)).level).toBe('inactif')
  })

  it('returns warning at 60 days (60j threshold)', () => {
    const r = getInactivityLevel(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000))
    expect(r.level).toBe('warning')
    expect(r.days).toBe(60)
  })

  it('returns suspendu for 90 days', () => {
    expect(getInactivityLevel(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)).level).toBe('suspendu')
  })

  it('returns scheduled_deletion for 180 days', () => {
    expect(getInactivityLevel(new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)).level).toBe('scheduled_deletion')
  })
})
