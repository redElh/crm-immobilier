import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getClients,
  getClientsByContact,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  duplicateClient,
  getClientCroisements,
  proposeProperty,
  sendFinancement,
} from '../controllers/client.controller.js';
import {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} from '../controllers/activity.controller.js';

const router = express.Router();

router.get('/', verifyToken, getClients);
router.get('/by-contact/:contactId', verifyToken, getClientsByContact);
router.get('/:id/croisements', verifyToken, getClientCroisements);
router.get('/:id/activities', verifyToken, getActivities);
router.post('/:id/activities', verifyToken, createActivity);
router.put('/:id/activities/:activityId', verifyToken, updateActivity);
router.delete('/:id/activities/:activityId', verifyToken, deleteActivity);
router.post('/:id/propose', verifyToken, proposeProperty);
router.post('/:id/send-financement', verifyToken, sendFinancement);
router.get('/:id', verifyToken, getClientById);
router.post('/', verifyToken, createClient);
router.put('/:id', verifyToken, updateClient);
router.post('/:id/duplicate', verifyToken, duplicateClient);
router.delete('/:id', verifyToken, deleteClient);

export default router;
