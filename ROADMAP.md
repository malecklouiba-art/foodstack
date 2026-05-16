# FoodStack — Roadmap & État d'avancement

> Basé sur le cahier des charges initial "Loone POS"  
> Dernière mise à jour : 14 mai 2026

---

## Légende
- ✅ Fait
- 🔄 Partiel (existant mais incomplet)
- ❌ À faire

---

## 1. Architecture & Infrastructure

| Élément | État | Notes |
|---|---|---|
| Monorepo Turborepo | ✅ | `apps/web`, `apps/api`, `packages/shared`, `packages/database` |
| TypeScript strict partout | ✅ | `tsconfig` configuré pour tous les workspaces |
| Docker Compose (dev) | ✅ | PostgreSQL 16, Redis 7, API, Web |
| Docker Compose Supabase local | ✅ | Kong, GoTrue, PostgREST, Realtime, Studio |
| Dockerfiles production multi-stage | ✅ | `apps/api` + `apps/web` |
| CI GitHub Actions (lint + typecheck + tests + build) | ✅ | `.github/workflows/ci.yml` |
| CD GitHub Actions (deploy Vercel + GHCR) | ✅ | `.github/workflows/deploy.yml` |
| Variables d'environnement `.env.example` | ✅ | Supabase, Stripe, Google Maps, JWT, Redis |
| Rate limiting | 🔄 | `ThrottlerModule` NestJS configuré, pas testé en prod |
| Monitoring / logs centralisés | ❌ | Sentry, Datadog ou équivalent à intégrer |
| Backup automatique base de données | ❌ | Script cron + S3 à créer |
| Tests unitaires | 🔄 | Jest configuré, aucun test réel écrit |
| Tests E2E | ❌ | Playwright ou Cypress à mettre en place |

---

## 2. Base de données (Prisma Schema)

| Modèle | État | Notes |
|---|---|---|
| `User` | ✅ | Avec rôles et adresses |
| `SavedAddress` | ✅ | |
| `Restaurant` | ✅ | Multi-tenant, isolation par `restaurantId` |
| `RestaurantStaff` | ✅ | Lien user ↔ restaurant avec rôle |
| `MenuCategory` | ✅ | |
| `MenuItem` | ✅ | Avec image, prix, calories, allergènes |
| `ModifierGroup` + `ModifierOption` | ✅ | Variantes (taille, options) |
| `Order` + `OrderItem` | ✅ | |
| `Delivery` | ✅ | Lié à livreur et commande |
| `InventoryItem` + `StockMovement` | ✅ | Avec fournisseur |
| `Supplier` | ✅ | |
| `LoyaltyTransaction` | ✅ | Points gagnés/dépensés |
| `Promotion` | ✅ | |
| `Review` | ✅ | |
| `Driver` (livreur dédié) | ❌ | Modèle livreur avec GPS, véhicule |
| `Coupon` | ❌ | Codes promo individuels |
| `Notification` | ❌ | Modèle pour push/email/SMS |
| `AuditLog` | ❌ | Traçabilité des actions sensibles |
| `Table` (gestion tables restaurant) | ❌ | Pour mode restaurant avec tables |
| `Subscription` (SaaS plans) | ❌ | Abonnements pour Super Admin |
| `Permission` granulaire | ❌ | RBAC avancé au niveau action |

---

## 3. Backend NestJS (`apps/api`)

