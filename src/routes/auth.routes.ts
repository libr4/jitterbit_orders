import { Router } from 'express';
import { login } from '../controllers/auth.controller';
import { validateBody } from '../validation/middleware';
import { loginSchema } from '../validators/order.validator';

const router = Router();

router.post('/login', validateBody(loginSchema), login);

export default router;
