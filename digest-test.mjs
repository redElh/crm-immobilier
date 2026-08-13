import { spawn } from 'child_process';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST,
  database: process.env.DB_NAME, password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const {
  runMessageDigestCheck, generateDigestPdf, buildConversationalHtml,
  countUnreadMessages, getUnreadMessages,
} = await import('./src/backend/services/message-digest.service.js');

const PORT = 5111;
const token = (id, role, email) =>
  jwt.sign({ id, role, email }, 'your-secret-key', { expiresIn: '1h' });
const TOKEN16 = token(16, 'agent', 'ridaelhiri6@gmail.com');

const server = spawn('node', ['src/backend/app.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/api/health`);
      if (res.ok) return true;
    } catch {}
    await sleep(500);
  }
  return false;
}

const results = [];
function assert(cond, name) {
  results.push({ name, ok: !!cond });
  console.log(cond ? 'PASS' : 'FAIL', name);
}

let seededIds = [];

async function main() {
  if (!(await waitForServer())) { console.log('FAIL server did not start'); server.kill(); process.exit(1); }
  console.log('server up on', PORT);

  // 1. Settings endpoints
  const defaults = await fetch(`http://localhost:${PORT}/api/messages/settings`, {
    headers: { Authorization: `Bearer ${TOKEN16}` },
  }).then(r => r.json());
  assert(defaults.notifyOnNewMessage === true && defaults.dailyDigest === false && defaults.emailNotifications === false, 'GET settings returns defaults');

  const saved = await fetch(`http://localhost:${PORT}/api/messages/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN16}` },
    body: JSON.stringify({ notifyOnNewMessage: false, dailyDigest: true, emailNotifications: true, theme: 'dark' }),
  }).then(r => r.json());
  assert(saved.notifyOnNewMessage === false && saved.dailyDigest === true && saved.emailNotifications === true, 'PUT settings persists toggles');

  const reget = await fetch(`http://localhost:${PORT}/api/messages/settings`, {
    headers: { Authorization: `Bearer ${TOKEN16}` },
  }).then(r => r.json());
  assert(reget.theme === 'dark' && reget.dailyDigest === true, 'GET settings returns persisted values');

  // 2. Seed unread messages (from admin 12 into conversation 2, of which agent 16 is a participant)
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`http://localhost:${PORT}/api/messages/conversations/2/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(12, 'admin', 'redaelhiri9@gmail.com')}` },
      body: JSON.stringify({ body: `DIGEST_SEED_${i}` }),
    });
    const msg = await res.json();
    seededIds.push(Number(msg.id));
  }

  // 3. Unread counting
  const unreadCount = await countUnreadMessages(16);
  assert(unreadCount >= 3, `countUnreadMessages(16) >= 3 (got ${unreadCount})`);

  const messages = await getUnreadMessages(16, 15);
  assert(messages.length >= 3 && messages.every(m => m.subject && m.sender && m.sender.name), 'getUnreadMessages returns messages with subject + sender');

  // 4. PDF generation
  const pdf = await generateDigestPdf({ messages, userName: 'Rid A', date: '1 août 2026' });
  assert(Buffer.isBuffer(pdf) && pdf.slice(0, 4).toString() === '%PDF', 'generateDigestPdf produces a valid PDF buffer');

  // 5. HTML email body
  const html = buildConversationalHtml({ messages, userName: 'Rid A', date: '1 août 2026' });
  assert(html.includes('Résumé quotidien des messages') && html.includes(messages[0].conversation.name), 'buildConversationalHtml produces UI-styled HTML with conversation header');
  assert(html.includes('#4F46E5') && html.includes('Chiffré de bout en bout'), 'buildConversationalHtml uses app accent + footer strip');

  // 6. Digest cron run (stub sender)
  const sent = [];
  const stub = async (opts) => { sent.push(opts); };
  const first = await runMessageDigestCheck({ send: stub, minUnread: 3, now: Date.now() });
  assert(first.sentPdf.includes(16), 'digest run sends PDF (résumé quotidien)');
  assert(first.sentEmail.includes(16), 'digest run sends HTML email (notification email)');
  assert(sent.length === 2, `digest run sends 2 emails (got ${sent.length})`);
  assert(sent[0].attachments && sent[0].attachments[0].contentType === 'application/pdf', 'PDF email includes attachment');
  assert(sent[1].html && sent[1].html.trim().startsWith('<!DOCTYPE html>'), 'HTML email body sent');

  const row = await pool.query('SELECT last_digest_sent_at FROM user_messaging_settings WHERE user_id = 16');
  assert(Boolean(row.rows[0] && row.rows[0].last_digest_sent_at), 'last_digest_sent_at recorded after send');

  // 7. No 24h gate: a second run with no fresh crossing is skipped (anti-spam)
  const sent2 = [];
  const stub2 = async (opts) => { sent2.push(opts); };
  const second = await runMessageDigestCheck({ send: stub2, minUnread: 3, now: Date.now() });
  assert(second.skippedActive.includes(16), 'second run without fresh crossing is skipped');
  assert(sent2.length === 0, 'no duplicate email sent');

  // 8. Below threshold skips and resets the crossing state
  const sent3 = [];
  const stub3 = async (opts) => { sent3.push(opts); };
  const below = await runMessageDigestCheck({ send: stub3, minUnread: 100, now: Date.now() + 24 * 60 * 60 * 1000 });
  assert(below.skippedUnder15.includes(16) && sent3.length === 0, 'below-threshold run is skipped');

  // 9. Threshold re-crossing sends again immediately (no 24h wait)
  const sent4 = [];
  const stub4 = async (opts) => { sent4.push(opts); };
  const fourth = await runMessageDigestCheck({ send: stub4, minUnread: 3, now: Date.now() + 25 * 60 * 60 * 1000 });
  assert(fourth.sentPdf.includes(16) && fourth.sentEmail.includes(16), 're-crossing threshold sends digest without 24h wait');
  assert(sent4.length === 2, 're-crossing run sends PDF + email');
}

main()
  .catch(async (e) => { console.error('ERR', e); })
  .finally(async () => {
    try {
      if (seededIds.length) await pool.query('DELETE FROM messages WHERE id = ANY($1::int[])', [seededIds]);
    } catch {}
    try { await pool.query('DELETE FROM user_messaging_settings WHERE user_id = 16'); } catch {}
    try { await pool.end(); } catch {}
    server.kill();
    const pass = results.every(r => r.ok);
    console.log('\nSUMMARY', results.filter(r => r.ok).length + '/' + results.length);
    process.exit(pass ? 0 : 1);
  });
