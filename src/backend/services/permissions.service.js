import pool from '../config/db.js';

// Default (valeur par défaut) for every permission key across all modules.
export const PERMISSION_DEFAULTS = {
  'calendrier-lecture': true,
  'calendrier-ecriture': true,
  'contacts-supprimer': true,
  'contacts-info-privees': true,
  'contacts-lecture': true,
  'contacts-demandes': true,
  'contacts-ecriture': true,
  'contacts-general-export': true,
  'prospects-lecture': true,
  'prospects-ecriture': true,
  'clients-supprimer': true,
  'clients-info-privees': true,
  'clients-lecture': true,
  'clients-ecriture': true,
  'clients-visite': true,
  'clients-general-export': true,
  'contrats-supprimer': true,
  'contrats-info-privees': true,
  'contrats-lecture': true,
  'contrats-ecriture': true,
  'contrats-general-export': true,
  'contrats-general-lock': false,
  'biens-afficher-adresse': true,
  'biens-afficher-nom-contact': true,
  'biens-afficher-coordonnees-contact': true,
  'biens-documents-prives': false,
  'biens-transfert': true,
  'biens-info-privees': false,
  'biens-lecture': true,
  'biens-ecriture': true,
  'biens-commercial-export': true,
  'biens-commercial-publier': true,
  'registre-ecriture': true,
  'registre-general-export': true,
  'registre-info-privees': false,
  'registre-lecture': true,
};

function moduleOf(key) {
  return key.split('-')[0];
}

// Raw stored choices for a user: { '<module>-<key>': 'défaut' | 'oui' | 'non' }
export async function getStoredPermissions(userId) {
  const { rows } = await pool.query(
    'SELECT module, permission_key, value FROM user_permissions WHERE user_id = $1',
    [userId]
  );
  const result = {};
  for (const row of rows) {
    result[`${row.module}-${row.permission_key}`] = row.value;
  }
  return result;
}

// Effective boolean for each permission key (choice applied on top of the default).
export async function getEffectivePermissions(userId) {
  const stored = await getStoredPermissions(userId);
  const result = {};
  for (const [key, defaultValue] of Object.entries(PERMISSION_DEFAULTS)) {
    const choice = stored[key];
    if (choice === 'oui') result[key] = true;
    else if (choice === 'non') result[key] = false;
    else result[key] = defaultValue;
  }
  return result;
}

// Save a flat map of choices { '<module>-<key>': 'défaut' | 'oui' | 'non' }.
// Keys set to 'défaut' are removed so the default value always applies.
export async function savePermissions(userId, permissions = {}) {
  for (const [key, value] of Object.entries(permissions)) {
    if (!(key in PERMISSION_DEFAULTS)) continue;
    const module = moduleOf(key);
    if (value === 'défaut') {
      await pool.query(
        'DELETE FROM user_permissions WHERE user_id = $1 AND module = $2 AND permission_key = $3',
        [userId, module, key.slice(module.length + 1)]
      );
    } else if (value === 'oui' || value === 'non') {
      await pool.query(
        `INSERT INTO user_permissions (user_id, module, permission_key, value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, module, permission_key)
         DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [userId, module, key.slice(module.length + 1), value]
      );
    }
  }
}
