import pool from '../config/db.js';
import nodemailer from 'nodemailer';

const PROPERTY_TYPE_LABELS = {
  residential: 'Résidentiel',
  commercial: 'Commercial',
  land: 'Terrain',
  vacation: 'Saisonnier',
  luxury: 'Luxe',
};

const TRANSACTION_TYPE_LABELS = {
  vente: 'Vente',
  location: 'Location',
  location_ld: 'Location longue durée',
  location_saisonniere: 'Location saisonnière',
};

const PROPERTY_TYPE_ICONS = {
  residential: '🏠',
  commercial: '🏢',
  land: '🌲',
  vacation: '🏖️',
  luxury: '💎',
};

function formatPrice(price, devise) {
  if (!price || price === 0) return '';
  const d = devise || 'MAD';
  return Number(price).toLocaleString('fr-FR') + ' ' + d;
}

function formatSurface(surface) {
  if (!surface || surface === 0) return '';
  return Number(surface).toLocaleString('fr-FR') + ' m²';
}

function replaceTemplateVars(template, vars) {
  if (!template) return '';
  return template.replace(/\{\{(\w+\.?\w*)\}\}/g, (_m, key) => {
    const val = vars[key] !== undefined ? vars[key] : key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), vars);
    return val !== undefined && val !== null ? String(val) : `{{${key}}}`;
  });
}

function buildPropertyTypeSpecificHtml(property, devise) {
  const type = property.propertyType || property.type;
  const d = devise || 'MAD';
  const priceStr = formatPrice(property.price, d);
  const surfaceStr = formatSurface(property.surface);
  const landSizeStr = formatSurface(property.landSize);

  switch (type) {
    case 'residential': {
      let html = `<p style="margin:0 0 12px;color:#1a1a2e;font-size:14px;font-weight:600;">Détails du bien résidentiel</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:20px;">
  <tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Type</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">Résidentiel</td></tr>`;
      if (priceStr) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Prix</span></td><td style="padding:4px 0;text-align:right;font-weight:600;font-size:13px;">${priceStr}</td></tr>`;
      if (surfaceStr) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Surface</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${surfaceStr}</td></tr>`;
      if (property.rooms) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Pièces</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.rooms}</td></tr>`;
      if (property.bedrooms) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Chambres</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.bedrooms}</td></tr>`;
      if (property.bathrooms) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">SDB</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.bathrooms}</td></tr>`;
      if (property.city) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Ville</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.city}</td></tr>`;
      html += `</table>`;
      return html;
    }

    case 'commercial': {
      let html = `<p style="margin:0 0 12px;color:#1a1a2e;font-size:14px;font-weight:600;">Détails du bien commercial</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:20px;">
  <tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Type</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">Commercial</td></tr>`;
      if (priceStr) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Prix</span></td><td style="padding:4px 0;text-align:right;font-weight:600;font-size:13px;">${priceStr}</td></tr>`;
      if (property.loyerHC) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Loyer HC</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${formatPrice(property.loyerHC, d)}/mois</td></tr>`;
      if (surfaceStr) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Surface</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${surfaceStr}</td></tr>`;
      if (property.rooms) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Pièces</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.rooms}</td></tr>`;
      if (property.city) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Ville</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.city}</td></tr>`;
      if (property.currentUse) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Usage</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.currentUse}</td></tr>`;
      html += `</table>`;
      return html;
    }

    case 'land': {
      let html = `<p style="margin:0 0 12px;color:#1a1a2e;font-size:14px;font-weight:600;">Détails du terrain</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:20px;">
  <tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Type</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">Terrain</td></tr>`;
      if (priceStr) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Prix</span></td><td style="padding:4px 0;text-align:right;font-weight:600;font-size:13px;">${priceStr}</td></tr>`;
      if (landSizeStr) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Surface terrain</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${landSizeStr}</td></tr>`;
      if (property.buildableSurface) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Surface constructible</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${formatSurface(property.buildableSurface)}</td></tr>`;
      if (property.buildable !== undefined) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Constructible</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.buildable ? 'Oui' : 'Non'}</td></tr>`;
      if (property.city) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Ville</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.city}</td></tr>`;
      html += `</table>`;
      return html;
    }

    case 'vacation': {
      let html = `<p style="margin:0 0 12px;color:#1a1a2e;font-size:14px;font-weight:600;">Détails du bien saisonnier</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:20px;">
  <tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Type</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">Saisonnier</td></tr>`;
      if (property.seasonalPriceMin) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Prix min/nuit</span></td><td style="padding:4px 0;text-align:right;font-weight:600;font-size:13px;">${formatPrice(property.seasonalPriceMin, d)}</td></tr>`;
      if (property.seasonalPriceMax) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Prix max/nuit</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${formatPrice(property.seasonalPriceMax, d)}</td></tr>`;
      if (property.seasonalPriceWeek) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Prix semaine</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${formatPrice(property.seasonalPriceWeek, d)}</td></tr>`;
      if (property.sleepingCapacity) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Capacité</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.sleepingCapacity} pers.</td></tr>`;
      if (property.bedrooms) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Chambres</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.bedrooms}</td></tr>`;
      if (surfaceStr) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Surface</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${surfaceStr}</td></tr>`;
      if (property.city) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Ville</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.city}</td></tr>`;
      html += `</table>`;
      return html;
    }

    case 'luxury': {
      let html = `<p style="margin:0 0 12px;color:#1a1a2e;font-size:14px;font-weight:600;">Détails du bien de luxe</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:20px;border:1px solid #e8d5b0;">
  <tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Type</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">Luxe</td></tr>`;
      if (priceStr) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Prix</span></td><td style="padding:4px 0;text-align:right;font-weight:600;font-size:13px;">${priceStr}</td></tr>`;
      if (surfaceStr) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Surface</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${surfaceStr}</td></tr>`;
      if (property.bedrooms) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Chambres</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.bedrooms}</td></tr>`;
      if (property.bathrooms) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">SDB</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.bathrooms}</td></tr>`;
      if (property.rooms) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Pièces</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.rooms}</td></tr>`;
      if (property.pool?.hasPool) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Piscine</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">✅ Oui</td></tr>`;
      if (property.city) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Ville</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.city}</td></tr>`;
      html += `</table>`;
      return html;
    }

    default: {
      let html = `<p style="margin:0 0 12px;color:#1a1a2e;font-size:14px;font-weight:600;">Détails du bien</p>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;border-radius:8px;padding:20px;">
  <tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Type</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${PROPERTY_TYPE_LABELS[type] || type || '—'}</td></tr>`;
      if (priceStr) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Prix</span></td><td style="padding:4px 0;text-align:right;font-weight:600;font-size:13px;">${priceStr}</td></tr>`;
      if (surfaceStr) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Surface</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${surfaceStr}</td></tr>`;
      if (property.rooms) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Pièces</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.rooms}</td></tr>`;
      if (property.city) html += `<tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">Ville</span></td><td style="padding:4px 0;text-align:right;font-size:13px;">${property.city}</td></tr>`;
      html += `</table>`;
      return html;
    }
  }
}

