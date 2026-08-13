import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getRegistre,
  getRegistreById,
  createRegistreEntry,
  updateRegistreEntry,
  deleteRegistreEntry,
  getRegistreStats,
} from '../controllers/registre.controller.js';

const router = Router();

router.get('/stats', verifyToken, getRegistreStats);
router.get('/', verifyToken, getRegistre);
router.get('/:id', verifyToken, getRegistreById);
router.post('/', verifyToken, createRegistreEntry);
router.put('/:id', verifyToken, updateRegistreEntry);
router.delete('/:id', verifyToken, deleteRegistreEntry);

export default router;
