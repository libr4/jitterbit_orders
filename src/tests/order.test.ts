import request from 'supertest';
import app from '../app';
import prisma from '../db/prismaClient';
import config from '../config';

let token: string;

const sampleIncoming = {
  numeroPedido: 'v10089015vdb-01',
  valorTotal: 10000,
  dataCriacao: '2023-07-19T12:24:11.5299601+00:00',
  items: [
    {
      idItem: '2434',
      quantidadeItem: 1,
      valorItem: 1000
    }
  ]
};

beforeAll(async () => {
  const res = await request(app).post('/auth/login').send({ username: config.DEV_AUTH_USER, password: config.DEV_AUTH_PASS });
  token = res.body.token;
});

afterAll(async () => {
  await prisma.item.deleteMany();
  await prisma.order.deleteMany();
  await prisma.$disconnect();
});

describe('Order endpoints', () => {
  it('create order success', async () => {
    const res = await request(app).post('/order').set('Authorization', `Bearer ${token}`).send(sampleIncoming);
    expect(res.status).toBe(201);
    expect(res.header.location).toBe('/order/v10089015vdb-01');
    expect(res.body.orderId).toBe(sampleIncoming.numeroPedido);
    expect(res.body.items[0].productId).toBe(2434);
  });

  it('create duplicate returns 409', async () => {
    const res = await request(app).post('/order').set('Authorization', `Bearer ${token}`).send(sampleIncoming);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_ORDER');
  });

  it('create invalid idItem returns 400', async () => {
    const bad = JSON.parse(JSON.stringify(sampleIncoming));
    bad.numeroPedido = 'v-bad-01';
    bad.items[0].idItem = 'abc';
    const res = await request(app).post('/order').set('Authorization', `Bearer ${token}`).send(bad);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ITEM_ID');
  });

  it('get order by id', async () => {
    const res = await request(app).get(`/order/${sampleIncoming.numeroPedido}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe(sampleIncoming.numeroPedido);
  });

  it('list orders pagination', async () => {
    const res = await request(app).get('/order/list?page=1&size=10').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.page).toBe(1);
  });

  it('update order replaces items', async () => {
    const upd = {
      numeroPedido: sampleIncoming.numeroPedido,
      valorTotal: 20000,
      dataCriacao: '2023-07-20T12:00:00Z',
      items: [
        { idItem: '5000', quantidadeItem: 2, valorItem: 500 }
      ]
    };
    const res = await request(app).put(`/order/${sampleIncoming.numeroPedido}`).set('Authorization', `Bearer ${token}`).send(upd);
    expect(res.status).toBe(200);
    expect(res.body.value).toBe(20000);
    expect(res.body.items[0].productId).toBe(5000);
  });

  it('delete order', async () => {
    const res = await request(app).delete(`/order/${sampleIncoming.numeroPedido}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    const getRes = await request(app).get(`/order/${sampleIncoming.numeroPedido}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });
});
