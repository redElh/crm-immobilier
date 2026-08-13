import { spawn } from 'child_process';
import jwt from 'jsonwebtoken';
import wsPkg from 'ws';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();
const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST,
  database: process.env.DB_NAME, password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

const PORT = 5110;
const token = (id, role, email) =>
  jwt.sign({ id, role, email }, 'your-secret-key', { expiresIn: '1h' });
const TOKEN12 = token(12, 'admin', 'redaelhiri9@gmail.com');
const TOKEN16 = token(16, 'agent', 'ridaelhiri6@gmail.com');

const server = spawn('node', ['src/backend/app.js'], {
  cwd: process.cwd(),
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'inherit',
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

const WebSocketClient = wsPkg;

function connect(tk) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocketClient(`ws://localhost:${PORT}/ws?token=${encodeURIComponent(tk)}`);
    const events = [];
    ws.onopen = () => resolve({ ws, events });
    ws.onmessage = (ev) => events.push(JSON.parse(ev.data));
    ws.onerror = (e) => reject(new Error('ws error'));
    setTimeout(() => reject(new Error('timeout connecting')), 5000);
  });
}

const results = [];
function assert(cond, name) {
  results.push({ name, ok: !!cond });
  console.log(cond ? 'PASS' : 'FAIL', name);
}

