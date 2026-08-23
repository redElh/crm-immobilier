import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken, isAdmin } from '../middleware/auth.middleware.js';
import {
  getPartners, createPartner, updatePartner, deletePartner,
  getActivities, createActivity, updateActivity, deleteActivity,
  getReservations, createReservation, updateReservation, deleteReservation,
  getConciergerieStats, getCommissions,
  getPricingTiers, createPricingTier, updatePricingTier, deletePricingTier,
  uploadActivityPhotos,
} from '../controllers/conciergerie.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads', 'conciergerie');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMime = /^image\/(jpeg|jpg|png|webp|gif|bmp|tiff|svg\+xml|avif)$/i;
    if (allowedMime.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Type de fichier non supporté: ${file.originalname} (${file.mimetype})`));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

const router = express.Router();

router.use(verifyToken);

router.get('/stats', getConciergerieStats);
router.get('/activities', getActivities);
router.get('/partners', getPartners);
router.get('/reservations', getReservations);
router.get('/commissions', getCommissions);

router.post('/activities', createActivity);
router.put('/activities/:id', updateActivity);
router.delete('/activities/:id', deleteActivity);

router.post('/partners', createPartner);
router.put('/partners/:id', updatePartner);
router.delete('/partners/:id', deletePartner);

router.post('/reservations', createReservation);
router.put('/reservations/:id', updateReservation);
router.delete('/reservations/:id', deleteReservation);

router.post('/upload', upload.array('files', 20), (req, res, next) => {
  if (req.fileValidationError) return res.status(400).json({ error: req.fileValidationError });
  if (!req.files?.length) return res.status(400).json({ error: 'Aucun fichier valide uploadé' });
  next();
}, uploadActivityPhotos);

router.get('/activities/:activityId/tiers', getPricingTiers);
router.post('/activities/:activityId/tiers', createPricingTier);
router.put('/tiers/:id', updatePricingTier);
router.delete('/tiers/:id', deletePricingTier);

export default router;
