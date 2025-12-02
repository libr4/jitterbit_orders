import { Request, Response, NextFunction } from 'express';
import orderService from '../services/order.service';
import createError from 'http-errors';
import { incomingOrderSchema, mappedOrderSchema } from '../validators/order.validator';

const mapIncomingToMapped = (body: any) => {
  const incoming = incomingOrderSchema.parse(body);
  const date = new Date(incoming.dataCriacao);
  if (isNaN(date.getTime())) {
    throw createError(400, 'Invalid dataCriacao', { code: 'VALIDATION_ERROR' });
  }

  const items = incoming.items.map((it: any) => {
    const pid = Number(it.idItem);
    if (!Number.isInteger(pid)) {
      const err: any = new Error('idItem must be numeric');
      err.status = 400;
      err.code = 'INVALID_ITEM_ID';
      throw err;
    }
    return {
      productId: pid,
      quantity: it.quantidadeItem,
      price: it.valorItem
    };
  });

  const mapped = {
    orderId: incoming.numeroPedido,
    value: incoming.valorTotal,
    creationDate: date.toISOString(),
    items
  };

  mappedOrderSchema.parse(mapped);
  return mapped;
};

export const createOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const mapped = mapIncomingToMapped(req.body);
    const created = await orderService.createOrder(mapped);
    res.location(`/order/${created!.orderId}`).status(201).json({
      orderId: created!.orderId,
      value: created!.value,
      creationDate: created!.creationDate.toISOString(),
      items: created!.items.map((it: any) => ({ productId: it.productId, quantity: it.quantity, price: it.price }))
    });
  } catch (err: any) {
    if (err.code === 'P2002' || (err.status === 409)) {
      return next(createError(409, 'Order already exists', { code: 'DUPLICATE_ORDER' }));
    }
    if (err.code === 'INVALID_ITEM_ID' || err.code === 'INVALID_ITEM_ID') {
      return next(createError(400, 'idItem must be numeric', { code: 'INVALID_ITEM_ID' }));
    }
    next(err);
  }
};

export const getOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const o = await orderService.getOrder(orderId);
    if (!o) return next(createError(404, 'Order not found', { code: 'NOT_FOUND' }));
    res.json({
      orderId: o.orderId,
      value: o.value,
      creationDate: o.creationDate.toISOString(),
      items: o.items.map((it: any) => ({ productId: it.productId, quantity: it.quantity, price: it.price }))
    });
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
      data: list.data.map((o: any) => ({
        orderId: o.orderId,
        value: o.value,
        creationDate: o.creationDate.toISOString(),
        items: o.items.map((it: any) => ({ productId: it.productId, quantity: it.quantity, price: it.price }))
      }))
    });
  } catch (err) {
    next(err);
  }
};

export const updateOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    const body = req.body;
    let mapped;
    try {
      const parsed = mappedOrderSchema.parse(body);
      mapped = parsed;
    } catch {
      mapped = mapIncomingToMapped(body);
    }
    const updated = await orderService.updateOrder(orderId, mapped);
    res.json({
      orderId: updated!.orderId,
      value: updated!.value,
      creationDate: updated!.creationDate.toISOString(),
      items: updated!.items.map((it: any) => ({ productId: it.productId, quantity: it.quantity, price: it.price }))
    });
  } catch (err: any) {
    if (err.code === 'INVALID_ITEM_ID') {
      return next(createError(400, 'idItem must be numeric', { code: 'INVALID_ITEM_ID' }));
    }
    if (err.status === 404) {
      return next(createError(404, 'Order not found', { code: 'NOT_FOUND' }));
    }
    next(err);
  }
};

export const deleteOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId } = req.params;
    await orderService.deleteOrder(orderId);
    res.status(204).send();
  } catch (err: any) {
    if (err.status === 404) return next(createError(404, 'Order not found', { code: 'NOT_FOUND' }));
    next(err);
  }
};
