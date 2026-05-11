import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Star,
  Clock,
  Shield,
  BarChart3,
  Smartphone,
  Truck,
  UtensilsCrossed,
  Package,
  CreditCard,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: UtensilsCrossed,
    title: 'Système POS Complet',
    description: 'Gérez vos commandes, paiements et tickets depuis n\'importe quel appareil — tablette, kiosque ou mobile.',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
  },
  {
    icon: Package,
    title: 'Gestion des Stocks',
    description: 'Suivez vos ingrédients en temps réel, recevez des alertes de stock bas et gérez vos fournisseurs.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Truck,
    title: 'Suivi de Livraison',
    description: 'Tracking en direct à la Uber Eats — position du livreur, ETA et mises à jour automatiques.',
    color: 'text-green-500',
    bg: 'bg-green-50',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Rapports',
    description: 'Tableaux de bord riches en données — ventes, comportement client et performances de livraison.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: Star,
    title: 'Programme Fidélité',
    description: 'Fidélisez vos clients avec un système de points, récompenses et niveaux personnalisables.',
    color: 'text-yellow-500',
    bg: 'bg-yellow-50',
  },
  {
    icon: CreditCard,
    title: 'Paiements Sécurisés',
    description: 'Intégration Stripe complète — cartes, mobile pay, paiements fractionnés et remboursements.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
];

const stats = [
  { value: '10k+', label: 'Restaurants actifs' },
  { value: '2M+', label: 'Commandes traitées' },
  { value: '99.9%', label: 'Disponibilité' },
  { value: '4.9★', label: 'Satisfaction client' },
];

