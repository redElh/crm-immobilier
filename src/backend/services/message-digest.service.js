import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/db.js';
import PDFDocument from 'pdfkit';
import { sendRawEmail } from './email.service.js';

const BACKEND_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const APP_URL = process.env.APP_URL || 'http://localhost:5000';

export const MESSAGING_SETTINGS_DEFAULTS = {
  signature: '',
  notifyOnNewMessage: true,
  dailyDigest: false,
  emailNotifications: false,
  autoReplyEnabled: false,
  autoReplyMessage: '',
  outOfOfficeUntil: '',
  pushNotifications: true,
  smsNotifications: false,
  notificationSounds: true,
  showReadReceipts: true,
  showOthersReadReceipts: true,
  disableReadReceipts: false,
  readReceiptsEnabledAt: null,
  readReceiptsDisabledAt: null,
  showOthersReadReceiptsEnabledAt: null,
  theme: 'light',
  messageSize: 'medium',
  showEmojis: true,
};

export const DIGEST_MIN_UNREAD = 15;

export async function getMessagingSettings(userId) {
  const { rows } = await pool.query(
    'SELECT settings FROM user_messaging_settings WHERE user_id = $1',
    [userId]
  );
  return { ...MESSAGING_SETTINGS_DEFAULTS, ...(rows[0]?.settings || {}) };
}

export async function saveMessagingSettings(userId, settings = {}) {
  const prev = await getMessagingSettings(userId);
  const safe = {};
  for (const key of Object.keys(MESSAGING_SETTINGS_DEFAULTS)) {
    if (key in settings && settings[key] !== undefined) safe[key] = settings[key];
  }
  // Record the moment read receipts were (re)enabled so messages sent before
  // that moment never show the blue read receipt. The cutoff only tracks the
  // "Afficher les accusés de réception" switch itself: toggling "Désactiver les
  // accusés" on/off must not touch messages sent before the toggle.
  const wasShowReadReceipts = prev.showReadReceipts === true;
  const willShowReadReceipts = safe.showReadReceipts === true;
  if (willShowReadReceipts && !wasShowReadReceipts) {
    safe.readReceiptsEnabledAt = new Date().toISOString();
  } else if (safe.readReceiptsEnabledAt === undefined || safe.readReceiptsEnabledAt === null) {
    safe.readReceiptsEnabledAt = prev.readReceiptsEnabledAt || null;
  }
  // Record the moment "Voir les accusés des autres" was (re)enabled so the read
  // time is never shown for messages sent before that moment. Same rule: only
  // the "Voir les accusés des autres" switch itself sets this cutoff.
  const wasShowOthersReadReceipts = prev.showOthersReadReceipts === true;
  const willShowOthersReadReceipts = safe.showOthersReadReceipts === true;
  if (willShowOthersReadReceipts && !wasShowOthersReadReceipts) {
    safe.showOthersReadReceiptsEnabledAt = new Date().toISOString();
  } else if (safe.showOthersReadReceiptsEnabledAt === undefined || safe.showOthersReadReceiptsEnabledAt === null) {
    safe.showOthersReadReceiptsEnabledAt = prev.showOthersReadReceiptsEnabledAt || null;
  }
  // Record the moment disabling was turned on so only messages sent afterwards
  // are hidden; messages sent while receipts were enabled keep their blue check.
  const wasDisabled = prev.disableReadReceipts === true;
  const willBeDisabled = safe.disableReadReceipts === true;
  if (willBeDisabled && !wasDisabled) {
    safe.readReceiptsDisabledAt = new Date().toISOString();
  } else if (!willBeDisabled && wasDisabled) {
    safe.readReceiptsDisabledAt = null;
  } else if (safe.readReceiptsDisabledAt === undefined || safe.readReceiptsDisabledAt === null) {
    safe.readReceiptsDisabledAt = prev.readReceiptsDisabledAt || null;
  }
  await pool.query(
    `INSERT INTO user_messaging_settings (user_id, settings, updated_at)
     VALUES ($1, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id)
     DO UPDATE SET settings = EXCLUDED.settings, updated_at = CURRENT_TIMESTAMP`,
    [userId, JSON.stringify(safe)]
  );
  return { ...MESSAGING_SETTINGS_DEFAULTS, ...safe };
}

async function setLastDigestSentAt(userId, unreadCount) {
  await pool.query(
    `INSERT INTO user_messaging_settings (user_id, last_digest_sent_at, last_digest_unread, updated_at)
     VALUES ($1, CURRENT_TIMESTAMP, $2, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id)
     DO UPDATE SET last_digest_sent_at = CURRENT_TIMESTAMP, last_digest_unread = $2, updated_at = CURRENT_TIMESTAMP`,
    [userId, unreadCount]
  );
}

