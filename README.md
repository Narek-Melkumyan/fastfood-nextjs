# Foodly

A full-stack food ordering platform built with Next.js, TypeScript, PostgreSQL and Prisma. Customers browse restaurants and dishes, build a basket and place orders, while admins manage orders, users, restaurants, products, promotions and images from a dedicated admin panel.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-database-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)
![Cloudflare R2](https://img.shields.io/badge/Cloudflare-R2-F38020?logo=cloudflare&logoColor=white)

---

## Overview

Foodly is a food delivery web app built around a real relational data model instead of mock data. Menus, restaurants, prices, promotions and orders all live in PostgreSQL and are served through Next.js Server Components and Route Handlers.

The project covers the parts of a delivery product that are usually skipped in tutorials:

- server-side price calculation, so the client never decides what an order costs
- per-restaurant minimum order and delivery fee rules
- promo codes with limits, dates and minimum basket amounts
- short-lived access tokens with rotating, hashed refresh tokens
- email verification and password reset through Resend
- an admin panel with its own protected API
- an image pipeline that resizes uploads with Sharp and stores them privately in Cloudflare R2

The app is set up for the Armenian market: prices are stored in AMD (֏) and addresses default to Yerevan.

---

## Screenshots

> Screenshots live in `docs/screenshots/`.

### Home Page

<!-- SCREENSHOT: HOME PAGE -->
![Foodly Home Page](docs/screenshots/home.png)

### Menu / Products

<!-- SCREENSHOT: PRODUCTS PAGE -->
![Foodly Menu](docs/screenshots/menu.png)

### Product Details

<!-- SCREENSHOT: PRODUCT DETAILS -->
![Product Details](docs/screenshots/product-details.png)

### Restaurant Listing

<!-- SCREENSHOT: RESTAURANT LISTING -->
![Restaurant Listing](docs/screenshots/restaurants.png)

### Restaurant Page

<!-- SCREENSHOT: RESTAURANT PAGE -->
![Restaurant Details](docs/screenshots/restaurant-details.png)

### Basket

<!-- SCREENSHOT: BASKET -->
<!-- TODO: ADD SCREENSHOT (docs/screenshots/basket.png) - the basket currently appears in the checkout order summary below -->

### Checkout

<!-- SCREENSHOT: CHECKOUT -->
![Checkout](docs/screenshots/checkout.png)

### Order Confirmation

<!-- SCREENSHOT: ORDER CONFIRMATION -->
![Order Placed](docs/screenshots/order-confirmation.png)

---

## Main Features

### Customer Experience

- **Home page** with featured dishes loaded from the database
- **Menu page** listing all active, available products with client-side search and filtering
- **Product details page** with ingredients, allergens, restaurant info and related dishes from the same category
- **Restaurant listing** with search by name or cuisine and sorting
- **Restaurant page** with cuisines, opening hours, delivery info and the full menu
- **Persistent basket** built with Zustand and saved to `localStorage`
- **Checkout** with a live server-side quote (subtotal, delivery fee, discount, total)
- **Promo codes** validated on the server (active window, minimum order, usage limits, new-customer rules)
- **Guest checkout** or checkout while signed in (the order is linked to the account from the JWT, never from the request body)
- **Cash on delivery** payment (card payment is shown as not yet available)
- **Customer profile** with account overview, email verification status and profile navigation
- **Order history** and order detail pages
- **Saved addresses** with a default address that pre-fills checkout
- **Light / dark theme** toggle
- Responsive layout built on the Bootstrap grid with a custom design system

### Authentication & Account Security

- Registration and login with bcrypt password hashing (cost factor 12)
- 15-minute JWT access tokens (HS256, signed with `jose`) kept in memory on the client
- Refresh tokens stored in an HttpOnly cookie and saved in the database only as a peppered SHA-256 hash
- Refresh token rotation on every refresh, inside a database transaction
- "Remember me": 7-day persistent cookie, otherwise a browser-session cookie backed by a 1-day token
- Logout revokes the current refresh token
- Automatic token refresh and request retry through a shared `apiFetch` helper
- Email verification via Resend with hashed, single-use, 24-hour tokens and a resend cooldown
- Password reset via a one-time code sent by email (hashed, 15-minute expiry); a successful reset revokes all active sessions
- Role-based access (`CUSTOMER`, `PARTNER`, `ADMIN`) with admin checks against the database on every admin request

### Admin Panel

- **Dashboard** with users, orders, pending orders, active restaurants, active products, delivered revenue and recent orders
- **Orders**: list, search, filter by status, update status, view full order details
- **Users**: list, search, filter by role, create users, change roles, enable or disable accounts (with protection against an admin demoting or disabling themselves)
- **Restaurants**: create and edit restaurants, address and delivery settings, logo and cover images, activate or deactivate, open or close for orders
- **Products**: create and edit products, prices, ingredients, allergens, badges, category, restaurant, image, availability, featured and active flags
- **Promotions**: create and edit percentage, fixed-amount and free-delivery promotions with codes, dates, minimum order, max discount, usage limits, new-customer flag and a banner image (restaurant, category and product targets can be saved but are not applied at checkout yet)

### Media Management

- Admin image uploads for products, restaurant logos, restaurant covers and promotions
- File type and size validation (JPG, PNG, WebP, AVIF, up to 10 MB)
- Sharp pipeline: auto-rotate, resize to a per-type maximum size and convert to WebP
- Images stored in a private Cloudflare R2 bucket under a random UUID key
- The database stores an application URL (`/api/media/...`), not a public bucket URL
- Images are streamed back through a Next.js route that only allows known key prefixes
- Replaced images are removed from R2, and unsaved temporary uploads are cleaned up when the editor is closed

---

## Architecture

```
Browser
  │
  ▼
Next.js 16 (App Router)
  ├── Server Components ──────────────┐   public pages read data directly
  ├── Client Components                │   basket, checkout, profile, admin UI
  │     └── AuthProvider (apiFetch) ───┼── Bearer access token
  └── Route Handlers (/api/*) ─────────┤
        ├── auth, profile, orders      │
        ├── admin (role check)         │
        └── media                      │
                                       ▼
                                    Prisma 7 (pg adapter)
                                       │
                                       ▼
                                   PostgreSQL

Route Handlers ──► Resend             (verification and password reset emails)
Route Handlers ──► Sharp ──► Cloudflare R2   (admin uploads)
/api/media/*   ◄── Cloudflare R2      (private image streaming)
```

- **Public pages** (`/`, `/products`, `/products/[slug]`, `/restaurants`, `/restaurants/[slug]`) are Server Components that query Prisma and pass plain data to client components.
- **Interactive pages** (checkout, profile, admin) are Client Components that call the API through `apiFetch`.
- **Business logic** that matters for money lives in `lib/checkout.ts` and is shared by the quote endpoint and the order endpoint.
- **Server-only helpers** live in `lib/` (auth, admin auth, Prisma client, R2 client, image processing, email verification, password reset).

---

## Authentication Flow

```
Login / Register
  └─► server verifies credentials (bcrypt)
  └─► creates refresh token (random 64 bytes)
        ├─ SHA-256(token + pepper) saved in RefreshToken table
        └─ raw token sent as HttpOnly cookie (food_refresh_token)
  └─► returns a 15-minute access token (JWT) in the response body

App load
  └─► AuthProvider calls POST /api/auth/refresh
        ├─ looks up the hashed token, checks revoked / expired / user active
        ├─ revokes the old token and creates a new one in one transaction
        └─ returns a new access token + user

API request
  └─► apiFetch adds "Authorization: Bearer <access token>"
  └─► on 401, refreshes once (shared promise) and retries

Admin request
  └─► token verified, then the user is re-read from the database
      and must be ADMIN and active

Logout
  └─► refresh token marked revoked, cookie cleared, in-memory token dropped
```

Key details:

- The access token is never written to `localStorage` or cookies.
- The refresh cookie is `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- Password reset revokes every active refresh token for the user.
- Disabled users cannot log in or refresh their session.

---

## Email Verification

1. After registration, the server creates a random 32-byte token, stores only its SHA-256 hash with a 24-hour expiry and sends a link through Resend.
2. The link opens `/verify-email?token=...`, which posts the token to `/api/auth/email-verification/verify`.
3. The server checks the hash, expiry and usage, then sets `emailVerifiedAt` and marks the token used in a transaction.
4. Signed-in users can request a new link from their profile. Requests are limited by a 60-second cooldown and older unused tokens are replaced.

## Password Reset

1. The user enters their email on `/forgot`. In the normal flow the response does not reveal whether an account exists.
2. The server generates a one-time code, stores a peppered hash with a 15-minute expiry and emails the code through Resend.
3. The user enters the code and a new password. On success the password is re-hashed, the code is marked used and all sessions are revoked.

---

## Media Upload Architecture

```
Admin panel
  └─► POST /api/admin/media  (multipart: file + kind)
        ├─ admin check
        ├─ type + size validation
        ├─ Sharp: rotate → resize (fit inside) → WebP
        └─ PutObject to private R2 bucket
              key: products/<uuid>.webp
                   restaurants/logos/<uuid>.webp
                   restaurants/covers/<uuid>.webp
                   promotions/<uuid>.webp
  ◄── { key, url: "/api/media/<key>", width, height, size }

Admin saves the form
  └─► imageUrl = "/api/media/<key>" saved in PostgreSQL
  └─► previous R2 object deleted if the image changed

Visitor loads an image
  └─► GET /api/media/<key>
        ├─ key must match an allowed prefix (no "..")
        └─ object read from R2 and returned with long-term cache headers
```

| Image type        | Max size    | Quality |
|-------------------|-------------|---------|
| Product           | 1200 × 800  | 82      |
| Restaurant logo   | 512 × 512   | 85      |
| Restaurant cover  | 1600 × 900  | 82      |
| Promotion banner  | 1400 × 700  | 82      |

---

## Database

PostgreSQL managed with Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg`). Money is stored as integers in AMD.

