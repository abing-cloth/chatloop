import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CartItem,
  Comment,
  Conversation,
  LiveStream,
  Order,
  OrderStatus,
  Post,
  Product,
  ScheduledLive,
  ShippingAddress,
  Story,
  Theme,
  User,
} from "./types";
import {
  ME,
  SEED_CONVERSATIONS,
  SEED_LIVES,
  SEED_POSTS,
  SEED_PRODUCTS,
  SEED_SCHEDULED,
  SEED_STORIES,
  SEED_USERS,
} from "./seed";

let counter = 0;
const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${counter++}`;

export interface Settings {
  privateAccount: boolean;
  notifLikes: boolean;
  notifComments: boolean;
  notifFollows: boolean;
  notifLive: boolean;
  showActivity: boolean;
  // keamanan
  appLockEnabled: boolean;
  pin: string | null;
  autoLockMinutes: number; // 0 = hanya saat dibuka
  biometricEnabled: boolean;
  biometricCredId: string | null;
}

const DEFAULT_SETTINGS: Settings = {
  privateAccount: false,
  notifLikes: true,
  notifComments: true,
  notifFollows: true,
  notifLive: true,
  showActivity: true,
  appLockEnabled: false,
  pin: null,
  autoLockMinutes: 5,
  biometricEnabled: false,
  biometricCredId: null,
};

interface State {
  currentUserId: string;
  users: User[];
  posts: Post[];
  stories: Story[];
  conversations: Conversation[];
  liveStreams: LiveStream[];
  scheduledLives: ScheduledLive[];
  reminderIds: string[];
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  theme: Theme;
  savedPostIds: string[];
  followingIds: string[];
  isAuthed: boolean;
  settings: Settings;

  user: (id: string) => User;
  me: () => User;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;

  login: (userId: string) => void;
  register: (data: {
    name: string;
    username: string;
    phone?: string;
    email?: string;
  }) => void;
  logout: () => void;
  findByUsername: (username: string) => User | undefined;

  toggleTheme: () => void;
  sendMessage: (userId: string, text: string) => void;
  activeChatUserId: string | null;
  startChat: (userId: string) => void;
  clearActiveChat: () => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (userId: string) => void;
  toggleReminder: (scheduledId: string) => void;

  // marketplace
  addProduct: (data: {
    name: string;
    price: number;
    image: string;
    description: string;
    category: string;
  }) => void;
  deleteProduct: (id: string) => void;
  addToCart: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  checkout: (address: ShippingAddress) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  cartCount: () => number;
  cartTotal: () => number;

  addPost: (text: string, image?: string) => void;
  deletePost: (id: string) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string) => void;

  markStorySeen: (id: string) => void;
  updateProfile: (data: Partial<Pick<User, "name" | "bio" | "avatar">>) => void;
  resetAll: () => void;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      currentUserId: ME.id,
      users: SEED_USERS,
      posts: SEED_POSTS,
      stories: SEED_STORIES,
      conversations: SEED_CONVERSATIONS,
      liveStreams: SEED_LIVES,
      scheduledLives: SEED_SCHEDULED,
      reminderIds: [],
      products: SEED_PRODUCTS,
      cart: [],
      orders: [],
      activeChatUserId: null,
      theme: "light",
      savedPostIds: [],
      followingIds: [],
      isAuthed: false,
      settings: DEFAULT_SETTINGS,

      user: (id) => get().users.find((u) => u.id === id) ?? ME,
      me: () => get().user(get().currentUserId),

      setSetting: (key, value) =>
        set((s) => ({ settings: { ...s.settings, [key]: value } })),

      login: (userId) => set({ currentUserId: userId, isAuthed: true }),

      findByUsername: (username) =>
        get().users.find(
          (u) => u.username.toLowerCase() === username.trim().toLowerCase()
        ),

      register: ({ name, username, phone, email }) =>
        set((s) => {
          const id = uid("u");
          const clean = username.trim().toLowerCase().replace(/\s+/g, "");
          const newUser: User = {
            id,
            name: name.trim(),
            username: clean,
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(clean || id)}`,
            bio: "Pengguna baru di ChatLoop 🔄",
            verified: true, // sudah lolos verifikasi OTP
            phone,
            email,
          };
          return {
            users: [...s.users, newUser],
            currentUserId: id,
            isAuthed: true,
            savedPostIds: [],
            followingIds: [],
          };
        }),

      logout: () => set({ isAuthed: false }),

      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),

      toggleSave: (postId) =>
        set((s) => ({
          savedPostIds: s.savedPostIds.includes(postId)
            ? s.savedPostIds.filter((id) => id !== postId)
            : [postId, ...s.savedPostIds],
        })),

      toggleFollow: (userId) =>
        set((s) => ({
          followingIds: s.followingIds.includes(userId)
            ? s.followingIds.filter((id) => id !== userId)
            : [userId, ...s.followingIds],
        })),

      toggleReminder: (scheduledId) =>
        set((s) => ({
          reminderIds: s.reminderIds.includes(scheduledId)
            ? s.reminderIds.filter((id) => id !== scheduledId)
            : [scheduledId, ...s.reminderIds],
        })),

      addProduct: ({ name, price, image, description, category }) =>
        set((s) => ({
          products: [
            {
              id: uid("pr"),
              sellerId: s.currentUserId,
              name: name.trim(),
              price,
              image,
              description: description.trim(),
              category,
              createdAt: Date.now(),
            },
            ...s.products,
          ],
        })),

      deleteProduct: (id) =>
        set((s) => ({
          products: s.products.filter((p) => p.id !== id),
          cart: s.cart.filter((c) => c.productId !== id),
        })),

      addToCart: (productId) =>
        set((s) => {
          const found = s.cart.find((c) => c.productId === productId);
          return {
            cart: found
              ? s.cart.map((c) =>
                  c.productId === productId ? { ...c, qty: c.qty + 1 } : c
                )
              : [...s.cart, { productId, qty: 1 }],
          };
        }),

      setQty: (productId, qty) =>
        set((s) => ({
          cart:
            qty <= 0
              ? s.cart.filter((c) => c.productId !== productId)
              : s.cart.map((c) =>
                  c.productId === productId ? { ...c, qty } : c
                ),
        })),

      removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((c) => c.productId !== productId) })),

      clearCart: () => set({ cart: [] }),

      checkout: (address) =>
        set((s) => {
          const items = s.cart
            .map((c) => {
              const p = s.products.find((pr) => pr.id === c.productId);
              return p ? { name: p.name, price: p.price, qty: c.qty } : null;
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x));
          if (items.length === 0) return {};
          const total = items.reduce((n, it) => n + it.price * it.qty, 0);
          const order: Order = {
            id: uid("ord"),
            items,
            total,
            createdAt: Date.now(),
            address,
            status: "dikemas",
          };
          return { orders: [order, ...s.orders], cart: [] };
        }),

      updateOrderStatus: (orderId, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })),

      cartCount: () => get().cart.reduce((n, c) => n + c.qty, 0),

      cartTotal: () =>
        get().cart.reduce((n, c) => {
          const p = get().products.find((pr) => pr.id === c.productId);
          return n + (p ? p.price * c.qty : 0);
        }, 0),

      sendMessage: (userId, text) =>
        set((s) => {
          const msg = {
            id: uid("m"),
            fromId: s.currentUserId,
            text: text.trim(),
            createdAt: Date.now(),
          };
          const exists = s.conversations.some((c) => c.userId === userId);
          return {
            conversations: exists
              ? s.conversations.map((c) =>
                  c.userId === userId
                    ? { ...c, messages: [...c.messages, msg] }
                    : c
                )
              : [{ userId, messages: [msg] }, ...s.conversations],
          };
        }),

      addPost: (text, image) =>
        set((s) => ({
          posts: [
            {
              id: uid("p"),
              userId: s.currentUserId,
              text: text.trim(),
              image,
              createdAt: Date.now(),
              likedBy: [],
              comments: [],
            },
            ...s.posts,
          ],
        })),

      deletePost: (id) =>
        set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

      toggleLike: (postId) =>
        set((s) => ({
          posts: s.posts.map((p) => {
            if (p.id !== postId) return p;
            const liked = p.likedBy.includes(s.currentUserId);
            return {
              ...p,
              likedBy: liked
                ? p.likedBy.filter((id) => id !== s.currentUserId)
                : [...p.likedBy, s.currentUserId],
            };
          }),
        })),

      addComment: (postId, text) =>
        set((s) => {
          const comment: Comment = {
            id: uid("c"),
            userId: s.currentUserId,
            text: text.trim(),
            createdAt: Date.now(),
          };
          return {
            posts: s.posts.map((p) =>
              p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
            ),
          };
        }),

      startChat: (userId) =>
        set((s) => ({
          activeChatUserId: userId,
          conversations: s.conversations.some((c) => c.userId === userId)
            ? s.conversations
            : [{ userId, messages: [] }, ...s.conversations],
        })),

      clearActiveChat: () => set({ activeChatUserId: null }),

      markStorySeen: (id) =>
        set((s) => ({
          stories: s.stories.map((st) => (st.id === id ? { ...st, seen: true } : st)),
        })),

      updateProfile: (data) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === s.currentUserId ? { ...u, ...data } : u
          ),
        })),

      resetAll: () =>
        set((s) => ({
          currentUserId: ME.id,
          users: SEED_USERS,
          posts: SEED_POSTS,
          stories: SEED_STORIES,
          conversations: SEED_CONVERSATIONS,
          liveStreams: SEED_LIVES,
          scheduledLives: SEED_SCHEDULED,
          reminderIds: [],
          products: SEED_PRODUCTS,
          cart: [],
          orders: [],
          activeChatUserId: null,
          theme: s.theme,
          savedPostIds: [],
          followingIds: [],
          isAuthed: true,
        })),
    }),
    {
      name: "loop-store-v1",
      // pastikan field baru (mis. pengaturan keamanan) tetap ada untuk data lama
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          settings: { ...DEFAULT_SETTINGS, ...(p.settings ?? {}) },
        };
      },
    }
  )
);
