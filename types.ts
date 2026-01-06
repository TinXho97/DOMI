
export type Role = 'user' | 'delivery' | 'vendor' | 'admin';
export type OrderStatus = 'pending' | 'accepted' | 'at_store' | 'on_the_way' | 'delivered' | 'cancelled';

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
}

export interface Order {
  id: string;
  clientId: string;
  clientName: string;
  vendorId?: string;
  partnerId?: string;
  partnerName?: string;
  item: string;
  type: 'delivery' | 'taxi';
  status: OrderStatus;
  addressNote: string;
  payment: 'cash' | 'transfer';
  total: string;
  totalNum: number;
  location: Location;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  password?: string;
  role: Role;
  phone?: string;
  businessName?: string;
  isOnline?: boolean;
}

export interface Category {
  id: string;
  name: string;
  emoji: string;
  sub: string;
  color: string;
}
