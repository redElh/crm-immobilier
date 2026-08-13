import { Router } from 'express';
import multer from 'multer';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getProfiles,
  createPost,
  getPostStatus,
  getProfileUpdates,
  uploadMedia,
} from '../controllers/social.controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/profiles', verifyToken, getProfiles);
router.post('/posts', verifyToken, createPost);
router.get('/posts/:updateId', verifyToken, getPostStatus);
router.get('/profiles/:profileId/updates', verifyToken, getProfileUpdates);
router.post('/media/upload', verifyToken, upload.single('file'), uploadMedia);

export default router;
