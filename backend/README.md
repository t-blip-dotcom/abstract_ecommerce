# Abstract Cosmetics — Backend

Express + PostgreSQL (raw SQL, no ORM) + MongoDB (notifications only).

## Setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in real values
```

1. Run your existing schema (the CREATE TABLE / INSERT statements
   you already have, including ROLE, STAFF with `username`, BRAND,
   and `orders.processed_by`).
2. Run `db/schema-additions.sql` — adds the pickup/delivery columns
   to `orders` and a helper index.
3. Make sure a local (or hosted) MongoDB instance is reachable at
   `MONGODB_URI` — notifications live there instead of Postgres,
   since each notification type carries different extra fields
   (an order-status one has `order_id`; a stock one has
   `product_id`) and forcing that into one fixed table would mean a
   lot of unused nullable columns.
4. `npm run dev` (auto-restart on save) or `npm start`.

## Folder structure

```
backend/
  server.js              entry point — security middleware, route mounting, startup
  db/
    pool.js               PostgreSQL connection pool
    mongo.js               MongoDB connection (notifications)
    schema-additions.sql   the few extra columns/index this backend needs
  routes/                 HTTP layer: params, status codes, calling queries/
  queries/                 all the actual SQL / MongoDB calls, one file per table group
  middleware/
    auth.middleware.js       verifies the login cookie
    requireRole.middleware.js  enforces admin/manager/staff permissions
    upload.middleware.js       validates + saves photo uploads
    validate.js                turns express-validator errors into a consistent shape
    errorHandler.js            central error handling + async wrapper
  config/
    jwt.js                sign/set/clear the auth cookie consistently
    rateLimiters.js        brute-force protection for login, general API throttling
  uploads/                product/brand photos land here, served at /uploads/...
```

Routes never contain SQL, and query files never touch `req`/`res` —
that split is what makes each side easy to read and test on its own.

## Security checklist

- **SQL injection**: every query uses `$1, $2, ...` parameter
  placeholders — user input is never concatenated into SQL text.
- **Passwords**: hashed with bcrypt (cost factor from
  `BCRYPT_SALT_ROUNDS`, default 12) — plaintext passwords are never
  stored or logged.
- **Sessions**: JWT in an `httpOnly`, `sameSite=lax` cookie (and
  `secure` in production, HTTPS-only) — unreadable by page
  JavaScript, which blocks the most common way a stolen token leaks
  (XSS reading `localStorage`).
- **Brute-force protection**: `authLimiter` caps login/signup
  attempts per IP; `apiLimiter` caps general API use.
- **Role enforcement**: happens server-side in
  `requireRole.middleware.js` on every protected route — the
  frontend's nav hiding is just convenience, not the real gate.
- **File uploads**: MIME-type checked (not just file extension),
  capped at 5MB, saved under a random filename so uploads can't
  overwrite each other or be used to guess other files' names.
- **Headers**: `helmet()` sets the standard protective headers
  (clickjacking, MIME-sniffing, etc).
- **CORS**: locked to the exact frontend origin(s) in `CORS_ORIGIN`
  — not `*`.
- **Errors**: `errorHandler.js` never leaks stack traces or raw
  database errors to the client in production; it logs them
  server-side instead.

## How the trickier features work

**Stock is never oversold.** `orders.queries.js` → `createOrderFromCart`
runs the whole checkout in one transaction and takes a row lock
(`SELECT ... FOR UPDATE`) on every product being ordered before
checking stock. If two customers try to buy the last 3 units at the
same moment, the second transaction waits for the first to finish,
then sees the real (now lower) stock number — so it fails cleanly
with a list of which items are short, instead of both "succeeding"
and leaving stock negative.

**Stock level** (`in_stock` / `low_stock` / `out_of_stock`) is
computed from `stock_quantity` on every read (`products.queries.js`),
not stored — so it's always accurate. Low stock is `< 15`; out of
stock is `0`.

**Popularity ranking** (`products.queries.js` → `listProducts`) counts
how many times each `product_id` appears across every `order_items`
row ever, and sorts by that descending by default — no separate
"popularity score" to keep updated, it's computed live from real
order history.

**Notifications fire automatically**, not as a separate manual step:
placing an order, a status change (`PATCH /api/orders/:id/status`),
and an item selling out during someone else's checkout all create a
MongoDB notification for the right customer in the same request that
caused them.

**Pickup**: checkout with `fulfillment_method: "pickup"` generates a
short code (`PU-XXXXXX`) and returns a QR code (as a data URL, via
the `qrcode` package) encoding that same code. Staff look it up with
`GET /api/orders/pickup/:code` (shows the customer's name/phone to
confirm identity) and confirm collection with
`POST /api/orders/pickup/:code/collect`, which also notifies the
customer and marks the order delivered.

**Delivery** intentionally has no fixed fee — cost depends on size
and distance, which is why `orders.queries.js` doesn't calculate one.
The order is created either way; delivery cost gets sorted out with
the customer afterward, as agreed.

**Staff accounts**: no company email required. A prospective staff
member picks a username + password themselves
(`POST /api/auth/staff-request`), which creates a `STAFF` row with
`status = 'pending'`. They can't log in yet — `POST
/api/auth/staff-login` checks `status` and returns a clear error if
it's still pending. An admin approves with one click
(`PATCH /api/staff/:id/approve`), which is the only manual step
required per new hire.