async function main() {
  if (!(await waitForServer())) { console.log('FAIL server did not start'); server.kill(); process.exit(1); }
  console.log('server up on', PORT);

  const admin = await connect(TOKEN12);
  const agent = await connect(TOKEN16);
  await sleep(300);
  assert(admin.events.some((e) => e.type === 'hello' && e.userId === 12), 'admin hello');
  assert(agent.events.some((e) => e.type === 'hello' && e.userId === 16), 'agent hello');

  agent.ws.send(JSON.stringify({ type: 'typing', conversationId: '2', active: true }));
  await sleep(400);
  assert(admin.events.some((e) => e.type === 'typing' && e.conversationId === '2' && e.state === 'typing' && e.userId === 16), 'typing relayed to admin');

  const before = admin.events.filter((e) => e.type === 'message:new').length;
  const res = await fetch(`http://localhost:${PORT}/api/messages/conversations/2/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN16}` },
    body: JSON.stringify({ body: 'Test temps réel' }),
  });
  const created = await res.json();
  assert(res.status === 201, 'REST send returns 201');
  await sleep(600);
  const newMsgs = admin.events.filter((e) => e.type === 'message:new');
  assert(newMsgs.length > before, 'admin received message:new');
  if (newMsgs.length > before) {
    assert(newMsgs[newMsgs.length - 1].message.body === 'Test temps réel', 'message:new body matches');
  }
  assert(!agent.events.some((e) => e.type === 'message:new' && e.message?.body === 'Test temps réel'), 'no echo to sender');

  admin.ws.send(JSON.stringify({ type: 'recording', conversationId: '2', active: true }));
  await sleep(400);
  assert(agent.events.some((e) => e.type === 'typing' && e.conversationId === '2' && e.state === 'recording' && e.userId === 12), 'recording state relayed to agent');

  await fetch(`http://localhost:${PORT}/api/messages/conversations/2/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${TOKEN12}` },
  });
  await sleep(150);
  const readRes = await fetch(`http://localhost:${PORT}/api/messages/conversations/2/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN16}` },
    body: JSON.stringify({ body: 'Test accusé lecture' }),
  });
  const readMsg = await readRes.json();
  assert(readMsg.status === 'delivered', 'sent message starts as delivered (not read)');

  const readBefore = agent.events.filter((e) => e.type === 'message:read').length;
  await fetch(`http://localhost:${PORT}/api/messages/conversations/2/read`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${TOKEN12}` },
  });
  await sleep(400);
  assert(agent.events.filter((e) => e.type === 'message:read').length > readBefore, 'sender receives message:read broadcast');

  const convRead = await fetch(`http://localhost:${PORT}/api/messages/conversations/2`, {
    headers: { Authorization: `Bearer ${TOKEN16}` },
  }).then((r) => r.json());
  const target = (convRead.messages || []).find((m) => m.id === readMsg.id);
  assert(Boolean(target && target.status === 'read'), 'sent message becomes read after recipient reads');

  const usersRes = await fetch(`http://localhost:${PORT}/api/messages/users`, {
    headers: { Authorization: `Bearer ${TOKEN12}` },
  });
  const users = await usersRes.json();
  const u16 = users.find((u) => u.id === '16');
  assert(Boolean(u16 && u16.presence === 'away' && typeof u16.lastSeen === 'string'), 'REST users includes presence + lastSeen');

  agent.ws.send(JSON.stringify({ type: 'presence', status: 'away' }));
  await sleep(1200);
  const usersSame = await fetch(`http://localhost:${PORT}/api/messages/users`, {
    headers: { Authorization: `Bearer ${TOKEN12}` },
  }).then((r) => r.json());
  const a16 = usersSame.find((u) => u.id === '16');
  assert(Boolean(a16 && a16.lastSeen === u16.lastSeen), 'repeated same-status does not refresh lastSeen');

  agent.ws.send(JSON.stringify({ type: 'presence', status: 'online' }));
  await sleep(300);
  agent.ws.send(JSON.stringify({ type: 'presence', status: 'away' }));
  await sleep(300);
  const usersTrans = await fetch(`http://localhost:${PORT}/api/messages/users`, {
    headers: { Authorization: `Bearer ${TOKEN12}` },
  }).then((r) => r.json());
  const t16 = usersTrans.find((u) => u.id === '16');
  assert(Boolean(t16 && t16.lastSeen !== a16.lastSeen), 'status transition refreshes lastSeen');

  admin.ws.send(JSON.stringify({ type: 'presence', status: 'online' }));
  await sleep(400);
  assert(agent.events.some((e) => e.type === 'presence:update' && e.user?.id === '12' && e.user?.presence === 'online'), 'presence online broadcast to agent');

  admin.ws.send(JSON.stringify({ type: 'presence', status: 'away' }));
  await sleep(400);
  assert(agent.events.some((e) => e.type === 'presence:update' && e.user?.id === '12' && e.user?.presence === 'away'), 'presence away broadcast to agent');

  admin.ws.send(JSON.stringify({ type: 'presence', status: 'offline' }));
  await sleep(400);
  assert(agent.events.some((e) => e.type === 'presence:update' && e.user?.id === '12' && e.user?.presence === 'offline'), 'presence offline broadcast to agent');

  admin.ws.send(JSON.stringify({ type: 'presence', status: 'online' }));
  await sleep(300);
  const adminReconnect = await connect(TOKEN12);
  await sleep(400);
  const usersAfterReconnect = await fetch(`http://localhost:${PORT}/api/messages/users`, {
    headers: { Authorization: `Bearer ${TOKEN16}` },
  }).then((r) => r.json());
  const a12 = usersAfterReconnect.find((u) => u.id === '12');
  assert(Boolean(a12 && a12.presence === 'online'), 'reconnect does not reset an online user to away');
  adminReconnect.ws.close();

  admin.ws.close();
  agent.ws.close();
  await pool.query("DELETE FROM messages WHERE body IN ($1, $2)", ['Test temps réel', 'Test accusé lecture']);
  await pool.end();

  console.log('\nSUMMARY', results.filter((r) => r.ok).length + '/' + results.length);
  server.kill();
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch(async (e) => {
  console.error('ERR', e);
  try { await pool.query("DELETE FROM messages WHERE body IN ($1, $2)", ['Test temps réel', 'Test accusé lecture']); } catch {}
  try { await pool.end(); } catch {}
  server.kill();
  process.exit(1);
});
