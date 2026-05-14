'use client';

import Link from 'next/link';
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
  MapPin,
  Zap,
  Users,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

const features = [
  {
    icon: UtensilsCrossed,
    title: 'Système POS Complet',
    description: 'Gérez vos commandes, paiements et tickets depuis n\'importe quel appareil — tablette, kiosque ou mobile.',
    color: 'text-brand-500',
    bg: 'bg-brand-50',
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
  {
    icon: Smartphone,
    title: 'App Mobile Clients',
    description: 'Application iOS & Android pour commander, suivre sa livraison et gérer sa fidélité.',
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
  },
  {
    icon: MapPin,
    title: 'GPS en Temps Réel',
    description: 'Suivi GPS live des livreurs avec position actualisée toutes les secondes sur la carte.',
    color: 'text-teal-500',
    bg: 'bg-teal-50',
  },
  {
    icon: Zap,
    title: 'Notifications Instant.',
    description: 'Alertes push en temps réel pour les nouvelles commandes, stocks bas et statuts de livraison.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
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
      'Livraison & tracking GPS',
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

const team = [
  { name: 'Maleck Louiba', role: 'CEO & Co-fondateur', avatar: 'ML', desc: 'Ex-ingénieur chez Deliveroo. Passionné de food tech et d\'expérience client.' },
  { name: 'Sarah Chen', role: 'CTO', avatar: 'SC', desc: 'Ancienne lead engineer chez Stripe. Spécialiste des systèmes temps réel.' },
  { name: 'Julien Moreau', role: 'Head of Product', avatar: 'JM', desc: '10 ans dans la restauration. Designer UX & expert expérience utilisateur.' },
];

const blogPosts = [
  {
    title: 'Comment réduire votre temps de préparation de 30%',
    category: 'Efficacité',
    date: '10 mai 2026',
    read: '5 min',
    color: 'bg-brand-50 text-brand-600',
  },
  {
    title: 'Programme fidélité : guide complet pour fidéliser vos clients',
    category: 'Marketing',
    date: '5 mai 2026',
    read: '8 min',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    title: 'Livraison en 2026 : les tendances qui vont transformer le secteur',
    category: 'Tendances',
    date: '28 avril 2026',
    read: '6 min',
    color: 'bg-blue-50 text-blue-600',
  },
];

export default function LandingPage() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const navItems = [
    { label: 'Fonctionnalités', id: 'fonctionnalites' },
    { label: 'Tarifs', id: 'tarifs' },
    { label: 'À propos', id: 'a-propos' },
    { label: 'Blogue', id: 'blogue' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-surface-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button onClick={() => scrollTo('accueil')} className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-brand shadow-brand">
              <span className="text-sm font-bold text-white">F</span>
            </div>
            <span className="text-lg font-bold text-surface-900">FoodStack</span>
          </button>
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm text-surface-600 hover:text-surface-900 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Démarrer gratuitement</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="accueil" className="relative overflow-hidden bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-50" />
          <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-brand-50/60" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-sm font-medium text-brand-600">
                <Star className="h-3.5 w-3.5 fill-brand-500 text-brand-500" />
                Noté 4.9/5 par 10 000+ restaurants
              </div>

              <h1 className="text-4xl font-bold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Gérez votre restaurant
                <span className="block text-brand-500">sans effort</span>
                tout-en-un
              </h1>

              <p className="mt-5 text-lg text-gray-500 leading-relaxed">
                FoodStack unifie commandes en ligne, livraison GPS, gestion des stocks, programme fidélité et analytiques dans une seule plateforme. Rapide, fiable, garanti.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="xl" className="rounded-2xl gap-2 shadow-lg shadow-brand">
                    Démarrer gratuitement
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="xl" className="rounded-2xl">
                    Accéder au dashboard
                  </Button>
                </Link>
              </div>

              <div className="mt-8 flex items-center gap-6">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Truck className="h-4 w-4 text-brand-500" />
                  Livraison GPS live
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Shield className="h-4 w-4 text-brand-500" />
                  Paiement Stripe
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Zap className="h-4 w-4 text-brand-500" />
                  Temps réel
                </div>
              </div>
            </div>

            <div className="relative hidden lg:flex items-center justify-center">
              <div className="relative rounded-3xl bg-gradient-to-br from-brand-500 to-brand-400 p-8 shadow-2xl shadow-brand">
                <div className="grid grid-cols-2 gap-3">
                  {['🍔 Burgers', '🍕 Pizzas', '🥗 Salades', '🍟 Frites', '🥤 Boissons', '🍮 Desserts'].map((cat) => (
                    <div key={cat} className="flex items-center gap-2 rounded-2xl bg-white/20 px-3 py-2.5 text-sm font-medium text-white backdrop-blur-sm">
                      {cat}
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-2xl">🍔</div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Classic Smash Burger</p>
                      <p className="text-xs text-gray-400">Le Comptoir Moderne · 12 min</p>
                    </div>
                    <span className="font-bold text-brand-500">14.90€</span>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-2xl bg-white px-4 py-3 shadow-lg">
                <p className="text-xs text-gray-500">Commandes aujourd&apos;hui</p>
                <p className="text-2xl font-bold text-gray-900">2 847</p>
                <p className="text-xs text-green-500 font-medium">↑ 12% vs hier</p>
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-center">
            <button onClick={() => scrollTo('stats')} className="flex flex-col items-center gap-1 text-surface-400 hover:text-surface-600 transition-colors">
              <span className="text-xs">Découvrir</span>
              <ChevronDown className="h-5 w-5 animate-bounce" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-surface-200 bg-surface-50 py-12">
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
      <section id="fonctionnalites" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600 mb-4">Fonctionnalités</span>
            <h2 className="text-3xl font-bold text-surface-900 sm:text-4xl">
              Tout ce dont vous avez besoin
            </h2>
            <p className="mt-4 text-lg text-surface-500">
              Une suite complète d&apos;outils conçus pour les restaurants modernes
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

      {/* How it works */}
      <section className="bg-surface-50 py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600 mb-4">Comment ça marche</span>
            <h2 className="text-3xl font-bold text-surface-900 sm:text-4xl">Opérationnel en 3 étapes</h2>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              { step: '01', title: 'Créez votre compte', desc: 'Inscrivez-vous en 2 minutes. Importez votre menu existant ou créez-en un nouveau depuis zéro.', icon: Users },
              { step: '02', title: 'Configurez votre restaurant', desc: 'Paramétrez vos horaires, zones de livraison, méthodes de paiement et programme fidélité.', icon: Clock },
              { step: '03', title: 'Recevez vos commandes', desc: 'Les commandes arrivent en temps réel. Gérez-les depuis le dashboard ou l\'application mobile.', icon: Zap },
            ].map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative rounded-2xl border border-surface-200 bg-white p-8 shadow-sm">
                <span className="absolute -top-4 left-6 rounded-xl bg-brand-500 px-3 py-1 text-sm font-bold text-white">{step}</span>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50">
                  <Icon className="h-6 w-6 text-brand-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-surface-900">{title}</h3>
                <p className="text-sm text-surface-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
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
      <section id="tarifs" className="bg-surface-50 py-24 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600 mb-4">Tarifs</span>
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
                    ? 'border-brand-500 bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand-lg'
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
                  <Link href="/register">
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

      {/* About */}
      <section id="a-propos" className="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600 mb-4">À propos</span>
            <h2 className="text-3xl font-bold text-surface-900 sm:text-4xl">L&apos;équipe derrière FoodStack</h2>
            <p className="mt-4 text-lg text-surface-500 max-w-2xl mx-auto">
              Fondée en 2024 à Paris, FoodStack est née d&apos;une obsession : donner aux restaurateurs des outils dignes des grandes plateformes, sans la complexité.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {team.map((member) => (
              <div key={member.name} className="rounded-2xl border border-surface-200 bg-white p-8 shadow-sm text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-brand text-2xl font-bold text-white">
                  {member.avatar}
                </div>
                <h3 className="text-lg font-bold text-surface-900">{member.name}</h3>
                <p className="text-sm font-medium text-brand-600 mb-3">{member.role}</p>
                <p className="text-sm text-surface-500 leading-relaxed">{member.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 rounded-3xl bg-gradient-to-br from-brand-50 to-brand-100 p-10 text-center">
            <h3 className="text-2xl font-bold text-surface-900">Notre mission</h3>
            <p className="mt-4 text-lg text-surface-600 max-w-3xl mx-auto">
              Démocratiser les outils de gestion restaurant. Chaque restaurateur, qu&apos;il gère un food truck ou une chaîne de 50 établissements, mérite une plateforme puissante, intuitive et abordable.
            </p>
          </div>
        </div>
      </section>

      {/* Blog */}
      <section id="blogue" className="bg-surface-50 py-24 px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="inline-block rounded-full bg-brand-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-brand-600 mb-4">Blogue</span>
              <h2 className="text-3xl font-bold text-surface-900 sm:text-4xl">Ressources & conseils</h2>
            </div>
            <button className="hidden sm:flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
              Tous les articles <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {blogPosts.map((post) => (
              <article key={post.title} className="group cursor-pointer rounded-2xl border border-surface-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${post.color} mb-4`}>
                  {post.category}
                </span>
                <h3 className="text-base font-bold text-surface-900 leading-snug group-hover:text-brand-600 transition-colors">
                  {post.title}
                </h3>
                <div className="mt-4 flex items-center gap-3 text-xs text-surface-400">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span>{post.read} de lecture</span>
                </div>
              </article>
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
            <Link href="/register">
              <Button size="lg" className="shadow-brand-lg">
                Démarrer l&apos;essai gratuit
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="glass" size="lg">
                Se connecter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-200 bg-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-brand">
                  <span className="text-xs font-bold text-white">F</span>
                </div>
                <span className="font-bold text-surface-900">FoodStack</span>
              </div>
              <p className="text-sm text-surface-400 leading-relaxed">La plateforme tout-en-un pour restaurants modernes.</p>
            </div>
            {[
              { title: 'Produit', links: ['Fonctionnalités', 'Tarifs', 'Changelog', 'Roadmap'] },
              { title: 'Ressources', links: ['Documentation', 'API', 'Blogue', 'Support'] },
              { title: 'Légal', links: ['Confidentialité', 'CGU', 'Contact', 'Mentions légales'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="mb-4 text-sm font-semibold text-surface-900">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-surface-400 hover:text-surface-700 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-surface-100 pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-surface-400">© 2026 FoodStack. Tous droits réservés.</p>
            <div className="flex gap-4 text-sm text-surface-400">
              <a href="#" className="hover:text-surface-700">🇫🇷 Français</a>
              <a href="#" className="hover:text-surface-700">Made in Paris</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
