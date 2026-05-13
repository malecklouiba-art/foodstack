'use client';

import { useState } from 'react';
import { Search, Star, MessageCircle, Pencil, ChevronLeft, ChevronRight, TrendingUp, Users, Calendar, Reply } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ReviewReply {
  restaurantName: string;
  text: string;
  date: string;
}

interface Review {
  id: string;
  customerName: string;
  customerInitials: string;
  avatarColor: string;
  date: string;
  rating: number;
  text: string;
  orderItems: string[];
  reply: ReviewReply | null;
}

type FilterTab = 'all' | 'no-reply' | '5' | '4' | 'lte3';

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-001',
    customerName: 'Marie Laurent',
    customerInitials: 'ML',
    avatarColor: 'bg-purple-500',
    date: '12 mai 2026',
    rating: 5,
    text: 'Excellent repas ! Le burger était juteux et les frites parfaitement croustillantes. Livraison rapide et emballage soigné. Je recommande vivement !',
    orderItems: ['Classic Burger', 'Frites', 'Limonade'],
    reply: {
      restaurantName: 'FoodStack Restaurant',
      text: 'Merci beaucoup Marie ! C\'est un plaisir de vous compter parmi nos clients fidèles. À bientôt !',
      date: '12 mai 2026',
    },
  },
  {
    id: 'rev-002',
    customerName: 'Pierre Dubois',
    customerInitials: 'PD',
    avatarColor: 'bg-blue-500',
    date: '11 mai 2026',
    rating: 4,
    text: 'Très bon repas dans l\'ensemble. La pizza était savoureuse avec des ingrédients frais. Petit bémol sur le délai de livraison un peu long, mais ça valait l\'attente.',
    orderItems: ['Margherita', 'Tiramisu'],
    reply: null,
  },
  {
    id: 'rev-003',
    customerName: 'Sophie Martin',
    customerInitials: 'SM',
    avatarColor: 'bg-green-500',
    date: '10 mai 2026',
    rating: 5,
    text: 'Parfait comme toujours ! La salade César est ma préférée, ingrédients ultra frais. Le service client est au top, toujours à l\'écoute.',
    orderItems: ['Salade César', 'Eau pétillante'],
    reply: {
      restaurantName: 'FoodStack Restaurant',
      text: 'Merci Sophie ! Notre équipe fait tout pour vous satisfaire. On vous retrouve très bientôt !',
      date: '10 mai 2026',
    },
  },
  {
    id: 'rev-004',
    customerName: 'Julien Klein',
    customerInitials: 'JK',
    avatarColor: 'bg-orange-500',
    date: '10 mai 2026',
    rating: 3,
    text: 'Commande correcte mais sans plus. Le burger était un peu froid à l\'arrivée et la présentation laissait à désirer. J\'espère que c\'était une exception.',
    orderItems: ['Chicken Burger', 'Frites'],
    reply: null,
  },
  {
    id: 'rev-005',
    customerName: 'Alice Bonnet',
    customerInitials: 'AB',
    avatarColor: 'bg-pink-500',
    date: '9 mai 2026',
    rating: 5,
    text: 'Wow ! Le Truffle Burger est une véritable merveille gustative. Les saveurs sont incroyablement équilibrées. Déjà en train de penser à ma prochaine commande !',
    orderItems: ['Truffle Burger', 'Limonade artisanale', 'Fondant Choco'],
    reply: {
      restaurantName: 'FoodStack Restaurant',
      text: 'Alice, vous nous faites chaud au cœur ! Le Truffle Burger est effectivement notre fierté. À très vite !',
      date: '9 mai 2026',
    },
  },
  {
    id: 'rev-006',
    customerName: 'Thomas Bernard',
    customerInitials: 'TB',
    avatarColor: 'bg-cyan-500',
    date: '9 mai 2026',
    rating: 2,
    text: 'Déçu de ma commande. Deux articles manquants et le plat principal était trop salé. Le service client a mis du temps à répondre. J\'espère une amélioration.',
    orderItems: ['Diavola', 'Salade verte'],
    reply: null,
  },
  {
    id: 'rev-007',
    customerName: 'Camille Rousseau',
    customerInitials: 'CR',
    avatarColor: 'bg-yellow-500',
    date: '8 mai 2026',
    rating: 4,
    text: 'Très satisfaite de ma commande ! Les sushis étaient frais et bien préparés. La livraison était poncutelle. Je reviendrai sûrement.',
    orderItems: ['Plateau Sushi 12 pièces', 'Soupe Miso'],
    reply: {
      restaurantName: 'FoodStack Restaurant',
      text: 'Merci Camille pour votre retour positif ! Nous sommes ravis que nos sushis vous aient plu. On vous attend !',
      date: '8 mai 2026',
    },
  },
  {
    id: 'rev-008',
    customerName: 'Nicolas Fournier',
    customerInitials: 'NF',
    avatarColor: 'bg-red-500',
    date: '8 mai 2026',
    rating: 5,
    text: 'Absolument délicieux ! Chaque plat était une explosion de saveurs. La qualité des produits est irréprochable. C\'est définitivement mon restaurant préféré !',
    orderItems: ['Burger du Chef', 'Frites maison', 'Milkshake Vanille'],
    reply: null,
  },
  {
    id: 'rev-009',
    customerName: 'Isabelle Moreau',
    customerInitials: 'IM',
    avatarColor: 'bg-indigo-500',
    date: '7 mai 2026',
    rating: 4,
    text: 'Bonne expérience globalement. La qualité est constante et les portions sont généreuses. Je recommande particulièrement les desserts qui sont excellents.',
    orderItems: ['Pasta Carbonara', 'Tiramisu maison'],
    reply: null,
  },
  {
    id: 'rev-010',
    customerName: 'François Leroy',
    customerInitials: 'FL',
    avatarColor: 'bg-teal-500',
    date: '6 mai 2026',
    rating: 1,
    text: 'Très mauvaise expérience. Commande arrivée avec 1h de retard, plat complètement froid et renversé dans le sac. Aucun geste commercial proposé. Je ne recommanderai pas.',
    orderItems: ['Poulet rôti', 'Légumes grillés'],
    reply: {
      restaurantName: 'FoodStack Restaurant',
      text: 'François, nous sommes sincèrement désolés pour cette expérience. Nous avons contacté notre équipe de livraison et un avoir vous a été envoyé. Merci de nous donner une seconde chance.',
      date: '6 mai 2026',
    },
  },
  {
    id: 'rev-011',
    customerName: 'Aurélie Petit',
    customerInitials: 'AP',
    avatarColor: 'bg-rose-500',
    date: '5 mai 2026',
    rating: 5,
    text: 'Encore une fois, je suis conquise ! Les falafels sont moelleux à l\'intérieur et croustillants à l\'extérieur. La sauce houmous maison est divine. Bravo !',
    orderItems: ['Assiette Falafels', 'Houmous maison', 'Pain pita'],
    reply: {
      restaurantName: 'FoodStack Restaurant',
      text: 'Merci mille fois Aurélie ! Votre fidélité nous touche énormément. Nos falafels sont préparés avec amour chaque matin !',
      date: '5 mai 2026',
    },
  },
  {
    id: 'rev-012',
    customerName: 'Baptiste Lemaire',
    customerInitials: 'BL',
    avatarColor: 'bg-emerald-500',
    date: '4 mai 2026',
    rating: 4,
    text: 'Très bon rapport qualité-prix. Les portions sont copieuses et les plats savoureux. Seul bénol, l\'application pour passer commande gagnerait à être améliorée.',
    orderItems: ['Menu Découverte', 'Dessert du jour'],
    reply: null,
  },
];

