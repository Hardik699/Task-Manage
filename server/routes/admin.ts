import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  getActivityLogs,
  getUserLogs,
  deleteUser,
  impersonateUser,
  updateUserRole,
  getAdminStats,
} from '../controllers/admin';
import { verifyToken } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/role', updateUserRole);
router.get('/users/:userId/logs', getUserLogs);
router.delete('/users/:userId', deleteUser);
router.post('/users/:userId/impersonate', impersonateUser);
router.get('/logs', getActivityLogs);

export default router;