| Area | Models | Notes |
|------|--------|-------|
| Users & auth | `User`, `RefreshToken`, `PasswordResetToken`, `EmailVerificationToken` | Tokens stored as unique hashes, cascade on user delete |
| Addresses | `Address` | Belongs to a user, one default per user |
| Restaurants | `Restaurant`, `RestaurantHour`, `Cuisine` | Delivery fee, minimum order, free-delivery threshold, optional owner |
| Catalog | `ProductCategory`, `Product` | Product belongs to one restaurant and one category |
| Favorites | `Favorite` | Unique per user + product |
| Promotions | `Promotion`, `PromotionRedemption` | Many-to-many with restaurants, categories and products |
| Orders | `Order`, `OrderItem` | Snapshot of names and prices at order time; optional user for guest orders |

Order items copy the product name, restaurant name and unit price so historical orders stay correct when a product changes or is removed (`onDelete: SetNull`).

The schema also contains models for reviews, wallet and loyalty, referrals, support tickets and a newsletter. They are defined in the schema but are not used by the application yet.

Migrations are in `prisma/migrations/` and a seed script (`prisma/seed.ts`) creates categories, cuisines, restaurants, products and sample promotions.

---

## Tech Stack

**Frontend**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Zustand (persisted basket)

**Backend**
- Next.js Route Handlers (Node.js runtime)
- Prisma ORM 7 with `@prisma/adapter-pg` and `pg`