// ---------------------------------------------------------------------------
// Rating distribution data
// ---------------------------------------------------------------------------
const RATING_DISTRIBUTION: { stars: number; count: number; pct: number }[] = [
  { stars: 5, count: 142, pct: 57 },
  { stars: 4, count: 63, pct: 26 },
  { stars: 3, count: 24, pct: 10 },
  { stars: 2, count: 12, pct: 5 },
  { stars: 1, count: 6, pct: 2 },
];

const REVIEWS_PER_PAGE = 4;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------
function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' }) {
  const starSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${starSize} ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-700 text-gray-700'}`}
        />
      ))}
    </div>
  );
}

function CustomerAvatar({ initials, color }: { initials: string; color: string }) {
  return (
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${color} text-sm font-semibold text-white`}>
      {initials}
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  onReplySubmit: (id: string, text: string) => void;
  onReplyEdit: (id: string, text: string) => void;
}

function ReviewCard({ review, onReplySubmit, onReplyEdit }: ReviewCardProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [editText, setEditText] = useState(review.reply?.text ?? '');
  const [isSending, setIsSending] = useState(false);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    // Mock API call
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    onReplySubmit(review.id, replyText.trim());
    setReplyText('');
    setIsReplying(false);
    setIsSending(false);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setIsSending(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 600));
    onReplyEdit(review.id, editText.trim());
    setIsEditing(false);
    setIsSending(false);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <CustomerAvatar initials={review.customerInitials} color={review.avatarColor} />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{review.customerName}</p>
            <p className="text-xs text-gray-500">{review.date}</p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>

      {/* Review text */}
      <p className="text-sm text-gray-300 leading-relaxed">{review.text}</p>

      {/* Order items chips */}
      {review.orderItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {review.orderItems.map((item) => (
            <span
              key={item}
              className="inline-flex items-center rounded-full bg-gray-800 border border-gray-700 px-2.5 py-0.5 text-xs text-gray-400"
            >
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Existing reply */}
      {review.reply && !isEditing && (
        <div className="rounded-xl bg-gray-800 border border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Reply className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-xs font-semibold text-brand-400">{review.reply.restaurantName}</span>
              <span className="text-xs text-gray-500">{review.reply.date}</span>
            </div>
            <button
              onClick={() => {
                setEditText(review.reply?.text ?? '');
                setIsEditing(true);
              }}
              className="rounded-lg p-1 text-gray-500 hover:bg-gray-700 hover:text-gray-300 transition-colors"
              title="Modifier la réponse"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{review.reply.text}</p>
        </div>
      )}

      {/* Edit reply inline */}
      {review.reply && isEditing && (
        <div className="rounded-xl bg-gray-800 border border-gray-700 p-4 space-y-3">
          <p className="text-xs font-semibold text-brand-400">Modifier la réponse</p>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-600 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
            placeholder="Modifiez votre réponse..."
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isSending}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEdit}
              loading={isSending}
              disabled={!editText.trim()}
            >
              Sauvegarder
            </Button>
          </div>
        </div>
      )}

      {/* Reply button or inline reply form */}
      {!review.reply && !isReplying && (
        <button
          onClick={() => setIsReplying(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          Répondre
        </button>
      )}

      {!review.reply && isReplying && (
        <div className="space-y-3">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
            placeholder="Écrivez votre réponse au client..."
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsReplying(false);
                setReplyText('');
              }}
              disabled={isSending}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              onClick={handleSendReply}
              loading={isSending}
              disabled={!replyText.trim()}
              icon={<Reply className="h-3.5 w-3.5" />}
            >
              Envoyer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // KPI aggregates
  const avgRating = 4.2;
  const totalReviews = 247;
  const monthlyReviews = 34;
  const responseRate = 78;

  // Filter logic
  const filtered = reviews.filter((r) => {
    const matchSearch =
      !search ||
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.text.toLowerCase().includes(search.toLowerCase());

    let matchTab = true;
    if (activeTab === 'no-reply') matchTab = r.reply === null;
    else if (activeTab === '5') matchTab = r.rating === 5;
    else if (activeTab === '4') matchTab = r.rating === 4;
    else if (activeTab === 'lte3') matchTab = r.rating <= 3;

    return matchSearch && matchTab;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / REVIEWS_PER_PAGE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paginatedReviews = filtered.slice(
    (safeCurrentPage - 1) * REVIEWS_PER_PAGE,
    safeCurrentPage * REVIEWS_PER_PAGE
  );

  const handleTabChange = (tab: FilterTab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleReplySubmit = (id: string, text: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              reply: {
                restaurantName: 'FoodStack Restaurant',
                text,
                date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
              },
            }
          : r
      )
    );
  };

  const handleReplyEdit = (id: string, text: string) => {
    setReviews((prev) =>
      prev.map((r) =>
        r.id === id && r.reply
          ? { ...r, reply: { ...r.reply, text } }
          : r
      )
    );
  };

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'Tous' },
    { key: 'no-reply', label: 'Sans réponse' },
    { key: '5', label: '5★' },
    { key: '4', label: '4★' },
    { key: 'lte3', label: '≤3★' },
  ];

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Avis clients</h1>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-semibold text-white">{avgRating}</span>
            <span className="text-sm text-gray-400">note moyenne</span>
          </div>
          <span className="text-gray-700">·</span>
          <span className="text-sm text-gray-400">
            <span className="font-semibold text-white">{totalReviews}</span> avis au total
          </span>
          <span className="text-gray-700">·</span>
          <span className="text-sm text-gray-400">
            <span className="font-semibold text-white">{responseRate}%</span> taux de réponse
          </span>
        </div>
      </div>

      {/* KPI row */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
              <Star className="h-5 w-5 text-yellow-400" />
            </div>
            <Badge variant="warning">+0.2 ce mois</Badge>
          </div>
          <p className="text-2xl font-bold text-white">{avgRating}/5 ★</p>
          <p className="mt-1 text-sm text-gray-400">Note moyenne</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-400" />
            </div>
            <Badge variant="info">+34 ce mois</Badge>
          </div>
          <p className="text-2xl font-bold text-white">{totalReviews}</p>
          <p className="mt-1 text-sm text-gray-400">Total avis</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
              <Calendar className="h-5 w-5 text-green-400" />
            </div>
            <Badge variant="success">+8%</Badge>
          </div>
          <p className="text-2xl font-bold text-white">{monthlyReviews}</p>
          <p className="mt-1 text-sm text-gray-400">Avis ce mois</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10">
              <TrendingUp className="h-5 w-5 text-brand-400" />
            </div>
            <Badge variant="brand">+5pts</Badge>
          </div>
          <p className="text-2xl font-bold text-white">{responseRate}%</p>
          <p className="mt-1 text-sm text-gray-400">Taux de réponse</p>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Rating distribution */}
        <div className="lg:col-span-1">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <h2 className="mb-4 text-base font-semibold text-white">Distribution des notes</h2>
            <div className="space-y-3">
              {RATING_DISTRIBUTION.map(({ stars, count, pct }) => (
                <div key={stars} className="flex items-center gap-3">
                  <div className="flex w-8 flex-shrink-0 items-center gap-0.5">
                    <span className="text-sm font-medium text-gray-300">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 overflow-hidden rounded-full bg-gray-800 h-2">
                    <div
                      className="h-2 rounded-full bg-yellow-400 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex w-20 flex-shrink-0 items-center justify-end gap-1.5">
                    <span className="text-xs text-gray-400">{count}</span>
                    <span className="text-xs text-gray-600">({pct}%)</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Overall rating visual */}
            <div className="mt-6 flex flex-col items-center border-t border-gray-800 pt-5">
              <p className="text-5xl font-bold text-white">{avgRating}</p>
              <StarRating rating={Math.round(avgRating)} />
              <p className="mt-1 text-xs text-gray-500">Basé sur {totalReviews} avis</p>
            </div>
          </div>
        </div>

        {/* Reviews list column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Filters */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Tab filters */}
              <div className="flex flex-wrap gap-2">
                {tabs.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleTabChange(key)}
                    className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeTab === key
                        ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="flex-1 min-w-[180px]">
                <Input
                  placeholder="Rechercher un avis..."
                  value={search}
                  onChange={handleSearchChange}
                  leftIcon={<Search className="h-4 w-4" />}
                />
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="space-y-4">
            {paginatedReviews.length === 0 ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
                <MessageCircle className="mx-auto mb-3 h-10 w-10 text-gray-600" />
                <p className="text-sm text-gray-400">Aucun avis trouvé</p>
              </div>
            ) : (
              paginatedReviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  onReplySubmit={handleReplySubmit}
                  onReplyEdit={handleReplyEdit}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {filtered.length > REVIEWS_PER_PAGE && (
            <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-2xl px-5 py-3">
              <Button
                variant="ghost"
                size="sm"
                icon={<ChevronLeft className="h-4 w-4" />}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
              >
                Précédent
              </Button>
              <span className="text-sm text-gray-400">
                Page <span className="font-semibold text-white">{safeCurrentPage}</span> sur{' '}
                <span className="font-semibold text-white">{totalPages}</span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                icon={<ChevronRight className="h-4 w-4" />}
                iconPosition="right"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
