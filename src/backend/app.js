import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import twoFARoutes from './routes/2fa.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';
import socialRoutes from './routes/social.routes.js';
import propertyRoutes from './routes/property.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import clientRoutes from './routes/client.routes.js';
import contractRoutes from './routes/contract.routes.js';
import transactionRoutes from './routes/transaction.routes.js';
import registreRoutes from './routes/registre.routes.js';
import documentRoutes from './routes/document.routes.js';
import contactRoutes from './routes/contact.routes.js';
import prospectRoutes from './routes/prospect.routes.js';
import reservationRoutes from './routes/reservation.routes.js';
import simulationRoutes from './routes/simulation.routes.js';
import automatorRoutes from './routes/automator.routes.js';
import eventRoutes from './routes/event.routes.js';
import googleRoutes, { googleCalendarCallback } from './routes/google.routes.js';
import messageRoutes from './routes/message.routes.js';
import filesRoutes from './routes/files.routes.js';
import { protectPrivatePropertyDocuments } from './middleware/propertyFiles.middleware.js';
import { setupRealtime } from './ws/server.js';
import { googleAuth, googleCallback, facebookAuth, facebookCallback } from './controllers/oauth.controller.js';
import { checkAndUpdateInactivity, deleteExpiredUsers, checkAgentInactivityAndNotify, markInactiveUsers } from './services/inactivity.service.js';
import { checkOverdueProspects, checkReminderNotifications } from './services/prospectCron.service.js';
import { checkActivityAlarms, checkActivityReminders, autoCancelUnconfirmedRendezVous, remindRendezVousConfirmation } from './services/activityCron.service.js';
import { checkCalendarReminders } from './services/calendarReminder.service.js';
import { runMessageDigestCheck } from './services/message-digest.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Reads from environment (Railway in production, .env in development).
// CORS_ORIGIN can be a single URL or a comma-separated list of allowed origins.
const corsOrigin = process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000';
const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow any localhost / 127.0.0.1 origin in development (http or https)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    console.warn(`[CORS] Rejected origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve uploaded files. Private property documents are blocked here and must
// be fetched through the authenticated /api/files route instead.
app.use('/uploads/properties', protectPrivatePropertyDocuments);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth/2fa', twoFARoutes);
app.use('/api/auth/sessions', sessionsRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/registre', registreRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/prospects', prospectRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/automators', automatorRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/google', googleRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/files', filesRoutes);

// Google Calendar OAuth callback — reachable through the CRA dev-server proxy
// at http://localhost:5001/api/auth/google/callback (matches the redirect URI
// registered in Google Cloud Console).
app.get('/api/auth/google/callback', googleCalendarCallback);

// OAuth routes (matching registered callback URIs)
app.get('/auth/google', googleAuth);
app.get('/auth/google/callback', googleCallback);
app.get('/auth/facebook', facebookAuth);
app.get('/auth/facebook/callback', facebookCallback);

// Test route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// SMTP diagnostic endpoint (temporary): reports loaded env vars (masked) and
// whether the SMTP host/port is reachable over TCP, plus the nodemailer result.
app.get('/api/debug/smtp', async (req, res) => {
  const net = (await import('node:net')).default;
  const dns = (await import('node:dns')).default;
  const host = process.env.EMAIL_HOST || '(not set)';
  const port = Number(process.env.EMAIL_PORT || 587);

  const tcpTest = (targetHost, targetPort) => new Promise((resolve) => {
    const socket = net.createConnection({ host: targetHost, port: targetPort, timeout: 6000 });
    socket.on('connect', () => { socket.destroy(); resolve({ ok: true }); });
    socket.on('error', (err) => resolve({ ok: false, error: err.message }));
    socket.setTimeout(6000);
    socket.on('timeout', () => { socket.destroy(); resolve({ ok: false, error: 'ETIMEDOUT' }); });
  });

  const resolveWith = (resolver, h) => new Promise((r) => resolver.resolve4(h, (e, a) => r(e ? null : a)));

  const sysAddrs = await resolveWith(dns, host);
  const pubRes = new dns.Resolver();
  pubRes.setServers(['8.8.8.8', '1.1.1.1']);
  let pubAddrs = null;
  try { pubAddrs = await resolveWith(pubRes, host); } catch { pubAddrs = null; }

  const unique = [...new Set([...(sysAddrs || []), ...(pubAddrs || [])])];
  const candidates = [];
  for (const ip of unique) {
    candidates.push({ label: `${ip}:587`, test: () => tcpTest(ip, 587) });
    candidates.push({ label: `${ip}:465`, test: () => tcpTest(ip, 465) });
  }
  candidates.push({ label: 'smtp.sendgrid.net:587', test: () => tcpTest('smtp.sendgrid.net', 587) });
  candidates.push({ label: 'smtp.mailgun.org:587', test: () => tcpTest('smtp.mailgun.org', 587) });
  candidates.push({ label: 'smtp.gmail.com:465', test: () => tcpTest('smtp.gmail.com', 465) });
  candidates.push({ label: 'www.google.com:443', test: () => tcpTest('www.google.com', 443) });

  const results = await Promise.all(candidates.map(async (c) => ({ label: c.label, ...(await c.test()) })));

  let verifyResult = null;
  try {
    const nodemailer = (await import('nodemailer')).default;
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    });
    await transporter.verify();
    verifyResult = { ok: true };
  } catch (err) {
    verifyResult = { ok: false, error: err.message };
  }

  res.json({
    env: {
      host,
      port,
      secure: process.env.EMAIL_SECURE,
      user: process.env.EMAIL_USER ? `${String(process.env.EMAIL_USER).slice(0, 3)}***` : '(not set)',
      from: process.env.EMAIL_FROM || '(not set)',
      hasPassword: !!process.env.EMAIL_PASSWORD,
    },
    dns: { system: sysAddrs, public8833: pubAddrs },
    tcpResults: results,
    verify: verifyResult,
  });
});

// Global error handler (must be last)
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ error: err.message });
  }

  // File filter / validation errors
  if (err instanceof Error && err.message) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Schedule inactivity & deletion check: runs daily at 2:00 AM
  cron.schedule('*/5 * * * *', async () => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] Running scheduled inactivity/deletion check...`);
    try {
      const inactivityResults = await checkAndUpdateInactivity();
      console.log(`[${ts}] Inactivity check complete:`, inactivityResults);
    } catch (error) {
      console.error(`[${ts}] Inactivity check failed:`, error);
    }
    try {
      const sweepResults = await markInactiveUsers();
      if (sweepResults.markedInactive > 0) {
        console.log(`[${ts}] Logged-out activity sweep marked ${sweepResults.markedInactive} user(s) inactive`);
      }
    } catch (error) {
      console.error(`[${ts}] Logged-out activity sweep failed:`, error);
    }
    try {
      const deletionResults = await deleteExpiredUsers();
      if (deletionResults.deleted > 0 || deletionResults.errors > 0) {
        console.log(`[${ts}] Deletion check complete:`, deletionResults);
      }
    } catch (error) {
      console.error(`[${ts}] Deletion check failed:`, error);
    }
    try {
      const agentResults = await checkAgentInactivityAndNotify();
      if (agentResults.notified30j > 0 || agentResults.notified60j > 0 || agentResults.errors > 0) {
        console.log(`[${ts}] Agent inactivity notification check complete:`, agentResults);
      }
    } catch (error) {
      console.error(`[${ts}] Agent inactivity notification check failed:`, error);
    }
  });
  console.log('Cron job scheduled: inactivity/deletion check every 5 minutes');

  // Schedule prospect overdue check: runs daily at 3:00 AM — auto-mark "Perdu" after 30 days
  cron.schedule('0 3 * * *', async () => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] Running prospect overdue check...`);
    try {
      const results = await checkOverdueProspects();
      if (results.markedPerdu > 0) {
        console.log(`[${ts}] Prospect overdue check complete:`, results);
      }
    } catch (error) {
      console.error(`[${ts}] Prospect overdue check failed:`, error);
    }
  });
  console.log('Cron job scheduled: prospect overdue check daily at 3:00 AM');

  // Schedule prospect reminder notifications: runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const results = await checkReminderNotifications();
      if (results.notified > 0) {
        const ts = new Date().toISOString();
        console.log(`[${ts}] Prospect reminder notifications sent:`, results);
      }
    } catch (error) {
      const ts = new Date().toISOString();
      console.error(`[${ts}] Prospect reminder check failed:`, error);
    }
  });
  console.log('Cron job scheduled: prospect reminder notifications every 5 minutes');

  // Schedule activity alarm notifications: runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const results = await checkActivityAlarms();
      if (results.notified > 0) {
        const ts = new Date().toISOString();
        console.log(`[${ts}] Activity alarm notifications sent:`, results);
      }
    } catch (error) {
      const ts = new Date().toISOString();
      console.error(`[${ts}] Activity alarm check failed:`, error);
    }
  });
  console.log('Cron job scheduled: activity alarms every minute');

  // Schedule activity reminder notifications: runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const results = await checkActivityReminders();
      if (results.notified > 0) {
        const ts = new Date().toISOString();
        console.log(`[${ts}] Activity reminder notifications sent:`, results);
      }
    } catch (error) {
      const ts = new Date().toISOString();
      console.error(`[${ts}] Activity reminder check failed:`, error);
    }
  });
  console.log('Cron job scheduled: activity reminders every minute');

  // Schedule auto-cancel of unconfirmed rendez-vous: runs every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const results = await autoCancelUnconfirmedRendezVous();
      if (results.cancelled > 0) {
        const ts = new Date().toISOString();
        console.log(`[${ts}] Unconfirmed rendez-vous auto-cancelled:`, results);
      }
    } catch (error) {
      const ts = new Date().toISOString();
      console.error(`[${ts}] Auto-cancel rendez-vous check failed:`, error);
    }
  });
  console.log('Cron job scheduled: auto-cancel unconfirmed rendez-vous every 5 minutes');

  // Schedule rendez-vous confirmation reminders: runs every 1 minute
  // Uses activity_date >= NOW() so the notification fires at exactly the 24h-before mark.
  cron.schedule('* * * * *', async () => {
    try {
      const results = await remindRendezVousConfirmation();
      if (results.notified > 0) {
        const ts = new Date().toISOString();
        console.log(`[${ts}] Rendez-vous confirmation reminders sent:`, results);
      }
    } catch (error) {
      const ts = new Date().toISOString();
      console.error(`[${ts}] Rendez-vous confirmation reminder check failed:`, error);
    }
  });
  console.log('Cron job scheduled: rendez-vous confirmation reminders every 1 minute');

  // Schedule calendar event reminder notifications: runs every minute
  cron.schedule('* * * * *', async () => {
    try {
      const results = await checkCalendarReminders();
      if (results.notified > 0) {
        const ts = new Date().toISOString();
        console.log(`[${ts}] Calendar reminder notifications sent:`, results);
      }
    } catch (error) {
      const ts = new Date().toISOString();
      console.error(`[${ts}] Calendar reminder check failed:`, error);
    }
  });
  console.log('Cron job scheduled: calendar event reminders every 1 minute');

  // Schedule message digests (Résumé quotidien + Notification par email):
  // runs every 5 minutes. A digest is sent as soon as a user has >= 15 unread
  // messages, and only re-sent once the unread count drops below 15 and climbs
  // back above the threshold (no 24h window).
  cron.schedule('*/5 * * * *', async () => {
    try {
      const results = await runMessageDigestCheck();
      if (results.sentPdf.length > 0 || results.sentEmail.length > 0 || results.errors.length > 0) {
        const ts = new Date().toISOString();
        console.log(`[${ts}] Message digest check complete:`, {
          pdf: results.sentPdf.length,
          email: results.sentEmail.length,
          skippedUnder15: results.skippedUnder15.length,
          skippedActive: results.skippedActive.length,
          errors: results.errors.length,
        });
      }
    } catch (error) {
      const ts = new Date().toISOString();
      console.error(`[${ts}] Message digest check failed:`, error);
    }
  });
  console.log('Cron job scheduled: message digest check every 5 minutes');
});

// Real-time messaging (WebSocket): message:new / conversation:new / typing
setupRealtime(server);