function buildPropertyInlineDetails(vars, devise) {
  const b = vars.bien;
  const d = devise || 'MAD';
  const typeLabel = PROPERTY_TYPE_LABELS[b.type] || b.type || '—';
  const priceStr = formatPrice(b.prix, d);
  const surfaceStr = b.surface ? `${b.surface} m²` : '';

  let items = [];

  if (priceStr) items.push({ label: 'Prix', value: priceStr });
  if (surfaceStr) items.push({ label: 'Surface', value: surfaceStr });
  if (b.landSize) items.push({ label: 'Terrain', value: formatSurface(b.landSize) });
  if (b.pieces) items.push({ label: 'Pièces', value: b.pieces });
  if (b.chambres) items.push({ label: 'Chambres', value: b.chambres });
  if (b.sdb) items.push({ label: 'SDB', value: b.sdb });
  if (b.prix_min_nuit) items.push({ label: 'Min/nuit', value: formatPrice(b.prix_min_nuit, d) });
  if (b.prix_max_nuit) items.push({ label: 'Max/nuit', value: formatPrice(b.prix_max_nuit, d) });
  if (b.prix_semaine) items.push({ label: 'Semaine', value: formatPrice(b.prix_semaine, d) });
  if (b.loyer_hc) items.push({ label: 'Loyer HC', value: formatPrice(b.loyer_hc, d) + '/mois' });
  if (b.sleepingCapacity) items.push({ label: 'Capacité', value: b.sleepingCapacity + ' pers.' });
  if (b.buildableSurface) items.push({ label: 'Surface constructible', value: formatSurface(b.buildableSurface) });
  if (b.buildable !== undefined) items.push({ label: 'Constructible', value: b.buildable ? 'Oui' : 'Non' });
  if (b.currentUse) items.push({ label: 'Usage', value: b.currentUse });
  if (b.piscine) items.push({ label: 'Piscine', value: '✅ Oui' });
  if (b.ville) items.push({ label: 'Ville', value: b.ville });

  if (items.length === 0) return '';

  const sep = '<span style="color:#d1d5db;margin:0 8px;">|</span>';
  const row = items.map(i => `<span style="color:#6b7280;font-size:13px;">${i.label}:</span> <strong style="font-size:13px;">${i.value}</strong>`).join(sep);

  return `<div style="margin:16px 0 0;padding-top:16px;border-top:1px solid #e5e7eb;line-height:2;">
    <div style="font-weight:600;color:#1a1a2e;font-size:14px;margin-bottom:4px;">Détails du bien${typeLabel ? ' — ' + typeLabel : ''}</div>
    <div>${row}</div>
  </div>`;
}

