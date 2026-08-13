import express from 'express';
import pool from '../config/db.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  buildAuthUrl,
  parseCallbackState,
  exchangeCode,
  storeTokens,
  getConnectionStatus,
  disconnect,
  syncUserEventsToGoogle,
  pullGoogleEventsToCrm,
  getPrimaryCalendarInfo,
  getRedirectUri,
} from '../services/googleCalendar.service.js';

const router = express.Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

router.get('/auth-url', verifyToken, (req, res) => {
  const returnPath = req.query.returnPath || '/calendar';
  const url = buildAuthUrl(req.user.id, String(returnPath));
  res.json({ url });
});

export const googleCalendarCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    if (error || !code) {
      const stateInfo = state ? parseCallbackState(state) : null;
      const base = stateInfo ? stateInfo.path : '/calendar';
      return res.redirect(`${FRONTEND_URL}${base}?google=error`);
    }

    const stateInfo = parseCallbackState(state);
    if (!stateInfo) {
      return res.redirect(`${FRONTEND_URL}/calendar?google=error`);
    }

    const tokens = await exchangeCode(code);
    let email = '';
    try {
      await storeTokens(stateInfo.userId, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      });
      const info = await getPrimaryCalendarInfo(stateInfo.userId);
      if (info && info.id && info.id !== 'primary') {
        email = info.id;
        await pool.query(
          'UPDATE google_calendar_tokens SET google_email = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
          [email, stateInfo.userId]
        );
      }
    } catch (tokenError) {
      console.error('[google] storing tokens failed:', tokenError.message);
      return res.redirect(`${FRONTEND_URL}${stateInfo.path}?google=error`);
    }

    res.redirect(`${FRONTEND_URL}${stateInfo.path}?google=connected`);
  } catch (err) {
    console.error('[google] callback error:', err);
    res.redirect(`${FRONTEND_URL}/calendar?google=error`);
  }
};

router.get('/status', verifyToken, async (req, res) => {
  try {
    res.json(await getConnectionStatus(req.user.id));
  } catch (err) {
    console.error('[google] status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/disconnect', verifyToken, async (req, res) => {
  try {
    await disconnect(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[google] disconnect error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/sync', verifyToken, async (req, res) => {
  try {
    const direction = req.body?.direction || 'both';
    if (direction === 'crm-to-google') {
      return res.json(await syncUserEventsToGoogle(req.user.id));
    }
    if (direction === 'google-to-crm') {
      return res.json(await pullGoogleEventsToCrm(req.user.id));
    }
    const pushResult = await syncUserEventsToGoogle(req.user.id);
    const pullResult = await pullGoogleEventsToCrm(req.user.id);
    res.json({
      ...pushResult,
      pulled: pullResult.pulled,
      pullFailed: pullResult.failed,
    });
  } catch (err) {
    console.error('[google] sync error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

router.get('/redirect-uri', (req, res) => {
  res.json({ redirectUri: getRedirectUri() });
});

export default router;
