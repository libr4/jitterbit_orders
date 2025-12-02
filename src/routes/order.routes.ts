import { Router } from 'express';
import { createOrder } from '../controllers/order.controller';
import authMiddleware from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { createOrderSchema } from '../validators/order.validator';
import * as orderCtrl from '../controllers/order.controller';
import express from 'express';

const router = Router();

router.use(authMiddleware);

router.post('/', validate(createOrderSchema), createOrder);
router.get('/list', orderCtrl.listOrders);
router.get('/:orderId', orderCtrl.getOrder);
router.put('/:orderId', express.json(), orderCtrl.updateOrder);
router.delete('/:orderId', orderCtrl.deleteOrder);

export default router;
