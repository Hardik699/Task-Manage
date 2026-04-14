import { Router } from 'express';
import { createExpense, getExpenses, updateExpense, deleteExpense, getExpenseStats } from '../controllers/expense';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

router.post('/', createExpense);
router.get('/stats', getExpenseStats);
router.get('/', getExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