**Database**
- PostgreSQL

**Authentication**
- `jose` (JWT access tokens)
- `bcryptjs` (password hashing)
- Node `crypto` (token generation and hashing)

**Storage & Media**
- Cloudflare R2 via `@aws-sdk/client-s3`
- Sharp (image resizing and WebP conversion)

**Email**
- Resend

**Styling**
- Bootstrap 5 (grid and utilities)
- Custom CSS design system with light and dark themes (`app/globals.css`)

**Tooling**
- ESLint (`eslint-config-next`)
- `tsx` for running the seed script
- `dotenv` for Prisma config and seeding

---

## Project Structure

```
fastfood-nextjs/
├── app/
│   ├── page.tsx                  # Home (server)
│   ├── products/                 # Menu + product details
│   ├── restaurants/              # Listing + restaurant page
│   ├── promotions/               # Offers page
│   ├── checkout/                 # Basket + checkout
│   ├── login/  register/  forgot/  verify-email/
│   ├── profile/                  # Overview, orders, addresses, favorites, edit
│   ├── admin/                    # Dashboard, orders, users, restaurants, products, promotions
│   ├── providers/AuthProvider.tsx
│   └── api/
│       ├── auth/                 # login, register, refresh, logout, me, password reset, email verification
│       ├── profile/              # addresses, favorites, orders
│       ├── checkout/quote/
│       ├── orders/
│       ├── media/[...key]/
│       └── admin/                # dashboard, orders, users, restaurants, products, promotions, media
├── components/                   # Page-level client components and layout
├── lib/
│   ├── auth.ts                   # JWT + refresh token helpers
│   ├── adminAuth.ts              # Admin guard
│   ├── checkout.ts               # Pricing, delivery and promo logic
│   ├── emailVerification.ts
│   ├── passwordReset.ts
│   ├── imageProcessing.ts        # Sharp settings
│   ├── media.ts                  # Media key/URL helpers
│   ├── r2.ts                     # R2 client
│   └── prisma.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── store/cartStore.ts
├── prisma.config.ts
└── package.json
```