const testimonials = [
  {
    name: 'Sophie Martin',
    role: 'Propriétaire, Bistro Le Marais',
    text: 'FoodStack a révolutionné notre gestion. Les commandes en ligne ont augmenté de 40% et notre équipe est bien plus efficace.',
    avatar: 'SM',
  },
  {
    name: 'Pierre Dubois',
    role: 'Directeur, Boulangerie Centrale',
    text: 'L\'interface est magnifique et intuitive. Nos clients adorent suivre leurs commandes en temps réel.',
    avatar: 'PD',
  },
  {
    name: 'Amina Khoury',
    role: 'Gérante, Restaurant La Méditerranée',
    text: 'La gestion des stocks nous évite les ruptures. Les alertes automatiques nous ont sauvé la mise plusieurs fois !',
    avatar: 'AK',
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '49',
    description: 'Idéal pour les petits restaurants',
    features: [
      'POS sur 1 appareil',
      'Commandes en ligne',
      'Gestion du menu',
      'Rapports basiques',
      'Support email',
    ],
    cta: 'Démarrer',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '149',
    description: 'Pour les restaurants en croissance',
    features: [
      'POS illimité',
      'Livraison & tracking',
      'Programme fidélité',
      'Gestion des stocks avancée',
      'Analytics complètes',
      'Support prioritaire 24/7',
      'Multi-restaurants (jusqu\'à 3)',
    ],
    cta: 'Essai gratuit 14 jours',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Sur mesure',
    description: 'Pour les chaînes et groupes',
    features: [
      'Tout dans Professional',
      'Restaurants illimités',
      'API & intégrations',
      'Tableau de bord personnalisé',
      'Gestionnaire de compte dédié',
      'SLA garanti 99.9%',
    ],
    cta: 'Nous contacter',
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-surface-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand shadow-brand">
              <span className="text-sm font-bold text-white">F</span>
            </div>
            <span className="text-lg font-bold text-surface-900">FoodStack</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            {['Fonctionnalités', 'Tarifs', 'À propos', 'Blog'].map((item) => (
              <a key={item} href="#" className="text-sm text-surface-600 hover:text-surface-900">
                {item}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link href="/auth/register">
              <Button size="sm">Démarrer gratuitement</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-36">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-brand-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm backdrop-blur-md">
            <Star className="h-3.5 w-3.5 text-brand-400" />
            <span className="text-white/90">Plateforme tout-en-un pour la restauration</span>
          </div>

          <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-7xl">
            Gérez votre restaurant
            <span className="block bg-gradient-to-r from-brand-400 to-orange-300 bg-clip-text text-transparent">
              comme les pros
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-white/70 sm:text-xl">
            FoodStack unifie votre POS, gestion des stocks, commandes en ligne et livraison
            dans une seule plateforme élégante. Du comptoir à la porte.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/register">
              <Button size="xl" className="gap-3 shadow-brand-lg">
                Commencer gratuitement
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/menu">
              <Button variant="glass" size="xl">
                Voir la démo
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-white/50">
            Aucune carte de crédit requise · 14 jours d'essai gratuit
          </p>
        </div>

        {/* Hero image placeholder */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/5 p-1 shadow-glass-lg backdrop-blur-sm">
            <div className="aspect-[16/9] w-full rounded-xl bg-gradient-to-br from-surface-800 to-surface-900 flex items-center justify-center">
              <div className="text-center text-white/40">
                <BarChart3 className="mx-auto h-16 w-16 mb-4" />
                <p className="text-lg font-medium">Dashboard Preview</p>
                <p className="text-sm">Analytics & Reporting Interface</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-surface-200 bg-surface-50 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-surface-900">{stat.value}</p>
                <p className="mt-1 text-sm text-surface-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-surface-900 sm:text-4xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-4 text-lg text-surface-500">
              Une suite complète d'outils conçus pour les restaurants modernes
            </p>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
              >
                <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${feature.bg}`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-surface-900">{feature.title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{feature.description}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand-600 opacity-0 transition-opacity group-hover:opacity-100">
                  En savoir plus <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-surface-50 py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-surface-900 sm:text-4xl">
              Ils nous font confiance
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-surface-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-brand-400 text-brand-400" />
                  ))}
                </div>
                <p className="text-sm text-surface-600 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-brand text-sm font-bold text-white">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900">{t.name}</p>
                    <p className="text-xs text-surface-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-surface-900 sm:text-4xl">
              Des tarifs transparents
            </h2>
            <p className="mt-4 text-lg text-surface-500">Pas de surprises. Changez de plan à tout moment.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 ${
                  plan.highlighted
                    ? 'border-brand-500 bg-gradient-to-br from-brand-500 to-orange-600 text-white shadow-brand-lg'
                    : 'border-surface-200 bg-white shadow-sm'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-surface-900 px-3 py-1 text-xs font-semibold text-white">
                    Le plus populaire
                  </div>
                )}
                <h3 className={`text-xl font-bold ${plan.highlighted ? 'text-white' : 'text-surface-900'}`}>
                  {plan.name}
                </h3>
                <p className={`mt-1 text-sm ${plan.highlighted ? 'text-white/80' : 'text-surface-500'}`}>
                  {plan.description}
                </p>
                <div className="mt-4">
                  {plan.price === 'Sur mesure' ? (
                    <span className={`text-3xl font-bold ${plan.highlighted ? 'text-white' : 'text-surface-900'}`}>
                      Sur mesure
                    </span>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-surface-900'}`}>
                        {plan.price}€
                      </span>
                      <span className={`text-sm ${plan.highlighted ? 'text-white/70' : 'text-surface-400'}`}>/mois</span>
                    </div>
                  )}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 flex-shrink-0 ${
                          plan.highlighted ? 'text-white/80' : 'text-brand-500'
                        }`}
                      />
                      <span className={`text-sm ${plan.highlighted ? 'text-white/90' : 'text-surface-600'}`}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/auth/register">
                    <Button
                      variant={plan.highlighted ? 'secondary' : 'primary'}
                      fullWidth
                      className={plan.highlighted ? 'bg-white text-brand-600 hover:bg-white/90' : ''}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-surface-950 via-surface-900 to-surface-800 py-24 px-4 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Prêt à transformer votre restaurant?
          </h2>
          <p className="mt-4 text-lg text-white/70">
            Rejoignez plus de 10 000 restaurants qui font confiance à FoodStack.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/auth/register">
              <Button size="lg" className="shadow-brand-lg">
                Démarrer l'essai gratuit
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="glass" size="lg">
              Planifier une démo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand">
                <span className="text-xs font-bold text-white">F</span>
              </div>
              <span className="font-semibold text-surface-900">FoodStack</span>
            </div>
            <p className="text-sm text-surface-400">
              © 2026 FoodStack. Tous droits réservés.
            </p>
            <div className="flex gap-4">
              {['Confidentialité', 'CGU', 'Contact'].map((item) => (
                <a key={item} href="#" className="text-sm text-surface-400 hover:text-surface-700">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
