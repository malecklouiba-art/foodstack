# FoodStack 🍔

**Unified Retail & Delivery Platform** for restaurants and retail businesses.

## Overview

FoodStack is a comprehensive, multi-channel software solution that unifies:
- **Point-of-Sale (POS)** — native tablet, kiosk, and web interfaces
- **Online ordering** — web app + kiosk PWA
- **Delivery tracking** — real-time live tracking (Uber Eats-style)
- **Inventory management** — stock levels, alerts, supplier management
- **Customer loyalty** — points, tiers, redemption
- **Admin dashboard** — analytics, reporting, multi-store management

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Zustand, Framer Motion |
| Backend | NestJS, TypeScript, Prisma, PostgreSQL, Redis |
| Payments | Stripe |
| Auth | Supabase Auth / JWT |
| Maps | Google Maps API / Mapbox |
| Infra | Docker, Vercel, GitHub Actions |

## Quick Start

```bash
# Install dependencies
npm install

# Copy env variables
cp .env.example .env.local

# Start all services (requires Docker)
docker-compose up -d

# Run development servers
npm run dev
```

## Project Structure

```
foodstack/
├── apps/
│   ├── web/          # Next.js 14 web app (customer + admin)
│   └── api/          # NestJS REST API
├── packages/
│   ├── shared/       # Shared TypeScript types
│   └── database/     # Prisma schema + migrations
├── .github/
│   └── workflows/    # CI/CD pipelines
└── docker-compose.yml
```

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@foodstack.app | Admin1234! |
| Restaurant Owner | owner@lecomptoir.fr | Owner1234! |
| Customer | client@exemple.fr | Customer1234! |

## License

MIT © 2026 FoodStack
