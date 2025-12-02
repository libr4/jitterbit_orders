import { Request, Response, NextFunction } from 'express';
import orderService, { normalizeOrderPayload, formatOrderDto } from '../services/order.service';

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mapped = normalizeOrderPayload(req.body);
    const created = await orderService.createOrder(mapped);
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
    const page = req.query.page ? Number(req.query.page) : 1;
    const size = req.query.size ? Number(req.query.size) : 10;
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
    const body = req.body;
    const mapped = normalizeOrderPayload(body);
    const updated = await orderService.updateOrder(orderId, mapped);
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
