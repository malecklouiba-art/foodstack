import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding FoodStack database...');

  const hash = (pw: string) => bcrypt.hash(pw, 12);

  // ─── Users ────────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: 'admin@foodstack.app' },
    update: {},
    create: {
      email: 'admin@foodstack.app',
      passwordHash: await hash('Admin1234!'),
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.super_admin,
      emailVerified: true,
    },
  });

  const owner = await prisma.user.upsert({
    where: { email: 'owner@lecomptoir.fr' },
    update: {},
    create: {
      email: 'owner@lecomptoir.fr',
      passwordHash: await hash('Owner1234!'),
      firstName: 'Jean',
      lastName: 'Dupont',
      phone: '06 12 34 56 78',
      role: UserRole.restaurant_owner,
      emailVerified: true,
      loyaltyPoints: 1200,
      loyaltyTier: 'gold',
    },
  });

  await prisma.user.upsert({
    where: { email: 'staff@lecomptoir.fr' },
    update: {},
    create: {
      email: 'staff@lecomptoir.fr',
      passwordHash: await hash('Staff1234!'),
      firstName: 'Sophie',
      lastName: 'Martin',
      phone: '06 55 44 33 22',
      role: UserRole.staff,
      emailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'driver@foodstack.app' },
    update: {},
    create: {
      email: 'driver@foodstack.app',
      passwordHash: await hash('Driver1234!'),
      firstName: 'Karim',
      lastName: 'Benali',
      phone: '07 11 22 33 44',
      role: UserRole.driver,
      emailVerified: true,
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'client@exemple.fr' },
    update: {},
    create: {
      email: 'client@exemple.fr',
      passwordHash: await hash('Customer1234!'),
      firstName: 'Marie',
      lastName: 'Laurent',
      phone: '07 98 76 54 32',
      role: UserRole.customer,
      emailVerified: true,
      loyaltyPoints: 450,
      loyaltyTier: 'bronze',
    },
  });

  // ─── Restaurant ────────────────────────────────────────────────────────────

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
        monday:    { open: '11:30', close: '22:00' },
        tuesday:   { open: '11:30', close: '22:00' },
        wednesday: { open: '11:30', close: '22:00' },
        thursday:  { open: '11:30', close: '22:00' },
        friday:    { open: '11:30', close: '23:00' },
        saturday:  { open: '12:00', close: '23:00' },
        sunday:    { open: '12:00', close: '21:00' },
      },
    },
  });

  // ─── Menu categories (idempotent via name+restaurantId) ───────────────────

  const categoryDefs = [
    { name: 'Burgers',  position: 1 },
    { name: 'Pizzas',   position: 2 },
    { name: 'Salades',  position: 3 },
    { name: 'Boissons', position: 4 },
    { name: 'Desserts', position: 5 },
  ];

  const categories: Record<string, string> = {};
  for (const def of categoryDefs) {
    const existing = await prisma.menuCategory.findFirst({
      where: { restaurantId: restaurant.id, name: def.name },
    });
    const cat = existing ?? await prisma.menuCategory.create({
      data: { restaurantId: restaurant.id, name: def.name, position: def.position, isActive: true },
    });
    categories[def.name] = cat.id;
  }

  // ─── Menu items (idempotent via name+restaurantId) ────────────────────────

  const menuDefs = [
    { category: 'Burgers',  name: 'Classic Smash Burger',    description: 'Double smash patty, cheddar fondu, salade, tomate, cornichons, sauce maison', price: 14.90, calories: 650, prepTime: 12, isFeatured: true,  rating: 4.8, soldCount: 1234, allergens: ['gluten','lactose','oeufs'], dietaryTags: [] },
    { category: 'Burgers',  name: 'Truffle Cheeseburger',     description: 'Wagyu beef, fromage de chèvre, truffe, roquette, oignon caramélisé',           price: 22.50, calories: 780, prepTime: 15, isFeatured: true,  rating: 4.9, soldCount: 876,  allergens: ['gluten','lactose'],         dietaryTags: [] },
    { category: 'Burgers',  name: 'Chicken Burger',           description: 'Poulet croustillant, pickles, sauce ranch, cheddar',                            price: 13.50, calories: 580, prepTime: 12, isFeatured: false, rating: 4.6, soldCount: 543,  allergens: ['gluten','lactose'],         dietaryTags: [] },
    { category: 'Pizzas',   name: 'Margherita Napoletana',    description: 'Sauce San Marzano, mozzarella fior di latte, basilic frais',                    price: 13.90, calories: 820, prepTime: 20, isFeatured: false, rating: 4.7, soldCount: 2341, allergens: ['gluten','lactose'],         dietaryTags: ['vegetarian'] },
    { category: 'Pizzas',   name: 'Diavola',                  description: 'Sauce tomate, mozzarella, salami piquant, piment d\'Espelette',                 price: 15.90, calories: 890, prepTime: 20, isFeatured: true,  rating: 4.8, soldCount: 1102, allergens: ['gluten','lactose'],         dietaryTags: [] },
    { category: 'Salades',  name: 'Salade César Premium',     description: 'Poulet grillé, romaine, croûtons artisanaux, parmesan 24 mois, sauce César',    price: 12.50, calories: 420, prepTime: 8,  isFeatured: false, rating: 4.6, soldCount: 543,  allergens: ['gluten','lactose','oeufs','poisson'], dietaryTags: [] },
    { category: 'Boissons', name: 'Limonade Artisanale',      description: 'Citrons frais, menthe, sirop de canne, eau pétillante',                         price:  4.90, calories: 120, prepTime:  3, isFeatured: false, rating: 4.7, soldCount: 987,  allergens: [],                           dietaryTags: ['vegan'] },
    { category: 'Boissons', name: 'Coca-Cola',                description: 'Canette 33cl',                                                                  price:  3.50, calories: 140, prepTime:  1, isFeatured: false, rating: 4.5, soldCount: 1800, allergens: [],                           dietaryTags: [] },
    { category: 'Desserts', name: 'Tiramisu Classique',       description: 'Mascarpone onctueux, espresso, biscuits Savoiardi, cacao amer',                 price:  7.50, calories: 380, prepTime:  5, isFeatured: false, rating: 4.9, soldCount: 432,  allergens: ['gluten','lactose','oeufs'], dietaryTags: [] },
    { category: 'Desserts', name: 'Fondant Chocolat',         description: 'Cœur coulant, glace vanille maison',                                            price:  8.50, calories: 460, prepTime:  8, isFeatured: true,  rating: 4.8, soldCount: 321,  allergens: ['gluten','lactose','oeufs'], dietaryTags: [] },
  ];

  for (const def of menuDefs) {
    const existing = await prisma.menuItem.findFirst({
      where: { restaurantId: restaurant.id, name: def.name },
    });
    if (!existing) {
      await prisma.menuItem.create({
        data: {
          restaurantId: restaurant.id,
          categoryId: categories[def.category],
          name: def.name,
          description: def.description,
          price: def.price,
          calories: def.calories,
          prepTime: def.prepTime,
          isFeatured: def.isFeatured,
          rating: def.rating,
          soldCount: def.soldCount,
          allergens: def.allergens,
          dietaryTags: def.dietaryTags,
          isActive: true,
          position: 0,
        },
      });
    }
  }

  // ─── Suppliers ────────────────────────────────────────────────────────────

  const supplierDefs = [
    { name: 'Moulins du Sud',       contact: 'Pierre Fabre',    email: 'commandes@moulinsdusud.fr',   phone: '04 67 12 34 56', address: 'ZI des Oliviers, 34000 Montpellier' },
    { name: 'Boucherie Martin',     contact: 'Jacques Martin',  email: 'pro@boucherie-martin.fr',     phone: '01 44 55 66 77', address: '8 rue des Abattoirs, 75015 Paris' },
    { name: 'Fromagerie Centrale',  contact: 'Claire Dubois',   email: 'b2b@fromagerie-centrale.fr',  phone: '03 80 21 43 65', address: '45 route des Fromageries, 21000 Dijon' },
    { name: 'Épicerie du Monde',    contact: 'Ahmed Saïd',      email: 'ahmed@epicerie-monde.fr',     phone: '01 56 78 90 12', address: '22 boulevard de la Chapelle, 75018 Paris' },
    { name: 'Ferme de la Vallée',   contact: 'Lucie Morel',     email: 'lucie@ferme-vallee.com',      phone: '05 59 34 56 78', address: 'Lieu-dit La Vallée, 64100 Bayonne' },
  ];

  for (const def of supplierDefs) {
    const existing = await prisma.supplier.findFirst({
      where: { restaurantId: restaurant.id, name: def.name },
    });
    if (!existing) {
      await prisma.supplier.create({
        data: { restaurantId: restaurant.id, ...def },
      });
    }
  }

  // ─── Inventory ────────────────────────────────────────────────────────────

  const supplierByName = async (name: string) => {
    const s = await prisma.supplier.findFirst({ where: { restaurantId: restaurant.id, name } });
    return s?.id;
  };

  const inventoryDefs = [
    { name: 'Farine T55',              category: 'Épicerie',      unit: 'kg',      currentStock: 25,  minStock: 10,  costPerUnit: 0.80,  supplier: 'Moulins du Sud' },
    { name: 'Steak haché 180g',        category: 'Viandes',       unit: 'kg',      currentStock: 3,   minStock: 8,   costPerUnit: 12.50, supplier: 'Boucherie Martin' },
    { name: 'Mozzarella fior di latte',category: 'Laitiers',      unit: 'kg',      currentStock: 5.5, minStock: 4,   costPerUnit: 8.40,  supplier: 'Fromagerie Centrale' },
    { name: 'Tomates San Marzano',     category: 'Épicerie',      unit: 'boîtes',  currentStock: 12,  minStock: 5,   costPerUnit: 3.20,  supplier: 'Épicerie du Monde' },
    { name: "Huile d'olive AOP",       category: 'Épicerie',      unit: 'L',       currentStock: 2,   minStock: 5,   costPerUnit: 14.00, supplier: 'Épicerie du Monde' },
    { name: 'Œufs bio',                category: 'Frais',         unit: 'unités',  currentStock: 120, minStock: 50,  costPerUnit: 0.35,  supplier: 'Ferme de la Vallée' },
    { name: 'Lait entier',             category: 'Laitiers',      unit: 'L',       currentStock: 8,   minStock: 10,  costPerUnit: 1.10,  supplier: 'Fromagerie Centrale' },
    { name: 'Sucre en poudre',         category: 'Épicerie',      unit: 'kg',      currentStock: 15,  minStock: 5,   costPerUnit: 0.90,  supplier: 'Moulins du Sud' },
    { name: 'Bacon fumé',              category: 'Viandes',       unit: 'kg',      currentStock: 1.5, minStock: 3,   costPerUnit: 18.00, supplier: 'Boucherie Martin' },
    { name: 'Salami piquant',          category: 'Charcuterie',   unit: 'kg',      currentStock: 2.8, minStock: 2,   costPerUnit: 22.00, supplier: 'Épicerie du Monde' },
  ];

  for (const def of inventoryDefs) {
    const existing = await prisma.inventoryItem.findFirst({
      where: { restaurantId: restaurant.id, name: def.name },
    });
    if (!existing) {
      await prisma.inventoryItem.create({
        data: {
          restaurantId: restaurant.id,
          name: def.name,
          category: def.category,
          unit: def.unit,
          currentStock: def.currentStock,
          minStock: def.minStock,
          costPerUnit: def.costPerUnit,
          supplierId: await supplierByName(def.supplier),
        },
      });
    }
  }

  console.log('\n✅ Database seeded successfully!');
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔑 Comptes de test FoodStack');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('👑 Super Admin');
  console.log('   Email    : admin@foodstack.app');
  console.log('   Password : Admin1234!');
  console.log('   Accès    : toutes les pages /admin/*');
  console.log('');
  console.log('🍽️  Restaurant Owner');
  console.log('   Email    : owner@lecomptoir.fr');
  console.log('   Password : Owner1234!');
  console.log('   Accès    : /dashboard/* (Le Comptoir Moderne)');
  console.log('');
  console.log('👷 Staff');
  console.log('   Email    : staff@lecomptoir.fr');
  console.log('   Password : Staff1234!');
  console.log('   Accès    : /dashboard/* (lecture + commandes)');
  console.log('');
  console.log('🛵 Driver');
  console.log('   Email    : driver@foodstack.app');
  console.log('   Password : Driver1234!');
  console.log('   Accès    : interface livreur');
  console.log('');
  console.log('🛒 Customer');
  console.log('   Email    : client@exemple.fr');
  console.log('   Password : Customer1234!');
  console.log('   Accès    : commande, suivi, fidélité');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏪 Restaurant démo : Le Comptoir Moderne (ID: demo-restaurant-1)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
