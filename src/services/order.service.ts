import prisma from '../db/prismaClient';
import createError from 'http-errors';

type MappedItem = { productId: number; quantity: number; price: number };
type MappedOrder = { orderId: string; value: number; creationDate: string; items: MappedItem[] };

const createOrder = async (order: MappedOrder) => {
  try {
    const created = await prisma.$transaction(async (tx) => {
      const o = await tx.order.create({
        data: {
          orderId: order.orderId,
          value: order.value,
          creationDate: new Date(order.creationDate)
        }
      });
      const items = order.items.map((it) =>
        tx.item.create({
          data: {
            orderId: o.orderId,
            productId: it.productId,
            quantity: it.quantity,
            price: it.price
          }
        })
      );
      await Promise.all(items);
      const result = await tx.order.findUnique({
        where: { orderId: o.orderId },
        include: { items: true }
      });
      return result;
    });
    return created;
  } catch (err: any) {
    if (err.code === 'P2002') throw err;
    throw createError(500, 'DB error', { code: 'DB_ERROR', details: err.message });
  }
};

const getOrder = async (orderId: string) => {
  const o = await prisma.order.findUnique({ where: { orderId }, include: { items: true } });
  return o;
};

const listOrders = async (page = 1, size = 10) => {
  const take = size;
  const skip = (page - 1) * size;
  const [total, data] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({ skip, take, include: { items: true }, orderBy: { creationDate: 'desc' } })
  ]);
  return { total, page, size, data };
};

const updateOrder = async (orderId: string, order: MappedOrder) => {
  const existing = await prisma.order.findUnique({ where: { orderId } });
  if (!existing) throw createError(404, 'Not found', { code: 'NOT_FOUND' });

  const updated = await prisma.$transaction(async (tx) => {
    await tx.item.deleteMany({ where: { orderId } });
    await tx.order.update({
      where: { orderId },
      data: {
        value: order.value,
        creationDate: new Date(order.creationDate)
      }
    });
    const items = order.items.map((it) =>
      tx.item.create({
        data: {
          orderId,
          productId: it.productId,
          quantity: it.quantity,
          price: it.price
        }
      })
    );
    await Promise.all(items);
    const result = await tx.order.findUnique({ where: { orderId }, include: { items: true } });
    return result;
  });

  return updated;
};

const deleteOrder = async (orderId: string) => {
  const existing = await prisma.order.findUnique({ where: { orderId } });
  if (!existing) throw createError(404, 'Not found', { code: 'NOT_FOUND' });
  await prisma.order.delete({ where: { orderId } });
};

export default { createOrder, getOrder, listOrders, updateOrder, deleteOrder };
