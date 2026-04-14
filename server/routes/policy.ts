import { Router } from 'express';
import { createPolicy, getPolicies, getPolicyById, updatePolicy, deletePolicy, logPayment, getDashboardStats, getUpcomingPolicies } from '../controllers/policy';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.use(verifyToken);

router.post('/', createPolicy);
router.get('/dashboard', getDashboardStats);
router.get('/upcoming', getUpcomingPolicies);
router.get('/:id', getPolicyById);
router.get('/', getPolicies);
router.put('/:id', updatePolicy);
router.post('/:id/payment', logPayment);
router.delete('/:id', deletePolicy);

export default router;
