import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getAutomators,
  getAutomatorById,
  createAutomator,
  updateAutomator,
  toggleAutomator,
  deleteAutomator,
  getAutomatorLogs,
  createAutomatorLog,
  getTriggeredNotifications,
  createTriggeredNotification,
  markNotificationRead,
  markAllNotificationsRead,
  seedDefaultAutomations,
  triggerInactivityCheck,
  seedInactiveAgent,
} from '../controllers/automator.controller.js';

const router = express.Router();

router.get('/', verifyToken, getAutomators);
router.get('/seed', verifyToken, seedDefaultAutomations);
router.post('/seed', verifyToken, seedDefaultAutomations);
router.post('/trigger-inactivity', verifyToken, triggerInactivityCheck);
router.post('/seed-inactive-agent', verifyToken, seedInactiveAgent);
router.get('/logs/:automatorId', verifyToken, getAutomatorLogs);
router.post('/logs', verifyToken, createAutomatorLog);
router.get('/notifications', verifyToken, getTriggeredNotifications);
router.post('/notifications', verifyToken, createTriggeredNotification);
router.put('/notifications/read-all', verifyToken, markAllNotificationsRead);
router.put('/notifications/:id/read', verifyToken, markNotificationRead);
router.get('/:id', verifyToken, getAutomatorById);
router.post('/', verifyToken, createAutomator);
router.put('/:id', verifyToken, updateAutomator);
router.patch('/:id/toggle', verifyToken, toggleAutomator);
router.delete('/:id', verifyToken, deleteAutomator);

export default router;
