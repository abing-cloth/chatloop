export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  verified?: boolean;
  phone?: string;
  email?: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: number;
}

export interface Post {
  id: string;
  userId: string;
  text: string;
  image?: string;
  createdAt: number;
  likedBy: string[];
  comments: Comment[];
}

export interface Story {
  id: string;
  userId: string;
  image: string;
  createdAt: number;
  seen: boolean;
}

export interface Message {
  id: string;
  /** id user pengirim ("me" untuk kita) */
  fromId: string;
  text: string;
  createdAt: number;
}

export interface Conversation {
  /** id lawan bicara */
  userId: string;
  messages: Message[];
}

export interface LiveStream {
  id: string;
  userId: string;
  title: string;
  thumbnail: string;
  viewers: number;
  category: string;
}

export interface ScheduledLive {
  id: string;
  userId: string;
  title: string;
  category: string;
  thumbnail: string;
  startsAt: number; // epoch ms
}

export interface Product {
  id: string;
  sellerId: string;
  name: string;
  price: number; // Rupiah
  image: string;
  description: string;
  category: string;
  createdAt: number;
}

export interface CartItem {
  productId: string;
  qty: number;
}

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  createdAt: number;
}

export type Theme = "light" | "dark";
