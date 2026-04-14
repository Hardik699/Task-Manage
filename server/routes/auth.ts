import { Router } from 'express';
import { register, login, logout, refreshToken, getCurrentUser, demoLogin } from '../controllers/auth';
import { verifyToken } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.post('/logout', verifyToken, logout);
router.post('/refresh-token', refreshToken);
router.get('/me', verifyToken, getCurrentUser);

export default router;
