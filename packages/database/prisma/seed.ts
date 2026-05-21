import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedProduction() {
  // Only create the super admin — idempotent via upsert
  const email = process.env.SUPER_ADMIN_EMAIL ?? 'admin@foodstack.app';
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!password) {
    console.error('SUPER_ADMIN_PASSWORD env var is required for production seed');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hash,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.super_admin,
      emailVerified: true,
    },
  });

  console.log(`Super admin created/confirmed: ${email}`);
}

async function seedDevelopment() {
  await seedProduction();

  const ownerHash = await bcrypt.hash('Owner1234!', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@lecomptoir.fr' },
    update: {},
    create: {
      email: 'owner@lecomptoir.fr',
      passwordHash: ownerHash,
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      role: UserRole.restaurant_owner,
      emailVerified: true,
      loyaltyPoints: 1200,
      loyaltyTier: 'gold',
    },
  });

  const customerHash = await bcrypt.hash('Customer1234!', 12);
  await prisma.user.upsert({
    where: { email: 'client@exemple.fr' },
    update: {},
    create: {
      email: 'client@exemple.fr',
      passwordHash: customerHash,
      firstName: 'Marie',
      lastName: 'Laurent',
      phone: '07 98 76 54 32',
      role: UserRole.customer,
      emailVerified: true,
      loyaltyPoints: 450,
      loyaltyTier: 'bronze',
    },
  });

  const restaurant = await prisma.restaurant.upsert({
    where: { id: 'demo-restaurant-1' },
    update: {},
    create: {
      id: 'demo-restaurant-1',
      name: 'Le Comptoir Moderne',
      description: 'Cuisine urbaine raffinée, burgers artisanaux et pizzas napolitaines.',
      phone: '01 23 45 67 89',
      email: 'contact@lecomptoir.fr',
      street: '12 rue de la Paix',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
      latitude: 48.8698,
      longitude: 2.3309,
      isActive: true,
      isOpen: true,
      rating: 4.8,
      reviewCount: 634,
      ownerId: owner.id,
      siret: '12345678901234',
      settings: {
        deliveryEnabled: true,
        deliveryRadius: 5,
        deliveryFee: 2.99,
        freeDeliveryThreshold: 30,
        minOrderAmount: 15,
        estimatedPrepTime: 20,
        acceptsReservations: true,
        acceptsCash: true,
        taxRate: 0.1,
        currency: 'EUR',
        loyaltyEnabled: true,
        pointsPerEuro: 10,
      },
      businessHours: {
        monday: { open: '11:30', close: '22:00' },
        tuesday: { open: '11:30', close: '22:00' },
        wednesday: { open: '11:30', close: '22:00' },
        thursday: { open: '11:30', close: '22:00' },
        friday: { open: '11:30', close: '23:00' },
        saturday: { open: '12:00', close: '23:00' },
        sunday: { open: '12:00', close: '21:00' },
      },
    },
  });

  const burgers  = await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: 'Burgers',  position: 1, isActive: true } });
  const pizzas   = await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: 'Pizzas',   position: 2, isActive: true } });
  const salads   = await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: 'Salades',  position: 3, isActive: true } });
  const drinks   = await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: 'Boissons', position: 4, isActive: true } });
  const desserts = await prisma.menuCategory.create({ data: { restaurantId: restaurant.id, name: 'Desserts', position: 5, isActive: true } });

  const items = [
    { categoryId: burgers.id,  name: 'Classic Smash Burger',    description: 'Double smash patty, cheddar fondu, salade, tomate, cornichons, sauce maison', price: 14.90, calories: 650, prepTime: 12, isFeatured: true,  rating: 4.8, soldCount: 1234, allergens: ['gluten', 'lactose', 'oeufs'] },
    { categoryId: burgers.id,  name: 'Truffle Cheeseburger',    description: 'Wagyu beef, fromage de chèvre, truffe, roquette, oignon caramélisé',            price: 22.50, calories: 780, prepTime: 15, isFeatured: true,  rating: 4.9, soldCount:  876, allergens: ['gluten', 'lactose'] },
    { categoryId: pizzas.id,   name: 'Margherita Napoletana',   description: 'Sauce San Marzano, mozzarella fior di latte, basilic frais',                     price: 13.90, calories: 820, prepTime: 20, isFeatured: false, rating: 4.7, soldCount: 2341, allergens: ['gluten', 'lactose'], dietaryTags: ['vegetarian'] },
    { categoryId: salads.id,   name: 'Salade César Premium',    description: 'Poulet grillé, romaine, croûtons artisanaux, parmesan 24 mois, sauce César',     price: 12.50, calories: 420, prepTime:  8, isFeatured: false, rating: 4.6, soldCount:  543, allergens: ['gluten', 'lactose', 'oeufs', 'poisson'] },
    { categoryId: drinks.id,   name: 'Limonade Artisanale',     description: 'Citrons frais, menthe, sirop de canne, eau pétillante',                          price:  4.90, calories: 120, prepTime:  3, isFeatured: false, rating: 4.7, soldCount:  987, allergens: [], dietaryTags: ['vegan'] },
    { categoryId: desserts.id, name: 'Tiramisu Classique',      description: 'Mascarpone onctueux, espresso, biscuits Savoiardi, cacao amer',                  price:  7.50, calories: 380, prepTime:  5, isFeatured: false, rating: 4.9, soldCount:  432, allergens: ['gluten', 'lactose', 'oeufs'] },
  ];

  for (const item of items) {
    await prisma.menuItem.create({
      data: {
        restaurantId: restaurant.id,
        ...item,
        dietaryTags: (item as any).dietaryTags ?? [],
        isActive: true,
        position: 0,
      },
    });
  }

  console.log('Dev seed complete — demo restaurant + menu created');
  console.log('  Owner:    owner@lecomptoir.fr / Owner1234!');
  console.log('  Customer: client@exemple.fr / Customer1234!');
}

async function main() {
  const env = process.env.NODE_ENV ?? 'development';
  console.log(`Seeding database (${env})...`);

  if (env === 'production') {
    await seedProduction();
  } else {
    await seedDevelopment();
  }

  console.log('Done.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
