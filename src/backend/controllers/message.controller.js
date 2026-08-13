import pool from '../config/db.js';
import { broadcastToConversation, broadcastToUser } from '../ws/server.js';
import { getPresence } from '../ws/presence.js';
import { getMessagingSettings, saveMessagingSettings, MESSAGING_SETTINGS_DEFAULTS } from '../services/message-digest.service.js';

const ALLOWED_REACTIONS = [
  '👍', '❤️', '😂', '😮', '😢', '🙏',
  '🎉', '😍', '🔥', '👏', '🤔', '😎', '😭', '😡', '🤝', '💯',
  '✅', '⭐', '🙌', '😅', '🥳', '😴', '💪', '🤗', '😇', '🥰',
  '🤩', '😜', '🤞', '🧡', '💚', '💙', '💜', '✨', '👀',
];

async function fetchReactionsMap(messageIds, viewerId) {
  const ids = [...new Set((messageIds || []).map(Number).filter(Boolean))];
  const map = {};
  if (ids.length === 0) return map;
  const { rows } = await pool.query(
    `SELECT mr.message_id, mr.emoji,
            COUNT(*)::int AS count,
            BOOL_OR(mr.user_id = $1) AS mine,
            ARRAY_AGG(CONCAT_WS(' ', u.first_name, u.last_name) ORDER BY mr.created_at) AS users
     FROM message_reactions mr
     JOIN users u ON u.id = mr.user_id
     WHERE mr.message_id = ANY($2::int[])
     GROUP BY mr.message_id, mr.emoji
     ORDER BY MIN(mr.created_at)`,
    [Number(viewerId), ids]
  );
  for (const r of rows) {
    const key = String(r.message_id);
    if (!map[key]) map[key] = [];
    map[key].push({
      emoji: r.emoji,
      count: r.count,
      mine: Boolean(r.mine),
      users: (r.users || []).filter(Boolean),
    });
  }
  return map;
}

function toParticipant(row) {
  if (!row) return null;
  const presenceRecord = getPresence(row.id);
  return {
    id: String(row.id),
    name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || 'Utilisateur',
    type: row.role === 'admin' || row.role === 'gerant' ? 'admin' : row.role === 'client' ? 'client' : 'agent',
    email: row.email || '',
    role: row.position || (row.role === 'admin' || row.role === 'gerant' ? 'Administrateur' : 'Agent'),
    picture: row.profile_image || undefined,
    presence: presenceRecord ? presenceRecord.status : 'offline',
    lastSeen: presenceRecord
      ? new Date(presenceRecord.lastSeen).toISOString()
      : row.last_login_at || null,
  };
}

