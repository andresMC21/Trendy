# Trendy API


Backend del marketplace hiperlocal de segunda mano Trendy, desarrollado con NestJS, TypeORM y PostgreSQL + PostGIS para el taller de *Computación en Internet III* (Universidad Icesi).

Los usuarios publican productos, los encuentran por barrio o cercanía geográfica, acuerdan la entrega en un punto seguro y se califican entre sí al terminar la transacción.

## Enlaces

| Recurso | URL |
|---|---|
| Repositorio | https://github.com/andresMC21/Trendy |
| Aplicación desplegada (Render) | https://trendy-app-web-un9c.onrender.com/api |
| Documentación Swagger | https://trendy-app-web-un9c.onrender.com/api/docs |
| Health check | https://trendy-app-web-un9c.onrender.com/api/health |

> El plan gratuito de Render duerme el servicio tras un rato sin tráfico: la primera petición puede tardar ~1 minuto.

## Funcionalidades

| Módulo | Qué hace |  |
|---|---|---|
| **Usuarios** (`/user`, `/admin/users`, `/moderation`) | Registro, login con JWT, perfil, cambio de contraseña y correo, verificación de identidad, administración de usuarios (roles, activar/desactivar) y moderación |  |
| **Productos** (`/products`) | Publicar, editar y eliminar productos; feed por barrio o cercanía (PostGIS); filtros, orden, paginación; favoritos |  |
| **Transacciones** (`/transactions`) | Intención de compra o trueque, punto seguro y horario, cierre o cancelación; actualiza el estado del producto |  |
| **Reseñas** (`/review`) | Calificación (1–5) entre participantes de una transacción completada; recalcula el promedio del usuario |  |
| **Health** (`/health`) | Comprobación de disponibilidad | — |

**Autenticación:** JWT (Bearer, expira en 1 h) 

**Autorización:** roles `ADMIN`, `MODERATOR` y `USER` 

 **Persistencia:** TypeORM + migraciones sobre PostgreSQL/PostGIS.

## Tecnologías

NestJS 12 · TypeScript · TypeORM · PostgreSQL 16 + PostGIS · Passport JWT · bcrypt · class-validator · Swagger (OpenAPI) · Jest + Supertest · Postman/Newman · GitHub Actions · Render.

## Requisitos

- **Node.js 24** (el proyecto y el CI usan Node 24)
- **Docker** (para levantar PostgreSQL con PostGIS) o un PostgreSQL con la extensión PostGIS instalada
- npm



La API queda en **http://localhost:3000/api** y Swagger en **http://localhost:3000/api/docs**.



### Scripts (`npm run`)

| Comando | Descripción |
|---|---|
| `npm run start` | Inicia la API |
| `npm run start:dev` | Inicia con recarga automática |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta la versión compilada |
| `npm run migration:run` | Aplica las migraciones pendientes |
| `npm run migration:generate -- src/database/migrations/Nombre` | Genera una migración a partir de los cambios en las entidades |
| `npm run seed` | Carga los datos iniciales |
| `npm run lint` | Análisis estático (oxlint) |
| `npm run test` | Pruebas unitarias |
| `npm run test:cov` | Pruebas unitarias con cobertura (umbral mínimo 80 %) |
| `npm run test:e2e` | Pruebas de integración (necesitan base de datos) |

## Usuarios de prueba (seed)

| Correo | Contraseña | Rol | Notas |
|---|---|---|---|
| `admin@trendy.local` | `Admin1234` | ADMIN | Usuario administrador inicial |
| `moderador@trendy.local` | `Mod12345` | MODERATOR | Revisa verificaciones |
| `ana@trendy.local` | `Ana12345` | USER | Verificada; vende 2 productos |
| `carlos@trendy.local` | `Carlos12` | USER | Sin verificar; vende 1 producto y compró uno de Ana |

El seed también crea 3 productos, 1 transacción completada y 1 reseña de ejemplo. Se puede ejecutar varias veces.

## Cómo probar cada funcionalidad

Hay tres formas, de la más rápida a la más completa:

### Swagger (interfaz web)

1. Abre `/api/docs`.
2. En **Users → POST /api/user/login** pulsa *Try it out*, usa un usuario del seed y copia el `token` de la respuesta.
3. Pulsa **Authorize** (candado), pega el token y confirma.
4. Prueba cualquier endpoint: cada operación indica en su descripción qué rol necesita y qué errores puede devolver.

### Postman (todos los endpoints)

La colección `postman/trendy-api.postman_collection.json` cubre todos los endpoints (179 requests, 260 aserciones) e incluye casos de éxito y de error (400, 401, 403, 404, 409).

1. Importa el archivo en Postman.
2. Asegúrate de que la API esté corriendo y de haber ejecutado `npm run seed` (la colección usa el admin del seed).
3. Ejecuta la colección **completa y en orden** con *Collection Runner → Run*. Los tokens y los ids se guardan solos en variables.
4. Para apuntar a la app desplegada, cambia la variable `baseUrl` por `https://trendy-app-web-un9c.onrender.com/api`.