| Module | État | Notes |
|---|---|---|
| `AuthModule` (JWT + refresh tokens) | ✅ | Login, register, logout |
| `UsersModule` | ✅ | CRUD utilisateurs |
| `RestaurantsModule` | ✅ | CRUD restaurants |
| `MenuModule` | ✅ | Catégories, articles, modificateurs |
| `OrdersModule` | ✅ | Création, statuts |
| `DeliveryModule` | ✅ | Gestion livraisons |
| `InventoryModule` | ✅ | Stock, mouvements, alertes |
| `PaymentsModule` (Stripe) | 🔄 | Scaffold présent, webhook Stripe non implémenté |
| `LoyaltyModule` | ✅ | Points, tiers Bronze→Platine |
| `AnalyticsModule` | 🔄 | Scaffold présent, requêtes réelles à écrire |
| Swagger / OpenAPI docs | ✅ | Accessible à `/api/docs` |
| `ThrottlerModule` (rate limiting) | ✅ | 100 req/min |
| `ValidationPipe` global + Zod | ✅ | |
| RBAC complet (guards par rôle) | 🔄 | `JwtAuthGuard` OK, guards par rôle partiels |
| OAuth Google / Apple (Passport) | ❌ | Côté web géré par Supabase, côté API non câblé |
| 2FA (TOTP) | ✅ | |
| Socket.io temps réel | ✅ | Synchronisation commandes/stocks en live |
| `NotificationsModule` (push/email/SMS) | ❌ | Resend email, VAPID push, Twilio SMS |
| `SuperAdminModule` | ❌ | Gestion abonnements SaaS, monitoring |
| `DriversModule` (GPS livreurs) | ❌ | Positions GPS temps réel |
| `CouponsModule` | ❌ | Génération, validation, quotas |
| Export PDF / Excel | ❌ | Rapports commandes, stocks, CA |
| Impression thermique (tickets) | ❌ | Intégration Star Micronics / Epson |

---

## 4. Frontend Web (`apps/web` — Next.js 14)

### Design system & composants

| Élément | État | Notes |
|---|---|---|
| Tailwind config custom (brand, surface, shadows) | ✅ | Couleurs orange `#f97316`, glassmorphism |
| Composants UI de base (Button, Card, Input, Badge, Avatar) | ✅ | |
| StatCard, RevenueChart (Recharts), TopItems | ✅ | |
| CartDrawer (Zustand persist) | ✅ | |
| Navbar (desktop) | ✅ | Blanc, responsive |
| Sidebar dashboard repliable | ✅ | |
| Framer Motion animations | ✅ | Sur menu, cart, tracking |
| Mode sombre (dark mode) | ❌ | Tailwind `dark:` classes à ajouter |
| Design system complet (Storybook) | ❌ | |

### Pages customer

| Page | État | Notes |
|---|---|---|
| Landing page (`/`) | ✅ | Hero light, features, testimonials, pricing |
| Page menu (`/menu`) | ✅ | Uber Eats style, filtres, panier flottant |
| Checkout (`/checkout`) | ✅ | Adresse, créneau, paiement multi-méthodes |
| Suivi commande (`/orders/[id]/track`) | ✅ | Carte animée, timeline, livreur |
| Historique commandes | ✅ | `/orders` — liste des commandes passées |
| Profil client | ✅ | `/profile` — infos, adresses, préférences |
| Programme fidélité | ✅ | `/loyalty` — points, niveaux, récompenses |
| Favoris / restaurants sauvegardés | ✅ | |
| Notifications | ✅ | Centre de notifications `/notifications` |
| Commandes programmées | ✅ | Tab "Programmées" dans `/orders` — annulation, modification, badge compteur |

### Pages auth

| Page | État | Notes |
|---|---|---|
| Login (`/login`) | ✅ | Light style, Supabase auth |
| Register (`/register`) | ✅ | Sélecteur rôle, indicateur mot de passe |
| Auth callback OAuth (`/auth/callback`) | ✅ | PKCE |
| Mot de passe oublié | ✅ | `/auth/forgot-password` |
| Reset mot de passe | ✅ | `/auth/reset-password` |
| Vérification email | ✅ | Page confirmation |
| 2FA setup / vérification | ✅ | `/2fa/setup` — QR code, clé manuelle, vérification TOTP |

### Dashboard restaurant (`/dashboard`)

