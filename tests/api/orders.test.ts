import { http } from '../../tests/helpers/testApp';
import { resetDb, disconnectDb } from '../../tests/helpers/db';
import config from '../../src/config';

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

let token: string;

beforeAll(async () => {
  await resetDb();
  const res = await http().post('/auth/login').send({ username: config.DEV_AUTH_USER, password: config.DEV_AUTH_PASS });
  token = res.body.token;
});

afterAll(async () => {
  await resetDb();
  await disconnectDb();
});

beforeEach(async () => {
  await resetDb();
});

describe('API /order (integration)', () => {
  it('create order success', async () => {
    const res = await http().post('/order').set('Authorization', `Bearer ${token}`).send(sampleIncoming);
    expect(res.status).toBe(201);
    expect(res.header.location).toBe('/order/v10089015vdb-01');
    expect(res.body.orderId).toBe(sampleIncoming.numeroPedido);
    expect(res.body.items[0].productId).toBe(2434);
  });

  it('create duplicate returns 409', async () => {
    await http().post('/order').set('Authorization', `Bearer ${token}`).send(sampleIncoming);
    const res = await http().post('/order').set('Authorization', `Bearer ${token}`).send(sampleIncoming);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_ORDER');
  });

  it('create invalid idItem returns 400', async () => {
    const bad = JSON.parse(JSON.stringify(sampleIncoming));
    bad.numeroPedido = 'v-bad-01';
    bad.items[0].idItem = 'abc';
    const res = await http().post('/order').set('Authorization', `Bearer ${token}`).send(bad);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_ITEM_ID');
  });

  it('get order by id', async () => {
    await http().post('/order').set('Authorization', `Bearer ${token}`).send(sampleIncoming);
    const res = await http().get(`/order/${sampleIncoming.numeroPedido}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe(sampleIncoming.numeroPedido);
  });

  it('list orders pagination', async () => {
    await http().post('/order').set('Authorization', `Bearer ${token}`).send(sampleIncoming);
    const res = await http().get('/order/list?page=1&size=10').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.page).toBe(1);
  });

  it('update order replaces items', async () => {
    await http().post('/order').set('Authorization', `Bearer ${token}`).send(sampleIncoming);
    const upd = {
      numeroPedido: sampleIncoming.numeroPedido,
      valorTotal: 20000,
      dataCriacao: '2023-07-20T12:00:00Z',
      items: [
        { idItem: '5000', quantidadeItem: 2, valorItem: 500 }
      ]
    };
    const res = await http().put(`/order/${sampleIncoming.numeroPedido}`).set('Authorization', `Bearer ${token}`).send(upd);
    expect(res.status).toBe(200);
    expect(res.body.value).toBe(20000);
    expect(res.body.items[0].productId).toBe(5000);
  });

  it('delete order', async () => {
    await http().post('/order').set('Authorization', `Bearer ${token}`).send(sampleIncoming);
    const res = await http().delete(`/order/${sampleIncoming.numeroPedido}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(204);
    const getRes = await http().get(`/order/${sampleIncoming.numeroPedido}`).set('Authorization', `Bearer ${token}`);
    expect(getRes.status).toBe(404);
  });
});
