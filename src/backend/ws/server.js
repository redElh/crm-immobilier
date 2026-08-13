import wsPkg from 'ws';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { setPresence, getPresence } from './presence.js';

const { Server: WebSocketServer } = wsPkg;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// userId (number) -> Set of connected WebSocket clients
const clients = new Map();

// Throttled last activity tracking (in-memory, per user).
const lastActivityUpdates = new Map();

function touchLastActivity(userId) {
  const now = Date.now();
  const last = lastActivityUpdates.get(userId) || 0;
  if (now - last < 60000) return;
  lastActivityUpdates.set(userId, now);
  pool.query(
    'UPDATE users SET last_activity_at = CURRENT_TIMESTAMP WHERE id = $1',
    [userId]
  ).catch(() => {});
}

// Flip a user's status between 'actif' and 'inactif', never touching
// 'suspendu'/'supprimé' states.
function setUserStatus(userId, status) {
  pool.query(
    `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP
     WHERE id = $2 AND status = $3`,
    [status, userId, status === 'actif' ? 'inactif' : 'actif']
  ).catch((err) => console.error('Error updating user status:', err));
}

function send(ws, payload) {
  if (ws.readyState === 1) {
    ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
  }
}

function broadcastToAll(payload) {
  for (const set of clients.values()) {
    for (const ws of set) send(ws, payload);
  }
}

function presencePayload(userId, record) {
  return {
    type: 'presence:update',
    user: {
      id: String(userId),
      presence: record.status,
      lastSeen: new Date(record.lastSeen).toISOString(),
    },
  };
}

function updatePresence(userId, status) {
  const prev = getPresence(userId);
  const record = setPresence(userId, status);
  if (!prev || prev.status !== status) {
    broadcastToAll(presencePayload(userId, record));
  }
  return record;
}

export function setupRealtime(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    let user;
    try {
      const url = new URL(req.url, 'http://localhost');
      user = jwt.verify(url.searchParams.get('token') || '', JWT_SECRET);
    } catch (error) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    ws.userId = user.id;
    if (!clients.has(user.id)) clients.set(user.id, new Set());
    clients.get(user.id).add(ws);

    // A connected socket means the user has a tab open and is logged in.
    touchLastActivity(user.id);
    setUserStatus(user.id, 'actif');

    // Only default to 'away' when we have never seen this user before
    // (e.g. fresh login). On reconnects keep the last known status until the
    // client re-reports it, so an online user is not flipped to 'away'.
    if (!getPresence(user.id)) {
      updatePresence(user.id, 'away');
    }

    send(ws, { type: 'hello', userId: user.id, role: user.role || 'agent' });

    ws.on('message', (data) => {
      handleClientMessage(user, data.toString());
    });

    ws.on('close', () => {
      const set = clients.get(user.id);
      if (set) {
        set.delete(ws);
        if (set.size === 0) {
          clients.delete(user.id);
          // Last tab closed: the user is no longer active.
          setUserStatus(user.id, 'inactif');
          const current = getPresence(user.id);
          if (current && current.status === 'online') {
            updatePresence(user.id, 'away');
          }
        }
      }
    });
  });
}

async function handleClientMessage(user, raw) {
  let msg;
  try {
    msg = JSON.parse(raw);
  } catch (error) {
    return;
  }

  if (msg.type === 'presence') {
    const status = msg.status;
    if (status === 'online' || status === 'away' || status === 'offline') {
      updatePresence(user.id, status);
      if (status === 'offline') {
        setUserStatus(user.id, 'inactif');
      } else {
        touchLastActivity(user.id);
      }
    }
    return;
  }

  if (msg.type !== 'typing' && msg.type !== 'recording') return;

  const conversationId = String(msg.conversationId || '');
  if (!conversationId) return;

  const allowed = await canInteract(user.id, conversationId);
  if (!allowed) return;

  const recipients = await getRecipients(conversationId, user.id);
  const payload = {
    type: 'typing',
    conversationId,
    userId: user.id,
    state: msg.active ? msg.type : 'stop',
  };
  for (const uid of recipients) broadcastToUser(uid, payload);
}

async function canInteract(userId, conversationId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  return rows.length > 0;
}

async function getRecipients(conversationId, excludeUserId) {
  const { rows } = await pool.query(
    'SELECT cp.user_id FROM conversation_participants cp WHERE cp.conversation_id = $1 AND cp.user_id <> $2',
    [conversationId, excludeUserId]
  );
  return rows.map((r) => Number(r.user_id));
}

export function broadcastToUser(userId, payload) {
  const set = clients.get(Number(userId));
  if (!set) return;
  for (const ws of set) send(ws, payload);
}

export async function broadcastToConversation(conversationId, payload, excludeUserId) {
  try {
    const ids = await getRecipients(conversationId, excludeUserId);
    for (const id of ids) broadcastToUser(id, payload);
  } catch (error) {
    console.error('Error broadcasting to conversation:', error);
  }
}
