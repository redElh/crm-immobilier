import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/event.controller.js';

const router = express.Router();

router.get('/', verifyToken, getEvents);
router.get('/:id', verifyToken, getEventById);
router.post('/', verifyToken, createEvent);
router.put('/:id', verifyToken, updateEvent);
router.delete('/:id', verifyToken, deleteEvent);

export default router;