function buildPropertyAddedEmailHtml(vars, userMessage) {
  const label = PROPERTY_TYPE_LABELS[vars.bien.type] || vars.bien.type || '—';
  const transactionLabel = TRANSACTION_TYPE_LABELS[vars.bien.transaction_type] || vars.bien.transaction_type || '';
  const devise = vars.bien.devise || 'MAD';
  const priceStr = formatPrice(vars.bien.prix, devise);
  const typeIcon = PROPERTY_TYPE_ICONS[vars.bien.type] || '🏠';

  const detailsHtml = buildPropertyInlineDetails(vars, devise);

  const badgeHtml = `<span style="display:inline-block;background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:6px;padding:3px 12px;font-size:12px;font-weight:700;color:#16a34a;">${label}${transactionLabel ? ' · ' + transactionLabel : ''}</span>`;

  const userMessageHtml = userMessage
    ? userMessage.replace(/\\n/g, '<br>').replace(/\n/g, '<br>')
    : '';

  const hasContent = userMessageHtml || detailsHtml;

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,sans-serif;background:#f4f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:32px 36px;">
          <div style="font-size:36px;margin-bottom:8px;">${typeIcon}</div>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Nouveau bien ajouté</h1>
          <p style="margin:8px 0 0;color:#c8b8f0;font-size:14px;">Square Meter &middot; Notification automator</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          ${hasContent ? `<div style="background:#ffffff;border-radius:8px;padding:20px 22px;border-left:4px solid #667eea;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1a1a2e;line-height:1.8;">
            ${userMessageHtml ? '<div style="white-space:pre-wrap;">' + userMessageHtml + '</div>' : ''}
            ${userMessageHtml && (badgeHtml || detailsHtml) ? '<div style="margin-top:16px;"></div>' : ''}
            ${badgeHtml}
            ${detailsHtml}
            <div style="margin-top:18px;padding-top:16px;border-top:1px solid #e5e7eb;">
              <a href="${vars.lien_agent}" target="_parent" style="color:#667eea;font-weight:600;text-decoration:underline;font-size:14px;">Voir le bien dans le CRM →</a>
            </div>
          </div>` : ''}
        </td></tr>
        <tr><td style="background:#f8f9fb;padding:18px 36px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">Square Meter &mdash; CRM Immobilier</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildPropertyAddedCrmHtml(vars) {
  const label = PROPERTY_TYPE_LABELS[vars.bien.type] || vars.bien.type || '—';
  const devise = vars.bien.devise || 'MAD';
  const priceStr = formatPrice(vars.bien.prix, devise);
  const surfaceStr = vars.bien.surface ? `${vars.bien.surface} m²` : '';

  let details = `${label}`;
  if (priceStr) details += ` · ${priceStr}`;
  if (surfaceStr) details += ` · ${surfaceStr}`;

  let typeSpecificLine = '';
  switch (vars.bien.type) {
    case 'land':
      if (vars.bien.landSize) typeSpecificLine = `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Terrain de ${vars.bien.landSize}</p>`;
      break;
    case 'vacation':
      if (vars.bien.prix_min_nuit) typeSpecificLine = `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">À partir de ${formatPrice(vars.bien.prix_min_nuit, devise)}/nuit</p>`;
      break;
    case 'luxury':
      if (vars.bien.piscine) typeSpecificLine = `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">🏊 Piscine · ${vars.bien.chambres || '?'} chambres</p>`;
      break;
    case 'commercial':
      if (vars.bien.loyer_hc) typeSpecificLine = `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Loyer HC: ${formatPrice(vars.bien.loyer_hc, devise)}/mois</p>`;
      break;
    default:
      if (vars.bien.pieces) typeSpecificLine = `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${vars.bien.pieces} pièces${vars.bien.chambres ? ' · ' + vars.bien.chambres + ' chambres' : ''}</p>`;
  }

  return `<div style="padding:4px 0;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${
        vars.createur.role === 'Administrateur' ? '#ede9fe;color:#7c3aed' : '#dbeafe;color:#1d4ed8'
      };">${vars.createur.role}</span>
      <span style="font-size:13px;color:#1a1a2e;font-weight:500;">${vars.createur.prenom} ${vars.createur.nom}</span>
    </div>
    <p style="margin:0;font-size:13px;color:#1a1a2e;font-weight:600;">${vars.bien.titre || 'Sans titre'}</p>
    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${details}</p>
    ${typeSpecificLine}
    ${vars.bien.ville ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">📍 ${vars.bien.ville}</p>` : ''}
  </div>`;
}

function buildPropertySoldEmailHtml(vars, userMessage) {
  const label = PROPERTY_TYPE_LABELS[vars.bien.type] || vars.bien.type || '—';
  const transactionLabel = TRANSACTION_TYPE_LABELS[vars.bien.transaction_type] || vars.bien.transaction_type || '';
  const devise = vars.bien.devise || 'MAD';
  const typeIcon = PROPERTY_TYPE_ICONS[vars.bien.type] || '🏠';

  const detailsHtml = buildPropertyInlineDetails(vars, devise);

  const badgeHtml = `<span style="display:inline-block;background:linear-gradient(135deg,#fef3c7,#fde68a);border-radius:6px;padding:3px 12px;font-size:12px;font-weight:700;color:#d97706;">Vendu${transactionLabel ? ' · ' + transactionLabel : ''}</span>`;

  const userMessageHtml = userMessage
    ? userMessage.replace(/\\n/g, '<br>').replace(/\n/g, '<br>')
    : '';

  const hasContent = userMessageHtml || detailsHtml;

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,sans-serif;background:#f4f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#d97706,#f59e0b);padding:32px 36px;">
          <div style="font-size:36px;margin-bottom:8px;">${typeIcon}</div>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Bien vendu</h1>
          <p style="margin:8px 0 0;color:#fef3c7;font-size:14px;">Square Meter &middot; Notification automator</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          ${hasContent ? `<div style="background:#ffffff;border-radius:8px;padding:20px 22px;border-left:4px solid #d97706;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1a1a2e;line-height:1.8;">
            ${userMessageHtml ? '<div style="white-space:pre-wrap;">' + userMessageHtml + '</div>' : ''}
            ${userMessageHtml && (badgeHtml || detailsHtml) ? '<div style="margin-top:16px;"></div>' : ''}
            ${badgeHtml}
            ${detailsHtml}
            <div style="margin-top:18px;padding-top:16px;border-top:1px solid #e5e7eb;">
              <a href="${vars.lien_agent}" target="_parent" style="color:#d97706;font-weight:600;text-decoration:underline;font-size:14px;">Voir le bien dans le CRM →</a>
            </div>
          </div>` : ''}
        </td></tr>
        <tr><td style="background:#f8f9fb;padding:18px 36px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">Square Meter &mdash; CRM Immobilier</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildPropertySoldCrmHtml(vars) {
  const label = PROPERTY_TYPE_LABELS[vars.bien.type] || vars.bien.type || '—';
  const devise = vars.bien.devise || 'MAD';
  const priceStr = formatPrice(vars.bien.prix, devise);

  return `<div style="padding:4px 0;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${
        vars.createur.role === 'Administrateur' ? '#ede9fe;color:#7c3aed' : '#dbeafe;color:#1d4ed8'
      };">${vars.createur.role}</span>
      <span style="font-size:13px;color:#1a1a2e;font-weight:500;">${vars.createur.prenom} ${vars.createur.nom}</span>
    </div>
    <p style="margin:0;font-size:13px;color:#1a1a2e;font-weight:600;">${vars.bien.titre || 'Sans titre'}</p>
    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${label} · Vendu${priceStr ? ' · ' + priceStr : ''}</p>
    ${vars.bien.ville ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">📍 ${vars.bien.ville}</p>` : ''}
  </div>`;
}

export async function triggerPropertySoldAutomation(property, updater) {
  if (!property || !property.id) {
    console.log('[PropertySoldAutomator] No property or id, skipping');
    return;
  }

  try {
    console.log(`[PropertySoldAutomator] Checking automators for property ${property.id} (${property.title || 'no title'})`);
    const automators = await pool.query(
      `SELECT a.id as automator_id, a.event_id, an.id as notif_id, an.canal, an.message_template, an.objet_template, an.destinataires
       FROM automators a
       JOIN automator_notifications an ON an.automator_id = a.id
       WHERE a.event_id = 'admin_propriete_vendue'
         AND a.actif = true AND an.actif = true`
    );

    if (automators.rows.length === 0) {
      console.log('[PropertySoldAutomator] No active automators found for admin_propriete_vendue');
      return;
    }
    console.log(`[PropertySoldAutomator] Found ${automators.rows.length} automator(s)`);

    let createurPrenom = updater?.first_name || '';
    let createurNom = updater?.last_name || '';
    const updaterRole = updater?.role || '';
    if ((!createurPrenom || !createurNom) && updater?.id) {
      try {
        const userRes = await pool.query('SELECT first_name, last_name, role FROM users WHERE id = $1', [updater.id]);
        if (userRes.rows.length > 0) {
          createurPrenom = userRes.rows[0].first_name || '';
          createurNom = userRes.rows[0].last_name || '';
        }
      } catch (err) {
        console.error('[PropertyAutomator] Error querying updater name:', err);
      }
    }
    const createurRole = updaterRole === 'admin' ? 'Administrateur' : 'Agent';

    const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType || '—';
    const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType] || property.transactionType || '';
    const devise = property.devise || 'MAD';
    let priceVal = Number(property.price) || property.prixNetVendeur || property.seasonalPriceMin || property.priceMin || property.priceMax || 0;
    const priceStr = formatPrice(priceVal, devise);
    const surfaceStr = formatSurface(property.surface);

    const admins = await pool.query(
      `SELECT id, first_name, last_name, email FROM users WHERE role IN ('admin', 'gerant') AND status = 'actif'`
    );

    const adminNames = admins.rows.map(a => `${a.first_name || ''} ${a.last_name || ''}`.trim()).filter(Boolean).join(', ') || 'Administrateur';
    const firstAdminId = admins.rows[0]?.id || '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const lienCrm = `${frontendUrl}/admin/${firstAdminId}/properties/${property.id}`;

    const vars = {
      'bien.titre': property.title || '',
      'bien.type': typeLabel,
      'bien.prix_vente': priceStr,
      'bien.prix': priceStr,
      'bien.surface': surfaceStr,
      'bien.pieces': property.rooms || property.bedrooms || '',
      'bien.chambres': property.bedrooms || '',
      'bien.ville': property.city || '',
      'bien.devise': devise,
      'bien.date_vente': new Date().toLocaleDateString('fr-FR'),
      'createur.prenom': createurPrenom,
      'createur.nom': createurNom,
      'createur.role': createurRole,
      'agent.prenom': createurPrenom,
      'agent.nom': createurNom,
      'lien_agent': lienCrm,
    };

    const fullVars = {
      bien: {
        titre: property.title || '',
        type: property.propertyType || '',
        devise: devise,
        prix: priceVal,
        surface: property.surface,
        landSize: property.landSize,
        pieces: property.rooms || property.bedrooms || '',
        chambres: property.bedrooms || '',
        sdb: property.bathrooms || '',
        ville: property.city || '',
        transaction_type: property.transactionType || '',
        date_vente: new Date().toISOString(),
      },
      createur: {
        prenom: createurPrenom,
        nom: createurNom,
        role: createurRole,
      },
      agent: {
        prenom: createurPrenom,
        nom: createurNom,
      },
      lien_agent: lienCrm,
    };

    let transporter = null;

    for (const n of automators.rows) {
      const rawCanal = n.canal || 'application_mobile';
      const canal = rawCanal === 'application_mobile' ? 'crm' : rawCanal;

      const message = replaceTemplateVars(n.message_template, vars);
      const objet = replaceTemplateVars(n.objet_template, vars);
      const title = objet || `Bien vendu - ${property.title || ''}`;

      let emailHtml = null;
      let crmHtml = null;

      if (canal === 'email') {
        emailHtml = buildPropertySoldEmailHtml(fullVars, message);
      } else {
        crmHtml = buildPropertySoldCrmHtml(fullVars);
      }

      const eventLabel = 'Propriété vendue';
      const agentFullName = `${createurPrenom} ${createurNom}`.trim();

      const summaryMessage = `Vendu par ${createurPrenom} ${createurNom} (${createurRole}) · ${typeLabel}${priceStr ? ' · ' + priceStr : ''}${property.city ? ' · ' + property.city : ''}`;

      await pool.query(
        `INSERT INTO automator_triggered_notifications
         (event_id, event_label, categorie, canal, titre, message, email_html, crm_html, agent_nom, bien_titre, client_nom, client_type, mandat_type, date_expiration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        ['admin_propriete_vendue', eventLabel, 'admin', canal, title, summaryMessage,
         emailHtml, crmHtml, agentFullName, property.title || '', '', 'admin', '', '']
      );

      if (canal === 'email' && emailHtml) {
        if (!transporter) {
          transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
            },
          });
        }
        for (const admin of admins.rows) {
          if (admin.email) {
            try {
              await transporter.sendMail({
                from: `"Square Meter" <${process.env.EMAIL_FROM || 'noreply@squaremeter.ma'}>`,
                to: admin.email,
                subject: title,
                html: emailHtml,
              });
            } catch (emailErr) {
              console.error(`[PropertyAutomator] Failed to send email to ${admin.email}:`, emailErr);
            }
          }
        }
      }

      await pool.query(
        `INSERT INTO automator_logs (automator_id, evenement, destinataire, statut, contenu)
         VALUES ($1, $2, $3, $4, $5)`,
        [n.automator_id, eventLabel, adminNames, 'succes',
         `Bien "${property.title || ''}" vendu par ${createurPrenom} ${createurNom} (${createurRole}) - ${priceStr ? priceStr : ''}`]
      );

      await pool.query(
        `UPDATE automators SET derniere_execution = CURRENT_TIMESTAMP WHERE id = $1`,
        [n.automator_id]
      );
    }

    try {
      for (const admin of admins.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [admin.id, 'Square Meter', 'agent_inactivity',
           `Propriété vendue - ${property.title || ''} : marqué vendu par ${createurPrenom} ${createurNom} (${createurRole})`,
           '', 'admin_propriete_vendue']
        );
      }
    } catch (notifErr) {
      console.error('[PropertyAutomator] Failed to create bell notifications:', notifErr);
    }
  } catch (error) {
    console.error('[PropertyAutomator] Error triggering property sold automation:', error);
  }
}