| Page | État | Notes |
|---|---|---|
| Vue d'ensemble | ✅ | Stats, graphiques, commandes live |
| Gestion commandes (`/dashboard/orders`) | ✅ | Tableau filtrable, statuts, modal détail |
| Inventaire (`/dashboard/inventory`) | ✅ | Niveaux stock, alertes, stats |
| Caisse POS (`/pos`) | ✅ | Interface tactile, calcul monnaie, paiement |
| Gestion menus | ✅ | CRUD catégories + articles + modificateurs |
| Gestion employés | ✅ | Invitations, rôles, permissions |
| Statistiques avancées | ✅ | KPIs, CA/j, heatmap, top articles, fidélisation — export PDF/CSV/Excel |
| Gestion fournisseurs | ✅ | Contacts, commandes fournisseurs, export Excel |
| Zones de livraison | ✅ | Carte avec polygones de zone |
| Paramètres restaurant | ✅ | 7 onglets : infos, horaires, notifs, livraison, paiements, équipe, périphériques |

### Super Admin (`/admin`)

| Page | État | Notes |
|---|---|---|
| Dashboard super admin | ✅ | Vue globale tous restaurants |
| Gestion abonnements | ✅ | Plans, facturation, Stripe |
| Gestion restaurants clients | ✅ | Onboarding, suspension, metrics |
| Monitoring / logs erreurs | ✅ | CPU/RAM/latence live (3s), logs, services uptime |
| Configuration plateforme | ✅ | 6 onglets : plateforme, plans, webhooks, clés API, SMTP, feature flags |

---

## 5. Applications mobiles

| Application | État | Notes |
|---|---|---|
| `apps/customer-app` (React Native + Expo) | ❌ | App consommateur Android/iOS |
| `apps/pos-tablet` (React Native + Expo) | ❌ | Caisse tactile tablette |
| `apps/kiosk-app` (React Native + Expo) | ❌ | Borne de commande grand écran |
| `apps/delivery-driver-app` (React Native + Expo) | ❌ | App livreur GPS |
| Mode hors-ligne (offline first) | ❌ | SQLite local + sync Zustand |
| Notifications push (Expo) | ❌ | VAPID / FCM |
| Publication Play Store | ❌ | EAS Build + EAS Submit |

---

## 6. Paiements

| Fonctionnalité | État | Notes |
|---|---|---|
| Intégration Stripe (scaffold) | 🔄 | Module présent, pas de webhook réel |
| Paiement par carte (Stripe Elements) | ❌ | |
| Apple Pay / Google Pay | ❌ | Stripe Payment Request Button |
| Split paiement | ❌ | |
| Remboursement | ❌ | API Stripe refund |
| Gestion TVA | ❌ | Taux par article/catégorie |
| Conformité PCI DSS | ❌ | Audit à faire |
| Factures PDF | ❌ | |

---

## 7. Livraison temps réel

| Fonctionnalité | État | Notes |
|---|---|---|
| Interface suivi côté client | ✅ | Carte simulée avec animations |
| Carte Google Maps réelle | ❌ | Remplacer la carte simulée |
| GPS livreur temps réel (WebSocket) | ❌ | Socket.io + position GPS |
| Algorithme assignation livreur | ❌ | File d'attente Redis |
| Estimation temps livraison (ETA) | ❌ | Google Maps Distance Matrix API |
| App livreur | ❌ | Voir section mobile |
| Historique itinéraires | ❌ | |

---

## 8. Programme de fidélité

| Fonctionnalité | État | Notes |
|---|---|---|
| Modèle `LoyaltyTransaction` | ✅ | |
| Tiers Bronze/Silver/Gold/Platinum | ✅ | Constants dans `@foodstack/shared` |
| Attribution points à la commande | 🔄 | Logique backend partielle |
| Interface consommateur fidélité | ✅ | Page `/loyalty` |
| Coupons et codes promo | ❌ | |
| Cashback | ❌ | |
| Récompenses échangeables | ❌ | |
| Promotions automatiques | ❌ | |

