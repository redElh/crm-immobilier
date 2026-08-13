import pool from '../config/db.js';
import { getStoredPermissions, savePermissions, getEffectivePermissions } from '../services/permissions.service.js';

const ALLOWED_VALUES = ['défaut', 'oui', 'non'];

async function assertAgentExists(userId) {
  const { rows } = await pool.query(
    'SELECT id, role FROM users WHERE id = $1',
    [userId]
  );
  if (rows.length === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  if (rows[0].role !== 'agent') {
    const err = new Error('Droits are only available for agent users');
    err.status = 400;
    throw err;
  }
}

export async function getUserDroits(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Invalid user id' });
    await assertAgentExists(userId);
    res.json({ permissions: await getStoredPermissions(userId) });
  } catch (error) {
    console.error('Error fetching user droits:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function updateUserDroits(req, res) {
  try {
    const userId = Number(req.params.id);
    if (!Number.isInteger(userId)) return res.status(400).json({ error: 'Invalid user id' });
    await assertAgentExists(userId);

    if (req.body?.reset === true) {
      await pool.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);
      return res.json({ permissions: await getStoredPermissions(userId) });
    }

    const permissions = req.body?.permissions || {};
    const cleaned = {};
    for (const [key, value] of Object.entries(permissions)) {
      if (ALLOWED_VALUES.includes(value)) cleaned[key] = value;
    }
    await savePermissions(userId, cleaned);
    res.json({ permissions: await getStoredPermissions(userId) });
  } catch (error) {
    console.error('Error updating user droits:', error);
    res.status(error.status || 500).json({ error: error.message || 'Internal server error' });
  }
}

export async function getMyPermissions(req, res) {
  try {
    res.json({ permissions: await getEffectivePermissions(req.user.id) });
  } catch (error) {
    console.error('Error fetching my permissions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
