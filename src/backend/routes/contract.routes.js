import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  getContractsByClient,
  getContractStats,
  getContractHistory,
  uploadContractFile,
  updateContractDocuments,
  deleteContractDocument,
  sendContractToProprietaire,
} from '../controllers/contract.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads', 'contracts'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `contract-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageExt = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
  const allowedDocExt = /\.(pdf|doc|docx|xls|xlsx|csv|txt)$/i;
  const allowedImageMime = /^image\/(jpeg|png|gif|webp|svg\+xml)$/;
  const allowedDocMime = /^(application\/pdf|application\/msword|application\/vnd\.openxmlformats-officedocument|text\/plain|text\/csv)$/;
  if (allowedImageExt.test(path.extname(file.originalname)) || allowedImageMime.test(file.mimetype) ||
      allowedDocExt.test(path.extname(file.originalname)) || allowedDocMime.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Seuls les fichiers image et document sont autorisés'), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

const router = express.Router();

router.get('/stats', verifyToken, getContractStats);
router.get('/client/:client_id', verifyToken, getContractsByClient);
router.get('/', verifyToken, getContracts);
router.get('/:id/history', verifyToken, getContractHistory);
router.get('/:id', verifyToken, getContractById);
router.post('/', verifyToken, createContract);
router.post('/:id/upload', verifyToken, upload.array('files', 20), uploadContractFile);
router.put('/:id/documents', verifyToken, updateContractDocuments);
router.delete('/:id/documents/:docId', verifyToken, deleteContractDocument);
router.post('/:id/send-to-proprietaire', verifyToken, sendContractToProprietaire);
router.put('/:id', verifyToken, updateContract);
router.delete('/:id', verifyToken, deleteContract);

export default router;
