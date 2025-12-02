import prisma from './prismaClient';

// Low-level persistence helpers for orders/items. These are thin wrappers
// around Prisma and accept an optional transaction client (tx). When a tx is
// provided, it's used for the operation so callers can orchestrate transactions
// at the service layer.

export const createOrderTx = async (tx: any, order: any) => {
  return tx.order.create({
    data: {
      orderId: order.orderId,
      value: order.value,
      creationDate: new Date(order.creationDate)
    }
  });
};

export const createItemTx = async (tx: any, item: any) => {
  return tx.item.create({
    data: {
      orderId: item.orderId,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price
    }
  });
};

export const deleteItemsTx = async (tx: any, orderId: string) => {
  return tx.item.deleteMany({ where: { orderId } });
};

export const updateOrderTx = async (tx: any, orderId: string, payload: any) => {
  return tx.order.update({
    where: { orderId },
    data: {
      value: payload.value,
      creationDate: new Date(payload.creationDate)
    }
  });
};

export const findOrder = async (orderId: string, tx?: any) => {
  if (tx) return tx.order.findUnique({ where: { orderId }, include: { items: true } });
  return prisma.order.findUnique({ where: { orderId }, include: { items: true } });
};

export const findManyOrders = async (skip: number, take: number) => {
  return prisma.order.findMany({ skip, take, include: { items: true }, orderBy: { creationDate: 'desc' } });
};

export const countOrders = async () => {
  return prisma.order.count();
};

export const deleteOrder = async (orderId: string) => {
  return prisma.order.delete({ where: { orderId } });
};

export default {
  createOrderTx,
  createItemTx,
  deleteItemsTx,
  updateOrderTx,
  findOrder,
  findManyOrders,
  countOrders,
  deleteOrder
};
