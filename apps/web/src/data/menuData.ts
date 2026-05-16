import type { MenuCategory, MenuItem } from '@foodstack/shared';

export const MENU_CATEGORIES: MenuCategory[] = [
  { id: 'cat-1', restaurantId: 'r1', name: 'Burgers',  description: 'Nos burgers maison',        position: 0, isActive: true },
  { id: 'cat-2', restaurantId: 'r1', name: 'Pizzas',   description: 'Cuites au feu de bois',     position: 1, isActive: true },
  { id: 'cat-3', restaurantId: 'r1', name: 'Salades',  description: 'Fraîches & légères',         position: 2, isActive: true },
  { id: 'cat-4', restaurantId: 'r1', name: 'Desserts', description: 'Nos douceurs',               position: 3, isActive: true },
  { id: 'cat-5', restaurantId: 'r1', name: 'Boissons', description: '',                           position: 4, isActive: false },
];

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'i-1', restaurantId: 'r1', categoryId: 'cat-1',
    name: 'Classic Burger', description: 'Steak haché, cheddar, salade, tomate, oignons',
    image: 'https://cdn.pixabay.com/photo/2016/03/05/19/02/hamburger-1238246_640.jpg',
    price: 14.90, prepTime: 12, dietaryTags: [], allergens: ['Gluten', 'Lait', 'Oeufs'],
    modifierGroups: [], isActive: true, isFeatured: true, position: 0,
    rating: 4.8, reviewCount: 124, soldCount: 843, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-2', restaurantId: 'r1', categoryId: 'cat-1',
    name: 'Truffle Burger', description: 'Huile de truffe, champignons, emmental, mayo maison',
    image: 'https://cdn.pixabay.com/photo/2020/08/09/14/17/mushroom-burger-5476453_640.jpg',
    price: 22.50, compareAtPrice: 26.00, prepTime: 15, dietaryTags: [], allergens: ['Gluten', 'Lait', 'Oeufs'],
    modifierGroups: [], isActive: true, isFeatured: false, position: 1,
    rating: 4.9, reviewCount: 67, soldCount: 312, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-3', restaurantId: 'r1', categoryId: 'cat-1',
    name: 'Chicken Burger', description: 'Poulet croustillant, coleslaw, sauce BBQ',
    image: 'https://cdn.pixabay.com/photo/2014/10/23/18/05/burger-500054_640.jpg',
    price: 12.90, prepTime: 14, dietaryTags: [], allergens: ['Gluten', 'Lait'],
    modifierGroups: [], isActive: true, isFeatured: false, position: 2,
    rating: 4.6, reviewCount: 89, soldCount: 445, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-4', restaurantId: 'r1', categoryId: 'cat-1',
    name: 'Veggie Burger', description: 'Steak de légumes, avocat, tomate, roquette',
    image: 'https://cdn.pixabay.com/photo/2022/07/13/09/51/burger-7319051_640.jpg',
    price: 13.50, prepTime: 10, dietaryTags: ['vegetarian', 'vegan'], allergens: ['Gluten'],
    modifierGroups: [], isActive: false, isFeatured: false, position: 3,
    rating: 4.3, reviewCount: 34, soldCount: 156, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-5', restaurantId: 'r1', categoryId: 'cat-2',
    name: 'Margherita', description: 'Tomate, mozzarella, basilic frais',
    image: 'https://cdn.pixabay.com/photo/2017/12/09/08/18/pizza-3007395_640.jpg',
    price: 13.90, prepTime: 18, dietaryTags: ['vegetarian'], allergens: ['Gluten', 'Lait'],
    modifierGroups: [], isActive: true, isFeatured: true, position: 0,
    rating: 4.7, reviewCount: 201, soldCount: 934, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-6', restaurantId: 'r1', categoryId: 'cat-2',
    name: 'Diavola', description: 'Tomate, mozzarella, salami piquant',
    image: 'https://cdn.pixabay.com/photo/2019/09/26/08/14/pizza-4505870_640.jpg',
    price: 15.90, prepTime: 18, dietaryTags: ['spicy'], allergens: ['Gluten', 'Lait'],
    modifierGroups: [], isActive: true, isFeatured: false, position: 1,
    rating: 4.5, reviewCount: 88, soldCount: 421, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-7', restaurantId: 'r1', categoryId: 'cat-2',
    name: 'Quattro Formaggi', description: 'Quatre fromages fondus sur base crème',
    image: 'https://cdn.pixabay.com/photo/2022/02/10/21/23/pizza-7005859_640.jpg',
    price: 18.00, prepTime: 20, dietaryTags: ['vegetarian'], allergens: ['Gluten', 'Lait'],
    modifierGroups: [], isActive: true, isFeatured: false, position: 2,
    rating: 4.6, reviewCount: 55, soldCount: 287, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-8', restaurantId: 'r1', categoryId: 'cat-3',
    name: 'Salade César', description: 'Romaine, parmesan, croûtons, poulet grillé',
    image: 'https://cdn.pixabay.com/photo/2017/10/09/19/29/salad-2836445_640.jpg',
    price: 12.50, prepTime: 8, dietaryTags: [], allergens: ['Gluten', 'Lait', 'Oeufs'],
    modifierGroups: [], isActive: true, isFeatured: false, position: 0,
    rating: 4.4, reviewCount: 56, soldCount: 234, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-9', restaurantId: 'r1', categoryId: 'cat-3',
    name: 'Salade Niçoise', description: 'Thon, olives, haricots verts, œuf dur',
    image: 'https://cdn.pixabay.com/photo/2017/05/11/19/44/fresh-2305367_640.jpg',
    price: 13.90, prepTime: 8, dietaryTags: [], allergens: ['Oeufs', 'Poisson'],
    modifierGroups: [], isActive: true, isFeatured: false, position: 1,
    rating: 4.3, reviewCount: 41, soldCount: 198, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-10', restaurantId: 'r1', categoryId: 'cat-4',
    name: 'Tiramisu', description: 'Recette traditionnelle italienne',
    image: 'https://cdn.pixabay.com/photo/2017/01/11/11/33/cake-1971552_640.jpg',
    price: 7.50, prepTime: 0, dietaryTags: ['vegetarian'], allergens: ['Oeufs', 'Lait', 'Gluten'],
    modifierGroups: [], isActive: true, isFeatured: false, position: 0,
    rating: 4.9, reviewCount: 145, soldCount: 678, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-11', restaurantId: 'r1', categoryId: 'cat-4',
    name: 'Fondant Chocolat', description: 'Coulant au chocolat noir, glace vanille',
    image: 'https://cdn.pixabay.com/photo/2020/01/17/16/54/chocolate-4773322_640.jpg',
    price: 8.00, prepTime: 12, dietaryTags: ['vegetarian'], allergens: ['Oeufs', 'Lait', 'Gluten'],
    modifierGroups: [], isActive: true, isFeatured: true, position: 1,
    rating: 4.8, reviewCount: 92, soldCount: 401, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-12', restaurantId: 'r1', categoryId: 'cat-5',
    name: 'Eau Minérale', description: 'Eau minérale naturelle 50cl',
    image: 'https://cdn.pixabay.com/photo/2016/12/22/09/21/mineral-water-1925835_640.jpg',
    price: 2.50, prepTime: 0, dietaryTags: ['vegetarian', 'vegan', 'gluten_free'], allergens: [],
    modifierGroups: [], isActive: true, isFeatured: false, position: 0,
    rating: 4.0, reviewCount: 12, soldCount: 1200, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-13', restaurantId: 'r1', categoryId: 'cat-5',
    name: 'Limonade', description: 'Limonade maison au citron frais',
    image: 'https://cdn.pixabay.com/photo/2018/07/07/19/55/lemon-3523243_640.jpg',
    price: 4.90, prepTime: 3, dietaryTags: ['vegetarian', 'vegan'], allergens: [],
    modifierGroups: [], isActive: true, isFeatured: false, position: 1,
    rating: 4.5, reviewCount: 38, soldCount: 543, createdAt: new Date(), updatedAt: new Date(),
  },
  {
    id: 'i-14', restaurantId: 'r1', categoryId: 'cat-5',
    name: 'Café Espresso', description: 'Café espresso 100% arabica',
    image: 'https://cdn.pixabay.com/photo/2017/11/29/15/41/coffee-2987455_640.jpg',
    price: 2.20, prepTime: 2, dietaryTags: ['vegetarian', 'vegan', 'gluten_free'], allergens: [],
    modifierGroups: [], isActive: true, isFeatured: false, position: 2,
    rating: 4.7, reviewCount: 203, soldCount: 2100, createdAt: new Date(), updatedAt: new Date(),
  },
];

// TVA rates by category name (French standard)
export const CATEGORY_TVA: Record<string, number> = {
  'Burgers':  10,
  'Pizzas':   10,
  'Salades':  10,
  'Desserts': 10,
  'Boissons': 5.5,
};

// Emoji fallbacks by category
export const CATEGORY_EMOJI: Record<string, string> = {
  'Burgers':  '🍔',
  'Pizzas':   '🍕',
  'Salades':  '🥗',
  'Desserts': '🍮',
  'Boissons': '🥤',
};
