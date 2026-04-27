# OweMyGod Web

Web frontend for OweMyGod, a group expense splitting app.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- React Hook Form + Zod

## Prerequisites

- Node.js 20+
- npm 10+
- Running API service from sibling folder `../owemygod-api`

## Environment

Create your local env file:

```bash
cp .env.example .env
```

Required variables:

- `NEXT_PUBLIC_API_URL` - API base URL including version path, for example `http://localhost:4000/api/v1`

Notes:

- `.env*` files are gitignored.
- `.env.example` is safe to commit and should contain placeholder values only.

## Run Locally

Install dependencies:

```bash
npm install
```

Start dev server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Backend Dependency

The web app expects the API to be running from `../owemygod-api`.

Quick start for API:

```bash
cd ../owemygod-api
npm install
npm run dev
```

By default API runs on port `4000` unless overridden by API env config.

## Useful Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run built app
- `npm run lint` - run ESLint
