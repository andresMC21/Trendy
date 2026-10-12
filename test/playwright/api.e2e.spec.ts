import { expect, test, type APIRequestContext } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const runId = Date.now().toString();
const password = 'Passw0rd1';
const neighborhoodId = `playwright-${runId}`;

type AuthUser = {
  id: string;
  email: string;
  token: string;
};

async function registerAndLogin(
  request: APIRequestContext,
  name: string,
): Promise<AuthUser> {
  const email = `${name}.${runId}@trendy.test`;

  const register = await request.post('/user/register', {
    data: {
      email,
      password,
      fullName: `Playwright ${name}`,
    },
  });
  expect(register.status()).toBe(201);

  const login = await request.post('/user/login', {
    data: { email, password },
  });
  expect(login.status()).toBe(201);

  const body = await login.json();
  expect(body.id).toEqual(expect.any(String));
  expect(body.token).toEqual(expect.any(String));

  return { id: body.id, email, token: body.token };
}

function auth(user: AuthUser) {
  return {
    Authorization: `Bearer ${user.token}`,
  };
}

function productBody(overrides: Record<string, unknown> = {}) {
  return {
    title: `Bicicleta Playwright ${runId}`,
    description: 'Producto creado desde Playwright API tests',
    price: 250000,
    acceptsBarter: true,
    category: 'deportes',
    condition: 'COMO_NUEVO',
    location: {
      lat: 3.4516,
      lng: -76.532,
    },
    neighborhoodId,
    estimatedWeightKg: 14.5,
    ...overrides,
  };
}

test.describe('Trendy API e2e con Playwright', () => {
  let seller: AuthUser;
  let buyer: AuthUser;
  let outsider: AuthUser;
  let productId: string;
  let transactionProductId: string;
  let transactionId: string;

  test('health responde OK', async ({ request }) => {
    const response = await request.get('/health');
    expect(response.status()).toBe(200);

    await expect(response.json()).resolves.toMatchObject({
      status: 'ok',
      service: 'trendy-api',
    });
  });

  test('registra usuarios, autentica y obtiene perfil', async ({ request }) => {
    seller = await registerAndLogin(request, 'seller');
    buyer = await registerAndLogin(request, 'buyer');
    outsider = await registerAndLogin(request, 'outsider');

    const profile = await request.get('/user/me', {
      headers: auth(seller),
    });
    expect(profile.status()).toBe(200);

    const body = await profile.json();
    expect(body).toMatchObject({
      id: seller.id,
      email: seller.email,
      isActive: true,
    });
    expect(body.password).toBeUndefined();
  });

  test('valida autenticacion y body al crear productos', async ({
    request,
  }) => {
    const noToken = await request.post('/products', {
      data: productBody(),
    });
    expect(noToken.status()).toBe(401);

    const invalid = await request.post('/products', {
      headers: auth(seller),
      data: productBody({
        title: 'x',
        price: -5,
        location: { lat: 99, lng: 0 },
        campoExtra: true,
      }),
    });
    expect(invalid.status()).toBe(400);
  });

  test('crea, consulta, actualiza, marca favorito y elimina producto', async ({
    request,
  }) => {
    const create = await request.post('/products', {
      headers: auth(seller),
      data: productBody(),
    });
    expect(create.status()).toBe(201);

    const product = await create.json();
    productId = product.id;
    expect(product).toMatchObject({
      sellerId: seller.id,
      status: 'AVAILABLE',
      price: 250000,
      neighborhoodId,
    });

    const feed = await request.get('/products', {
      params: { neighborhood: neighborhoodId },
    });
    expect(feed.status()).toBe(200);
    const feedBody = await feed.json();
    expect(
      feedBody.items.some((item: { id: string }) => item.id === productId),
    ).toBe(true);

    const updateAsBuyer = await request.put(`/products/${productId}`, {
      headers: auth(buyer),
      data: { price: 1 },
    });
    expect(updateAsBuyer.status()).toBe(403);

    const updateAsSeller = await request.put(`/products/${productId}`, {
      headers: auth(seller),
      data: {
        price: 200000,
        location: { lat: 3.46, lng: -76.53 },
      },
    });
    expect(updateAsSeller.status()).toBe(200);
    expect((await updateAsSeller.json()).price).toBe(200000);

    const favorite = await request.post(`/products/${productId}/favorite`, {
      headers: auth(buyer),
    });
    expect(favorite.status()).toBe(200);
    expect(await favorite.json()).toEqual({ isFavorite: true });

    const detail = await request.get(`/products/${productId}`);
    expect(detail.status()).toBe(200);
    expect((await detail.json()).favoritesCount).toBe(1);

    const deleteAsBuyer = await request.delete(`/products/${productId}`, {
      headers: auth(buyer),
    });
    expect(deleteAsBuyer.status()).toBe(403);

    const deleteAsSeller = await request.delete(`/products/${productId}`, {
      headers: auth(seller),
    });
    expect(deleteAsSeller.status()).toBe(204);

    const deleted = await request.get(`/products/${productId}`);
    expect(deleted.status()).toBe(404);
  });

  test('completa flujo de transaccion', async ({ request }) => {
    const createProduct = await request.post('/products', {
      headers: auth(seller),
      data: productBody({
        title: `Producto transaccion ${runId}`,
        price: 80000,
      }),
    });
    expect(createProduct.status()).toBe(201);
    transactionProductId = (await createProduct.json()).id;

    const selfPurchase = await request.post('/transactions', {
      headers: auth(seller),
      data: { productId: transactionProductId },
    });
    expect(selfPurchase.status()).toBe(403);

    const createTransaction = await request.post('/transactions', {
      headers: auth(buyer),
      data: {
        productId: transactionProductId,
        message: 'Me interesa comprarlo.',
      },
    });
    expect(createTransaction.status()).toBe(201);

    const transaction = await createTransaction.json();
    transactionId = transaction.id;
    expect(transaction).toMatchObject({
      productId: transactionProductId,
      buyerId: buyer.id,
      sellerId: seller.id,
      status: 'PENDING',
      safePointId: null,
    });

    const reserved = await request.get(`/products/${transactionProductId}`);
    expect(reserved.status()).toBe(200);
    expect((await reserved.json()).status).toBe('RESERVED');

    const outsiderRead = await request.get(`/transactions/${transactionId}`, {
      headers: auth(outsider),
    });
    expect(outsiderRead.status()).toBe(403);

    const confirmPoint = await request.post(
      `/transactions/${transactionId}/confirm-point`,
      {
        headers: auth(seller),
        data: {
          safePointId: 'sp-playwright',
          scheduledTime: '2030-10-05T15:00:00.000Z',
        },
      },
    );
    expect(confirmPoint.status()).toBe(200);
    expect((await confirmPoint.json()).status).toBe('AGREED_POINT');

    const complete = await request.put(
      `/transactions/${transactionId}/status`,
      {
        headers: auth(buyer),
        data: { status: 'COMPLETED' },
      },
    );
    expect(complete.status()).toBe(200);
    expect((await complete.json()).status).toBe('COMPLETED');

    const sold = await request.get(`/products/${transactionProductId}`);
    expect(sold.status()).toBe(200);
    expect((await sold.json()).status).toBe('SOLD');
  });
});
