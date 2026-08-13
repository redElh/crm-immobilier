import express from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getSimulations,
  getSimulationById,
  createSimulation,
  updateSimulation,
  deleteSimulation,
} from '../controllers/simulation.controller.js';

const router = express.Router();

router.get('/', verifyToken, getSimulations);
router.get('/:id', verifyToken, getSimulationById);
router.post('/', verifyToken, createSimulation);
router.put('/:id', verifyToken, updateSimulation);
router.delete('/:id', verifyToken, deleteSimulation);

export default router;
