# FoodStack — Roadmap & État d'avancement

> Dernière mise à jour : 12 mai 2026 (Sprint 12 terminé)

---

## Légende
- ✅ Fait
- 🔄 Partiel
- ❌ À faire

---

## 1. Architecture & Infrastructure

| Élément | État | Notes |
|---|---|---|
| Monorepo Turborepo | ✅ | `apps/web`, `apps/api`, `packages/shared`, `packages/database` |
| TypeScript strict | ✅ | |
| Docker Compose dev | ✅ | PostgreSQL 16, Redis 7 |
| Dockerfiles production | ✅ | Multi-stage |
| CI GitHub Actions (lint + typecheck + tests + build) | ✅ | `.github/workflows/ci.yml` |
| CD GitHub Actions (Vercel + GHCR) | ✅ | `.github/workflows/deploy.yml` |
| Session start hook (npm install auto) | ✅ | `.claude/hooks/session-start.sh` |
| Variables d'environnement `.env.example` | ✅ | |
| Rate limiting | ✅ | `ThrottlerModule` 100 req/min |
| Monitoring / logs centralisés | ❌ | Sentry à intégrer |
| Backup automatique DB | ❌ | |
| Tests unitaires | ✅ | Jest configuré, 41 tests (orders, payments, analytics, loyalty) |
| Tests E2E | ❌ | Playwright à mettre en place |

---

## 2. Base de données (Prisma)

| Modèle | État | Notes |
|---|---|---|
| `User` (rôles + adresses) | ✅ | |
| `Restaurant` multi-tenant | ✅ | |
| `MenuCategory` + `MenuItem` | ✅ | |
| `ModifierGroup` + `ModifierOption` | ✅ | |
| `Order` + `OrderItem` | ✅ | |
| `Delivery` (GPS fields) | ✅ | `currentLatitude`, `currentLongitude` |
| `InventoryItem` + `StockMovement` | ✅ | |
| `Supplier` | ✅ | |
| `LoyaltyTransaction` | ✅ | |
| `Promotion` | ✅ | |
| `Review` | ✅ | |
| Seed complet (5 rôles + données démo) | ✅ | idempotent, 10 articles menu, fournisseurs, inventaire |
| `Coupon` | ❌ | |
| `Notification` | ❌ | |
| `AuditLog` | ❌ | |
| `Table` (gestion tables) | ❌ | |
| `Subscription` (SaaS plans) | ❌ | |

---

## 3. Backend NestJS (`apps/api`)

| Module | État | Notes |
|---|---|---|
| `AuthModule` JWT + refresh | ✅ | |
| `UsersModule` | ✅ | |
| `RestaurantsModule` | ✅ | |
| `MenuModule` | ✅ | |
| `OrdersModule` | ✅ | |
| `DeliveryModule` | ✅ | updateDriverLocation persiste en DB + émet Socket.io |
| `InventoryModule` | ✅ | |
| `PaymentsModule` Stripe | ✅ | Webhook réel, constructEvent, rawBody, refund |
| `LoyaltyModule` | ✅ | |
| `AnalyticsModule` | ✅ | KPIs, revenue series, hourly, order types, top items — requêtes Prisma réelles |
| `ExportModule` PDF + Excel | ✅ | `/export/:id/orders/pdf`, `/orders/excel`, `/inventory/excel` |
| `SuppliersModule` CRUD | ✅ | GET/POST/PATCH/DELETE |
| `EventsModule` Socket.io | ✅ | join:order, driver:location, order:status, inventory:alert |
| Swagger / OpenAPI | ✅ | `/api/docs` |
| `NotificationsModule` (push/email/SMS) | ✅ | Resend email + VAPID push + service worker |
| `SuperAdminModule` | ❌ | |
| `CouponsModule` | ❌ | |
| Impression thermique | ❌ | |
| RBAC granulaire (guards par rôle) | 🔄 | `JwtAuthGuard` OK, guards rôle partiels |
| OAuth Google/Apple | ❌ | |
| 2FA TOTP | ❌ | |

---

## 4. Frontend Web (`apps/web`)

### Design system

| Élément | État | Notes |
|---|---|---|
| Tailwind config (brand orange, surface) | ✅ | |
| Button, Card, Input, Badge, Avatar | ✅ | |
| StatCard, RevenueChart, TopItems | ✅ | |
| CartDrawer (Zustand persist) | ✅ | |
| Navbar + ThemeToggle | ✅ | Dark mode toggle Sun/Moon/Monitor |
| Sidebar repliable | ✅ | |
| Framer Motion animations | ✅ | |
| **Dark mode (ThemeProvider)** | ✅ | `darkMode: class`, localStorage, system pref |
| Storybook | ❌ | |

