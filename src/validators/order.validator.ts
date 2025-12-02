import { z } from 'zod';

const itemIncoming = z.object({
  idItem: z.string(),
  quantidadeItem: z.number().int().nonnegative(),
  valorItem: z.number().nonnegative()
});

export const incomingOrderSchema = z.object({
  numeroPedido: z.string(),
  valorTotal: z.number().nonnegative(),
  dataCriacao: z.string(),
  items: z.array(itemIncoming).min(1)
}).strict();

export const mappedItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.number().int().nonnegative(),
  price: z.number().nonnegative()
});

export const mappedOrderSchema = z.object({
  orderId: z.string(),
  value: z.number().nonnegative(),
  creationDate: z.string(),
  items: z.array(mappedItemSchema).min(1)
}).strict();

export const createOrderSchema = incomingOrderSchema;

export const loginSchema = z.object({
  username: z.string(),
  password: z.string()
}).strict();
