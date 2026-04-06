# RevAudit - Revenue Leakage Detection System

## Setup

1. Install dependencies: `npm install`
2. Set up database: Update DATABASE_URL in .env
3. Run Prisma migrations: `npx prisma migrate dev --name init`
4. Generate Prisma client: `npx prisma generate`
5. Start development server: `npm run dev`

## Demo Credentials

- Email: demo@revaudit.com
- Password: password123

## Features

- Dashboard with revenue leakage metrics
- Client management
- Contract and rule management
- CSV billing upload
- Audit engine with deterministic rule calculation
- Drill-down audit views
- Insights panel

## Tech Stack

- Next.js 14 (App Router)
- PostgreSQL
- Prisma ORM
- NextAuth.js
- Tailwind CSS
- TypeScript