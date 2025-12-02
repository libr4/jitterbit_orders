# Orders API

## Quick Start

Get the service up and running quickly (recommended: Docker Desktop on Windows).

1. Copy the example env and edit if needed:

```bash
cp .env.example .env
```

2. Start Postgres with Docker Compose:

```bash
docker-compose up -d
```

3. Install dependencies:

```bash
npm install
```

4. Apply database migrations and generate the client:

```bash
npx prisma migrate deploy
npx prisma generate
```

5. Run tests or start the server:

```bash
# run test suite
npm test

# start in development
npm run dev
```

**Note:** the default `.env` expects Postgres at `127.0.0.1:5432`.

## Host Postgres Conflict (Windows)

If you have a local Postgres instance already running on port `5432`, the container may fail to bind that port or your app may connect to the wrong server. Two safe options:

- Stop the local Postgres service (PowerShell):

```powershell
# show which process owns port 5432
Get-Process -Id (Get-NetTCPConnection -LocalPort 5432).OwningProcess

# stop the service if it's named 'postgresql' (adjust name as needed)
Stop-Service postgresql -Force
```

- Or change the host port mapping in `docker-compose.yml` and `.env` to another port (e.g. `5433:5432`) and update `DATABASE_URL` to use `127.0.0.1:5433`.

On Bash (Git Bash / WSL):

```bash
netstat -ano | grep 5432
# then kill the PID with `kill <PID>` if appropriate
```

## API Contract

Base URL: `http://localhost:3000`

Authentication

- POST `/auth/login` (public)
	- Request JSON:

```json
{
	"username": "dev",
	"password": "dev"
}
```

	- Response 200:

```json
{ "token": "<jwt>" }
```

Orders (all endpoints require `Authorization: Bearer <token>`)

- POST `/order` — create order
	- Request (incoming format):

```json
{
	"numeroPedido": "ORD-1001",
	"valorTotal": 199.99,
	"dataCriacao": "2025-12-01T12:00:00Z",
	"items": [
		{ "idItem": "1", "quantidadeItem": 2, "valorItem": 49.99 },
		{ "idItem": "2", "quantidadeItem": 1, "valorItem": 99.99 }
	]
}
```

	- Success 201: location header `Location: /order/:orderId` and body:

```json
{
	"orderId": "ORD-1001",
	"value": 199.99,
	"creationDate": "2025-12-01T12:00:00.000Z",
	"items": [ { "productId": 1, "quantity": 2, "price": 49.99 }, { "productId": 2, "quantity": 1, "price": 99.99 } ]
}
```

	- Errors:
		- 400 `INVALID_ITEM_ID` when `idItem` is not a numeric string
		- 409 `DUPLICATE_ORDER` when order already exists

- GET `/order/:orderId` — fetch order
	- Response 200: same shape as create success
	- 404 `NOT_FOUND` if missing

- GET `/order/list?page=1&size=10` — paginated list
	- Response 200:

```json
{
	"total": 42,
	"page": 1,
	"size": 10,
	"data": [ { "orderId": "...", "value": 0, "creationDate": "...", "items": [...] } ]
}
```

- PUT `/order/:orderId` — update order
	- Accepts either the same incoming format as POST or the mapped format:

```json
{
	"orderId": "ORD-1001",
	"value": 199.99,
	"creationDate": "2025-12-01T12:00:00Z",
	"items": [ { "productId": 1, "quantity": 2, "price": 49.99 } ]
}
```

	- Response 200: updated order JSON
	- 400 `INVALID_ITEM_ID`, 404 `NOT_FOUND`

- DELETE `/order/:orderId` — delete order
	- Response 204 on success
	- 404 `NOT_FOUND` if not found

## Error Codes

- `INVALID_ITEM_ID` — 400 when `idItem` is not numeric
- `DUPLICATE_ORDER` — 409 on create when order exists
- `NOT_FOUND` — 404 when requested order is missing

## Libraries & Technologies

- **Node.js** (>=18) + **TypeScript**
- **Express** — HTTP server
- **Prisma** — ORM for PostgreSQL
- **PostgreSQL** — database (docker-compose)
- **Zod** — schema validation
- **jsonwebtoken** — JWT auth
- **swagger-jsdoc** + **swagger-ui-express** — API docs at `/docs`
- **Jest** + **Supertest** — tests
- **ESLint** + **Prettier** — linting & formatting

## Project Layout (high level)

- `src/` — source code
	- `src/routes/` — routes (`auth.routes.ts`, `order.routes.ts`)
	- `src/controllers/` — request handlers
	- `src/services/` — business logic / Prisma
	- `src/validators/` — Zod schemas
	- `src/tests/` — Jest + Supertest tests
- `prisma/schema.prisma` — Prisma schema (tables mapped to `"Order"` and `"Items"`)
- `docker-compose.yml` — Postgres service
- `.env.example` — sample env

## Troubleshooting & Tips

- If `npx prisma db push` fails with permission errors, ensure the DB at `DATABASE_URL` is reachable and the user has create/schema privileges. You can inspect the Postgres container logs with:

```bash
docker-compose logs db
```

- To run everything inside Docker (avoid host networking issues):

```bash
# build a node image and run tests inside a container attached to the same network
docker run --rm -v "$PWD":/app -w /app node:18 bash -c "npm ci && npx prisma generate && npm test"
```

---

If you want, I can also add an npm script that runs `compose up` + `prisma push` + `test` in sequence or add CI workflow to run the tests in GitHub Actions.


