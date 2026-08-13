import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  generateSecret,
  verifyAndEnable,
  disable2FA,
  generateBackupCodes,
  verifyLoginCode,
  get2FAStatus
} from '../controllers/2fa.controller.js';

const router = express.Router();

router.get('/status', verifyToken, get2FAStatus);
router.post('/generate-secret', verifyToken, generateSecret);
router.post('/verify-enable', verifyToken, verifyAndEnable);
router.post('/disable', verifyToken, disable2FA);
router.post('/backup-codes', verifyToken, generateBackupCodes);
router.post('/verify-login', verifyLoginCode);

export default router;