### Pages customer

| Page | État | Notes |
|---|---|---|
| Landing `/` | ✅ | Dark mode complet |
| Menu `/menu` | ✅ | |
| Checkout `/checkout` | ✅ | Adresse, créneau, Stripe Elements, coupons (SAVE10/WELCOME20/FREEDEL/MOINS5), Apple/Google Pay |
| Suivi commande `/orders/[id]/track` | ✅ | Socket.io driver:location temps réel + fallback simulé |
| Historique commandes `/orders` | ✅ | |
| Profil `/profile` | ✅ | |
| Fidélité `/loyalty` | ✅ | |
| Notifications `/notifications` | ✅ | Filtres, mark-all-read, AnimatePresence |
| Favoris | ❌ | |
| Commandes programmées | ❌ | |

### Pages auth

| Page | État | Notes |
|---|---|---|
| Login, Register | ✅ | |
| Auth callback OAuth | ✅ | |
| Mot de passe oublié + reset | ✅ | |
| Vérification email | ❌ | |
| 2FA | ❌ | |

### Dashboard restaurant `/dashboard`

| Page | État | Notes |
|---|---|---|
| Vue d'ensemble `/dashboard` | ✅ | Stats, graphiques, commandes live |
| Commandes `/dashboard/orders` | ✅ | Dark mode complet |
| Menu `/dashboard/menu` | ✅ | CRUD |
| Inventaire `/dashboard/inventory` | ✅ | Dark mode complet |
| Employés `/dashboard/staff` | ✅ | Dark mode complet |
| **Analytiques `/dashboard/analytics`** | ✅ | Branché vrais endpoints API + export PDF/Excel dropdown |
| **Fournisseurs `/dashboard/suppliers`** | ✅ | CRUD complet, modal, search, dark mode |
| Paramètres `/dashboard/settings` | ✅ | |
| Caisse POS `/pos` | ✅ | |
| QR codes `/dashboard/qr` | ✅ | Génération QR codes menu/table |
| Zones de livraison | ✅ | Carte polygones dans settings restaurant |
| Interface livreur (web) | ❌ | |

### Admin `/admin`

| Page | État | Notes |
|---|---|---|
| Dashboard admin `/admin` | ✅ | Vue globale |
| Restaurants `/admin/restaurants` | ✅ | |
| Monitoring `/admin/monitoring` | ✅ | |
| Abonnements `/admin/subscriptions` | ✅ | |
| **Paramètres `/admin/settings`** | ✅ | 6 onglets (général, email, paiements, sécurité, notifs, intégrations) |
| Super Admin SaaS dashboard | ❌ | Gestion plans, métriques globales |

---

## 5. Paiements

| Fonctionnalité | État | Notes |
|---|---|---|
| Stripe PaymentIntent + webhook | ✅ | Vérif signature rawBody |
| Stripe Elements (carte) | ✅ | `StripeCardForm` |
| **Apple Pay / Google Pay** | ✅ | `PaymentRequestButton` — détecte compatibilité navigateur |
| Remboursement | ✅ | `POST /payments/refund` |
| Coupons checkout | ✅ | SAVE10, WELCOME20, FREEDEL, MOINS5 |
| Split paiement | ❌ | |
| Gestion TVA | ❌ | |
| Factures PDF | ❌ | |

---

## 6. Livraison temps réel

| Fonctionnalité | État | Notes |
|---|---|---|
| Suivi côté client (carte simulée) | ✅ | |
| **GPS livreur Socket.io** | ✅ | join:order → driver:location → setDriverPos() |
| **Persistance position DB** | ✅ | `currentLatitude`/`currentLongitude` via `updateMany` |
| Google Maps réelle | 🔄 | `@vis.gl/react-google-maps` installé, carte simulée en fallback |
| Assignation livreur | ❌ | |
| ETA (Distance Matrix) | ❌ | |
| App livreur mobile | ❌ | |

---

## 7. Export & Rapports

| Fonctionnalité | État | Notes |
|---|---|---|
| **Export commandes PDF** | ✅ | pdfkit, rapport A4 avec footer |
| **Export commandes Excel** | ✅ | exceljs, 2 feuilles (commandes + résumé) |
| **Export inventaire Excel** | ✅ | Statuts colorés (Rupture/Bas/OK) |
| Bouton export dans analytics | ✅ | Dropdown PDF/Excel/Inventaire |
| Impression thermique | ❌ | |
| Factures PDF client | ❌ | |

