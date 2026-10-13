
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

const run = Date.now().toString();
const emailPrefix = `e2e-${run}-`;
const password = 'Passw0rd1';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let http: ReturnType<typeof request>;
  let dataSource: DataSource;

  let token: string;
  let userId: string;
  let userEmail: string;

  const auth = (jwt: string) => ({
    Authorization: `Bearer ${jwt}`,
  });

  const newUser = (suffix: string) => ({
    email: `${emailPrefix}${suffix}@test.com`,
    password,
    fullName: `E2E User ${suffix}`,
  });

  beforeAll(async () => {
    process.env.FEED_CACHE_TTL_SECONDS = '0';

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
    dataSource = app.get(DataSource);

    // Usuario base para las pruebas de perfil y autenticación.
    const user = newUser('base');

    const registerResponse = await http
      .post('/api/user/register')
      .send(user)
      .expect(201);

    userId = registerResponse.body.id;
    userEmail = user.email;
    token = registerResponse.body.token;

    expect(userId).toBeDefined();
    expect(token).toBeDefined();
  });

  afterAll(async () => {
    if (app) {
      // Elimina solamente los usuarios creados por este archivo.
      await dataSource.query(
        'DELETE FROM "user" WHERE email LIKE $1',
        [`${emailPrefix}%`],
      );

      await app.close();
    }
  });

  it('POST /user/register registra un usuario', async () => {
    const user = newUser('register');

    const res = await http
      .post('/api/user/register')
      .send(user)
      .expect(201);

    expect(res.body).toMatchObject({
      email: user.email,
      fullName: user.fullName,
    });

    expect(res.body.id).toBeDefined();
    expect(res.body.token).toBeDefined();

    // La contraseña nunca debe devolverse en la respuesta.
    expect(res.body.password).toBeUndefined();
  });

  it('POST /user/register rechaza un correo duplicado', async () => {
    await http
      .post('/api/user/register')
      .send(newUser('base'))
      .expect(409);
  });

  it('POST /user/register valida los datos recibidos', async () => {
    await http
      .post('/api/user/register')
      .send({
        email: 'correo-invalido',
        password: '123',
        fullName: 'Usuario inválido',
        extra: true,
      })
      .expect(400);
  });

  it('POST /user/login inicia sesión con credenciales válidas', async () => {
    const res = await http
      .post('/api/user/login')
      .send({
        email: userEmail,
        password,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      id: userId,
      email: userEmail,
    });

    expect(res.body.token).toBeDefined();
    expect(res.body.password).toBeUndefined();
  });

  it('POST /user/login rechaza una contraseña incorrecta', async () => {
    await http
      .post('/api/user/login')
      .send({
        email: userEmail,
        password: 'WrongPass1',
      })
      .expect(401);
  });

  it('GET /user/me requiere autenticación', async () => {
    await http.get('/api/user/me').expect(401);
  });

  it('GET /user/me devuelve el perfil autenticado sin exponer la contraseña', async () => {
    const res = await http
      .get('/api/user/me')
      .set(auth(token))
      .expect(200);

    expect(res.body).toMatchObject({
      id: userId,
      email: userEmail,
      fullName: 'E2E User base',
      isActive: true,
    });

    expect(res.body.password).toBeUndefined();
  });

  it('PATCH /user/me actualiza el nombre del usuario', async () => {
    const res = await http
      .patch('/api/user/me')
      .set(auth(token))
      .send({
        fullName: 'E2E User Updated',
      })
      .expect(200);

    expect(res.body).toMatchObject({
      id: userId,
      fullName: 'E2E User Updated',
    });
  });

  it('PATCH /user/me valida los datos de actualización', async () => {
    await http
      .patch('/api/user/me')
      .set(auth(token))
      .send({
        extra: 'campo no permitido',
      })
      .expect(400);
  });

  it('PATCH /user/me/password cambia la contraseña con la actual correcta', async () => {
    const newPassword = 'NewPassw2';

    const res = await http
      .patch('/api/user/me/password')
      .set(auth(token))
      .send({
        currentPassword: password,
        newPassword,
      })
      .expect(200);

    expect(res.body.message).toBe('Password updated successfully');

    // Comprueba que la nueva contraseña funciona.
    await http
      .post('/api/user/login')
      .send({
        email: userEmail,
        password: newPassword,
      })
      .expect(200);
  });

  it('PATCH /user/me/password rechaza una contraseña actual incorrecta', async () => {
    await http
      .patch('/api/user/me/password')
      .set(auth(token))
      .send({
        currentPassword: 'WrongPass1',
        newPassword: 'AnotherPass2',
      })
      .expect(403);
  });

  it('PATCH /user/me/email cambia el correo con la contraseña correcta', async () => {
    const newEmail = `${emailPrefix}changed@test.com`;

    const res = await http
      .patch('/api/user/me/email')
      .set(auth(token))
      .send({
        currentPassword: 'NewPassw2',
        newEmail,
      })
      .expect(200);

    expect(res.body).toMatchObject({
      id: userId,
      email: newEmail,
    });

    // Verifica que el correo nuevo permite iniciar sesión.
    await http
      .post('/api/user/login')
      .send({
        email: newEmail,
        password: 'NewPassw2',
      })
      .expect(200);
  });

  it('GET /user/:id devuelve el perfil público autenticado', async () => {
    const res = await http
      .get(`/api/user/${userId}`)
      .set(auth(token))
      .expect(200);

    expect(res.body).toMatchObject({
      id: userId,
      email: `${emailPrefix}changed@test.com`,
      fullName: 'E2E User Updated',
    });

    expect(res.body.password).toBeUndefined();
  });

  it('GET /user/:id valida el UUID', async () => {
    await http
      .get('/api/user/no-es-uuid')
      .set(auth(token))
      .expect(400);
  });

  it('GET /user/:id devuelve 404 para un usuario inexistente', async () => {
    await http
      .get('/api/user/00000000-0000-4000-8000-000000000000')
      .set(auth(token))
      .expect(404);
  });

  describe('POST /user/logout', () => {
    it('requiere autenticación', async () => {
      await http.post('/api/user/logout').expect(401);
    });

    it('invalida el token y exige un nuevo inicio de sesión', async () => {
      const user = newUser('logout');

      const registerRes = await http
        .post('/api/user/register')
        .send(user)
        .expect(201);

      const oldToken: string = registerRes.body.token;

      await http.get('/api/user/me').set(auth(oldToken)).expect(200);

      const logoutRes = await http
        .post('/api/user/logout')
        .set(auth(oldToken))
        .expect(200);

      expect(logoutRes.body.message).toBe('Session successfuly closed');

      await http.get('/api/user/me').set(auth(oldToken)).expect(401);
      await http.post('/api/user/logout').set(auth(oldToken)).expect(401);

      const loginRes = await http
        .post('/api/user/login')
        .send({ email: user.email, password })
        .expect(200);

      const newToken: string = loginRes.body.token;

      await http.get('/api/user/me').set(auth(newToken)).expect(200);

      await http.get('/api/user/me').set(auth(oldToken)).expect(401);
    });
  });

});