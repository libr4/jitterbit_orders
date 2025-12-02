import prisma from '../db/prismaClient';
import { incomingOrderSchema, mappedOrderSchema } from '../validators/order.validator';
import * as repo from '../db/orderRepository';
import {
  InvalidInputError,
  InvalidItemIdError,
  NotFoundError,
  DuplicateEntityError
} from '../errors/domain';

type MappedItem = { productId: number; quantity: number; price: number };
type MappedOrder = { orderId: string; value: number; creationDate: string; items: MappedItem[] };

// Accepts either the incoming raw format or the already-mapped format and
// returns a normalized MappedOrder suitable for persistence.
const normalizeOrderPayload = (body: any): MappedOrder => {
  // If already matches mapped schema, return it
  try {
    const mapped = mappedOrderSchema.parse(body);
    return mapped as MappedOrder;
  } catch {
    // fallthrough to try incoming format
  }

  const incoming = incomingOrderSchema.parse(body);
  const date = new Date(incoming.dataCriacao);
  if (isNaN(date.getTime())) {
    throw new InvalidInputError('Invalid dataCriacao');
  }

  const items = incoming.items.map((it: any) => {
    const pid = Number(it.idItem);
    if (!Number.isInteger(pid)) {
      throw new InvalidItemIdError('Item ID must be numeric');
    }
    return {
      productId: pid,
      quantity: it.quantidadeItem,
      price: it.valorItem
    } as MappedItem;
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

export const formatOrderDto = (o: any) => {
  if (!o) return null;
  return {
    orderId: o.orderId,
    value: o.value,
    creationDate: (o.creationDate instanceof Date ? o.creationDate : new Date(o.creationDate)).toISOString(),
    items: (o.items || []).map((it: any) => ({ productId: it.productId, quantity: it.quantity, price: it.price }))
  };
};

const createOrder = async (order: any) => {
  try {
    const mapped = normalizeOrderPayload(order);
    const created = await prisma.$transaction(async (tx) => {
      const o = await repo.createOrderTx(tx, mapped);
      const items = mapped.items.map((it) => repo.createItemTx(tx, { orderId: o.orderId, ...it }));
      await Promise.all(items);
      const result = await repo.findOrder(o.orderId, tx);
      return result;
    });
    return created;
  } catch (err: any) {
    // Wrap Prisma P2002 (unique constraint violation) as a domain error
    if (err.code === 'P2002') {
      throw new DuplicateEntityError('Order already exists');
    }
    // Re-throw other errors (will be caught by global error handler)
    throw err;
  }
};

const getOrder = async (orderId: string) => {
  const o = await repo.findOrder(orderId);
  if (!o) throw new NotFoundError('Order not found');
  return o;
};

const listOrders = async (page = 1, size = 10) => {
  const take = size;
  const skip = (page - 1) * size;
  const [total, data] = await Promise.all([
    repo.countOrders(),
    repo.findManyOrders(skip, take)
  ]);
  return { total, page, size, data };
};

const updateOrder = async (orderId: string, order: any) => {
  const existing = await repo.findOrder(orderId);
  if (!existing) throw new NotFoundError('Order not found');
  const mapped = normalizeOrderPayload(order);
  const updated = await prisma.$transaction(async (tx) => {
    await repo.deleteItemsTx(tx, orderId);
    await repo.updateOrderTx(tx, orderId, mapped);
    const items = mapped.items.map((it) => repo.createItemTx(tx, { orderId, ...it }));
    await Promise.all(items);
    const result = await repo.findOrder(orderId, tx);
    return result;
  });
  return updated;
};

const deleteOrder = async (orderId: string) => {
  const existing = await repo.findOrder(orderId);
  if (!existing) throw new NotFoundError('Order not found');
  await repo.deleteOrder(orderId);
};

export default { createOrder, getOrder, listOrders, updateOrder, deleteOrder };
