import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  listSessions,
  revokeSession,
  revokeOtherSessions,
  revokeAllSessions
} from '../controllers/sessions.controller.js';
import { listLoginHistory } from '../controllers/login-history.controller.js';

const router = express.Router();

router.get('/', verifyToken, listSessions);
router.post('/', verifyToken, listSessions);
router.delete('/:id', verifyToken, revokeSession);
router.post('/revoke-others', verifyToken, revokeOtherSessions);
router.post('/revoke-all', verifyToken, revokeAllSessions);

router.get('/history', verifyToken, listLoginHistory);

export default router;
