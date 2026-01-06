
import { Category } from './types';

export const CATEGORIES: Category[] = [
  { id: 'food', name: 'Comida', emoji: '🍔', sub: 'Sabor Local', color: 'bg-orange-500' },
  { id: 'market', name: 'Súper', emoji: '🛒', sub: 'Despensa', color: 'bg-green-500' },
  { id: 'taxi', name: 'Taxi', emoji: '🚕', sub: 'Pedir Viaje', color: 'bg-yellow-500' },
  { id: 'pets', name: 'Mascotas', emoji: '🐶', sub: 'Pet Shop', color: 'bg-purple-500' },
  { id: 'health', name: 'Salud', emoji: '💊', sub: 'Farmacias', color: 'bg-red-500' },
  { id: 'home', name: 'Hogar', emoji: '🛠️', sub: 'Ferretería', color: 'bg-blue-500' },
];

export const INITIAL_LOCATION = { lat: -34.6037, lng: -58.3816 }; // Buenos Aires
