import { Router } from 'express';
import { createTask, getTasks, updateTask, deleteTask, addSubtask, updateSubtask, deleteSubtask } from '../controllers/task';
import { verifyToken } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(verifyToken);

router.post('/', createTask);
router.get('/', getTasks);
router.put('/:id', updateTask);
router.post('/:id/subtasks', addSubtask);
router.put('/:id/subtasks/:subtaskId', updateSubtask);
router.delete('/:id/subtasks/:subtaskId', deleteSubtask);
router.delete('/:id', deleteTask);

export default router;
