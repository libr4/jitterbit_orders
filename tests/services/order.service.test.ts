import orderService from '../../src/services/order.service';
import * as repo from '../../src/db/orderRepository';
import prisma from '../../src/db/prismaClient';
import { DuplicateEntityError, NotFoundError } from '../../src/errors/domain';

jest.mock('../../src/db/orderRepository');

describe('Order Service (unit - domain rules)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('createOrder wraps duplicate P2002 into DuplicateEntityError', async () => {
    // arrange: repo.createOrderTx throws Prisma P2002
    (repo.createOrderTx as jest.Mock).mockImplementation(() => { throw { code: 'P2002' }; });
    (repo.findOrder as jest.Mock).mockResolvedValue(null);

    const input = {
      orderId: 'o1',
      value: 100,
      creationDate: new Date().toISOString(),
      items: [{ productId: 1, quantity: 1, price: 100 }]
    };

    await expect(orderService.createOrder(input as any)).rejects.toBeInstanceOf(DuplicateEntityError);
  });

  it('getOrder throws NotFoundError when missing', async () => {
    (repo.findOrder as jest.Mock).mockResolvedValue(null);
    await expect(orderService.getOrder('missing')).rejects.toBeInstanceOf(NotFoundError);
  });

  it('listOrders returns totals and propagates repo data', async () => {
    (repo.countOrders as jest.Mock).mockResolvedValue(1);
    (repo.findManyOrders as jest.Mock).mockResolvedValue([{ orderId: 'o1', items: [] }]);

    const res = await orderService.listOrders(1, 10);
    expect(res.total).toBe(1);
    expect(res.page).toBe(1);
    expect(res.size).toBe(10);
    expect(res.data.length).toBe(1);
  });

  it('updateOrder throws NotFoundError when record missing', async () => {
    (repo.findOrder as jest.Mock).mockResolvedValue(null);
    const input = {
      numeroPedido: 'x',
      valorTotal: 100,
      dataCriacao: new Date().toISOString(),
      items: [{ idItem: '1', quantidadeItem: 1, valorItem: 100 }]
    };
    await expect(orderService.updateOrder('missing', input as any)).rejects.toBeInstanceOf(NotFoundError);
  });
});
