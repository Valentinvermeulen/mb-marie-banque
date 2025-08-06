// Types pour le client (sans Zod)
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  phone?: string;
  isVerified?: boolean;
  rating?: number;
  totalSales?: number;
  totalPurchases?: number;
  lastSeen?: Date;
}

export interface Product {
  id: string;
  sellerId: string;
  categoryId: string;
  brandId?: string;
  title: string;
  description: string;
  price: number;
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor';
  sizeId?: string;
  colorId?: string;
  isActive: boolean;
  isSold: boolean;
  isReserved: boolean;
  views: number;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
}

export interface Brand {
  id: string;
  name: string;
  logo?: string;
}

export interface Size {
  id: string;
  name: string;
}

export interface Color {
  id: string;
  name: string;
  hex: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  isPrimary: boolean;
}

export interface Favorite {
  id: string;
  userId: string;
  productId: string;
  createdAt: Date;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerId: string;
  productId: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Review {
  id: string;
  orderId: string;
  reviewerId: string;
  reviewedId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ProductTag {
  id: string;
  productId: string;
  tagId: string;
} 