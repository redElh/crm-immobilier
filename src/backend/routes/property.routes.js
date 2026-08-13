import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  updatePropertyCompletion,
  updatePropertyStatus,
  duplicateProperty,
  reassignProperty,
  deleteProperty,
  generateReference,
  uploadPropertyFile,
  updatePropertyDocuments,
  getTimeline,
  addTimelineEvent,
  updateTimelineEvent,
  deleteTimelineEvent,
  getPropertyMatching,
  proposeToClient,
  refuseMatch,
  unrefuseMatch,
} from '../controllers/property.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'properties'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `property-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageExt = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
  const allowedVideoExt = /\.(mp4|mov|avi|mkv|webm)$/i;
  const allowedDocExt = /\.(pdf|doc|docx|xls|xlsx|txt)$/i;
  const allowedImageMime = /^image\/(jpeg|png|gif|webp|svg\+xml)$/;
  const allowedVideoMime = /^video\/(mp4|quicktime|x-msvideo|webm|mkv)$/;
  const allowedDocMime = /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument|text\/plain)$/;
  if (allowedImageExt.test(path.extname(file.originalname)) || allowedImageMime.test(file.mimetype) ||
      allowedVideoExt.test(path.extname(file.originalname)) || allowedVideoMime.test(file.mimetype) ||
      allowedDocExt.test(path.extname(file.originalname)) || allowedDocMime.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image, video and document files are allowed'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

const router = express.Router();

router.get('/reference', verifyToken, generateReference);
router.get('/', verifyToken, getProperties);
router.get('/:id', verifyToken, getPropertyById);
router.get('/:id/matching', verifyToken, getPropertyMatching);
router.post('/:id/propose', verifyToken, proposeToClient);
router.post('/:id/refuse', verifyToken, refuseMatch);
router.delete('/:id/refuse/:clientId', verifyToken, unrefuseMatch);
router.post('/', verifyToken, createProperty);
router.post('/upload', verifyToken, upload.array('files', 20), uploadPropertyFile);
router.put('/:id', verifyToken, updateProperty);
router.patch('/:id/status', verifyToken, updatePropertyStatus);
router.patch('/:id/completion', verifyToken, updatePropertyCompletion);
router.post('/:id/duplicate', verifyToken, isAdmin, duplicateProperty);
router.post('/:id/reassign', verifyToken, reassignProperty);
router.patch('/:id/documents', verifyToken, updatePropertyDocuments);
router.delete('/:id', verifyToken, deleteProperty);

router.get('/:id/timeline', verifyToken, getTimeline);
router.post('/:id/timeline', verifyToken, addTimelineEvent);
router.put('/:id/timeline/:eventId', verifyToken, updateTimelineEvent);
router.delete('/:id/timeline/:eventId', verifyToken, deleteTimelineEvent);

export default router;