---

## API Overview

### Auth: `/api/auth`

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account, start session, send verification email |
| POST | `/api/auth/login` | Log in and set refresh cookie |
| POST | `/api/auth/refresh` | Rotate refresh token and issue new access token |
| POST | `/api/auth/logout` | Revoke refresh token and clear cookie |
| GET | `/api/auth/me` | Current user profile |
| POST | `/api/auth/forgot-password` | Email a password reset code |
| POST | `/api/auth/reset-password` | Set a new password with the code |
| POST | `/api/auth/email-verification/send` | Send a new verification email |
| POST | `/api/auth/email-verification/verify` | Verify email with token |

### Customer: `/api/profile`, `/api/checkout`, `/api/orders`

| Method | Route | Description |
|--------|-------|-------------|
| GET / POST | `/api/profile/addresses` | List or create addresses |
| PATCH / DELETE | `/api/profile/addresses/[id]` | Update or delete an address |
| GET | `/api/profile/favorites` | List favorite products |
| DELETE | `/api/profile/favorites/[id]` | Remove a favorite |
| GET | `/api/profile/orders` | Order history |
| POST | `/api/checkout/quote` | Server-side price quote |
| POST | `/api/orders` | Place an order (guest or signed in) |

### Media: `/api/media`

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/media/[...key]` | Serve an image from private R2 storage |

### Admin: `/api/admin` (admin role required)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats and recent orders |
| GET | `/api/admin/orders` | All orders |
| GET / PATCH | `/api/admin/orders/[id]` | Order details / update status |
| GET / POST | `/api/admin/users` | List / create users |
| PATCH | `/api/admin/users/[id]` | Change role or active state |
| GET / POST | `/api/admin/restaurants` | List / create restaurants |
| PATCH | `/api/admin/restaurants/[id]` | Update restaurant |
| GET / POST | `/api/admin/products` | List / create products |
| PATCH | `/api/admin/products/[id]` | Update product |
| GET / POST | `/api/admin/promotions` | List / create promotions |
| PATCH | `/api/admin/promotions/[id]` | Update promotion |
| POST / DELETE | `/api/admin/media` | Upload or delete an image |

---

## Admin Panel

The admin panel lives at `/admin`. The UI redirects users without the `ADMIN` role, and every admin API route checks the role again on the server.

### Dashboard

Overview cards for users, orders, pending orders, active restaurants, active products and delivered revenue, plus the latest orders.

<!-- SCREENSHOT: ADMIN DASHBOARD -->
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

### Orders

Search and filter orders by status, change status and open a detailed view with customer, delivery and item information.

<!-- SCREENSHOT: ADMIN ORDERS -->
![Admin Orders](docs/screenshots/admin-orders.png)

<!-- SCREENSHOT: ADMIN ORDER DETAILS -->
![Admin Order Details](docs/screenshots/admin-order-details.png)

### Users

Search users, filter by role, create accounts, change roles and enable or disable accounts.

<!-- SCREENSHOT: ADMIN USERS -->
![Admin Users](docs/screenshots/admin-users.png)

### Restaurants

Create and edit restaurants, including name, description, address, city, delivery fee, minimum order, delivery time range, logo and cover image, and toggle whether a restaurant is active or accepting orders.

<!-- SCREENSHOT: ADMIN RESTAURANTS -->
![Admin Restaurants](docs/screenshots/admin-restaurants.png)

### Products

Create and edit dishes with price, category, restaurant, ingredients, allergens, badge and image, and toggle availability, featured and active status.

<!-- SCREENSHOT: ADMIN PRODUCTS -->
![Admin Products](docs/screenshots/admin-products.png)

### Promotions

Create percentage, fixed-amount and free-delivery promotions with codes, date ranges, minimum order, max discount, usage limits and banner images.

<!-- SCREENSHOT: ADMIN PROMOTIONS -->
![Admin Promotions](docs/screenshots/admin-promotions.png)

### Image Upload

<!-- SCREENSHOT: ADMIN IMAGE UPLOAD -->
![Admin Image Upload](docs/screenshots/media-upload.png)

---

## Customer Account

### Profile

<!-- SCREENSHOT: USER PROFILE -->
![User Profile](docs/screenshots/profile.png)

### Order History

<!-- SCREENSHOT: ORDER HISTORY -->
![Order History](docs/screenshots/orders.png)

<!-- SCREENSHOT: ORDER DETAILS -->
![Order Details](docs/screenshots/order-details.png)

### Addresses

<!-- SCREENSHOT: ADDRESSES -->
![Saved Addresses](docs/screenshots/addresses.png)

### Email Verification

<!-- SCREENSHOT: EMAIL VERIFICATION -->
![Email Verification](docs/screenshots/email-verification.png)

### Login and Password Reset

<!-- SCREENSHOT: LOGIN -->
![Login](docs/screenshots/login.png)

<!-- SCREENSHOT: PASSWORD RESET -->
![Password Reset](docs/screenshots/forgot-password.png)

---

## Security

Measures implemented in the code:

- Passwords hashed with bcrypt
- Access tokens are short-lived and kept in memory only
- Refresh tokens in an HttpOnly, SameSite=Lax cookie (Secure in production)
- Refresh, password reset and email verification tokens stored only as SHA-256 hashes (refresh and reset tokens also use a server-side pepper)
- Refresh token rotation with a transactional revoke-and-create step
- All sessions revoked after a password reset
- Admin authorization re-checked against the database on every admin request
- Resource ownership enforced on profile routes (addresses, favorites, orders are always filtered by the user ID from the token)
- Order prices, delivery fees and discounts calculated on the server from database values
- Server-side validation for auth, checkout, addresses and admin input
- Uploaded images re-encoded by Sharp with a pixel limit
- Private R2 bucket with an allow-list of media key prefixes

This is a portfolio project. It has not been through a professional security audit, and some hardening (for example rate limiting) is listed under future improvements.

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=

# Auth
JWT_ACCESS_SECRET=
REFRESH_TOKEN_PEPPER=
PASSWORD_RESET_PEPPER=

# App
APP_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=
RESET_EMAIL_FROM=

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
```

