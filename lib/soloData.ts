export type FoodCategory =
  | 'Malay'
  | 'Chinese'
  | 'Indian'
  | 'Japanese'
  | 'Western';

export interface SoloFood {
  id: string;
  name: string;
  category: FoodCategory;
  image: string;
  emoji: string;
}

export const SOLO_FOODS: SoloFood[] = [
  {
    id: 'nasi_lemak',
    name: 'Nasi Lemak',
    category: 'Malay',
    image: '/foods/nasi-lemak.jpg',
    emoji: '🍛',
  },
  {
    id: 'chicken_rice',
    name: 'Chicken Rice',
    category: 'Chinese',
    image: '/foods/chicken-rice.jpg',
    emoji: '🍗',
  },
  {
    id: 'roti_canai',
    name: 'Roti Canai',
    category: 'Indian',
    image: '/foods/roti-canai.jpg',
    emoji: '🫓',
  },
  {
    id: 'laksa',
    name: 'Laksa',
    category: 'Malay',
    image: '/foods/laksa.jpg',
    emoji: '🍜',
  },
  {
    id: 'char_kuey_teow',
    name: 'Char Kuey Teow',
    category: 'Chinese',
    image: '/foods/char-kuey-teow.jpg',
    emoji: '🍳',
  },
  {
    id: 'burger',
    name: 'Burger',
    category: 'Western',
    image: '/foods/burger.png',
    emoji: '🍔',
  },
  {
    id: 'sushi',
    name: 'Sushi',
    category: 'Japanese',
    image: '/foods/sushi.jpg',
    emoji: '🍱',
  },
];

export const SOLO_CATEGORIES: FoodCategory[] = [
  'Malay',
  'Chinese',
  'Indian',
  'Japanese',
  'Western',
];

export interface FavoriteSpot {
  id: string;
  name: string;
  note?: string;
  createdAt: number;
}

export interface SoloHistoryEntry {
  id: string;
  name: string;
  mode: 'food' | 'favorite' | 'category';
  category?: FoodCategory | null;
  emoji?: string;
  time: number;
}

export const FAVORITES_KEY = 'cincailah_solo_favorites';
export const HISTORY_KEY = 'cincailah_solo_history';
export const MAX_HISTORY = 20;