### Qué probar y con qué usuario

| Funcionalidad | Endpoints | Usuario |
|---|---|---|
| Registro e inicio de sesión | `POST /user/register`, `POST /user/login` | cualquiera |
| Rutas protegidas (401 sin token) | `GET /user/me` | cualquiera |
| Perfil, contraseña, correo | `PATCH /user/me`, `/me/password`, `/me/email` | cualquiera |
| Solicitar verificación de identidad | `POST /user/me/verification` | `carlos` |
| Aprobar o rechazar verificaciones | `GET /moderation/verifications`, `PATCH /moderation/verifications/:userId` | `moderador` o `admin` |
| Administrar usuarios y **roles** | `/admin/users` (listar, editar, `/role`, `/active`, `DELETE`) | `admin` (el `moderador` solo lee) |
| Probar que un `USER` no accede a rutas admin (403) | `GET /admin/users` | `ana` |
| Publicar y editar productos | `POST /products`, `PUT /products/:id` | `ana` |
| Feed por barrio / cercanía / filtros | `GET /products?neighborhood=…&lat=…&lng=…&radius=…` | público |
| Favoritos | `POST /products/:id/favorite` | cualquiera autenticado |
| Compra: reservar → acordar punto → completar | `POST /transactions`, `POST /transactions/:id/confirm-point`, `PUT /transactions/:id/status` | `carlos` compra, `ana` vende |
| Reseñas tras una compra completada | `POST /review`, `GET /review` | comprador y vendedor |

## Pruebas automatizadas

```bash
npm run test        # unitarias
npm run test:cov    # unitarias + cobertura 
```

| Tipo | Herramienta | Resultado |
|---|---|---|
| Unitarias | Jest | 21 suites, 168 pruebas pasan |
| Cobertura | Jest | Sentencias 91.75 % · Ramas 80.98 % · Funciones 86.25 % · Líneas 91.37 % (umbral exigido: 80 %) |
| Integración | Jest + Supertest + PostGIS | 4 suites, 38 pruebas pasan (health, usuarios, productos, transacciones) |
| Manuales / regresión | Postman (Newman) | 179 requests, 260 aserciones, 0 fallos |

### Pruebas de integración

Las pruebas de integración levantan la aplicación completa contra una base PostgreSQL + PostGIS real. Se ejecutan automáticamente en GitHub Actions (workflow `tests`) en cada push y pull request a `main` y `develop`: el workflow crea el servicio de base de datos, aplica las migraciones y corre `test:cov` y `test:e2e`.

## CI/CD y despliegue

| Workflow | Cuándo | Qué hace |
|---|---|---|
| `tests` (`.github/workflows/tests.yml`) | push y PR a `main` / `develop` | Levanta Postgres + PostGIS, aplica migraciones, ejecuta lint, pruebas unitarias con cobertura, pruebas de integración y compila |
| `PROD-CI` (`.github/workflows/prod-ci.yml`) | push y PR a `main` / `develop` | Lint, pruebas unitarias y compilación; en `main` dispara el despliegue en Render (secreto `RENDER_DEPLOY_HOOK_URL`) |

**Despliegue:** Render (web service + PostgreSQL) definido en `render.yml`. Al arrancar ejecuta `npm run migration:run:prod` y luego `npm run start:prod`; el health check usa `/api/health`.

## Estructura del proyecto

```
src/
├── main.ts                  # Arranque: prefijo /api, validación global, Swagger
├── app.module.ts            # Configuración global y conexión a la base de datos
├── health.controller.ts
├── common/                  # Esquemas de error compartidos para Swagger
├── database/
│   ├── data-source.ts       # DataSource de TypeORM (CLI de migraciones)
│   └── migrations/          # Migraciones del esquema
├── seed/                    # Datos iniciales (npm run seed)
├── user/                    # Usuarios, auth (JWT), roles, administración, moderación
│   ├── decorators/          # @Auth(), @GetUser(), @RoleProtected()
│   ├── guards/              # UserRoleGuard
│   └── strategies/          # JwtStrategy
├── product/                 # Productos, feed geográfico, favoritos
├── transaction/             # Compra/trueque y máquina de estados
└── review/                  # Reseñas y promedio de calificación
test/                        # Pruebas de integración (Supertest)
postman/                     # Colección de Postman
```

## Documentación adicional

- **Swagger / OpenAPI:** `/api/docs` — parámetros, cuerpos, respuestas y errores de cada endpoint.
- **Informe técnico:** descripción detallada de endpoints, autenticación, autorización, persistencia y pruebas (se entrega en la tarea de Intu).

## Alcance y limitaciones conocidas

- La sesión es JWT sin estado (1 h de vigencia): cerrar sesión consiste en descartar el token en el cliente; no hay lista de revocación ni *refresh token*.
- **No** hay autenticación de dos factores (2FA).
- El feed de productos usa una **caché en memoria** (no Redis), por lo que no se comparte entre varias instancias.
- `reason` en la resolución de verificaciones se registra en logs, no se guarda en el perfil.