async function resetLastDigestUnread(userId) {
  await pool.query(
    `UPDATE user_messaging_settings
     SET last_digest_unread = 0, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1 AND last_digest_unread <> 0`,
    [userId]
  );
}

export async function countUnreadMessages(userId) {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count
     FROM messages m
     JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = $1
     WHERE m.sender_id <> $1
       AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)`,
    [userId]
  );
  return rows[0].count;
}

export async function getUnreadMessages(userId, limit = 15) {
  const { rows: msgs } = await pool.query(
    `SELECT m.id, m.conversation_id, m.body, m.kind, m.duration, m.attachment_name, m.attachment_size, m.call_type, m.call_direction, m.created_at,
            u.id AS sender_id, u.first_name, u.last_name, u.email, u.role, u.position, u.profile_image,
            c.type AS conv_type, c.name AS conv_name
     FROM messages m
     JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = $1
     JOIN conversations c ON c.id = m.conversation_id
     JOIN users u ON u.id = m.sender_id
     WHERE m.sender_id <> $1
       AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
     ORDER BY m.created_at ASC
     LIMIT $2`,
    [userId, limit]
  );

  if (msgs.length === 0) return [];

  const convIds = [...new Set(msgs.map(m => m.conversation_id))];
  const { rows: parts } = await pool.query(
    `SELECT cp.conversation_id, u.id AS user_id, u.first_name, u.last_name, u.role, u.position, u.profile_image
     FROM conversation_participants cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.conversation_id = ANY($1::int[])`,
    [convIds]
  );

  const convParts = {};
  for (const p of parts) {
    if (!convParts[p.conversation_id]) convParts[p.conversation_id] = [];
    convParts[p.conversation_id].push(p);
  }

  return msgs.map(m => {
    const participants = convParts[m.conversation_id] || [];
    const others = participants.filter(p => p.user_id !== m.sender_id);
    const isGroup = m.conv_type === 'group';
    const subject = isGroup
      ? (m.conv_name || 'Groupe')
      : (others[0] ? `${others[0].first_name} ${others[0].last_name}`.trim() : 'Conversation');
    const senderName = `${m.first_name} ${m.last_name}`.trim() || 'Utilisateur';
    return {
      id: String(m.id),
      conversationId: String(m.conversation_id),
      conversation: {
        id: String(m.conversation_id),
        name: subject,
        picture: isGroup ? undefined : (others[0]?.profile_image || undefined),
        isGroup,
      },
      subject,
      sender: {
        id: String(m.sender_id),
        name: senderName,
        role: m.position || (m.role === 'admin' || m.role === 'gerant' ? 'Administrateur' : 'Agent'),
        picture: m.profile_image || undefined,
      },
      body: m.body || '',
      kind: m.kind || 'text',
      duration: m.duration || null,
      attachmentName: m.attachment_name || null,
      attachmentSize: m.attachment_size || null,
      callType: m.call_type || null,
      callDirection: m.call_direction || null,
      createdAt: m.created_at,
    };
  });
}

/* ------------------------------ PDF (résumé) ------------------------------ */

const COLORS = {
  accent: '#4F46E5',
  accentHover: '#4338CA',
  accentLight: '#EEF2FF',
  background: '#F1F5F9',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
  borderSoft: '#E8ECF3',
  success: '#10B981',
  error: '#EF4444',
};

const AVATAR_GRADIENTS = [
  ['#6366f1', '#7c3aed'], // indigo-500 -> violet-600
  ['#0ea5e9', '#2563eb'], // sky-500 -> blue-600
  ['#10b981', '#0d9488'], // emerald-500 -> teal-600
  ['#f59e0b', '#ea580c'], // amber-500 -> orange-600
  ['#f43f5e', '#e11d48'], // rose-500 -> pink-600
  ['#d946ef', '#9333ea'], // fuchsia-500 -> purple-600
  ['#06b6d4', '#0284c7'], // cyan-500 -> sky-600
];

const MONTHS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function colorFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
}

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
}

function formatTime(iso) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateLabel(ts) {
  const d = new Date(ts);
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

function dateSeparator(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Aujourd'hui";
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 1) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatFooterDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR');
}

function profileImageBuffer(picture) {
  if (!picture) return null;
  try {
    const clean = picture.replace(/^\//, '');
    const ext = path.extname(clean).toLowerCase();
    if (!['.jpg', '.jpeg', '.jfif', '.png'].includes(ext)) return null;
    const full = path.join(BACKEND_ROOT, clean);
    if (!fs.existsSync(full)) return null;
    return fs.readFileSync(full);
  } catch {
    return null;
  }
}

function groupByConv(messages) {
  const out = [];
  let cur = null;
  for (const m of messages) {
    if (!cur || cur[0].conversationId !== m.conversationId) {
      cur = [];
      out.push(cur);
    }
    cur.push(m);
  }
  return out;
}

export async function generateDigestPdf({ messages, userName, date }) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const winLeft = 40;
    const winWidth = pageWidth - 80;
    const pageBottom = pageHeight - 46;
    const radius = 16;
    const contentTop = 74;
    const HEADER_H = 58;

    let pageNumber = 0;
    let cardOpen = false;
    let inMessages = false;

    const pageBg = () => {
      const g = doc.linearGradient(0, 0, 0, pageHeight);
      g.stop(0, COLORS.background);
      g.stop(1, COLORS.background);
      return g;
    };

    const drawPageBackground = () => {
      doc.rect(0, 0, pageWidth, pageHeight).fill(pageBg());
    };

    const drawHeader = () => {
      const y = 24;
      doc.save();
      doc.roundedRect(winLeft, y, 36, 36, 10).fill(COLORS.accentLight);
      doc.fillColor(COLORS.accent);
      doc.roundedRect(winLeft + 9, y + 9, 16, 11, 3).fill();
      doc.moveTo(winLeft + 11, y + 20).lineTo(winLeft + 8, y + 27).lineTo(winLeft + 16, y + 20).closePath().fill();
      doc.restore();

      doc.font('Helvetica-Bold').fontSize(15).fillColor(COLORS.text)
        .text('Résumé quotidien des messages', winLeft + 48, y + 3, { width: winWidth - 160, height: 18, ellipsis: true });
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.textSecondary)
        .text(`${userName} — ${date}`, winLeft + 48, y + 23, { width: winWidth - 160, height: 13, ellipsis: true });
      doc.y = contentTop;
    };

    const drawPageChrome = () => {
      pageNumber++;
      drawPageBackground();
      drawHeader();
      doc.font('Helvetica').fontSize(8).fillColor('#94A3B8')
        .text(`Page ${pageNumber}`, 0, pageHeight - 26, { width: pageWidth, height: 10, align: 'center' });
      doc.y = contentTop;
    };

    const drawShadow = (x, y, w, h, r = 16) => {
      doc.save();
      doc.opacity(0.05);
      doc.roundedRect(x + 1, y + 1.5, w, h, r).fill('#0F172A');
      doc.restore();
    };

    const strokeCardSides = (y) => {
      doc.save();
      doc.lineWidth(1).strokeColor(COLORS.border);
      doc.moveTo(winLeft, y).lineTo(winLeft, pageBottom).stroke();
      doc.moveTo(winLeft + winWidth, y).lineTo(winLeft + winWidth, pageBottom).stroke();
      doc.restore();
    };

    const strokeCardTop = (y) => {
      doc.save();
      doc.lineWidth(1).strokeColor(COLORS.border);
      doc.moveTo(winLeft, y + radius)
        .quadraticCurveTo(winLeft, y, winLeft + radius, y)
        .lineTo(winLeft + winWidth - radius, y)
        .quadraticCurveTo(winLeft + winWidth, y, winLeft + winWidth, y + radius)
        .stroke();
      doc.restore();
    };

    const drawAvatar = (name, picture, cx, cy, r) => {
      const img = profileImageBuffer(picture);
      if (img) {
        doc.save();
        doc.circle(cx, cy, r).clip();
        doc.image(img, cx - r, cy - r, { width: r * 2, height: r * 2 });
        doc.restore();
        doc.save();
        doc.circle(cx, cy, r).lineWidth(1).strokeColor(COLORS.border).stroke();
        doc.restore();
      } else {
        const [from, to] = colorFor(name);
        const g = doc.linearGradient(cx - r, cy - r, cx + r, cy + r);
        g.stop(0, from);
        g.stop(1, to);
        doc.save();
        doc.circle(cx, cy, r).fill(g);
        doc.fillColor(COLORS.card).font('Helvetica-Bold').fontSize(r * 0.66)
          .text(initials(name), cx - r, cy - r * 0.4, { width: r * 2, height: r * 1.2, align: 'center' });
        doc.restore();
      }
    };

    const drawCardHeader = (conv, count) => {
      const y = doc.y;
      drawAvatar(conv.name, conv.picture, winLeft + 17 + 19, y + HEADER_H / 2, 19);

      const nameX = winLeft + 52;
      const nameW = winWidth - 52 - 120;
      const badgeW = conv.isGroup ? doc.font('Helvetica-Bold').fontSize(8).widthOfString('Groupe') + 16 : 0;

      doc.font('Helvetica-Bold').fontSize(12.5).fillColor(COLORS.text)
        .text(conv.name, nameX, y + 8, { width: nameW - (conv.isGroup ? badgeW + 8 : 0), height: 16, ellipsis: true });
      if (conv.isGroup) {
        const bx = nameX + nameW - badgeW;
        doc.save();
        doc.roundedRect(bx, y + 10.5, badgeW, 15, 7.5).fill(COLORS.accentLight);
        doc.fillColor(COLORS.accent).font('Helvetica-Bold').fontSize(8)
          .text('Groupe', bx + 4, y + 12, { width: badgeW - 8, height: 11, align: 'center' });
        doc.restore();
      }
      doc.font('Helvetica').fontSize(9.5).fillColor(COLORS.textSecondary)
        .text(`${count} message${count > 1 ? 's' : ''} non lu${count > 1 ? 's' : ''}`, nameX, y + 27, { width: nameW, height: 14, ellipsis: true });

      const cw = Math.max(22, doc.font('Helvetica-Bold').fontSize(9.5).widthOfString(String(count)) + 14);
      const pillX = winLeft + winWidth - 14 - cw;
      doc.save();
      doc.roundedRect(pillX, y + 10, cw, 19, 9.5).fill(COLORS.accent);
      doc.fillColor(COLORS.card).font('Helvetica-Bold').fontSize(9.5)
        .text(String(count), pillX, y + 13.5, { width: cw, height: 12, align: 'center' });
      doc.restore();

      doc.save();
      doc.lineWidth(1).strokeColor(COLORS.border);
      doc.moveTo(winLeft, y + HEADER_H).lineTo(winLeft + winWidth, y + HEADER_H).stroke();
      doc.restore();
      doc.y = y + HEADER_H;
    };

    const beginCard = (conv, count) => {
      cardOpen = true;
      const top = doc.y;
      drawShadow(winLeft, top, winWidth, Math.min(120, pageBottom - top));
      doc.save();
      doc.rect(winLeft, top, winWidth, pageBottom - top).fill(COLORS.card);
      doc.restore();
      strokeCardTop(top);
      drawCardHeader(conv, count);
    };

    const continueCard = () => {
      doc.save();
      doc.rect(winLeft, doc.y, winWidth, pageBottom - doc.y).fill(COLORS.card);
      doc.restore();
      strokeCardSides(doc.y);
      if (inMessages) beginMessagesArea();
    };

    const endCard = (count, lastCreated) => {
      if (!cardOpen) return;
      ensureSpace(30);
      doc.y += 4;
      doc.font('Helvetica').fontSize(8).fillColor('#94A3B8')
        .text(`${count} message${count > 1 ? 's' : ''} · Chiffré de bout en bout · ${formatFooterDate(lastCreated)}`,
          winLeft, doc.y, { width: winWidth, height: 12, align: 'center' });
      const footerY = doc.y + 16;
      if (footerY < pageBottom) {
        doc.rect(winLeft, footerY, winWidth, pageBottom - footerY).fill(COLORS.background);
        doc.save();
        doc.lineWidth(1).strokeColor(COLORS.border);
        doc.moveTo(winLeft, footerY)
          .quadraticCurveTo(winLeft, footerY, winLeft + radius, footerY)
          .lineTo(winLeft + winWidth - radius, footerY)
          .quadraticCurveTo(winLeft + winWidth, footerY, winLeft + winWidth, footerY + radius)
          .stroke();
        doc.restore();
        doc.y = footerY + 14;
      } else {
        doc.y = pageBottom + 14;
      }
      cardOpen = false;
      inMessages = false;
    };

    const beginMessagesArea = () => {
      inMessages = true;
      const g = doc.linearGradient(0, doc.y, 0, pageBottom);
      g.stop(0, '#F5F8FC');
      g.stop(1, COLORS.accentLight);
      doc.rect(winLeft, doc.y, winWidth, pageBottom - doc.y).fill(g);
    };

    const ensureSpace = (needed) => {
      if (doc.y + needed > pageBottom) {
        doc.addPage();
        drawPageChrome();
        if (cardOpen) continueCard();
      }
    };

    const bubblePath = (x, y, w, h) => {
      doc.moveTo(x + 16, y)
        .lineTo(x + w - 16, y)
        .quadraticCurveTo(x + w, y, x + w, y + 16)
        .lineTo(x + w, y + h - 16)
        .quadraticCurveTo(x + w, y + h, x + w - 16, y + h)
        .lineTo(x + 6, y + h)
        .quadraticCurveTo(x, y + h, x, y + h - 6)
        .lineTo(x, y + 16)
        .quadraticCurveTo(x, y, x + 16, y)
        .closePath();
    };

    const drawTextBubble = (msg) => {
      const maxW = winWidth * 0.68;
      const padX = 11;
      const fs = 10.5;
      const lineGap = 4.2;
      const tw = maxW - padX * 2;
      const text = (msg.body || '').slice(0, 1200);
      doc.font('Helvetica').fontSize(fs);
      const bodyH = doc.heightOfString(text, { width: tw, lineGap });
      const bubbleH = bodyH + 16 + 13;
      ensureSpace(bubbleH + 6);
      const x = winLeft + 14;
      const y = doc.y;
      drawShadow(x, y, maxW, bubbleH);
      doc.save();
      bubblePath(x, y, maxW, bubbleH);
      doc.fill(COLORS.card);
      doc.lineWidth(1).strokeColor(COLORS.border).stroke();
      doc.restore();
      doc.font('Helvetica').fontSize(fs).fillColor(COLORS.text)
        .text(text, x + padX, y + 9, { width: tw, lineGap, height: bodyH });
      doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8')
        .text(formatTime(msg.createdAt), x + maxW - padX - 30, y + bubbleH - 12, { width: 30, height: 10, align: 'right' });
      doc.y = y + bubbleH;
    };

    const drawAudioBubble = (msg) => {
      const maxW = winWidth * 0.5;
      const h = 42;
      ensureSpace(h + 6);
      const x = winLeft + 14;
      const y = doc.y;
      drawShadow(x, y, maxW, h);
      doc.save();
      bubblePath(x, y, maxW, h);
      doc.fill(COLORS.card);
      doc.lineWidth(1).strokeColor(COLORS.border).stroke();
      doc.restore();
      doc.save();
      doc.circle(x + 24, y + h / 2, 12).fill(COLORS.accentLight);
      doc.fillColor(COLORS.accent);
      doc.moveTo(x + 20, y + h / 2 - 5).lineTo(x + 20, y + h / 2 + 5).lineTo(x + 27, y + h / 2).closePath().fill();
      doc.restore();
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.text)
        .text('Message vocal', x + 46, y + 8, { width: maxW - 110, height: 13, ellipsis: true });
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.textSecondary)
        .text(msg.duration || '0:30', x + 46, y + 22, { width: maxW - 110, height: 11 });
      doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8')
        .text(formatTime(msg.createdAt), x + maxW - 26, y + 15, { width: 26, height: 10, align: 'right' });
      doc.y = y + h;
    };

    const drawCallBubble = (msg) => {
      const maxW = winWidth * 0.55;
      const h = 42;
      ensureSpace(h + 6);
      const x = winLeft + 14;
      const y = doc.y;
      drawShadow(x, y, maxW, h);
      doc.save();
      bubblePath(x, y, maxW, h);
      doc.fill(COLORS.card);
      doc.lineWidth(1).strokeColor(COLORS.border).stroke();
      doc.restore();
      const missed = msg.callDirection === 'missed';
      doc.save();
      doc.roundedRect(x + 16, y + 13, 38, 16, 6).fill(missed ? '#FEE2E2' : '#D1FAE5');
      doc.fillColor(missed ? COLORS.error : '#059669').font('Helvetica-Bold').fontSize(6.5)
        .text(missed ? 'MANQUÉ' : 'APPEL', x + 16, y + 16, { width: 38, height: 10, align: 'center' });
      doc.restore();
      const label = msg.callType === 'video' ? 'Appel vidéo' : 'Appel audio';
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.text)
        .text(label, x + 62, y + 8, { width: maxW - 130, height: 13, ellipsis: true });
      const dir = msg.callDirection === 'missed' ? 'Manqué' : (msg.callDirection === 'incoming' ? 'Entrant' : 'Sortant');
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.textSecondary)
        .text(`${dir} · ${msg.duration || '0:00'}`, x + 62, y + 22, { width: maxW - 130, height: 11 });
      doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8')
        .text(formatTime(msg.createdAt), x + maxW - 26, y + 15, { width: 26, height: 10, align: 'right' });
      doc.y = y + h;
    };

    const drawFileBubble = (msg) => {
      const maxW = winWidth * 0.6;
      const h = 46;
      ensureSpace(h + 6);
      const x = winLeft + 14;
      const y = doc.y;
      drawShadow(x, y, maxW, h);
      doc.save();
      bubblePath(x, y, maxW, h);
      doc.fill(COLORS.card);
      doc.lineWidth(1).strokeColor(COLORS.border).stroke();
      doc.restore();
      doc.save();
      doc.rect(x + 16, y + 10, 11, 15).fill(COLORS.accentLight);
      doc.moveTo(x + 21, y + 10).lineTo(x + 27, y + 16).lineTo(x + 21, y + 16).closePath().fill(COLORS.accent);
      doc.restore();
      doc.font('Helvetica').fontSize(10).fillColor(COLORS.text)
        .text(msg.attachmentName || 'Pièce jointe', x + 38, y + 8, { width: maxW - 96, height: 13, ellipsis: true });
      doc.font('Helvetica').fontSize(8).fillColor(COLORS.textSecondary)
        .text(msg.attachmentSize || '', x + 38, y + 23, { width: maxW - 96, height: 11 });
      doc.font('Helvetica').fontSize(7.5).fillColor('#94A3B8')
        .text(formatTime(msg.createdAt), x + maxW - 26, y + 18, { width: 26, height: 10, align: 'right' });
      doc.y = y + h;
    };

    const drawBubbleFor = (msg) => {
      if (msg.kind === 'audio') return drawAudioBubble(msg);
      if (msg.kind === 'call') return drawCallBubble(msg);
      if (msg.attachmentName && ['file', 'image', 'video'].includes(msg.kind)) return drawFileBubble(msg);
      return drawTextBubble(msg);
    };

    const drawDatePill = (iso) => {
      const label = dateSeparator(iso);
      doc.font('Helvetica').fontSize(8.5);
      const w = doc.widthOfString(label) + 22;
      const x = winLeft + (winWidth - w) / 2;
      ensureSpace(24);
      doc.save();
      doc.roundedRect(x, doc.y, w, 18, 9).fill(COLORS.card);
      doc.lineWidth(1).strokeColor(COLORS.border).stroke();
      doc.fillColor(COLORS.textSecondary).font('Helvetica').fontSize(8.5)
        .text(label, x, doc.y + 4.5, { width: w, height: 11, align: 'center' });
      doc.restore();
      doc.y += 24;
    };

    const drawSenderName = (name) => {
      ensureSpace(16);
      doc.font('Helvetica-Bold').fontSize(9.5).fillColor(COLORS.accent)
        .text(name, winLeft + 14, doc.y, { width: winWidth - 120, height: 12, ellipsis: true });
      doc.y += 13;
    };

    drawPageChrome();

    const conversations = groupByConv(messages);
    conversations.forEach((convMessages, i) => {
      if (i > 0) doc.y += 14;
      ensureSpace(HEADER_H + 46);
      const first = convMessages[0];
      beginCard(first.conversation, convMessages.length);
      beginMessagesArea();

      let lastDay = '';
      let lastSender = '';
      for (const msg of convMessages) {
        const day = new Date(msg.createdAt).toDateString();
        if (day !== lastDay) {
          lastDay = day;
          drawDatePill(msg.createdAt);
        }
        if (msg.sender.id !== lastSender) {
          lastSender = msg.sender.id;
          drawSenderName(msg.sender.name);
        }
        drawBubbleFor(msg);
      }
      endCard(convMessages.length, convMessages[convMessages.length - 1].createdAt);
    });

    doc.end();
  });
}

/* ----------------------------- Email HTML (notif) ---------------------------- */

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function bubbleHtml(m) {
  const bubbleStyle = 'background:#FFFFFF; border:1px solid #E2E8F0; border-radius:16px 16px 16px 6px; box-shadow:0 1px 3px rgba(0,0,0,0.06); padding:9px 12px 6px; max-width:68%; margin:4px 0 10px;';
  const timeHtml = `<div style="text-align:right; font-size:10px; color:#64748B; opacity:0.7; margin-top:4px;">${escapeHtml(formatTime(m.createdAt))}</div>`;

  let content;
  if (m.kind === 'audio') {
    content = `
      <div style="display:table-cell; vertical-align:middle;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle" style="padding-right:10px;">
            <div style="width:24px;height:24px;border-radius:50%;background:#EEF2FF;text-align:center;line-height:24px;color:#4F46E5;">▶</div>
          </td>
          <td valign="middle">
            <div style="font-size:13px; color:#0F172A;">Message vocal</div>
            <div style="font-size:10px; color:#64748B;">${escapeHtml(m.duration || '0:30')}</div>
          </td>
        </tr></table>
      </div>`;
  } else if (m.kind === 'call') {
    const missed = m.callDirection === 'missed';
    const chipBg = missed ? '#FEE2E2' : '#D1FAE5';
    const chipColor = missed ? '#EF4444' : '#059669';
    const chipLabel = missed ? 'MANQUÉ' : 'APPEL';
    const label = m.callType === 'video' ? 'Appel vidéo' : 'Appel audio';
    const dir = m.callDirection === 'missed' ? 'Manqué' : (m.callDirection === 'incoming' ? 'Entrant' : 'Sortant');
    content = `
      <div style="display:table-cell; vertical-align:middle;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle" style="padding-right:10px;">
            <div style="padding:3px 9px; border-radius:6px; background:${chipBg}; color:${chipColor}; font-size:9px; font-weight:700;">${chipLabel}</div>
          </td>
          <td valign="middle">
            <div style="font-size:13px; color:#0F172A;">${escapeHtml(label)}</div>
            <div style="font-size:10px; color:#64748B;">${escapeHtml(dir)} · ${escapeHtml(m.duration || '0:00')}</div>
          </td>
        </tr></table>
      </div>`;
  } else if (m.attachmentName && ['file', 'image', 'video'].includes(m.kind)) {
    content = `
      <div style="display:table-cell; vertical-align:middle;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td valign="middle" style="padding-right:10px;">
            <div style="width:20px;height:24px;background:#EEF2FF;position:relative;">
              <div style="position:absolute; right:0; top:0; width:7px; height:7px; background:#4F46E5; border-bottom-left-radius:3px;"></div>
            </div>
          </td>
          <td valign="middle">
            <div style="font-size:13px; color:#0F172A; font-weight:600;">${escapeHtml(m.attachmentName || 'Pièce jointe')}</div>
            <div style="font-size:10px; color:#64748B;">${escapeHtml(m.attachmentSize || '')}</div>
          </td>
        </tr></table>
      </div>`;
  } else {
    content = `<div style="font-size:14px; line-height:1.6; color:#0F172A; white-space:pre-wrap; word-wrap:break-word;">${escapeHtml(m.body || '')}</div>`;
  }

  return `
    <div style="text-align:left;">
      <div style="${bubbleStyle}">${content}${timeHtml}</div>
    </div>`;
}

function conversationAvatarHtml(conv) {
  if (conv.picture) {
    return `<div style="width:42px;height:42px;border-radius:50%;overflow:hidden;border:1px solid #E2E8F0;background:#fff;">
      <img src="${APP_URL}${escapeHtml(conv.picture)}" alt="" width="42" height="42" style="width:42px;height:42px;object-fit:cover;display:block;" />
    </div>`;
  }
  const [from, to] = colorFor(conv.name);
  return `<div style="width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,${from},${to});color:#fff;font-weight:700;font-size:15px;text-align:center;line-height:42px;">${escapeHtml(initials(conv.name))}</div>`;
}

export function buildConversationalHtml({ messages, userName, date }) {
  const convBlocks = groupByConv(messages).map(convMessages => {
    const conv = convMessages[0].conversation;
    const count = convMessages.length;
    const last = convMessages[convMessages.length - 1];

    let lastDay = '';
    let lastSender = '';
    let body = '';
    for (const m of convMessages) {
      const day = new Date(m.createdAt).toDateString();
      if (day !== lastDay) {
        lastDay = day;
        body += `
          <div style="text-align:center; margin:14px 0 10px;">
            <span style="display:inline-block; padding:3px 12px; border-radius:999px; background:#FFFFFF; border:1px solid #E2E8F0; font-size:10px; color:#64748B;">${escapeHtml(dateSeparator(m.createdAt))}</span>
          </div>`;
      }
      if (m.sender.id !== lastSender) {
        lastSender = m.sender.id;
        body += `<div style="font-size:11px; font-weight:700; color:#4F46E5; padding:8px 6px 2px;">${escapeHtml(m.sender.name)}</div>`;
      }
      body += bubbleHtml(m);
    }

    return `
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate; border-spacing:0; background:#FFFFFF; border:1px solid #E2E8F0; border-radius:16px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.06); margin-bottom:22px; -webkit-box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding:12px 16px; border-bottom:1px solid #E8ECF3;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="46" valign="middle" style="padding-right:12px;">${conversationAvatarHtml(conv)}</td>
                <td valign="middle">
                  <div style="font-size:14px; font-weight:700; color:#0F172A; line-height:1.2;">${escapeHtml(conv.name)}${conv.isGroup ? ' <span style="display:inline-block; font-size:9px; font-weight:700; padding:1px 6px; border-radius:6px; background:#EEF2FF; color:#4F46E5; vertical-align:middle;">Groupe</span>' : ''}</div>
                  <div style="font-size:11px; color:#64748B; margin-top:3px;">${count} message${count > 1 ? 's' : ''} non lu${count > 1 ? 's' : ''}</div>
                </td>
                <td width="42" align="right" valign="middle">
                  <span style="display:inline-block; min-width:20px; padding:2px 7px; border-radius:999px; background:#4F46E5; color:#FFFFFF; font-size:11px; font-weight:700; text-align:center;">${count}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:linear-gradient(135deg, rgba(241,245,249,0.6) 0%, #FFFFFF 50%, rgba(238,242,255,0.6) 100%); padding:4px 14px 14px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0 10px; text-align:center; font-size:10px; color:#94A3B8;">
            ${count} message${count > 1 ? 's' : ''} · Chiffré de bout en bout · ${escapeHtml(formatFooterDate(last.createdAt))}
          </td>
        </tr>
      </table>`;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; background:#F1F5F9; font-family:Arial, Helvetica, sans-serif; -webkit-font-smoothing:antialiased;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F1F5F9;">
      <tr>
        <td align="center" style="padding:28px 16px 4px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;">
            <tr>
              <td width="50" valign="middle" style="padding-right:14px;">
                <div style="width:44px;height:44px;border-radius:12px;background:#EEF2FF;text-align:center;line-height:44px;color:#4F46E5;font-size:20px;">💬</div>
              </td>
              <td valign="middle">
                <div style="font-size:20px; font-weight:800; color:#0F172A; line-height:1.2;">Résumé quotidien des messages</div>
                <div style="font-size:12px; color:#64748B; margin-top:3px;">${escapeHtml(userName)} — ${escapeHtml(date)} · ${messages.length} message${messages.length > 1 ? 's' : ''} non lu${messages.length > 1 ? 's' : ''}</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding:16px 16px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;">
            <tr><td>${convBlocks}</td></tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/* ---------------------------------- Cron ---------------------------------- */

export async function runMessageDigestCheck({ send = sendRawEmail, now = Date.now(), minUnread = DIGEST_MIN_UNREAD } = {}) {
  const { rows: users } = await pool.query(
    `SELECT us.user_id, us.settings, us.last_digest_sent_at, us.last_digest_unread, u.email, u.first_name, u.last_name
     FROM user_messaging_settings us
     JOIN users u ON u.id = us.user_id
     WHERE u.is_active = true
       AND (COALESCE(us.settings->>'dailyDigest', 'false')::boolean = true
            OR COALESCE(us.settings->>'emailNotifications', 'false')::boolean = true)`
  );

  const summary = { checked: 0, sentPdf: [], sentEmail: [], skippedUnder15: [], skippedActive: [], errors: [] };
  const nowMs = new Date(now).getTime();

  for (const user of users) {
    const settings = { ...MESSAGING_SETTINGS_DEFAULTS, ...(user.settings || {}) };
    summary.checked++;
    try {
      const unreadCount = await countUnreadMessages(user.user_id);
      if (unreadCount < minUnread) {
        await resetLastDigestUnread(user.user_id);
        summary.skippedUnder15.push(user.user_id);
        continue;
      }
      const lastDigestUnread = user.last_digest_unread || 0;
      if (lastDigestUnread >= minUnread) {
        summary.skippedActive.push(user.user_id);
        continue;
      }

      const messages = await getUnreadMessages(user.user_id, 15);
      const userName = `${user.first_name} ${user.last_name}`.trim() || 'Utilisateur';
      const dateLabel = formatDateLabel(nowMs);
      let sentOne = false;

      if (settings.dailyDigest) {
        const pdfBuffer = await generateDigestPdf({ messages, userName, date: dateLabel });
        await send({
          to: user.email,
          subject: `Résumé quotidien — ${unreadCount} messages non lus`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
            <h2 style="color: #1a1a2e;">Votre résumé quotidien des messages</h2>
            <p>Bonjour ${escapeHtml(userName)},</p>
            <p>Vous avez <strong>${unreadCount}</strong> message(s) non lu(s) dans vos conversations. Téléchargez le fichier joint pour les parcourir conversation par conversation.</p>
            <p style="font-size: 0.8em; color: #9ca3af;">Envoyé depuis CRM Immobilier — Square Meter</p>
          </div>`,
          attachments: [{
            filename: `resume-messages-${user.user_id}-${Date.now()}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          }],
        });
        summary.sentPdf.push(user.user_id);
        sentOne = true;
      }

      if (settings.emailNotifications) {
        const html = buildConversationalHtml({ messages, userName, date: dateLabel });
        await send({
          to: user.email,
          subject: `Nouveaux messages — ${unreadCount} messages non lus`,
          html,
        });
        summary.sentEmail.push(user.user_id);
        sentOne = true;
      }

      if (sentOne) await setLastDigestSentAt(user.user_id, unreadCount);
    } catch (error) {
      console.error(`[digest] Error for user ${user.user_id}:`, error);
      summary.errors.push({ userId: user.user_id, error: error.message });
    }
  }
  return summary;
}