| Variable | Used for |
|----------|----------|
| `DATABASE_URL` | PostgreSQL connection (app, Prisma CLI, seed) |
| `JWT_ACCESS_SECRET` | Signing access tokens |
| `REFRESH_TOKEN_PEPPER` | Hashing refresh tokens |
| `PASSWORD_RESET_PEPPER` | Hashing password reset codes |
| `APP_URL` | Base URL used in verification email links |
| `RESEND_API_KEY` | Sending emails |
| `RESET_EMAIL_FROM` | Sender address for verification and reset emails |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Cloudflare R2 storage |

Use long random values for the secret and pepper variables, and never commit `.env`.

---

## Local Development

### Requirements

- Node.js 20+
- PostgreSQL
- A Resend account (for emails)
- A Cloudflare R2 bucket (for admin image uploads)

### Setup

```bash
# 1. Clone
git clone https://github.com/Narek-Melkumyan/fastfood-nextjs.git
cd fastfood-nextjs

# 2. Install dependencies
npm install

# 3. Configure environment
#    create .env and fill in the variables listed above

# 4. Generate the Prisma client (output: generated/prisma)
npx prisma generate

# 5. Apply migrations
npx prisma migrate dev

# 6. Seed sample data
npx prisma db seed

# 7. Start the dev server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Creating an admin

The seed does not create users. Register a normal account, then change its role to `ADMIN`, for example with Prisma Studio:

```bash
npx prisma studio
```

or with SQL:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Log in again so the new role is included in your access token.

### Scripts

| Script | Command |
|--------|---------|
| `npm run dev` | `next dev` |
| `npm run build` | `next build` |
| `npm run start` | `next start` |
| `npm run lint` | `eslint` |

---

## Database Migrations

**Development**

```bash
npx prisma migrate dev --name your_change
```

Creates a new migration from schema changes and applies it to your local database. Run `npx prisma generate` afterward if the client was not regenerated.

**Production**

```bash
npx prisma migrate deploy
```

Applies only the committed migrations. Do not run `migrate dev` or `migrate reset` against a production database.

---

## Deployment

Foodly runs as a standard Node.js Next.js application:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
npm run start
```

