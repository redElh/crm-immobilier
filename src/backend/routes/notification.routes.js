import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  sendAutomatorEmail,
} from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', verifyToken, getNotifications);
router.post('/', verifyToken, createNotification);
router.patch('/:id/read', verifyToken, markAsRead);
router.patch('/read-all', verifyToken, markAllAsRead);
router.post('/send-automator-email', verifyToken, sendAutomatorEmail);

export default router;
