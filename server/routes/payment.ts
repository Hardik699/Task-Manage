import { Router } from 'express';
import { createPayment, getPayments, updatePayment, deletePayment, markAsPaid, getOverduePayments, addEmiPayment, updateEmiPayment, deleteEmiPayment, uploadAttachment, deleteAttachment } from '../controllers/payment';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

router.post('/', createPayment);
router.get('/overdue', getOverduePayments);
router.get('/', getPayments);
router.put('/:id', updatePayment);
router.put('/:id/mark-paid', markAsPaid);
router.post('/:id/emi-payment', addEmiPayment);
router.put('/:id/emi-payment/:emiIndex', updateEmiPayment);
router.delete('/:id/emi-payment/:emiIndex', deleteEmiPayment);
router.post('/:id/attachment', uploadAttachment);
router.delete('/:id/attachment/:attachmentIndex', deleteAttachment);
router.delete('/:id', deletePayment);

export default router;
