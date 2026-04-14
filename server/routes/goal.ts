import { Router } from 'express';
import { createGoal, getGoals, updateGoal, addSaving, deleteGoal } from '../controllers/goal';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

router.post('/', createGoal);
router.get('/', getGoals);
router.put('/:id', updateGoal);
router.post('/:id/saving', addSaving);
router.delete('/:id', deleteGoal);

export default router;
