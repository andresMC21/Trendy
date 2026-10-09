# Trendy
Trendy official repository for app development.


---

## Cómo ejecutar

Requisitos: **Node 24** (Jest necesita `require(esm)`, Node ≥ 24.9) y **PostgreSQL con PostGIS**.

```bash
# 1. Base de datos con PostGIS (opción rápida con Docker)
docker compose up -d

# 2. Variables de entorno
cp .env.example .env        # en Windows: copy .env.example .env

# 3. Dependencias y arranque
npm install
npm run start               # API en http://localhost:3000/api  (Swagger en la misma ruta)
```

Pruebas: `npm test` (unitarias) · `npm run test:cov` (cobertura) ·
`DB_NAME_TEST=trendy_test npm run test:e2e` (integración con supertest; usa una BD con PostGIS).

## Módulo 2 — Productos (`src/product`)

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/products` | No | Feed paginado de productos `AVAILABLE`. Query: `neighborhood`, `lat`, `lng`, `radius` (km, def. 5), `category`, `condition`, `sort` (`recent`·`price_asc`·`price_desc`·`distance`·`popular`), `page`, `limit` |
| GET | `/api/products/:id` | No | Detalle con vendedor e imágenes; suma una visita |
| POST | `/api/products` | JWT | Publicar producto |
| PUT | `/api/products/:id` | JWT (dueño) | Editar (solo si está `AVAILABLE`) |
| DELETE | `/api/products/:id` | JWT (dueño, ADMIN o MODERATOR) | Borrado lógico (`REMOVED`); solo si está `AVAILABLE` |
| POST | `/api/products/:id/images` | JWT (dueño) | Subir imágenes (`multipart`, campo `files`, máx. 8, JPG/PNG/WEBP, 5 MB c/u) |
| POST | `/api/products/:id/favorite` | JWT | Marca / desmarca favorito |

Swagger documenta todos los endpoints en `/api` (botón *Authorize* con el JWT).

**Para el módulo de transacciones** (`TransactionModule` debe importar `ProductModule`):

```ts
productService.findById(id)                          // entidad Product (price, sellerId, status, estimatedWeightKg…)
productService.updateStatus(id, ProductStatus.RESERVED | SOLD | AVAILABLE)
```

`updateStatus` valida transiciones: `AVAILABLE → RESERVED/SOLD/REMOVED`, `RESERVED → AVAILABLE/SOLD`; `SOLD` y `REMOVED` son finales (lanza 409 si no es válida). `findById` devuelve el producto aunque esté `SOLD`/`REMOVED`: quien lo use debe revisar `status`.

Notas de diseño: ubicación en columna PostGIS `geography(Point, 4326)` (filtro `ST_DWithin`); caché del feed en memoria con TTL (`FEED_CACHE_TTL_SECONDS`, 0 la desactiva) que se invalida al crear/editar/eliminar/cambiar estado; las imágenes se guardan en disco local (`/uploads`), detrás de `StorageService`, para cambiarlas a S3/Cloudinary sin tocar el resto.

## Pruebas manuales (Postman)

Importar `postman/trendy-products.postman_collection.json`, arrancar la API y ejecutar la colección con el *Collection Runner*
(o `npx newman run postman/trendy-products.postman_collection.json --working-dir postman`).
Los tokens, `productId` y el barrio de prueba se guardan solos en variables de la colección.
