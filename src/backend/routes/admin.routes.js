import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';
import {
  adminLogin,
  adminRegister,
  adminForgotPassword,
  adminResetPassword,
  getDashboardStats,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  uploadProfileImage,
  reactivateUserAccount,
  suspendUserAccount,
  runInactivityCheck
} from '../controllers/admin.controller.js';
import {
  getUserDroits,
  updateUserDroits
} from '../controllers/permission.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'profiles'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `profile-${req.user.id}-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(jpg|jpeg|png|gif|webp)$/i;
  const allowedMime = /^image\/(jpeg|png|gif|webp)$/;
  if (allowedExt.test(path.extname(file.originalname)) || allowedMime.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, jpeg, png, gif, webp) are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.post('/login', adminLogin);
router.post('/register', adminRegister);
router.post('/forgot-password', adminForgotPassword);
router.post('/reset-password', adminResetPassword);

router.post('/profile/upload-image', verifyToken, upload.single('image'), uploadProfileImage);

router.use(verifyToken, isAdmin);

router.get('/dashboard', getDashboardStats);

router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.get('/users/:id/droits', getUserDroits);
router.put('/users/:id/droits', updateUserDroits);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/toggle-status', toggleUserStatus);

router.patch('/users/:id/reactivate', reactivateUserAccount);
router.patch('/users/:id/suspend', suspendUserAccount);
router.post('/inactivity-check', runInactivityCheck);

export default router;
