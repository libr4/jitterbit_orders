import { Router } from 'express';
import { createOrder } from '../controllers/order.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../validation/middleware';
import { createOrderSchema, incomingOrderSchema } from '../validators/order.validator';
import { idSchema, paginationSchema, sortSchema } from '../validation/validators';
import { z } from '../validation';
import * as orderCtrl from '../controllers/order.controller';
import express from 'express';

const router = Router();

router.use(authMiddleware);

router.post('/', validateBody(createOrderSchema), createOrder);
router.get('/list', validateQuery(paginationSchema.merge(sortSchema)), orderCtrl.listOrders);
router.get('/:orderId', validateParams(z.object({ orderId: idSchema })), orderCtrl.getOrder);
router.put('/:orderId', express.json(), validateParams(z.object({ orderId: idSchema })), validateBody(incomingOrderSchema), orderCtrl.updateOrder);
router.delete('/:orderId', validateParams(z.object({ orderId: idSchema })), orderCtrl.deleteOrder);

export default router;
