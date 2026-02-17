# Better Auth Starter

![ChatGPT Image Jun 9, 2025, 07_09_10 PM](https://github.com/user-attachments/assets/660133ca-5463-4c77-9ece-37280caa229c)

## Overview

The Better Auth Starter is simple starter pack using Next.js, Better Auth, Shadcn, Drizzle, and Neon

## Getting Started

### Installation

To begin, install the required dependencies using the following command:

```bash
pnpm i
```

### Configuration

Create a copy of the provided `env.example` file and name it `.env`. Fill in the required OpenAI API Key in the newly created `.env` file, and Better Auth variables if you're going to use authentication:

`cp env.example .env`

```bash
BETTER_AUTH_SECRET="your-better-auth-secret"
BETTER_AUTH_URL="http://localhost:3000"

DATABASE_URL="your-database-url"

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

Make sure to replace placeholder values with your actual API keys, and keep them safe!

## Docker (recommended)

This repo can run fully in Docker (app + Postgres) using `docker compose`.

1) Create your `.env`:

```bash
cp env.example .env
```

2) Set at least:

- `BETTER_AUTH_SECRET`

Optional (recommended for first-time setup):

- `SUPER_ADMIN_EMAIL` (auto-promotes this user to `super_admin` in the active organization after login)

3) Start everything:

```bash
docker compose up --build
```

4) Initialize the database tables (first run only):

```bash
docker compose exec app pnpm exec drizzle-kit push
```

Open http://localhost:3000

Notes:

- In Docker, `DATABASE_URL` is automatically overridden to use the `db` container.
- If you run Drizzle commands from your host machine, keep `DATABASE_URL` pointing to `localhost:5432` (as in `env.example`).
- Postgres is exposed on your host as `localhost:5433` to avoid clashing with an existing local Postgres on `5432`.

### Email (optional)

Email verification + password reset + organization invitation emails are enabled only when SMTP is configured in `.env`:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Also set `NEXT_PUBLIC_APP_URL="http://localhost:3000"` so links point back to your local app.

# Development Server

After installing the dependencies, and adding configuration variables run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
