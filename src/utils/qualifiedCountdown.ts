const QUALIFIED_EXPIRY_DAYS = 30;

export function getQualifiedCountdown(qualifiedAt: string | null | undefined): {
  daysLeft: number;
  expired: boolean;
  label: string;
  urgency: 'safe' | 'warning' | 'critical' | 'expired';
} | null {
  if (!qualifiedAt) return null;

  const qualifiedDate = new Date(qualifiedAt);
  const now = new Date();
  const expiryDate = new Date(qualifiedDate);
  expiryDate.setDate(expiryDate.getDate() + QUALIFIED_EXPIRY_DAYS);

  const msLeft = expiryDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

  if (daysLeft <= 0) {
    return { daysLeft: 0, expired: true, label: 'Expiré', urgency: 'expired' };
  }

  let urgency: 'safe' | 'warning' | 'critical' = 'safe';
  if (daysLeft <= 5) urgency = 'critical';
  else if (daysLeft <= 10) urgency = 'warning';

  return {
    daysLeft,
    expired: false,
    label: `${daysLeft}j restant${daysLeft > 1 ? 's' : ''}`,
    urgency,
  };
}