async function fetchParticipants(conversationId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.position, u.profile_image, u.last_login_at
     FROM conversation_participants cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.conversation_id = $1`,
    [conversationId]
  );
  const participants = rows.map(toParticipant);
  const userMap = {};
  for (const p of participants) userMap[p.id] = p;
  return { participants, userMap };
}

async function fetchReadMap(conversationId) {
  const { rows } = await pool.query(
    `SELECT user_id, last_read_at FROM conversation_participants WHERE conversation_id = $1`,
    [conversationId]
  );
  const map = {};
  for (const r of rows) map[String(r.user_id)] = r.last_read_at;
  return map;
}

async function fetchViewerClearedAt(conversationId, viewerId) {
  const { rows } = await pool.query(
    'SELECT cleared_at FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, viewerId]
  );
  return rows[0]?.cleared_at || null;
}

// When a user joins a group they only see messages sent from that moment on.
async function fetchViewerJoinedAt(conversationId, viewerId) {
  const { rows } = await pool.query(
    'SELECT joined_at FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, viewerId]
  );
  return rows[0]?.joined_at || null;
}

async function fetchUserNames(userIds) {
  const ids = [...new Set((userIds || []).map(Number).filter(Boolean))];
  const map = {};
  if (ids.length === 0) return map;
  const { rows } = await pool.query(
    `SELECT id, CONCAT_WS(' ', first_name, last_name) AS name FROM users WHERE id = ANY($1::int[])`,
    [ids]
  );
  for (const r of rows) map[Number(r.id)] = r.name || 'Utilisateur';
  return map;
}

function recipientsHaveRead(row, readMap) {
  const created = new Date(row.created_at).getTime();
  const readers = Object.entries(readMap || {})
    .filter(([uid]) => String(uid) !== String(row.sender_id))
    .map(([, t]) => (t ? new Date(t).getTime() : 0));
  if (readers.length === 0) return false;
  return readers.every((t) => t >= created);
}

async function fetchSettingsMap(userIds) {
  const ids = [...new Set((userIds || []).map(Number).filter(Boolean))];
  const map = {};
  for (const id of ids) map[String(id)] = { ...MESSAGING_SETTINGS_DEFAULTS };
  if (ids.length === 0) return map;
  const { rows } = await pool.query(
    'SELECT user_id, settings FROM user_messaging_settings WHERE user_id = ANY($1::int[])',
    [ids]
  );
  for (const r of rows) {
    map[String(r.user_id)] = { ...map[String(r.user_id)], ...(r.settings || {}) };
  }
  return map;
}

// The blue read receipt on a message the viewer sent is decided by the sender's
// read-receipt privacy settings AS OF SEND TIME (snapshotted into
// receipt_settings when the message was created). Toggling "Afficher les
// accusés de réception", "Voir les accusés des autres" or "Désactiver les
// accusés" only ever affects messages sent afterwards.
//
// The (re)enable cutoffs are always enforced, even for snapshotted messages:
// when read receipts are switched back on, only messages sent from that moment
// on may show the blue check; likewise the read time is only shown for messages
// sent after "Voir les accusés des autres" was (re)enabled. Older messages that
// carried a send-time snapshot saying receipts were on must not be
// retroactively turned blue or gain a read time.
//
// A receipt is never shown when a recipient currently opted out of sending
// receipts (disableReadReceipts / showReadReceipts off) — except in group
// conversations, where the receipt reflects the group as a whole: once every
// other member has read the message, the sender sees the blue check regardless
// of individual members' settings. In groups this also overrides the sender's
// own read-receipt preferences (e.g. an admin who disabled receipts for herself
// still sees the blue check on her messages once every other member has read).

// Reconstruct the sender's send-time privacy settings for a message, using the
// snapshot when available and the viewer's current enable/disable cutoffs as a
// fallback.
function senderEffectiveSettings(row, viewer) {
  const created = new Date(row.created_at).getTime();
  const enabledAt = viewer.readReceiptsEnabledAt ? new Date(viewer.readReceiptsEnabledAt).getTime() : null;
  const sentAfterEnable = !enabledAt || created >= enabledAt;
  const othersEnabledAt = viewer.showOthersReadReceiptsEnabledAt ? new Date(viewer.showOthersReadReceiptsEnabledAt).getTime() : null;
  const sentAfterOthersEnable = !othersEnabledAt || created >= othersEnabledAt;

  if (row.receipt_settings && typeof row.receipt_settings === 'object') {
    const settings = { ...MESSAGING_SETTINGS_DEFAULTS, ...row.receipt_settings };
    if (!sentAfterEnable) settings.showReadReceipts = false;
    if (!sentAfterOthersEnable) settings.showOthersReadReceipts = false;
    return settings;
  }
  if (viewer.disableReadReceipts) {
    // Disabling must not touch messages sent before the disable moment: they
    // keep the exact display they had (send-time snapshot for snapshotted
    // messages, and for legacy ones the same enable/others cutoffs that applied
    // before disabling). Only messages sent after the disable moment are hidden.
    const disabledAt = viewer.readReceiptsDisabledAt ? new Date(viewer.readReceiptsDisabledAt).getTime() : null;
    const sentBeforeDisable = disabledAt && created < disabledAt;
    return {
      ...MESSAGING_SETTINGS_DEFAULTS,
      showReadReceipts: viewer.showReadReceipts === true && sentBeforeDisable && sentAfterEnable,
      showOthersReadReceipts: viewer.showOthersReadReceipts === true && sentBeforeDisable && sentAfterOthersEnable,
      disableReadReceipts: !sentBeforeDisable,
    };
  }
  return {
    ...MESSAGING_SETTINGS_DEFAULTS,
    showReadReceipts: viewer.showReadReceipts === true && sentAfterEnable,
    showOthersReadReceipts: viewer.showOthersReadReceipts === true && sentAfterOthersEnable,
    disableReadReceipts: false,
  };
}

// Decide the read-receipt display from the sender's send-time settings.
function receiptDisplayFor({ settings, row, readMap, settingsMap, isGroup }) {
  const recipients = Object.entries(readMap || {})
    .filter(([uid]) => String(uid) !== String(row.sender_id));
  // In group conversations the receipt reflects the group as a whole: once every
  // other member has read the message, the sender sees the blue check even if
  // individual members disabled their read confirmations — and regardless of the
  // sender's own read-receipt preferences. Direct conversations still respect
  // each participant's settings.
  if (!isGroup) {
    if (settings.disableReadReceipts || settings.showReadReceipts !== true) {
      return { status: 'delivered', readAt: null };
    }
    const anyHidden = recipients.some(([uid]) => {
      const rs = settingsMap[String(uid)] || { ...MESSAGING_SETTINGS_DEFAULTS };
      return rs.disableReadReceipts || rs.showReadReceipts !== true;
    });
    if (anyHidden) return { status: 'delivered', readAt: null };
  }
  if (settings.showOthersReadReceipts !== true) return { status: 'read', readAt: null };
  // Prefer the per-message read time (when that message actually became read);
  // fall back to the recipient's last read time for legacy messages only.
  if (row.read_at) return { status: 'read', readAt: new Date(row.read_at).toISOString() };
  const times = recipients
    .map(([, t]) => (t ? new Date(t).getTime() : 0))
    .filter(Boolean);
  return { status: 'read', readAt: times.length ? new Date(Math.max(...times)).toISOString() : null };
}

function computeReadDisplay({ row, isRead, readMap, settingsMap, viewerId, isGroup }) {
  if (!isRead) return { status: 'delivered', readAt: null };
  const viewer = settingsMap[String(viewerId)] || { ...MESSAGING_SETTINGS_DEFAULTS };

  if (String(row.sender_id) === String(viewerId)) {
    return receiptDisplayFor({
      settings: senderEffectiveSettings(row, viewer),
      row,
      readMap,
      settingsMap,
      isGroup,
    });
  }

  // Incoming message: the viewer's own read indicator, gated by their current
  // privacy settings with the disable cutoff so only messages received after
  // disabling lose the blue check.
  const disabledAt = viewer.readReceiptsDisabledAt ? new Date(viewer.readReceiptsDisabledAt).getTime() : null;
  if (viewer.disableReadReceipts) {
    const sentBeforeDisable = disabledAt && new Date(row.created_at).getTime() < disabledAt;
    if (!sentBeforeDisable) return { status: 'delivered', readAt: null };
  } else if (viewer.showReadReceipts !== true) {
    return { status: 'delivered', readAt: null };
  }
  return { status: 'read', readAt: null };
}

function buildMessage(row, userMap, viewerId, readMap, settingsMap = {}, isGroup = false, forceRead = false) {
  const sender = userMap[String(row.sender_id)] || {
    id: String(row.sender_id || ''),
    name: 'Utilisateur',
    type: 'agent',
    email: '',
    role: 'Agent',
    presence: 'offline',
  };
  const kind = row.is_call ? 'call' : row.kind || 'text';
  const readAt = (readMap || {})[String(viewerId)] || null;
  let isRead;
  if (forceRead) {
    isRead = true;
  } else if (row.sender_id === viewerId) {
    // Messages the viewer sent must not show as "read" until the other
    // participant(s) have actually read them; otherwise they stay "delivered".
    isRead = Boolean(row.read_at) || recipientsHaveRead(row, readMap);
  } else {
    isRead = Boolean(readAt && new Date(row.created_at) <= new Date(readAt));
  }
  const display = computeReadDisplay({ row, isRead, readMap, settingsMap, viewerId, isGroup });
  const msg = {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    sender,
    recipients: [],
    body: row.body || '',
    attachments: row.attachment_name
      ? [{
          id: `att-${row.id}`,
          name: row.attachment_name,
          size: row.attachment_size || '',
          url: row.attachment_url || '#',
          kind: kind === 'file' ? 'document' : kind,
        }]
      : [],
    sentAt: row.created_at,
    isRead,
    isInternalNote: Boolean(row.is_internal_note),
    kind,
    status: display.status,
    reactions: [],
  };
  if (display.readAt) msg.readAt = display.readAt;
  if (row.duration) msg.duration = row.duration;
  if (row.audio_url) msg.audioUrl = row.audio_url;
  if (row.deleted_at) msg.deleted = true;
  if (row.attachment_url) msg.attachmentUrl = row.attachment_url;
  if (row.is_call) {
    msg.callType = row.call_type || 'audio';
    msg.callDirection = row.call_direction || 'missed';
    msg.duration = row.duration || '0:00';
  }
  return msg;
}

function rawPreview(row) {
  if (!row) return '';
  if (row.deleted_at) return 'Message supprimé';
  if (row.attachment_name) return row.attachment_name;
  if (row.is_call) {
    const dir = row.call_direction === 'outgoing' ? 'Appel' : row.call_direction === 'missed' ? 'Appel manqué' : 'Appel';
    return `${dir} ${row.call_type === 'video' ? 'vidéo' : 'audio'}`;
  }
  if (row.kind === 'audio') return 'Message vocal';
  if (row.attachment_name) return row.attachment_name;
  return row.body || '';
}

async function getLastReaction(conversationId, clearedAt, joinedAt) {
  const { rows } = await pool.query(
    `SELECT mr.id, mr.message_id, mr.emoji, mr.created_at,
            CONCAT_WS(' ', u.first_name, u.last_name) AS name
     FROM message_reactions mr
     JOIN users u ON u.id = mr.user_id
     JOIN messages m ON m.id = mr.message_id
     WHERE m.conversation_id = $1
       AND ($2::timestamp IS NULL OR m.created_at > $2)
       AND ($3::timestamp IS NULL OR m.created_at >= $3)
     ORDER BY mr.created_at DESC, mr.id DESC
     LIMIT 1`,
    [conversationId, clearedAt, joinedAt]
  );
  return rows[0] || null;
}

// The conversation preview in the side list reflects the most recent activity:
// when the latest thing that happened is a reaction, the list shows
// "X a réagi {emoji} à « message »" and the conversation is ordered by the
// reaction time; otherwise the preview falls back to the last message.
async function computeConversationPreview(conversationId, clearedAt, joinedAt) {
  const { rows: convRows } = await pool.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
  const conv = convRows[0];
  if (!conv) return null;
  const lastReaction = await getLastReaction(conversationId, clearedAt, joinedAt);
  const { rows: msgRows } = await pool.query(
    'SELECT * FROM messages WHERE conversation_id = $1 AND ($2::timestamp IS NULL OR created_at > $2) AND ($3::timestamp IS NULL OR created_at >= $3) ORDER BY created_at DESC, id DESC LIMIT 1',
    [conversationId, clearedAt, joinedAt]
  );
  const lastMsg = msgRows[0] || null;
  const lastMsgTime = lastMsg ? new Date(lastMsg.created_at).getTime() : 0;
  const lastReactionTime = lastReaction ? new Date(lastReaction.created_at).getTime() : 0;

  if (lastReaction && lastReactionTime >= lastMsgTime) {
    const { rows: targetRows } = await pool.query(
      'SELECT * FROM messages WHERE id = $1',
      [lastReaction.message_id]
    );
    const targetPreview = rawPreview(targetRows[0] || null);
    const name = lastReaction.name || 'Quelqu\'un';
    return {
      preview: `${name} a réagi ${lastReaction.emoji} à « ${targetPreview} »`,
      previewReaction: { name, emoji: lastReaction.emoji, message: targetPreview },
      lastActivityAt: new Date(lastReaction.created_at).toISOString(),
    };
  }
  return {
    preview: rawPreview(lastMsg),
    previewReaction: null,
    lastActivityAt: conv.last_message_at || conv.created_at,
  };
}

async function buildConversation(conversationId, viewerId) {
  const { rows: convRows } = await pool.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
  if (convRows.length === 0) return null;
  const conv = convRows[0];

  const { participants, userMap } = await fetchParticipants(conversationId);
  const readMap = await fetchReadMap(conversationId);
  const settingsMap = await fetchSettingsMap([viewerId, ...participants.map(p => p.id)]);
  const viewerKey = String(viewerId);
  const readAt = readMap[viewerKey] || null;
  const isViewerParticipant = Boolean(readMap[viewerKey]);
  const clearedAt = await fetchViewerClearedAt(conversationId, viewerId);
  const joinedAt = await fetchViewerJoinedAt(conversationId, viewerId);

  const { rows: msgRows } = await pool.query(
    'SELECT * FROM messages WHERE conversation_id = $1 AND ($2::timestamp IS NULL OR created_at > $2) AND ($3::timestamp IS NULL OR created_at >= $3) ORDER BY created_at ASC, id ASC',
    [conversationId, clearedAt, joinedAt]
  );
  const reactionsMap = await fetchReactionsMap(msgRows.map(m => m.id), viewerId);
  const messages = msgRows.map(m => {
    const msg = buildMessage(m, userMap, viewerId, readMap, settingsMap, conv.type === 'group', !isViewerParticipant);
    msg.recipients = participants.filter(p => p.id !== msg.sender.id);
    const reacts = reactionsMap[String(m.id)];
    if (reacts) msg.reactions = reacts;
    return msg;
  });

  const unreadCount = isViewerParticipant
    ? msgRows.filter(m =>
        m.sender_id !== viewerId &&
        (!readAt || new Date(m.created_at) > new Date(readAt))
      ).length
    : 0;

  const others = participants.filter(p => p.id !== String(viewerId));
  const isGroup = conv.type === 'group';
  const subject = isGroup
    ? conv.name || 'Groupe'
    : (others[0]?.name || participants[0]?.name || 'Conversation');

  const { preview, previewReaction, lastActivityAt } = await computeConversationPreview(conversationId, clearedAt, joinedAt) || {};

  return {
    id: String(conv.id),
    participants,
    subject,
    preview: preview || '',
    previewReaction: previewReaction || null,
    folder: 'inbox',
    isStarred: false,
    isPinned: false,
    isGroup,
    createdAt: conv.created_at,
    lastActivityAt: lastActivityAt || conv.last_message_at || conv.created_at,
    messages,
    unreadCount,
    createdBy: String(conv.created_by || ''),
  };
}

async function updateLastReadAt(userId, conversationId) {
  await pool.query(
    `INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (conversation_id, user_id)
     DO UPDATE SET last_read_at = CURRENT_TIMESTAMP`,
    [conversationId, userId]
  );

  // Stamp the moment each message actually became read (all non-sender
  // participants have read it), so every message carries its own unique read
  // time instead of reusing the conversation-level last_read_at.
  await pool.query(
    `UPDATE messages m
     SET read_at = CURRENT_TIMESTAMP
     WHERE m.read_at IS NULL
       AND m.sender_id IS DISTINCT FROM $1
       AND m.conversation_id = $2
       AND NOT EXISTS (
         SELECT 1 FROM conversation_participants cp
         WHERE cp.conversation_id = m.conversation_id
           AND cp.user_id <> m.sender_id
           AND (cp.last_read_at IS NULL OR cp.last_read_at < m.created_at)
       )`,
    [userId, conversationId]
  );
}

async function assertParticipant(userId, conversationId) {
  const { rows } = await pool.query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
    [conversationId, userId]
  );
  return rows.length > 0;
}

export async function getConversations(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT c.id
       FROM conversations c
       JOIN conversation_participants cp ON cp.conversation_id = c.id
       WHERE cp.user_id = $1
       ORDER BY c.last_message_at DESC, c.id DESC`,
      [req.user.id]
    );
    const result = [];
    for (const row of rows) {
      const conv = await buildConversation(row.id, req.user.id);
      if (conv) result.push(conv);
    }
    res.json(result);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getConversation(req, res) {
  try {
    const conversationId = req.params.id;
    const isMember = await assertParticipant(req.user.id, conversationId);
    if (!isMember) return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation' });
    const conv = await buildConversation(conversationId, req.user.id);
    if (!conv) return res.status(404).json({ error: 'Conversation introuvable' });
    res.json(conv);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMessages(req, res) {
  try {
    const conversationId = req.params.id;
    const isMember = await assertParticipant(req.user.id, conversationId);
    if (!isMember) return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation' });

    await updateLastReadAt(req.user.id, conversationId);

    const { participants, userMap } = await fetchParticipants(conversationId);
    const readMap = await fetchReadMap(conversationId);
    const settingsMap = await fetchSettingsMap([req.user.id, ...participants.map(p => p.id)]);
    const clearedAt = await fetchViewerClearedAt(conversationId, req.user.id);
    const joinedAt = await fetchViewerJoinedAt(conversationId, req.user.id);
    const { rows: [convRow] } = await pool.query('SELECT type FROM conversations WHERE id = $1', [conversationId]);
    const isGroup = convRow?.type === 'group';
    const { rows } = await pool.query(
      'SELECT * FROM messages WHERE conversation_id = $1 AND ($2::timestamp IS NULL OR created_at > $2) AND ($3::timestamp IS NULL OR created_at >= $3) ORDER BY created_at ASC, id ASC',
      [conversationId, clearedAt, joinedAt]
    );
    const reactionsMap = await fetchReactionsMap(rows.map(m => m.id), req.user.id);
    res.json(rows.map(m => {
      const msg = buildMessage(m, userMap, req.user.id, readMap, settingsMap, isGroup);
      msg.recipients = participants.filter(p => p.id !== msg.sender.id);
      const reacts = reactionsMap[String(m.id)];
      if (reacts) msg.reactions = reacts;
      return msg;
    }));
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createConversation(req, res) {
  try {
    const { participantIds, name, firstMessage } = req.body || {};
    if (!Array.isArray(participantIds) || participantIds.length === 0) {
      return res.status(400).json({ error: 'Au moins un destinataire est requis' });
    }
    const ids = [...new Set(participantIds.map(Number).filter(n => Number.isInteger(n) && n !== req.user.id))];
    if (ids.length === 0) {
      return res.status(400).json({ error: 'Au moins un destinataire est requis' });
    }

    const isGroup = ids.length >= 2;
    if (isGroup && !name?.trim()) {
      return res.status(400).json({ error: 'Le nom du groupe est requis' });
    }

    const { rows: existing } = await pool.query('SELECT id FROM users WHERE id = ANY($1::int[])', [ids]);
    if (existing.length !== ids.length) {
      return res.status(400).json({ error: 'Certains destinataires sont introuvables' });
    }

    if (!isGroup) {
      const { rows: dup } = await pool.query(
        `SELECT c.id FROM conversations c
         WHERE c.type = 'direct'
           AND (SELECT COUNT(*) FROM conversation_participants cp WHERE cp.conversation_id = c.id) = 2
           AND EXISTS (SELECT 1 FROM conversation_participants a WHERE a.conversation_id = c.id AND a.user_id = $1)
           AND EXISTS (SELECT 1 FROM conversation_participants b WHERE b.conversation_id = c.id AND b.user_id = $2)
         LIMIT 1`,
        [req.user.id, ids[0]]
      );
      if (dup[0]) {
        const conv = await buildConversation(dup[0].id, req.user.id);
        return res.json(conv);
      }
    }

    const { rows: [convRow] } = await pool.query(
      `INSERT INTO conversations (type, name, created_by) VALUES ($1, $2, $3) RETURNING id`,
      [isGroup ? 'group' : 'direct', isGroup ? name.trim() : null, req.user.id]
    );
    const conversationId = convRow.id;

    const allIds = [req.user.id, ...ids];
    for (const uid of allIds) {
      await pool.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, last_read_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [conversationId, uid]
      );
    }

    if (firstMessage?.trim()) {
      const senderSettings = await getMessagingSettings(req.user.id);
      const receiptSettings = JSON.stringify({
        showReadReceipts: senderSettings.showReadReceipts,
        showOthersReadReceipts: senderSettings.showOthersReadReceipts,
        disableReadReceipts: senderSettings.disableReadReceipts,
      });
      await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, body, kind, receipt_settings) VALUES ($1, $2, $3, 'text', $4)`,
        [conversationId, req.user.id, firstMessage.trim(), receiptSettings]
      );
      await pool.query(
        `UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [conversationId]
      );
    }

    const conv = await buildConversation(conversationId, req.user.id);
    broadcastToConversation(conversationId, { type: 'conversation:new', conversationId }, req.user.id);
    res.status(201).json(conv);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function sendMessage(req, res) {
  try {
    const conversationId = req.params.id;
    const { body: content, kind, duration, attachmentName, attachmentSize, attachmentUrl, audioUrl } = req.body || {};
    const isMember = await assertParticipant(req.user.id, conversationId);
    if (!isMember) return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation' });
    await updateLastReadAt(req.user.id, conversationId);

    const text = (typeof content === 'string' ? content : '').trim();
    if (!text && !attachmentName && kind !== 'audio' && kind !== 'call') {
      return res.status(400).json({ error: 'Le message est vide' });
    }

    const senderSettings = await getMessagingSettings(req.user.id);
    const receiptSettings = JSON.stringify({
      showReadReceipts: senderSettings.showReadReceipts,
      showOthersReadReceipts: senderSettings.showOthersReadReceipts,
      disableReadReceipts: senderSettings.disableReadReceipts,
    });

    const { rows: [msgRow] } = await pool.query(
      `INSERT INTO messages (conversation_id, sender_id, body, kind, duration, attachment_name, attachment_size, attachment_url, receipt_settings, audio_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        conversationId,
        req.user.id,
        text,
        kind || 'text',
        duration || null,
        attachmentName || null,
        attachmentSize || null,
        typeof attachmentUrl === 'string' && attachmentUrl.trim() ? attachmentUrl.trim() : null,
        receiptSettings,
        typeof audioUrl === 'string' && audioUrl.trim() ? audioUrl.trim() : null,
      ]
    );
    await pool.query(
      `UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [conversationId]
    );

    const { participants, userMap } = await fetchParticipants(conversationId);
    const readMap = await fetchReadMap(conversationId);
    const settingsMap = await fetchSettingsMap([req.user.id, ...participants.map(p => p.id)]);
    const { rows: [convRow] } = await pool.query('SELECT type FROM conversations WHERE id = $1', [conversationId]);
    const msg = buildMessage(msgRow, userMap, req.user.id, readMap, settingsMap, convRow?.type === 'group');
    msg.recipients = participants.filter(p => p.id !== msg.sender.id);
    broadcastToConversation(conversationId, { type: 'message:new', conversationId, message: msg }, req.user.id);
    res.status(201).json(msg);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function markConversationRead(req, res) {
  try {
    const conversationId = req.params.id;
    const isMember = await assertParticipant(req.user.id, conversationId);
    if (!isMember) return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation' });
    await updateLastReadAt(req.user.id, conversationId);
    const settings = await getMessagingSettings(req.user.id);
    const sendsReceipts = !settings.disableReadReceipts && settings.showReadReceipts !== false;
    if (sendsReceipts) {
      broadcastToConversation(
        conversationId,
        { type: 'message:read', conversationId, userId: req.user.id },
        req.user.id
      );
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Error marking conversation as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteConversation(req, res) {
  try {
    const conversationId = req.params.id;
    const isMember = await assertParticipant(req.user.id, conversationId);
    if (!isMember) return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation' });
    await pool.query('DELETE FROM conversations WHERE id = $1', [conversationId]);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// "Vider la conversation" clears the history for the current user only: their
// `cleared_at` timestamp is set, and all earlier messages are hidden from their
// view (the other participants still see everything). Messages sent afterwards
// appear normally again.
export async function clearConversation(req, res) {
  try {
    const conversationId = req.params.id;
    const isMember = await assertParticipant(req.user.id, conversationId);
    if (!isMember) return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation' });
    await pool.query(
      `INSERT INTO conversation_participants (conversation_id, user_id, last_read_at, cleared_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (conversation_id, user_id)
       DO UPDATE SET last_read_at = CURRENT_TIMESTAMP, cleared_at = CURRENT_TIMESTAMP`,
      [conversationId, req.user.id]
    );
    broadcastToConversation(
      conversationId,
      { type: 'conversation:cleared', conversationId, userId: req.user.id },
      req.user.id
    );
    res.json({ ok: true, clearedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error clearing conversation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Lightweight payload for realtime broadcasts of the "X a ajouté / retiré Y"
// system messages (the receiving clients render them as centered lines).
function systemMessagePayload(conversationId, row, userMap) {
  return {
    id: String(row.id),
    conversationId: String(conversationId),
    sender: userMap[String(row.sender_id)] || {
      id: String(row.sender_id || ''),
      name: 'Utilisateur',
      type: 'agent',
      email: '',
      role: 'Agent',
      presence: 'offline',
    },
    recipients: [],
    body: row.body || '',
    attachments: [],
    sentAt: row.created_at,
    isRead: true,
    isInternalNote: false,
    kind: 'system',
    status: 'delivered',
  };
}

// Group membership is managed by the user who created the group. Adding a user
// creates a participant row (joined_at = now) plus a system message so the
// whole conversation knows "X a ajouté Y". New members only see messages sent
// from their join time onwards (see the joined_at filter in buildConversation).
export async function addGroupMembers(req, res) {
  try {
    const conversationId = Number(req.params.id);
    if (!Number.isInteger(conversationId)) return res.status(400).json({ error: 'Conversation invalide' });
    const userIds = [...new Set((req.body || {}).userIds || [])].map(Number).filter(Number.isInteger);
    if (userIds.length === 0) {
      return res.status(400).json({ error: 'Au moins un membre est requis' });
    }
    const { rows: [conv] } = await pool.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    if (!conv) return res.status(404).json({ error: 'Conversation introuvable' });
    if (conv.type !== 'group') return res.status(400).json({ error: "Cette conversation n'est pas un groupe" });
    if (conv.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Seul le créateur du groupe peut ajouter des membres' });
    }

    const { rows: memberRows } = await pool.query(
      'SELECT user_id FROM conversation_participants WHERE conversation_id = $1',
      [conversationId]
    );
    const existing = new Set(memberRows.map(r => Number(r.user_id)));
    existing.add(req.user.id);
    const fresh = userIds.filter(u => !existing.has(u));
    if (fresh.length === 0) {
      return res.status(400).json({ error: 'Ces membres sont déjà dans le groupe' });
    }
    const nameMap = await fetchUserNames(fresh);
    if (fresh.some(u => !nameMap[u])) {
      return res.status(400).json({ error: 'Certains membres sont introuvables' });
    }

    const actorName = (await fetchUserNames([req.user.id]))[req.user.id] || 'Utilisateur';
    for (const uid of fresh) {
      await pool.query(
        `INSERT INTO conversation_participants (conversation_id, user_id, last_read_at) VALUES ($1, $2, CURRENT_TIMESTAMP)`,
        [conversationId, uid]
      );
    }
    const systemRows = [];
    for (const uid of fresh) {
      const { rows: [sysRow] } = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, body, kind) VALUES ($1, $2, $3, 'system') RETURNING *`,
        [conversationId, req.user.id, `${actorName} a ajouté ${nameMap[uid]}`]
      );
      systemRows.push(sysRow);
    }
    await pool.query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    const { participants, userMap } = await fetchParticipants(conversationId);
    broadcastToConversation(
      conversationId,
      { type: 'conversation:members-changed', conversationId: String(conversationId), participants },
      null
    );
    for (const sysRow of systemRows) {
      broadcastToConversation(
        conversationId,
        { type: 'message:new', conversationId: String(conversationId), message: systemMessagePayload(conversationId, sysRow, userMap) },
        null
      );
    }
    // Let the freshly added users know the conversation now exists for them.
    for (const uid of fresh) {
      broadcastToUser(uid, { type: 'conversation:new', conversationId: String(conversationId) });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Error adding group members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function removeGroupMembers(req, res) {
  try {
    const conversationId = Number(req.params.id);
    if (!Number.isInteger(conversationId)) return res.status(400).json({ error: 'Conversation invalide' });
    const userIds = [...new Set((req.body || {}).userIds || [])].map(Number).filter(Number.isInteger);
    if (userIds.length === 0) {
      return res.status(400).json({ error: 'Au moins un membre est requis' });
    }
    const { rows: [conv] } = await pool.query('SELECT * FROM conversations WHERE id = $1', [conversationId]);
    if (!conv) return res.status(404).json({ error: 'Conversation introuvable' });
    if (conv.type !== 'group') return res.status(400).json({ error: "Cette conversation n'est pas un groupe" });
    if (conv.created_by !== req.user.id) {
      return res.status(403).json({ error: 'Seul le créateur du groupe peut retirer des membres' });
    }
    if (userIds.includes(req.user.id)) {
      return res.status(400).json({ error: 'Vous ne pouvez pas vous retirer vous-même' });
    }

    const { rows: memberRows } = await pool.query(
      'SELECT user_id FROM conversation_participants WHERE conversation_id = $1',
      [conversationId]
    );
    const memberSet = new Set(memberRows.map(r => Number(r.user_id)));
    const toRemove = [...new Set(userIds)].filter(u => memberSet.has(u) && u !== req.user.id);
    if (toRemove.length === 0) {
      return res.status(400).json({ error: 'Ces membres ne sont pas dans le groupe' });
    }

    const nameMap = await fetchUserNames(toRemove);
    const actorName = (await fetchUserNames([req.user.id]))[req.user.id] || 'Utilisateur';
    for (const uid of toRemove) {
      await pool.query(
        'DELETE FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2',
        [conversationId, uid]
      );
    }
    const systemRows = [];
    for (const uid of toRemove) {
      const { rows: [sysRow] } = await pool.query(
        `INSERT INTO messages (conversation_id, sender_id, body, kind) VALUES ($1, $2, $3, 'system') RETURNING *`,
        [conversationId, req.user.id, `${actorName} a retiré ${nameMap[uid]}`]
      );
      systemRows.push(sysRow);
    }
    await pool.query(
      'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [conversationId]
    );

    const { participants, userMap } = await fetchParticipants(conversationId);
    broadcastToConversation(
      conversationId,
      { type: 'conversation:members-changed', conversationId: String(conversationId), participants },
      null
    );
    for (const sysRow of systemRows) {
      broadcastToConversation(
        conversationId,
        { type: 'message:new', conversationId: String(conversationId), message: systemMessagePayload(conversationId, sysRow, userMap) },
        null
      );
    }
    for (const uid of toRemove) {
      broadcastToUser(uid, { type: 'conversation:member-removed', conversationId: String(conversationId) });
    }
    res.json({ ok: true });
  } catch (error) {
    console.error('Error removing group members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function uploadVoice(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier audio' });
    const sizeMb = req.file.size / (1024 * 1024);
    res.json({
      url: `/uploads/voice/${req.file.filename}`,
      size: `${sizeMb.toFixed(1)} Mo`,
    });
  } catch (error) {
    console.error('Error uploading voice message:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Uploads an image/video/document/audio file to be attached to a message.
// Returns the public URL plus display metadata so the caller can persist them
// on the message via sendMessage(attachmentName / attachmentSize / attachmentUrl).
export async function uploadAttachment(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier' });
    const sizeMb = req.file.size / (1024 * 1024);
    res.json({
      url: `/uploads/attachments/${req.file.filename}`,
      name: req.file.originalname,
      size: `${sizeMb.toFixed(1)} Mo`,
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Soft-deletes the given messages of a conversation for everyone: the rows keep
// a `deleted_at` timestamp so the UI can show a "Ce message a été supprimé"
// placeholder in their place (deleted for the sender AND the receivers).
export async function deleteMessages(req, res) {
  try {
    const conversationId = req.params.id;
    const messageIds = (req.body || {}).messageIds || [];
    const ids = [...new Set(messageIds.map(Number).filter(Number.isInteger))];
    if (ids.length === 0) {
      return res.status(400).json({ error: 'Aucun message sélectionné' });
    }
    const isMember = await assertParticipant(req.user.id, conversationId);
    if (!isMember) return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation' });

    const { rowCount } = await pool.query(
      `UPDATE messages
       SET deleted_at = CURRENT_TIMESTAMP
       WHERE conversation_id = $1 AND id = ANY($2::int[])`,
      [conversationId, ids]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'Messages introuvables' });

    await pool.query(
      `DELETE FROM message_reactions
       WHERE message_id IN (
         SELECT id FROM messages WHERE conversation_id = $1 AND id = ANY($2::int[])
       )`,
      [conversationId, ids]
    );

    const deletedIds = ids.map(String);
    broadcastToConversation(
      conversationId,
      { type: 'message:deleted', conversationId, messageIds: deletedIds },
      req.user.id
    );
    res.json({ ok: true, messageIds: deletedIds });
  } catch (error) {
    console.error('Error deleting messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function toggleReaction(req, res) {
  try {
    const conversationId = req.params.id;
    const messageId = Number(req.params.messageId);
    const emoji = String((req.body || {}).emoji || '').trim();
    if (!Number.isInteger(messageId) || messageId <= 0) {
      return res.status(400).json({ error: 'Message invalide' });
    }
    if (!ALLOWED_REACTIONS.includes(emoji)) {
      return res.status(400).json({ error: 'Réaction invalide' });
    }
    const isMember = await assertParticipant(req.user.id, conversationId);
    if (!isMember) return res.status(403).json({ error: 'Vous ne faites pas partie de cette conversation' });

    const { rows: msgRows } = await pool.query(
      'SELECT id FROM messages WHERE id = $1 AND conversation_id = $2',
      [messageId, conversationId]
    );
    if (msgRows.length === 0) return res.status(404).json({ error: 'Message introuvable' });

    const { rowCount } = await pool.query(
      `INSERT INTO message_reactions (message_id, user_id, emoji)
       VALUES ($1, $2, $3)
       ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
      [messageId, req.user.id, emoji]
    );
    if (rowCount === 0) {
      await pool.query(
        'DELETE FROM message_reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
        [messageId, req.user.id, emoji]
      );
    } else {
      // A new reaction is activity: bump the conversation so it moves back to
      // the top of the list (removing a reaction is not activity).
      await pool.query(
        'UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [conversationId]
      );
    }

    const reactions = (await fetchReactionsMap([messageId], req.user.id))[String(messageId)] || [];
    const clearedAt = await fetchViewerClearedAt(conversationId, req.user.id);
    const joinedAt = await fetchViewerJoinedAt(conversationId, req.user.id);
    const previewInfo = await computeConversationPreview(conversationId, clearedAt, joinedAt) || {};
    const payload = {
      type: 'message:reaction',
      conversationId,
      messageId: String(messageId),
      reactions,
      ...previewInfo,
    };
    broadcastToConversation(conversationId, payload, req.user.id);
    res.json({ reactions, ...previewInfo });
  } catch (error) {
    console.error('Error toggling reaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function listMessageUsers(req, res) {
  try {
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, email, role, position, profile_image, last_login_at
       FROM users
       WHERE role IN ('agent', 'admin', 'gerant') AND is_active = true AND id <> $1
       ORDER BY first_name ASC`,
      [req.user.id]
    );
    res.json(rows.map(toParticipant));
  } catch (error) {
    console.error('Error fetching message users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMessagingSettingsController(req, res) {
  try {
    res.json(await getMessagingSettings(req.user.id));
  } catch (error) {
    console.error('Error fetching messaging settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateMessagingSettingsController(req, res) {
  try {
    const saved = await saveMessagingSettings(req.user.id, req.body || {});
    res.json(saved);
  } catch (error) {
    console.error('Error saving messaging settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
