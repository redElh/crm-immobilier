import express from 'express';
import { register, login, checkEmail, forgotPassword, resetPassword, logout, getCurrentUser, updateCurrentUser, refreshToken, changePassword } from '../controllers/auth.controller.js';
import { getMyPermissions } from '../controllers/permission.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/check-email', checkEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', verifyToken, getCurrentUser);
router.get('/me/droits', verifyToken, getMyPermissions);
router.put('/profile', verifyToken, updateCurrentUser);
router.put('/password', verifyToken, changePassword);

export default router;