Things to keep in mind:

- The Prisma client is generated into `generated/prisma`, which is git-ignored, so `prisma generate` must run before `next build`.
- Set `APP_URL` to the public domain so verification links point to the right place.
- Sharp is a native dependency, so install packages on the target platform.
- Run the app behind a reverse proxy with HTTPS so the refresh cookie is sent with the `Secure` flag.

---

## Future Improvements

These are planned and **not implemented yet**:

- Card payments (Stripe)
- Applying promotion targets (restaurants, categories, products) at checkout
- Adding products and restaurants to favorites from the menu
- Profile editing and change-password endpoints
- Rate limiting on auth and email endpoints
- Promotions page driven by database promotions
- Customer reviews
- Partner (restaurant owner) dashboard
- Automated tests and CI

---

## Engineering Highlights

- **Relational data modeling**: restaurants, products, categories, promotions and orders with many-to-many promotion targeting and order item snapshots that survive product changes.
- **Refresh token authentication**: in-memory access tokens, HttpOnly refresh cookies, hashed and peppered tokens in the database, transactional rotation and session revocation on password reset.
- **Server-trusted checkout**: one shared pricing module used by both the quote and order endpoints, handling per-restaurant delivery fees, minimum orders, free-delivery thresholds and promo rules.
- **Transactional writes**: orders with items and promotion redemptions, address default switching, token rotation and email verification all run inside Prisma transactions.
- **Next.js server/client boundaries**: Server Components fetch catalog data with Prisma, Client Components handle the basket, checkout, profile and admin UI.
- **Protected admin API**: every admin route verifies the JWT and re-checks the user's role and active state in the database.
- **Image pipeline**: uploads validated, resized and converted to WebP with Sharp, stored privately in Cloudflare R2 and served through an application route.
- **Transactional email**: verification links and password reset codes sent through Resend with hashed, expiring, single-use tokens.

---

## Author

**Narek Melkumyan**

- LinkedIn: [linkedin.com/in/narek-melkumyan-60164a374](https://www.linkedin.com/in/narek-melkumyan-60164a374/)
- GitHub: [github.com/Narek-Melkumyan](https://github.com/Narek-Melkumyan)
- Repository: [github.com/Narek-Melkumyan/fastfood-nextjs](https://github.com/Narek-Melkumyan/fastfood-nextjs)

---

<p align="center">Built by Narek Melkumyan as a full-stack portfolio project.</p>