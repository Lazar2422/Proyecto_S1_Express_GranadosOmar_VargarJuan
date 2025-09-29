# KarenFlix · Backend (Node.js + Express + MongoDB)

> API REST para registrar, calificar y rankear películas, animes y series geek. Incluye autenticación JWT, validaciones, rate limiting, transacciones reales en MongoDB y documentación Swagger. Frontend (HTML+CSS+JS puro) consume esta API.

---

## Tabla de contenido

* [Visión general](#visión-general)
* [Stack, librerías obligatorias y versiones](#stack-librerías-obligatorias-y-versiones)
* [Arquitectura del proyecto](#arquitectura-del-proyecto)
* [Instalación y ejecución](#instalación-y-ejecución)
* [Seguridad y buenas prácticas](#seguridad-y-buenas-prácticas)
* [Autenticación y autorización](#autenticación-y-autorización)
* [Validaciones y manejo de errores](#validaciones-y-manejo-de-errores)
* [Rate limiting y CORS](#rate-limiting-y-cors)
* [Modelado de datos: colecciones y estructuras](#modelado-de-datos-colecciones-y-estructuras)

  * [Normalización: formas normales y proceso](#normalización-formas-normales-y-proceso)
  * [Esquemas JSON por colección](#esquemas-json-por-colección)
  * [Índices y performance](#índices-y-performance)
  * [Transacciones: casos críticos](#transacciones-casos-críticos)
  * [Cálculo de ranking ponderado](#cálculo-de-ranking-ponderado)
* [API: rutas principales](#api-rutas-principales)

  * [Convenciones y versionado (semver + /api/v1)](#convenciones-y-versionado-semver--apiv1)
  * [Ejemplos de endpoints (cURL)](#ejemplos-de-endpoints-curl)
  * [Swagger UI](#swagger-ui)
* [Estructura de carpetas](#estructura-de-carpetas)
* [Scripts de NPM](#scripts-de-npm)
* [Checklist de requisitos](#checklist-de-requisitos)
* [Contribución y flujo SCRUM](#contribución-y-flujo-scrum)
* [Créditos](#créditos)

---

## Visión general

KarenFlix es una API REST **full-Express** que permite:

* Registrar usuarios y autenticarlos con **JWT** (roles: `user`, `admin`).
* Gestionar **categorías** (solo admin) y **títulos** (películas/series/anime), con aprobación admin.
* Crear **reseñas** con calificaciones de **1.0 a 5.0** en pasos de **0.1** (p.ej., 3.7).
* Dar **like/dislike** a reseñas de otros usuarios (no a las propias).
* Calcular un **ranking ponderado de títulos** considerando: calificaciones, votos a reseñas y recencia.
* Documentación de endpoints con **Swagger UI**.

> **Base de datos:** MongoDB (driver oficial, sin Mongoose), con **transacciones** en operaciones críticas.

---

## Stack, librerías obligatorias y versiones

* **Runtime:** Node.js ≥ 20
* **Framework:** Express 4+
* **DB:** MongoDB 6+ (replica set para transacciones)
* **Autenticación:** `passport-jwt`, `jsonwebtoken`, `bcrypt`
* **Validaciones:** `express-validator`
* **DB Driver:** `mongodb` (oficial)
* **Rate limiting:** `express-rate-limit`
* **Docs:** `swagger-ui-express` (OpenAPI 3.x)
* **Config:** `dotenv`
* **Versionado:** `semver`

> Extras recomendados (opcionales, no obligatorios): `helmet`, `morgan`, `pino`, `zod` para tipos.

---

## Arquitectura del proyecto

* **API versionada** bajo `/api/v1`.
* **Capas**: `routes` → `controllers` → `services` → `models` (acceso a DB) → `utils`.
* **Middlewares**: auth (JWT), validaciones, rate limiting, manejo de errores.
* **Swagger** con definición OpenAPI generada a partir de objetos estáticos en `src/docs`.

---

## Instalación y ejecución

```bash
# 1) Clonar
git clone <repo-backend> karenflix-backend
cd karenflix-backend

# 2) Instalar deps
npm install

# 3) Configurar entorno
cp .env.example .env
# editar .env con tus valores (ver sección Variables de entorno)

# 4) Levantar en dev
npm run dev

# 5) Producción (ejemplo)
npm run build && npm start
```

> MongoDB debe correr con **replica set** aunque sea local (p.ej., `rs.initiate()` en mongosh) para habilitar transacciones.

---


## Seguridad y buenas prácticas

* **Hash de contraseñas** con `bcrypt` y `BCRYPT_SALT_ROUNDS` ≥ 10.
* **JWT** con expiración corta y rotación (refrescos opcionales vía endpoint dedicado si se desea).
* **Passport-JWT** como middleware de autenticación.
* **Rate limiting** por IP + rutas sensibles.
* **CORS** restringido a orígenes del frontend.
* **Validaciones** exhaustivas con `express-validator`.
* **Manejo centralizado de errores** con códigos HTTP correctos.

---

## Autenticación y autorización

* **Registro/Login**: entrega de `accessToken` (JWT). El payload incluye `sub` (userId), `role` y metadatos mínimos.
* **Roles**:

  * `user`: CRUD de **sus** reseñas, votar reseñas ajenas, leer listados.
  * `admin`: CRUD de categorías y aprobación de títulos; puede gestionar roles bajo endpoints admin.
* **Guard**: middleware `requireAuth` y `requireRole('admin')` según ruta.

---

## Validaciones y manejo de errores

* `express-validator` en cada endpoint: sanitización, `isString`, `isFloat({min:1,max:5})` con step 0.1, URLs, etc.
* Errores se devuelven como JSON con forma:

```json
{
  "ok": false,
  "message": "Validation error",
  "errors": [{"field":"title","msg":"Title is required"}]
}
```

---

## Rate limiting y CORS

* `express-rate-limit` global y reglas específicas para `/auth/*`.
* `CORS` habilitado solo para el dominio del frontend configurado en `.env`.

---

## Modelado de datos: colecciones y estructuras

### Entidades principales

* **users**: credenciales, perfil y rol.
* **categories**: catálogo controlado por admin.
* **titles**: películas/series/anime. Deben ser **aprobados** por admin; evita duplicados de título + año + categoría.
* **reviews**: reseñas de usuarios con rating (1.0–5.0, step 0.1), comentario, fecha.
* **review_votes**: likes/dislikes (+1/-1) sobre reseñas, 1 voto por (user, review).
* **aggregates** (opcional): caché de métricas por título para lecturas rápidas (puede estar embebido en `titles`).

### Normalización: formas normales y proceso

> Aunque **MongoDB es documental**, diseñamos primero un **modelo relacional normalizado** para evitar redundancias y asegurar consistencia; luego lo mapeamos a documentos con referencias/embebidos donde conviene.

**1FN (Primera Forma Normal)**

* Cada atributo es atómico (sin arrays de valores mixtos). Ej.: rating es `Number` con un solo valor por reseña.

**2FN (Segunda Forma Normal)**

* Sin dependencias parciales en claves compuestas. Ej.: en `reviews`, la clave es `_id`; los campos dependen solo de `_id`. Los datos del usuario/categoría no viven aquí.

**3FN (Tercera Forma Normal)**

* Sin dependencias transitivas. Ej.: el `role` del usuario permanece en `users`, no en `reviews` ni en `titles`.

**BCNF (opcional)**

* Restricción adicional: todo determinante es clave. Evitamos que `title` determine `category` indirectamente: se usa `categoryId` explícito para romper cualquier dependencia ambigua.

**Proceso aplicado**

1. Identificamos entidades (`User`, `Category`, `Title`, `Review`, `ReviewVote`).
2. Definimos claves y dependencias (p.ej., un `Review` depende de `(userId, titleId)` para unicidad soft si se limita a 1 reseña por usuario y título; opcional).
3. Normalizamos a 3FN.
4. **Mapeo a MongoDB**:

   * Referencias entre colecciones con `ObjectId` (`userId`, `titleId`, `categoryId`, `reviewId`).
   * **Embebidos** solo para agregados no canónicos (cachés) como `stats` en `titles`.
   * Transacciones para mantener consistencia entre colecciones relacionadas.

> Resultado: datos canónicos sin duplicaciones peligrosas; lecturas rápidas gracias a índices y, cuando conviene, agregados calculados.

### Esquemas JSON por colección

> *Nota:* "Esquema" aquí describe la **forma esperada**; la validación ocurre en la capa de servicio + validadores. Tipos Mongo indicados entre <>.

**users**

```json
{
  "_id": "<ObjectId>",
  "email": "string",
  "passwordHash": "string",
  "displayName": "string",
  "role": "user|admin",
  "createdAt": "<Date>",
  "updatedAt": "<Date>",
  "isActive": true
}
```

Índices sugeridos:

* `unique` en `email`.
* `role` (filtro rápido en vistas admin).

**categories**

```json
{
  "_id": "<ObjectId>",
  "name": "string",           
  "slug": "string",           
  "description": "string",
  "createdAt": "<Date>",
  "updatedAt": "<Date>"
}
```

Índices:

* `unique` en `slug` y `name`.

**titles** (películas/series/anime)

```json
{
  "_id": "<ObjectId>",
  "kind": "movie|series|anime",
  "title": "string",
  "year": 2024,
  "synopsis": "string",
  "imageUrl": "string|null",
  "categoryId": "<ObjectId>",
  "submittedBy": "<ObjectId>",
  "approvedBy": "<ObjectId|null>",
  "approvedAt": "<Date|null>",
  "isApproved": true,
  "createdAt": "<Date>",
  "updatedAt": "<Date>",
  "stats": {                    
    "reviewsCount": 0,
    "ratingSum": 0.0,          
    "avgRating": 0.0,          
    "votesUp": 0,              
    "votesDown": 0,            
    "wilsonScore": 0.0,        
    "recencyBoost": 0.0,       
    "rankingScore": 0.0        
  }
}
```

Restricción de unicidad sugerida (compuesta): `(normalized(title), year, categoryId)`.

**reviews**

```json
{
  "_id": "<ObjectId>",
  "titleId": "<ObjectId>",
  "userId": "<ObjectId>",
  "headline": "string",
  "comment": "string",
  "rating": 4.2,                
  "createdAt": "<Date>",
  "updatedAt": "<Date>"
}
```

Índices:

* `titleId` (listado por título).
* Compuesto `userId + titleId` si se limita a una reseña por usuario por título (único opcional).

**review_votes**

```json
{
  "_id": "<ObjectId>",
  "reviewId": "<ObjectId>",
  "userId": "<ObjectId>",
  "value": 1,                   
  "createdAt": "<Date>",
  "updatedAt": "<Date>"
}
```

Índices:

* Único compuesto `(reviewId, userId)` para evitar votos duplicados.
* Secundarios: `reviewId`, `userId`.

### Índices y performance

* **Búsquedas de títulos**: índice compuesto `{ isApproved: 1, 'stats.rankingScore': -1 }` y `{ categoryId: 1, 'stats.rankingScore': -1 }`.
* **Validación de duplicados**: índice único `{ normalizedTitle: 1, year: 1, categoryId: 1 }` (usar un campo derivado `normalizedTitle`).
* **Referencias frecuentes**: `reviews.titleId`, `reviews.userId`, `review_votes.reviewId`.

### Transacciones: casos críticos

Usar `withTransaction` para:

1. **Crear reseña** → insertar en `reviews` y actualizar agregados en `titles.stats` (`reviewsCount`, `ratingSum`, `avgRating`).
2. **Votar reseña** → upsert en `review_votes` y actualizar `titles.stats.votesUp/Down` + `wilsonScore`.

*Árbitro de consistencia:* si falla algún paso, se hace **abort** y no se dejan estados intermedios.

**Ejemplo (pseudocódigo Node)**

```js
const session = client.startSession();
await session.withTransaction(async () => {
  const review = await db.collection('reviews').insertOne({...}, { session });
  await db.collection('titles').updateOne(
    { _id: titleId },
    { $inc: { 'stats.reviewsCount': 1, 'stats.ratingSum': rating },
      $set: { 'stats.avgRating': { $divide: ['$stats.ratingSum', '$stats.reviewsCount'] } } },
    { session }
  );
});
```

> En producción, calcular `avgRating` correctamente con una **read-modify-write** o un pipeline de agregación con `$set` + operadores, o recalcular por agregación tras la inserción.

### Cálculo de ranking ponderado

Objetivo: evitar sesgos por pocas reseñas, premiar calidad y frescura.

**Componentes**

* **WR (Weighted Rating)** con ajuste bayesiano (IMDb-like):

  * `R` = `avgRating` del título (1–5).
  * `v` = `reviewsCount` del título.
  * `m` = mínimo reseñas para “confiar” (p.ej., 5).
  * `C` = rating global del sistema (p.ej., 3.0).
  * `WR = (v/(v+m)) * R + (m/(v+m)) * C`.
* **Confianza en votos** (likes/dislikes) con **Wilson score lower bound** para la proporción positiva.
* **Recencia** con decaimiento exponencial (half-life p.ej. 180 días) calculado sobre la **mediana** de fechas de reseñas del título.

**Fórmula sugerida**

```
rankingScore = 0.7 * normalize(WR, 1, 5)
             + 0.2 * wilsonScore
             + 0.1 * recencyBoost
```

**Actualización**

* Recalcular `stats` en cada inserción/edición/eliminación de reseña o voto.
* Endpoint de **rebuild** admin opcional para recomputar rankings por lotes (pipeline de agregación).

---

## API: rutas principales

### Convenciones y versionado (semver + /api/v1)

* **Semver** del proyecto (p.ej., `1.0.0`) en `package.json` y expuesto en `/health`.
* **Ruta base**: `/api/v1`.

### Ejemplos de endpoints (cURL)

> La **documentación completa** está en Swagger. Aquí algunos ejemplos.

**Auth**

```bash
# Registro
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@a.com","password":"Secret123","displayName":"A"}'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@a.com","password":"Secret123"}'

# Perfil
curl http://localhost:4000/api/v1/auth/me -H 'Authorization: Bearer <TOKEN>'
```

**Categorías (admin)**

```bash
# Crear
curl -X POST http://localhost:4000/api/v1/categories \
  -H 'Authorization: Bearer <ADMIN_TOKEN>' -H 'Content-Type: application/json' \
  -d '{"name":"Anime","slug":"anime","description":"Animación japonesa"}'
```

**Títulos**

```bash
# Proponer título (user)
curl -X POST http://localhost:4000/api/v1/titles \
  -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' \
  -d '{"kind":"anime","title":"Cowboy Bebop","year":1998,"categoryId":"<id>","synopsis":"..."}'

# Aprobar (admin)
curl -X PATCH http://localhost:4000/api/v1/titles/<id>/approve \
  -H 'Authorization: Bearer <ADMIN_TOKEN>'

# Listado por ranking
towncurl http://localhost:4000/api/v1/titles?sort=ranking&order=desc&category=anime
```

**Reseñas & votos**

```bash
# Crear reseña
curl -X POST http://localhost:4000/api/v1/titles/<titleId>/reviews \
  -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' \
  -d '{"headline":"Imperdible","comment":"Wow","rating":4.6}'

# Like a reseña
curl -X POST http://localhost:4000/api/v1/reviews/<reviewId>/vote \
  -H 'Authorization: Bearer <TOKEN>' -H 'Content-Type: application/json' \
  -d '{"value":1}'
```

**Health & meta**

```bash
curl http://localhost:4000/api/v1/health   # incluye versión APP_VERSION
```

### Swagger UI

* Disponible en: `GET ${SWAGGER_BASE_PATH}` (por defecto `/api-docs`).
* Definición OpenAPI en `src/docs/openapi.json` o generada en `src/docs/build.ts`.

---

## Estructura de carpetas

```
src/
  app.ts                 # instancia de Express, middlewares base
  server.ts              # http server bootstrap
  config/
    env.ts               # carga dotenv + validación
    db.ts                # Mongo client, conexión y helpers de sesión
  routes/
    index.ts             # monta /api/v1
    auth.routes.ts
    categories.routes.ts
    titles.routes.ts
    reviews.routes.ts
    admin.routes.ts      # aprobaciones, recomputes
  controllers/
    auth.controller.ts
    categories.controller.ts
    titles.controller.ts
    reviews.controller.ts
  services/
    auth.service.ts
    categories.service.ts
    titles.service.ts
    reviews.service.ts
    ranking.service.ts   # WR, wilson, recency
  models/
    users.model.ts       # operaciones con driver mongodb
    categories.model.ts
    titles.model.ts
    reviews.model.ts
    reviewVotes.model.ts
  middlewares/
    auth.middleware.ts   # passport-jwt
    validate.middleware.ts
    error.middleware.ts
    rateLimit.middleware.ts
  utils/
    crypto.ts            # bcrypt helpers
    text.ts              # normalización de títulos
    dates.ts             # recency/half-life
    http.ts
  docs/
    openapi.json
    swagger.ts
  tests/
    ...
```

---

## Scripts de NPM

```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc -p .",
    "start": "node dist/server.js",
    "lint": "eslint .",
    "test": "jest",
    "swagger": "node src/docs/build.js"
  }
}
```

---

## Checklist de requisitos

* [x] **Node.js + Express** puro, arquitectura modular.
* [x] **dotenv**, **express**, **express-rate-limit**, **express-validator**, **mongodb**, **semver**, **swagger-ui-express**, **passport-jwt**, **jsonwebtoken**, **bcrypt**.
* [x] **Autenticación JWT** + roles (`user`, `admin`).
* [x] **CRUD** de categorías (admin) y títulos (con **aprobación** admin).
* [x] **Validación de duplicados** de títulos por `(title, year, category)`.
* [x] **Reseñas** (1.0–5.0, step 0.1), **likes/dislikes** (no a propias).
* [x] **Ranking ponderado** (WR + Wilson + recencia).
* [x] **Transacciones MongoDB** en reseñas y votos.
* [x] **Swagger UI** y README.
* [x] **API versionada** (`/api/v1`, **semver** en `package.json`).
* [x] **CORS** configurado + **Rate limiting**.

---

## Contribución y flujo SCRUM

* **Roles**: Product Owner, Scrum Master, Devs.
* **Sprints**: ≥ 2. Cada sprint con historias de usuario, criterios de aceptación y evidencias (capturas, PRs).
* **Seguimiento**: GitHub Projects / Trello / ClickUp.
* **Documento de planeación (PDF)**: incluir en `docs/` del backend con:

  * roles, sprints, historias, tablero, acuerdos, riesgos.
* **Video (≤ 10 min)**: explicar back, mostrar endpoints en Swagger y frontend en acción.

---

## Créditos

Equipo KarenFlix — Backend API 💜

---

### Anexos útiles

**Validadores típicos (express-validator)**

```js
import { body, param, query } from 'express-validator';

export const createTitleValidator = [
  body('kind').isIn(['movie','series','anime']),
  body('title').isString().trim().notEmpty(),
  body('year').isInt({ min: 1900, max: 2100 }),
  body('categoryId').isMongoId(),
  body('synopsis').optional().isString().isLength({ max: 1000 }),
  body('imageUrl').optional().isURL()
];

export const createReviewValidator = [
  param('titleId').isMongoId(),
  body('headline').isString().trim().notEmpty(),
  body('comment').isString().trim().notEmpty(),
  body('rating').isFloat({ min: 1.0, max: 5.0 }),
  body('rating').custom(v => Math.abs(v * 10 - Math.round(v * 10)) < 1e-9) // step 0.1
];
```

**Passport-JWT (extract + strategy)**

```js
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';

passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
  issuer: process.env.JWT_ISS,
  audience: process.env.JWT_AUD
}, async (payload, done) => {
  try {
    const user = await db.collection('users').findOne({ _id: new ObjectId(payload.sub), isActive: true });
    if (!user) return done(null, false);
    return done(null, { id: user._id, role: user.role, email: user.email });
  } catch (e) { return done(e, false); }
}));
```

**Rate limit (global + auth)**

```js
import rateLimit from 'express-rate-limit';

export const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX || 100)
});

export const authLimiter = rateLimit({ windowMs: 15*60*1000, max: 20 });
```

**Errores centralizados**

```js
export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  const details = err.details || undefined;
  res.status(status).json({ ok: false, message, details });
}
```

**Agregación: recompute ranking (ejemplo)**

```js
// pipeline simplificado para un título
[
  { $match: { _id: titleId } },
  { $lookup: { from: 'reviews', localField: '_id', foreignField: 'titleId', as: 'reviews' } },
  { $set: {
      'stats.reviewsCount': { $size: '$reviews' },
      'stats.avgRating': { $cond: [ { $gt: [{ $size: '$reviews' }, 0] }, { $avg: '$reviews.rating' }, 0 ] }
    }
  },
  // calcular votesUp/Down desde review_votes...
]
```