function buildPropertyRentedEmailHtml(vars, userMessage) {
  const label = PROPERTY_TYPE_LABELS[vars.bien.type] || vars.bien.type || '—';
  const transactionLabel = TRANSACTION_TYPE_LABELS[vars.bien.transaction_type] || vars.bien.transaction_type || '';
  const devise = vars.bien.devise || 'MAD';
  const typeIcon = PROPERTY_TYPE_ICONS[vars.bien.type] || '🏠';

  const detailsHtml = buildPropertyInlineDetails(vars, devise);

  const badgeHtml = `<span style="display:inline-block;background:linear-gradient(135deg,#dbeafe,#bfdbfe);border-radius:6px;padding:3px 12px;font-size:12px;font-weight:700;color:#1d4ed8;">Loué${transactionLabel ? ' · ' + transactionLabel : ''}</span>`;

  const userMessageHtml = userMessage
    ? userMessage.replace(/\\n/g, '<br>').replace(/\n/g, '<br>')
    : '';

  const hasContent = userMessageHtml || detailsHtml;

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,sans-serif;background:#f4f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#1d4ed8,#3b82f6);padding:32px 36px;">
          <div style="font-size:36px;margin-bottom:8px;">${typeIcon}</div>
          <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Bien loué</h1>
          <p style="margin:8px 0 0;color:#bfdbfe;font-size:14px;">Square Meter &middot; Notification automator</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          ${hasContent ? `<div style="background:#ffffff;border-radius:8px;padding:20px 22px;border-left:4px solid #1d4ed8;border-top:1px solid #e5e7eb;border-right:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;font-size:14px;color:#1a1a2e;line-height:1.8;">
            ${userMessageHtml ? '<div style="white-space:pre-wrap;">' + userMessageHtml + '</div>' : ''}
            ${userMessageHtml && (badgeHtml || detailsHtml) ? '<div style="margin-top:16px;"></div>' : ''}
            ${badgeHtml}
            ${detailsHtml}
            <div style="margin-top:18px;padding-top:16px;border-top:1px solid #e5e7eb;">
              <a href="${vars.lien_agent}" target="_parent" style="color:#1d4ed8;font-weight:600;text-decoration:underline;font-size:14px;">Voir le bien dans le CRM →</a>
            </div>
          </div>` : ''}
        </td></tr>
        <tr><td style="background:#f8f9fb;padding:18px 36px;border-top:1px solid #e5e7eb;">
          <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;">Square Meter &mdash; CRM Immobilier</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildPropertyRentedCrmHtml(vars) {
  const label = PROPERTY_TYPE_LABELS[vars.bien.type] || vars.bien.type || '—';
  const devise = vars.bien.devise || 'MAD';
  const priceStr = formatPrice(vars.bien.prix, devise);

  return `<div style="padding:4px 0;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
      <span style="padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;background:${
        vars.createur.role === 'Administrateur' ? '#ede9fe;color:#7c3aed' : '#dbeafe;color:#1d4ed8'
      };">${vars.createur.role}</span>
      <span style="font-size:13px;color:#1a1a2e;font-weight:500;">${vars.createur.prenom} ${vars.createur.nom}</span>
    </div>
    <p style="margin:0;font-size:13px;color:#1a1a2e;font-weight:600;">${vars.bien.titre || 'Sans titre'}</p>
    <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">${label} · Loué${priceStr ? ' · ' + priceStr : ''}</p>
    ${vars.bien.loyer ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">Loyer: ${vars.bien.loyer}/mois</p>` : ''}
    ${vars.bien.ville ? `<p style="margin:4px 0 0;font-size:12px;color:#6b7280;">📍 ${vars.bien.ville}</p>` : ''}
  </div>`;
}

export async function triggerPropertyRentedAutomation(property, updater) {
  if (!property || !property.id) {
    console.log('[PropertyRentedAutomator] No property or id, skipping');
    return;
  }

  try {
    console.log(`[PropertyRentedAutomator] Checking automators for property ${property.id} (${property.title || 'no title'})`);
    const automators = await pool.query(
      `SELECT a.id as automator_id, a.event_id, an.id as notif_id, an.canal, an.message_template, an.objet_template, an.destinataires
       FROM automators a
       JOIN automator_notifications an ON an.automator_id = a.id
       WHERE a.event_id = 'admin_propriete_louee'
         AND a.actif = true AND an.actif = true`
    );

    if (automators.rows.length === 0) {
      console.log('[PropertyRentedAutomator] No active automators found for admin_propriete_louee');
      return;
    }
    console.log(`[PropertyRentedAutomator] Found ${automators.rows.length} automator(s)`);

    let createurPrenom = updater?.first_name || '';
    let createurNom = updater?.last_name || '';
    const updaterRole = updater?.role || '';
    if ((!createurPrenom || !createurNom) && updater?.id) {
      try {
        const userRes = await pool.query('SELECT first_name, last_name, role FROM users WHERE id = $1', [updater.id]);
        if (userRes.rows.length > 0) {
          createurPrenom = userRes.rows[0].first_name || '';
          createurNom = userRes.rows[0].last_name || '';
        }
      } catch (err) {
        console.error('[PropertyRentedAutomator] Error querying updater name:', err);
      }
    }
    const createurRole = updaterRole === 'admin' ? 'Administrateur' : 'Agent';

    const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType || '—';
    const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType] || property.transactionType || '';
    const devise = property.devise || 'MAD';
    let priceVal = Number(property.price) || property.prixNetVendeur || property.seasonalPriceMin || property.priceMin || property.priceMax || 0;
    const priceStr = formatPrice(priceVal, devise);
    const surfaceStr = formatSurface(property.surface);
    const loyerStr = property.loyerHC ? formatPrice(property.loyerHC, devise) : '';

    const admins = await pool.query(
      `SELECT id, first_name, last_name, email FROM users WHERE role IN ('admin', 'gerant') AND status = 'actif'`
    );

    const adminNames = admins.rows.map(a => `${a.first_name || ''} ${a.last_name || ''}`.trim()).filter(Boolean).join(', ') || 'Administrateur';
    const firstAdminId = admins.rows[0]?.id || '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const lienCrm = `${frontendUrl}/admin/${firstAdminId}/properties/${property.id}`;

    const vars = {
      'bien.titre': property.title || '',
      'bien.type': typeLabel,
      'bien.prix': priceStr + '/mois',
      'bien.loyer': loyerStr,
      'bien.surface': surfaceStr,
      'bien.pieces': property.rooms || property.bedrooms || '',
      'bien.chambres': property.bedrooms || '',
      'bien.ville': property.city || '',
      'bien.devise': devise,
      'bien.date_location': new Date().toLocaleDateString('fr-FR'),
      'createur.prenom': createurPrenom,
      'createur.nom': createurNom,
      'createur.role': createurRole,
      'agent.prenom': createurPrenom,
      'agent.nom': createurNom,
      'lien_agent': lienCrm,
    };

    const fullVars = {
      bien: {
        titre: property.title || '',
        type: property.propertyType || '',
        devise: devise,
        prix: priceVal,
        loyer: loyerStr,
        surface: property.surface,
        landSize: property.landSize,
        pieces: property.rooms || property.bedrooms || '',
        chambres: property.bedrooms || '',
        sdb: property.bathrooms || '',
        ville: property.city || '',
        transaction_type: property.transactionType || '',
        date_location: new Date().toISOString(),
      },
      createur: {
        prenom: createurPrenom,
        nom: createurNom,
        role: createurRole,
      },
      agent: {
        prenom: createurPrenom,
        nom: createurNom,
      },
      lien_agent: lienCrm,
    };

    let transporter = null;

    for (const n of automators.rows) {
      const rawCanal = n.canal || 'application_mobile';
      const canal = rawCanal === 'application_mobile' ? 'crm' : rawCanal;

      const message = replaceTemplateVars(n.message_template, vars);
      const objet = replaceTemplateVars(n.objet_template, vars);
      const title = objet || `Bien loué - ${property.title || ''}`;

      let emailHtml = null;
      let crmHtml = null;

      if (canal === 'email') {
        emailHtml = buildPropertyRentedEmailHtml(fullVars, message);
      } else {
        crmHtml = buildPropertyRentedCrmHtml(fullVars);
      }

      const eventLabel = 'Propriété louée';
      const agentFullName = `${createurPrenom} ${createurNom}`.trim();

      const summaryMessage = `Loué par ${createurPrenom} ${createurNom} (${createurRole}) · ${typeLabel}${priceStr ? ' · ' + priceStr : ''}${property.city ? ' · ' + property.city : ''}`;

      await pool.query(
        `INSERT INTO automator_triggered_notifications
         (event_id, event_label, categorie, canal, titre, message, email_html, crm_html, agent_nom, bien_titre, client_nom, client_type, mandat_type, date_expiration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        ['admin_propriete_louee', eventLabel, 'admin', canal, title, summaryMessage,
         emailHtml, crmHtml, agentFullName, property.title || '', '', 'admin', '', '']
      );

      if (canal === 'email' && emailHtml) {
        if (!transporter) {
          transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
            },
          });
        }
        for (const admin of admins.rows) {
          if (admin.email) {
            try {
              await transporter.sendMail({
                from: `"Square Meter" <${process.env.EMAIL_FROM || 'noreply@squaremeter.ma'}>`,
                to: admin.email,
                subject: title,
                html: emailHtml,
              });
            } catch (emailErr) {
              console.error(`[PropertyRentedAutomator] Failed to send email to ${admin.email}:`, emailErr);
            }
          }
        }
      }

      await pool.query(
        `INSERT INTO automator_logs (automator_id, evenement, destinataire, statut, contenu)
         VALUES ($1, $2, $3, $4, $5)`,
        [n.automator_id, eventLabel, adminNames, 'succes',
         `Bien "${property.title || ''}" loué par ${createurPrenom} ${createurNom} (${createurRole}) - ${priceStr ? priceStr : ''}`]
      );

      await pool.query(
        `UPDATE automators SET derniere_execution = CURRENT_TIMESTAMP WHERE id = $1`,
        [n.automator_id]
      );
    }

    try {
      for (const admin of admins.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [admin.id, 'Square Meter', 'agent_inactivity',
           `Propriété louée - ${property.title || ''} : marqué loué par ${createurPrenom} ${createurNom} (${createurRole})`,
           '', 'admin_propriete_louee']
        );
      }
    } catch (notifErr) {
      console.error('[PropertyRentedAutomator] Failed to create bell notifications:', notifErr);
    }
  } catch (error) {
    console.error('[PropertyRentedAutomator] Error triggering property rented automation:', error);
  }
}

