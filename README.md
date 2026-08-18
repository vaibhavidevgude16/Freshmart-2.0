# FreshMart Supermarket

FreshMart is a grocery ordering project with a customer storefront, checkout flow, order tracking, and an admin panel. The project keeps the simple current interface, while using a Node/Supabase Postgres backend for live customer orders.

## Main Features

- Customer storefront with categories, search, product details, wishlist, cart, checkout, profile, and order tracking.
- Admin panel for products, categories, inventory, orders, customers, reports, backups, and image uploads.
- Backend customer registration/login, product API, order creation, order history, and admin order status updates.
- Delivery options, payment options, optional UPI QR display, and order payment status.

## Project Structure

```text
market/
  admin/              Admin HTML pages
  assets/             Product, category, and payment images
  css/                Static storefront/admin styles
  js/                 Static storefront/admin scripts
  public/             Backend-connected customer storefront
  server.js           Express + Supabase/Postgres backend
```

## Data Storage

Backend database:

```text
Supabase Postgres
```

The backend uses Postgres through the `pg` driver. Set your Supabase connection string with:

```text
DATABASE_URL=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres
PGSSLMODE=require
```

Backend database stores:

- Products
- Customer accounts
- Admin account
- Orders
- Delivery method and delivery charge
- Payment method and payment status

Browser `localStorage` still stores/caches data for the static storefront and admin experience:

- Static product/category demo data
- Customer/admin browser sessions
- Cart and wishlist
- Static admin edits/backups

For deployment, the backend-connected `public/` storefront is the better production path because it talks to the API and Supabase database.

## Local Setup

Install dependencies:

```bash
pnpm install
```

Create a local environment file:

```bash
copy .env.example .env
```

Update `.env` with your own values, especially:

```text
DATABASE_URL=your-supabase-postgres-url
JWT_SECRET=your-long-random-secret
ADMIN_PASSWORD=your-admin-password
```

Start the backend:

```bash
pnpm start
```

Open:

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/api/health
```

## Admin Login

Default local admin credentials are created from environment variables:

```text
ADMIN_EMAIL=admin@freshmart.com
ADMIN_PASSWORD=change-this-admin-password
```

If you do not set them, local development falls back to:

```text
admin@freshmart.com / admin123
```

Change these before deployment.

## Useful Commands

```bash
pnpm start
pnpm dev
pnpm check
```

`pnpm check` runs JavaScript syntax checks for the backend and main frontend scripts.

## Viewing Database Data

After running the server, open Supabase **Table Editor** or **SQL Editor** to view data:

```sql
SELECT * FROM products;
SELECT * FROM customers;
SELECT * FROM orders;
```

## Deployment Checklist

- Run `pnpm install`.
- Set `NODE_ENV=production`.
- Set `DATABASE_URL` to your Supabase Postgres connection string.
- Set a strong `JWT_SECRET`.
- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Confirm `/api/health` returns `ok: true`.
- Commit and push the latest changes.

## Render Deployment

This repo includes `market/render.yaml` for Render Blueprint deployment.

1. Open Render and choose **New Blueprint**.
2. Connect `https://github.com/vedant1502/fresh-mart.git`.
3. Use blueprint path `market/render.yaml`.
4. Paste your Supabase Postgres connection string into `DATABASE_URL`.
5. Enter a strong `ADMIN_PASSWORD` when Render prompts for it.
6. Deploy the service and open `/api/health` after it finishes.

The blueprint uses Render's free web service plan and Supabase for database storage, so it does not need a paid Render disk.

Payment UI is designed to look realistic, but it is not connected to a real payment gateway yet.
