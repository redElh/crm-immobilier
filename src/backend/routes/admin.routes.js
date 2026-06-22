import express from 'express';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';
import {
  adminLogin,
  getDashboardStats,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus
} from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/login', adminLogin);

router.use(verifyToken, isAdmin);

router.get('/dashboard', getDashboardStats);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);

export default router;
