import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getProspects,
  getProspectById,
  getQualifiedProspects,
  createProspect,
  updateProspect,
  updateProspectStatus,
  scheduleReminder,
  updateReminder,
  cancelReminder,
  duplicateProspect,
  deleteProspect,
} from '../controllers/prospect.controller.js';

const router = express.Router();

router.get('/', verifyToken, getProspects);
router.get('/qualified', verifyToken, getQualifiedProspects);
router.get('/:id', verifyToken, getProspectById);
router.post('/', verifyToken, createProspect);
router.put('/:id', verifyToken, updateProspect);
router.patch('/:id/status', verifyToken, updateProspectStatus);
router.post('/:id/reminder', verifyToken, scheduleReminder);
router.put('/:id/reminder', verifyToken, updateReminder);
router.delete('/:id/reminder', verifyToken, cancelReminder);
router.post('/:id/duplicate', verifyToken, duplicateProspect);
router.delete('/:id', verifyToken, deleteProspect);

export default router;