export async function triggerPropertyAddedAutomation(property, creator) {
  if (!property || !property.id) return;

  try {
    const automators = await pool.query(
      `SELECT a.id as automator_id, a.event_id, an.id as notif_id, an.canal, an.message_template, an.objet_template, an.destinataires
       FROM automators a
       JOIN automator_notifications an ON an.automator_id = a.id
       WHERE a.event_id = 'admin_nouvelle_propriete_ajoutee'
         AND a.actif = true AND an.actif = true`
    );

    if (automators.rows.length === 0) return;

    let createurPrenom = creator?.first_name || '';
    let createurNom = creator?.last_name || '';
    const creatorRole = creator?.role || '';
    if ((!createurPrenom || !createurNom) && creator?.id) {
      try {
        const userRes = await pool.query('SELECT first_name, last_name, role FROM users WHERE id = $1', [creator.id]);
        if (userRes.rows.length > 0) {
          createurPrenom = userRes.rows[0].first_name || '';
          createurNom = userRes.rows[0].last_name || '';
        }
      } catch (err) {
        console.error('[PropertyAutomator] Error querying creator name:', err);
      }
    }
    const createurRole = creatorRole === 'admin' ? 'Administrateur' : 'Agent';

    const typeLabel = PROPERTY_TYPE_LABELS[property.propertyType] || property.propertyType || '—';
    const transactionLabel = TRANSACTION_TYPE_LABELS[property.transactionType] || property.transactionType || '';
    const devise = property.devise || 'MAD';
    let priceVal = Number(property.price) || property.prixNetVendeur || property.seasonalPriceMin || property.priceMin || property.priceMax || 0;
    const priceStr = formatPrice(priceVal, devise);
    const surfaceStr = formatSurface(property.surface);
    const landSizeStr = formatSurface(property.landSize);

    const admins = await pool.query(
      `SELECT id, first_name, last_name, email FROM users WHERE role IN ('admin', 'gerant') AND status = 'actif'`
    );

    const adminNames = admins.rows.map(a => `${a.first_name || ''} ${a.last_name || ''}`.trim()).filter(Boolean).join(', ') || 'Administrateur';
    const firstAdminId = admins.rows[0]?.id || '';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const lienCrm = `${frontendUrl}/admin/${firstAdminId}/properties/${property.id}`;

    const vars = {
      'bien.titre': property.title || '',
      'bien.type': typeLabel,
      'bien.prix': priceStr,
      'bien.surface': surfaceStr,
      'bien.pieces': property.rooms || property.bedrooms || '',
      'bien.chambres': property.bedrooms || '',
      'bien.ville': property.city || '',
      'bien.devise': devise,
      'createur.prenom': createurPrenom,
      'createur.nom': createurNom,
      'createur.role': createurRole,
      'agent.prenom': createurPrenom,
      'agent.nom': createurNom,
      'lien_agent': lienCrm,
    };

    const fullVars = {
      bien: {
        titre: property.title || '',
        type: property.propertyType || '',
        devise: devise,
        prix: priceVal,
        surface: property.surface,
        landSize: property.landSize,
        pieces: property.rooms || property.bedrooms || '',
        chambres: property.bedrooms || '',
        sdb: property.bathrooms || '',
        ville: property.city || '',
        transaction_type: property.transactionType || '',
        prix_min_nuit: property.seasonalPriceMin,
        prix_max_nuit: property.seasonalPriceMax,
        prix_semaine: property.seasonalPriceWeek,
        loyer_hc: property.loyerHC,
        constructible: property.buildable,
        surface_constructible: property.buildableSurface,
        usage: property.currentUse,
        capacite: property.sleepingCapacity,
        piscine: property.pool?.hasPool,
      },
      createur: {
        prenom: createurPrenom,
        nom: createurNom,
        role: createurRole,
      },
      agent: {
        prenom: createurPrenom,
        nom: createurNom,
      },
      lien_agent: lienCrm,
    };

    let transporter = null;

    for (const n of automators.rows) {
      const rawCanal = n.canal || 'application_mobile';
      const canal = rawCanal === 'application_mobile' ? 'crm' : rawCanal;

      const message = replaceTemplateVars(n.message_template, vars);
      const objet = replaceTemplateVars(n.objet_template, vars);
      const title = objet || `Nouveau bien ajouté - ${property.title || ''}`;

      let emailHtml = null;
      let crmHtml = null;

      if (canal === 'email') {
        emailHtml = buildPropertyAddedEmailHtml(fullVars, message);
      } else {
        crmHtml = buildPropertyAddedCrmHtml(fullVars);
      }

      const eventLabel = 'Nouvelle propriété ajoutée';
      const agentFullName = `${createurPrenom} ${createurNom}`.trim();

      const summaryMessage = `Ajouté par ${createurPrenom} ${createurNom} (${createurRole}) · ${typeLabel}${priceStr ? ' · ' + priceStr : ''}${property.city ? ' · ' + property.city : ''}`;

      await pool.query(
        `INSERT INTO automator_triggered_notifications
         (event_id, event_label, categorie, canal, titre, message, email_html, crm_html, agent_nom, bien_titre, client_nom, client_type, mandat_type, date_expiration)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        ['admin_nouvelle_propriete_ajoutee', eventLabel, 'admin', canal, title, summaryMessage,
         emailHtml, crmHtml, agentFullName, property.title || '', '', 'admin', '', '']
      );

      if (canal === 'email' && emailHtml) {
        if (!transporter) {
          transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT),
            secure: process.env.EMAIL_SECURE === 'true',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASSWORD,
            },
          });
        }
        for (const admin of admins.rows) {
          if (admin.email) {
            try {
              await transporter.sendMail({
                from: `"Square Meter" <${process.env.EMAIL_FROM || 'noreply@squaremeter.ma'}>`,
                to: admin.email,
                subject: title,
                html: emailHtml,
              });
            } catch (emailErr) {
              console.error(`[PropertyAutomator] Failed to send email to ${admin.email}:`, emailErr);
            }
          }
        }
      }

      await pool.query(
        `INSERT INTO automator_logs (automator_id, evenement, destinataire, statut, contenu)
         VALUES ($1, $2, $3, $4, $5)`,
        [n.automator_id, eventLabel, adminNames, 'succes',
         `Nouveau bien "${property.title || ''}" ajouté par ${createurPrenom} ${createurNom} (${createurRole}) - Type: ${typeLabel}${priceStr ? ' - ' + priceStr : ''}`]
      );

      await pool.query(
        `UPDATE automators SET derniere_execution = CURRENT_TIMESTAMP WHERE id = $1`,
        [n.automator_id]
      );
    }

    try {
      for (const admin of admins.rows) {
        await pool.query(
          `INSERT INTO notifications (user_id, sender_name, type, message, property_id, property_ref)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [admin.id, 'Square Meter', 'agent_inactivity',
           `Nouvelle propriété ajoutée - ${property.title || ''} : ajouté par ${createurPrenom} ${createurNom} (${createurRole})`,
           '', 'admin_nouvelle_propriete_ajoutee']
        );
      }
    } catch (notifErr) {
      console.error('[PropertyAutomator] Failed to create bell notifications:', notifErr);
    }
  } catch (error) {
    console.error('[PropertyAutomator] Error triggering property added automation:', error);
  }
}
