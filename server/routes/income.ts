import { Router } from 'express';
import {
  getAllIncome,
  getIncomeStats,
  createIncome,
  updateIncome,
  deleteIncome,
  uploadAttachment,
  deleteAttachment,
} from '../controllers/income';
import { verifyToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Income routes
router.get('/', getAllIncome);
router.get('/stats', getIncomeStats);
router.post('/', createIncome);
router.put('/:id', updateIncome);
router.delete('/:id', deleteIncome);

// Attachment routes
router.post('/:id/attachments', uploadAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);

export default router;