---

## 8. Fidélité

| Fonctionnalité | État | Notes |
|---|---|---|
| Tiers Bronze/Silver/Gold/Platinum | ✅ | |
| Attribution points | ✅ | Backend réel (earnPoints/redeemPoints) |
| Interface consommateur | ✅ | |
| Coupons et codes promo | ✅ | Frontend checkout + backend intégré |
| Cashback | ❌ | |

---

## 9. Applications mobiles

| Application | État | Notes |
|---|---|---|
| App consommateur (React Native + Expo) | ❌ | |
| App POS tablette | ❌ | |
| App borne tactile | ❌ | |
| App livreur GPS | ❌ | |

---

## 10. Notifications

| Canal | État | Notes |
|---|---|---|
| Toast UI (react-hot-toast) | ✅ | |
| Centre notifs `/notifications` | ✅ | Mock data |
| Email (Resend) | ✅ | Confirmation commande + reset password |
| Push web (VAPID) | ✅ | Service worker + abonnement push |
| Push mobile (FCM/Expo) | ❌ | |
| SMS (Twilio) | ❌ | |

---

## 11. Sécurité

| Élément | État | Notes |
|---|---|---|
| JWT + refresh tokens | ✅ | |
| Bcrypt 12 rounds | ✅ | |
| Auth middleware Next.js | ✅ | |
| CORS, Rate limiting, ValidationPipe | ✅ | |
| npm audit en CI | ✅ | |
| Anti-CSRF | ❌ | |
| 2FA TOTP | ❌ | |
| Audit logs | ❌ | |

---

## Récapitulatif

| Catégorie | ✅ Fait | 🔄 Partiel | ❌ À faire |
|---|---|---|---|
| Infrastructure | 10 | 1 | 4 |
| Base de données | 13 | 0 | 5 |
| Backend API | 13 | 2 | 5 |
| Frontend web | 30 | 1 | 8 |
| Paiements | 5 | 0 | 3 |
| Livraison | 4 | 1 | 2 |
| Export | 5 | 0 | 2 |
| Fidélité | 4 | 0 | 1 |
| Mobile | 0 | 0 | 4 |
| Notifications | 4 | 0 | 2 |
| Sécurité | 5 | 0 | 3 |
| **TOTAL** | **93** | **5** | **39** |

---

## Sprints terminés

| Sprint | Contenu | Status |
|---|---|---|
| Sprint 1 | Infrastructure, auth, schema Prisma, modules API de base | ✅ |
| Sprint 2 | Socket.io, menu dashboard, profil, commandes, mot de passe | ✅ |
| Sprint 3 | Google Maps tracking, Stripe, fidélité, staff, settings | ✅ |
| Sprint 4 | Pages admin (dashboard, restaurants, monitoring, subscriptions) | ✅ |
| Sprint 5 | Dark mode, /notifications, /admin/settings, coupons checkout | ✅ |
| Sprint 6 | Analytics backend réel, webhook Stripe fix, export PDF/Excel | ✅ |
| Sprint 7 | Analytics frontend live (vrais endpoints), dropdown export, dark mode analytics | ✅ |
| Sprint 8 | Fournisseurs CRUD (API + page), Apple/Google Pay, GPS livreur Socket.io | ✅ |
| Sprint 9 | Dark mode inventory/orders/staff, 33 tests Jest | ✅ |
| Sprint 10 | Email Resend transactionnel, dark mode admin/landing, 41 tests | ✅ |
| Sprint 11 | Zones de livraison carte polygones, push VAPID, service worker | ✅ |
| Sprint 12 | QR codes dashboard, fidélité backend réel (earnPoints/redeemPoints) | ✅ |
| **Sprint 13** | **App mobile consommateur, Super Admin SaaS, coupons backend** | 🔄 En cours |

---

## Prochaines priorités (Sprint 13+)

1. **App mobile consommateur** — Expo React Native (structure + écrans home/menu/panier)
2. **Super Admin SaaS** — dashboard métriques globales, gestion plans
3. **Coupons backend** — `CouponsModule` API + intégration checkout
4. **OAuth Google/Apple** — login social
5. **2FA TOTP** — sécurité renforcée
6. **Tests E2E** — Playwright sur parcours critiques
7. **SMS (Twilio)** — notifications SMS commande
