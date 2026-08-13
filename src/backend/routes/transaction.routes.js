import { Router } from 'express';
import { verifyToken } from '../middleware/auth.middleware.js';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  signTransaction,
  resiliateTransaction,
  expireTransaction,
} from '../controllers/transaction.controller.js';

const router = Router();

router.get('/', verifyToken, getTransactions);
router.get('/:id', verifyToken, getTransactionById);
router.post('/', verifyToken, createTransaction);
router.put('/:id', verifyToken, updateTransaction);
router.delete('/:id', verifyToken, deleteTransaction);
router.post('/:id/sign', verifyToken, signTransaction);
router.post('/:id/resiliate', verifyToken, resiliateTransaction);
router.post('/:id/expire', verifyToken, expireTransaction);

export default router;
