import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getReservations,
  getReservationById,
  createReservation,
  updateReservation,
  deleteReservation,
} from '../controllers/reservation.controller.js';

const router = express.Router();

router.get('/', verifyToken, getReservations);
router.get('/:id', verifyToken, getReservationById);
router.post('/', verifyToken, createReservation);
router.put('/:id', verifyToken, updateReservation);
router.delete('/:id', verifyToken, deleteReservation);

export default router;
