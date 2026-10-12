import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

process.env.DB_NAME = process.env.DB_NAME_TEST ?? process.env.DB_NAME;
process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.DB_PORT ?? '5432';
process.env.DB_NAME = process.env.DB_NAME ?? 'trendy';
process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'trendy';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'trendy';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';
process.env.FEED_CACHE_TTL_SECONDS = '0';

const run = Date.now().toString().slice(-6);

jest.setTimeout(40000);

describe('Transactions (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let tokenSeller: string;
  let tokenBuyer: string;
  let tokenOther: string;
  let productId: string;
  let transactionId: string;

  const hood = `transactions-${run}`;
  const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

  const newUser = async (name: string) => {
    const user = {
      email: `transaction-e2e-${run}-${name}@test.com`,
      password: 'Passw0rd1',
      fullName: `Transaction E2E ${name}`,
    };

    await http.post('/api/user/register').send(user).expect(201);

    const res = await http
      .post('/api/user/login')
      .send({ email: user.email, password: user.password })
      .expect(200);

    return res.body.token as string;
  };

  const productBody = (over: object = {}) => ({
    title: 'Producto para transaccion',
    description: 'Producto creado por pruebas e2e de transacciones',
    price: 150000,
    acceptsBarter: false,
    category: 'tecnologia',
    condition: 'USADO',
    location: { lat: 3.4516, lng: -76.532 },
    neighborhoodId: hood,
    estimatedWeightKg: 2,
    ...over,
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    http = request(app.getHttpServer());

    tokenSeller = await newUser('seller');
    tokenBuyer = await newUser('buyer');
    tokenOther = await newUser('other');
  });

  afterAll(async () => {
    if (!app) return;

    const ds = app.get(DataSource);
    await ds.query(
      `DELETE FROM "transaction" WHERE "productId" IN (SELECT id FROM product WHERE "neighborhoodId" = $1)`,
      [hood],
    );
    await ds.query(`DELETE FROM product WHERE "neighborhoodId" = $1`, [hood]);
    await ds.query(`DELETE FROM "user" WHERE email LIKE $1`, [
      `transaction-e2e-${run}-%`,
    ]);
    await app.close();
  });

  it('crea un producto disponible para iniciar la transaccion', async () => {
    // Arrange / Act
    const res = await http
      .post('/api/products')
      .set(auth(tokenSeller))
      .send(productBody())
      .expect(201);

    // Assert
    expect(res.body.status).toBe('AVAILABLE');
    productId = res.body.id;
  });

  it('POST /transactions exige autenticacion', () =>
    http.post('/api/transactions').send({ productId }).expect(401));

  it('POST /transactions valida el body', async () => {
    // Act
    const res = await http
      .post('/api/transactions')
      .set(auth(tokenBuyer))
      .send({ productId: 'no-es-uuid', extra: true })
      .expect(400);

    // Assert
    expect(res.body.message.join()).toMatch(/productId|extra/);
  });

  it('POST /transactions rechaza que el vendedor compre su propio producto', () =>
    http
      .post('/api/transactions')
      .set(auth(tokenSeller))
      .send({ productId })
      .expect(403));

  it('POST /transactions crea la transaccion y reserva el producto', async () => {
    // Act
    const res = await http
      .post('/api/transactions')
      .set(auth(tokenBuyer))
      .send({ productId })
      .expect(201);

    // Assert
    expect(res.body).toMatchObject({
      productId,
      status: 'PENDING',
      safePointId: null,
      scheduledTime: null,
    });
    transactionId = res.body.id;

    const product = await http.get(`/api/products/${productId}`).expect(200);
    expect(product.body.status).toBe('RESERVED');
  });

  it('POST /transactions rechaza producto con transaccion activa', () =>
    http
      .post('/api/transactions')
      .set(auth(tokenOther))
      .send({ productId })
      .expect(409));

  it('GET /transactions lista transacciones del usuario autenticado', async () => {
    // Act
    const res = await http
      .get('/api/transactions')
      .set(auth(tokenBuyer))
      .expect(200);

    // Assert
    expect(res.body.map((transaction: { id: string }) => transaction.id)).toContain(
      transactionId,
    );
  });

  it('GET /transactions/:id permite participantes y rechaza usuarios ajenos', async () => {
    // Act
    const res = await http
      .get(`/api/transactions/${transactionId}`)
      .set(auth(tokenSeller))
      .expect(200);

    // Assert
    expect(res.body.id).toBe(transactionId);

    await http
      .get(`/api/transactions/${transactionId}`)
      .set(auth(tokenOther))
      .expect(403);
  });

  it('POST /transactions/:id/confirm-point valida permisos, body y estado', async () => {
    // Assert
    await http
      .post(`/api/transactions/${transactionId}/confirm-point`)
      .set(auth(tokenOther))
      .send({ safePointId: 'sp-1', scheduledTime: '2030-10-05T15:00:00Z' })
      .expect(403);

    await http
      .post(`/api/transactions/${transactionId}/confirm-point`)
      .set(auth(tokenBuyer))
      .send({ safePointId: '', scheduledTime: 'fecha-mala' })
      .expect(400);

    const res = await http
      .post(`/api/transactions/${transactionId}/confirm-point`)
      .set(auth(tokenSeller))
      .send({ safePointId: 'sp-1', scheduledTime: '2030-10-05T15:00:00Z' })
      .expect(200);

    expect(res.body).toMatchObject({
      id: transactionId,
      status: 'AGREED_POINT',
      safePointId: 'sp-1',
    });

    await http
      .post(`/api/transactions/${transactionId}/confirm-point`)
      .set(auth(tokenSeller))
      .send({ safePointId: 'sp-2', scheduledTime: '2030-10-05T15:00:00Z' })
      .expect(409);
  });

  it('PUT /transactions/:id/status valida transiciones y completa la venta', async () => {
    // Assert
    await http
      .put(`/api/transactions/${transactionId}/status`)
      .set(auth(tokenBuyer))
      .send({ status: 'NO_EXISTE' })
      .expect(400);

    const res = await http
      .put(`/api/transactions/${transactionId}/status`)
      .set(auth(tokenSeller))
      .send({ status: 'COMPLETED' })
      .expect(200);

    expect(res.body.status).toBe('COMPLETED');

    const product = await http.get(`/api/products/${productId}`).expect(200);
    expect(product.body.status).toBe('SOLD');

    await http
      .put(`/api/transactions/${transactionId}/status`)
      .set(auth(tokenSeller))
      .send({ status: 'CANCELLED' })
      .expect(409);
  });

  it('POST /transactions rechaza productos vendidos', () =>
    http
      .post('/api/transactions')
      .set(auth(tokenOther))
      .send({ productId })
      .expect(409));
});
