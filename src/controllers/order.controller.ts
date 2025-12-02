import { Request, Response, NextFunction } from 'express';
import orderService, { formatOrderDto } from '../services/order.service';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const created = await orderService.createOrder(req.body as any);
    const dto = formatOrderDto(created);
    res.location(`/order/${dto!.orderId}`).status(201).json(dto);
  } catch (err) {
    next(err);
  }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const o = await orderService.getOrder(orderId);
    res.json(formatOrderDto(o));
  } catch (err) {
    next(err);
  }
};

export const listOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const q: any = req.query || {};
    const page = q.page ?? 1;
    const size = q.limit ?? q.size ?? 10;
    const list = await orderService.listOrders(page, size);
    res.json({
      total: list.total,
      page: list.page,
      size: list.size,
      data: list.data.map((o: any) => formatOrderDto(o))
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const updated = await orderService.updateOrder(orderId, req.body as any);
    res.json(formatOrderDto(updated));
  } catch (err) {
    next(err);
  }
};

export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    await orderService.deleteOrder(orderId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