---

## 9. Sécurité

| Élément | État | Notes |
|---|---|---|
| JWT + refresh tokens | ✅ | |
| Hachage bcrypt (12 rounds) | ✅ | |
| Auth middleware Next.js | ✅ | Routes protégées |
| CORS configuré | ✅ | |
| Rate limiting | ✅ | ThrottlerModule |
| ValidationPipe (anti injection) | ✅ | |
| OWASP headers (Helmet) | 🔄 | NestJS Helmet installé |
| Anti-CSRF | ❌ | |
| 2FA (TOTP) | ✅ | |
| Audit logs | ❌ | Modèle `AuditLog` manquant |
| Encryption données sensibles | ❌ | |
| Analyse de sécurité automatisée (CI) | 🔄 | `npm audit` en CI |

---

## 10. Notifications & Communications

| Canal | État | Notes |
|---|---|---|
| Toast UI (react-hot-toast) | ✅ | |
| Email transactionnel (Resend) | ❌ | Clé API en `.env.example`, pas câblée |
| Notifications push Web (VAPID) | ❌ | |
| Notifications push Mobile (Expo/FCM) | ❌ | |
| SMS (Twilio) | ❌ | |

---

## 11. Fonctionnalités avancées

| Fonctionnalité | État | Notes |
|---|---|---|
| Synchronisation temps réel (Socket.io) | ✅ | Priorité haute |
| QR Code (menu, tables) | ✅ | |
| Scan code-barres | ❌ | |
| Impression thermique tickets | ❌ | |
| Export PDF rapports | ✅ | |
| Export Excel données | ✅ | xlsx sur analytics, inventaire, commandes, fournisseurs, clients |
| Dark mode | ❌ | |
| Multi-langue (i18n, futur-ready) | ✅ | |
| Analytics avancées | 🔄 | Module scaffold, requêtes à écrire |

---

## Récapitulatif

| Catégorie | Fait | Partiel | À faire | Total |
|---|---|---|---|---|
| Infrastructure | 9 | 2 | 3 | 14 |
| Base de données | 17 | 0 | 6 | 23 |
| Backend API | 11 | 4 | 7 | 22 |
| Frontend web | 33 | 3 | 13 | 49 |
| Applications mobiles | 0 | 0 | 7 | 7 |
| Paiements | 0 | 1 | 7 | 8 |
| Livraison | 1 | 0 | 7 | 8 |
| Fidélité | 3 | 1 | 4 | 8 |
| Sécurité | 7 | 2 | 3 | 12 |
| Notifications | 1 | 0 | 4 | 5 |
| Fonctionnalités avancées | 4 | 2 | 3 | 9 |
| **TOTAL** | **86** | **15** | **64** | **165** |

---

## Prochaines priorités recommandées

### Court terme (sprint suivant)
1. **Socket.io** — synchronisation temps réel commandes/stocks (backend + frontend)
2. **Gestion menus** — page CRUD `/dashboard/menu` (création articles, catégories, variantes)
3. **Google Maps** — remplacer la carte simulée dans le suivi de commande
4. **Profil client** + historique commandes (`/profile`, `/orders`)
5. **Mot de passe oublié / reset** — pages auth manquantes

### Moyen terme
6. **App mobile consommateur** — `apps/customer-app` (React Native + Expo)
7. **Stripe complet** — paiement réel, webhooks, remboursements
8. **App livreur** — GPS temps réel + Socket.io
9. **Super Admin dashboard** — gestion SaaS, abonnements
10. **Dark mode** — Tailwind `dark:` sur tous les composants

### Long terme
11. App POS tablette (`apps/pos-tablet`)
12. App borne tactile (`apps/kiosk-app`)
13. Tests unitaires + E2E complets
14. Audit sécurité PCI DSS
15. Publication Play Store (EAS Build)
