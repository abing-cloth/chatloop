import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CartItem,
  Comment,
  Conversation,
  Draft,
  Group,
  GroupChat,
  GroupPost,
  LiveStream,
  Order,
  OrderStatus,
  PaymentMethod,
  Post,
  Product,
  Reel,
  ReelComment,
  Review,
  ScheduledLive,
  ShippingAddress,
  Story,
  Theme,
  User,
  View,
  WalletTx,
} from "./types";
import {
  ME,
  SEED_CONVERSATIONS,
  SEED_GROUP_CHATS,
  SEED_GROUP_POSTS,
  SEED_GROUPS,
  SEED_LIVES,
  SEED_POSTS,
  SEED_PRODUCTS,
  SEED_REELS,
  SEED_REVIEWS,
  SEED_SCHEDULED,
  SEED_STORIES,
  SEED_USERS,
  SEED_WALLET_BALANCE,
  SEED_WALLET_TX,
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
  creatorMode: boolean;
  lang: "id" | "en";
  dataSaver: boolean;
  pushEnabled: boolean;
  accent: "violet" | "rose" | "blue" | "emerald" | "orange";
  fontScale: "kecil" | "normal" | "besar";
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
  creatorMode: false,
  lang: "id",
  dataSaver: false,
  pushEnabled: false,
  accent: "violet",
  fontScale: "normal",
};

interface State {
  currentUserId: string;
  users: User[];
  posts: Post[];
  stories: Story[];
  conversations: Conversation[];
  groupChats: GroupChat[];
  createGroupChat: (name: string, memberIds: string[]) => void;
  sendGroupMessage: (groupId: string, text: string) => void;
  receiveGroupMessage: (groupId: string, fromId: string, text: string) => void;
  liveStreams: LiveStream[];
  scheduledLives: ScheduledLive[];
  reminderIds: string[];
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  reviews: Review[];
  wishlistIds: string[];
  reels: Reel[];
  reelComments: ReelComment[];
  groups: Group[];
  joinedGroupIds: string[];
  groupPosts: GroupPost[];
  walletBalance: number;
  walletTx: WalletTx[];
  theme: Theme;
  savedPostIds: string[];
  followingIds: string[];
  blockedIds: string[];
  isAuthed: boolean;
  settings: Settings;
  view: View;
  profileUserId: string | null;

  user: (id: string) => User;
  me: () => User;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  navigate: (view: View) => void;
  openProfile: (userId: string) => void;
  followerCount: (userId: string) => number;
  followingCount: (userId: string) => number;

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
  sendMessage: (userId: string, text: string, opts?: { image?: string; replyToId?: string; audio?: string; duration?: number; location?: { lat: number; lng: number } }) => void;
  receiveMessage: (userId: string, text: string) => void;
  deleteMessage: (userId: string, messageId: string) => void;
  reactMessage: (userId: string, messageId: string, emoji: string) => void;
  markConversationRead: (userId: string) => void;
  archivedChatIds: string[];
  toggleArchiveChat: (userId: string) => void;
  activeChatUserId: string | null;
  startChat: (userId: string) => void;
  clearActiveChat: () => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (userId: string) => void;
  toggleReminder: (scheduledId: string) => void;
  // siaran langsung milik pengguna -> tampil di beranda & Live semua orang
  startLive: (data: { title: string; category: string; thumbnail?: string; invited?: string[] }) => string;
  endLive: (id: string) => void;

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
  toggleWishlist: (productId: string) => void;
  checkout: (
    address: ShippingAddress,
    payment: PaymentMethod,
    opts?: { discount?: number; voucher?: string }
  ) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  cartCount: () => number;
  cartTotal: () => number;
  addReview: (data: { productId: string; rating: number; text: string }) => void;
  productRating: (productId: string) => { avg: number; count: number };

  // reels
  toggleReelLike: (reelId: string) => void;
  addReel: (data: { video: string; caption: string; music?: string }) => void;
  addReelComment: (reelId: string, text: string) => void;

  // grup
  toggleJoinGroup: (groupId: string) => void;
  addGroupPost: (groupId: string, text: string) => void;

  // dompet
  topUp: (amount: number) => void;
  withdraw: (amount: number) => boolean;

  addPost: (text: string, image?: string) => void;
  editPost: (postId: string, text: string) => void;
  editComment: (postId: string, commentId: string, text: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  drafts: Draft[];
  saveDraft: (d: { text: string; image?: string }) => void;
  deleteDraft: (id: string) => void;
  deletePost: (id: string) => void;
  toggleLike: (postId: string) => void;
  addComment: (postId: string, text: string, parentId?: string) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;

  markStorySeen: (id: string) => void;
  addStory: (image: string) => void;
  toggleBlock: (userId: string) => void;
  banUser: (userId: string, banned: boolean) => void;
  updateProfile: (data: Partial<Pick<User, "bio" | "avatar" | "username" | "cover">>) => void;
  lastNameChange: number | null;
  tryRename: (name: string) => { ok: boolean; msg: string };
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
      groupChats: SEED_GROUP_CHATS,
      liveStreams: SEED_LIVES,
      scheduledLives: SEED_SCHEDULED,
      reminderIds: [],
      products: SEED_PRODUCTS,
      cart: [],
      orders: [],
      reviews: SEED_REVIEWS,
      wishlistIds: [],
      reels: SEED_REELS,
      reelComments: [],
      groups: SEED_GROUPS,
      joinedGroupIds: [],
      groupPosts: SEED_GROUP_POSTS,
      walletBalance: SEED_WALLET_BALANCE,
      walletTx: SEED_WALLET_TX,
      activeChatUserId: null,
      archivedChatIds: [],
      theme: "light",
      savedPostIds: [],
      followingIds: [],
      blockedIds: [],
      isAuthed: false,
      settings: DEFAULT_SETTINGS,
      view: "feed",
      profileUserId: null,

      user: (id) => get().users.find((u) => u.id === id) ?? ME,
      me: () => get().user(get().currentUserId),

      setSetting: (key, value) =>
        set((s) => ({ settings: { ...s.settings, [key]: value } })),

      navigate: (view) => set({ view, profileUserId: null }),

      openProfile: (userId) =>
        set((s) => ({ view: "profile", profileUserId: userId === s.currentUserId ? null : userId })),

      followerCount: (userId) => {
        const base = get().user(userId).followers ?? 0;
        // jika kamu mengikuti user ini, +1 pengikut
        return base + (get().followingIds.includes(userId) ? 1 : 0);
      },

      followingCount: (userId) => {
        // untuk diri sendiri: jumlah nyata yang kamu ikuti + baseline
        if (userId === get().currentUserId)
          return (get().user(userId).following ?? 0) + get().followingIds.length;
        return get().user(userId).following ?? 0;
      },

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

      startLive: ({ title, category, thumbnail, invited }) => {
        const s = get();
        const me = s.user(s.currentUserId);
        const id = uid("lv");
        const live: LiveStream = {
          id, userId: s.currentUserId, title,
          thumbnail: thumbnail || me.cover || me.avatar,
          viewers: 1 + (invited?.length ?? 0),
          category,
        };
        set((st) => ({ liveStreams: [live, ...st.liveStreams] }));
        // undang teman: kirim DM "aku lagi live, nonton yuk"
        for (const uidv of invited ?? []) {
          try { get().sendMessage(uidv, `🔴 Aku lagi LIVE: "${title}" — nonton yuk!`); } catch { /* */ }
        }
        return id;
      },

      endLive: (id) => set((s) => ({ liveStreams: s.liveStreams.filter((l) => l.id !== id) })),

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

      toggleWishlist: (productId) =>
        set((s) => ({
          wishlistIds: s.wishlistIds.includes(productId)
            ? s.wishlistIds.filter((id) => id !== productId)
            : [productId, ...s.wishlistIds],
        })),

      checkout: (address, payment, opts) =>
        set((s) => {
          const items = s.cart
            .map((c) => {
              const p = s.products.find((pr) => pr.id === c.productId);
              return p ? { name: p.name, price: p.price, qty: c.qty } : null;
            })
            .filter((x): x is NonNullable<typeof x> => Boolean(x));
          if (items.length === 0) return {};
          const subtotal = items.reduce((n, it) => n + it.price * it.qty, 0);
          const discount = Math.min(opts?.discount ?? 0, subtotal);
          const total = subtotal - discount;
          if (payment === "saldo" && s.walletBalance < total) return {};
          const order: Order = {
            id: uid("ord"),
            items,
            total,
            discount: discount || undefined,
            voucher: opts?.voucher,
            createdAt: Date.now(),
            address,
            status: "dikemas",
            payment,
          };
          const base = { orders: [order, ...s.orders], cart: [] };
          if (payment === "saldo") {
            return {
              ...base,
              walletBalance: s.walletBalance - total,
              walletTx: [
                { id: uid("wt"), type: "belanja" as const, amount: -total, note: `Belanja ${items.length} item`, createdAt: Date.now() },
                ...s.walletTx,
              ],
            };
          }
          return base;
        }),

      updateOrderStatus: (orderId, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === orderId ? { ...o, status } : o)),
        })),

      addReview: ({ productId, rating, text }) =>
        set((s) => ({
          reviews: [
            {
              id: uid("rv"),
              productId,
              userId: s.currentUserId,
              rating,
              text: text.trim(),
              createdAt: Date.now(),
            },
            ...s.reviews,
          ],
        })),

      productRating: (productId) => {
        const rs = get().reviews.filter((r) => r.productId === productId);
        if (rs.length === 0) return { avg: 0, count: 0 };
        const avg = rs.reduce((n, r) => n + r.rating, 0) / rs.length;
        return { avg, count: rs.length };
      },

      toggleReelLike: (reelId) =>
        set((s) => ({
          reels: s.reels.map((r) => {
            if (r.id !== reelId) return r;
            const liked = r.likedBy.includes(s.currentUserId);
            return {
              ...r,
              likedBy: liked
                ? r.likedBy.filter((id) => id !== s.currentUserId)
                : [...r.likedBy, s.currentUserId],
            };
          }),
        })),

      addReel: ({ video, caption, music }) =>
        set((s) => ({
          reels: [
            {
              id: uid("re"),
              userId: s.currentUserId,
              video,
              caption: caption.trim(),
              music: music?.trim() || "Suara asli",
              likedBy: [],
              comments: 0,
              createdAt: Date.now(),
            },
            ...s.reels,
          ],
        })),

      addReelComment: (reelId, text) =>
        set((s) => ({
          reelComments: [
            ...s.reelComments,
            { id: uid("rc"), reelId, userId: s.currentUserId, text: text.trim(), createdAt: Date.now() },
          ],
        })),

      toggleJoinGroup: (groupId) =>
        set((s) => {
          const joined = s.joinedGroupIds.includes(groupId);
          return {
            joinedGroupIds: joined
              ? s.joinedGroupIds.filter((id) => id !== groupId)
              : [groupId, ...s.joinedGroupIds],
            groups: s.groups.map((g) =>
              g.id === groupId ? { ...g, members: g.members + (joined ? -1 : 1) } : g
            ),
          };
        }),

      addGroupPost: (groupId, text) =>
        set((s) => ({
          groupPosts: [
            {
              id: uid("gp"),
              groupId,
              userId: s.currentUserId,
              text: text.trim(),
              createdAt: Date.now(),
            },
            ...s.groupPosts,
          ],
        })),

      topUp: (amount) =>
        set((s) => ({
          walletBalance: s.walletBalance + amount,
          walletTx: [
            { id: uid("wt"), type: "topup", amount, note: "Top up saldo", createdAt: Date.now() },
            ...s.walletTx,
          ],
        })),

      withdraw: (amount) => {
        if (amount <= 0 || amount > get().walletBalance) return false;
        set((s) => ({
          walletBalance: s.walletBalance - amount,
          walletTx: [
            { id: uid("wt"), type: "tarik", amount: -amount, note: "Tarik dana", createdAt: Date.now() },
            ...s.walletTx,
          ],
        }));
        return true;
      },

      cartCount: () => get().cart.reduce((n, c) => n + c.qty, 0),

      cartTotal: () =>
        get().cart.reduce((n, c) => {
          const p = get().products.find((pr) => pr.id === c.productId);
          return n + (p ? p.price * c.qty : 0);
        }, 0),

      sendMessage: (userId, text, opts) =>
        set((s) => {
          const msg = {
            id: uid("m"),
            fromId: s.currentUserId,
            text: text.trim(),
            createdAt: Date.now(),
            image: opts?.image,
            audio: opts?.audio,
            duration: opts?.duration,
            location: opts?.location,
            replyToId: opts?.replyToId,
            read: false,
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

      createGroupChat: (name, memberIds) =>
        set((s) => ({
          groupChats: [
            { id: uid("gc"), name: name.trim() || "Grup baru", memberIds, messages: [], createdAt: Date.now() },
            ...s.groupChats,
          ],
        })),

      sendGroupMessage: (groupId, text) =>
        set((s) => ({
          groupChats: s.groupChats.map((g) =>
            g.id === groupId
              ? { ...g, messages: [...g.messages, { id: uid("gm"), fromId: s.currentUserId, text: text.trim(), createdAt: Date.now() }] }
              : g
          ),
        })),

      receiveGroupMessage: (groupId, fromId, text) =>
        set((s) => ({
          groupChats: s.groupChats.map((g) =>
            g.id === groupId
              ? { ...g, messages: [...g.messages, { id: uid("gm"), fromId, text, createdAt: Date.now() }] }
              : g
          ),
        })),

      receiveMessage: (userId, text) =>
        set((s) => {
          const msg = { id: uid("m"), fromId: userId, text, createdAt: Date.now() };
          const exists = s.conversations.some((c) => c.userId === userId);
          return {
            conversations: exists
              ? s.conversations.map((c) => (c.userId === userId ? { ...c, messages: [...c.messages, msg] } : c))
              : [{ userId, messages: [msg] }, ...s.conversations],
          };
        }),

      deleteMessage: (userId, messageId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.userId === userId ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c
          ),
        })),

      reactMessage: (userId, messageId, emoji) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.userId === userId
              ? { ...c, messages: c.messages.map((m) => (m.id === messageId ? { ...m, reaction: m.reaction === emoji ? undefined : emoji } : m)) }
              : c
          ),
        })),

      markConversationRead: (userId) =>
        set((s) => ({
          conversations: s.conversations.map((c) =>
            c.userId === userId
              ? { ...c, messages: c.messages.map((m) => (m.fromId === s.currentUserId ? { ...m, read: true } : m)) }
              : c
          ),
        })),

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

      drafts: [],
      saveDraft: (d) =>
        set((s) =>
          d.text.trim() || d.image
            ? { drafts: [{ id: uid("dr"), text: d.text, image: d.image, createdAt: Date.now() }, ...s.drafts].slice(0, 20) }
            : {}
        ),
      deleteDraft: (id) => set((s) => ({ drafts: s.drafts.filter((x) => x.id !== id) })),

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

      addComment: (postId, text, parentId) =>
        set((s) => {
          const comment: Comment = {
            id: uid("c"),
            userId: s.currentUserId,
            text: text.trim(),
            createdAt: Date.now(),
            parentId,
            likedBy: [],
          };
          return {
            posts: s.posts.map((p) =>
              p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
            ),
          };
        }),

      toggleCommentLike: (postId, commentId) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id !== postId
              ? p
              : {
                  ...p,
                  comments: p.comments.map((c) => {
                    if (c.id !== commentId) return c;
                    const likes = c.likedBy ?? [];
                    const liked = likes.includes(s.currentUserId);
                    return {
                      ...c,
                      likedBy: liked
                        ? likes.filter((id) => id !== s.currentUserId)
                        : [...likes, s.currentUserId],
                    };
                  }),
                }
          ),
        })),

      toggleArchiveChat: (userId) =>
        set((s) => ({
          archivedChatIds: s.archivedChatIds.includes(userId)
            ? s.archivedChatIds.filter((id) => id !== userId)
            : [userId, ...s.archivedChatIds],
        })),

      editPost: (postId, text) =>
        set((s) => ({
          posts: s.posts.map((p) => (p.id === postId ? { ...p, text: text.trim() } : p)),
        })),

      editComment: (postId, commentId, text) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId
              ? { ...p, comments: p.comments.map((c) => (c.id === commentId ? { ...c, text: text.trim() } : c)) }
              : p
          ),
        })),

      deleteComment: (postId, commentId) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === postId
              ? { ...p, comments: p.comments.filter((c) => c.id !== commentId && c.parentId !== commentId) }
              : p
          ),
        })),

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

      addStory: (image) =>
        set((s) => ({
          stories: [
            { id: uid("st"), userId: s.currentUserId, image, createdAt: Date.now(), seen: true },
            ...s.stories,
          ],
        })),

      toggleBlock: (userId) =>
        set((s) => ({
          blockedIds: s.blockedIds.includes(userId)
            ? s.blockedIds.filter((id) => id !== userId)
            : [userId, ...s.blockedIds],
          // berhenti mengikuti saat memblokir
          followingIds: s.blockedIds.includes(userId) ? s.followingIds : s.followingIds.filter((id) => id !== userId),
        })),

      banUser: (userId, banned) =>
        set((s) => ({
          users: s.users.map((u) => (u.id === userId ? { ...u, banned } : u)),
        })),

      updateProfile: (data) =>
        set((s) => ({
          users: s.users.map((u) =>
            u.id === s.currentUserId ? { ...u, ...data } : u
          ),
        })),

      lastNameChange: null,

      tryRename: (name) => {
        const clean = name.trim();
        const cur = get().me();
        if (!clean) return { ok: false, msg: "Nama tidak boleh kosong." };
        if (clean === cur.name) return { ok: true, msg: "" };
        const COOLDOWN = 30 * 24 * 60 * 60 * 1000; // 30 hari
        const last = get().lastNameChange;
        if (last && Date.now() - last < COOLDOWN) {
          const next = new Date(last + COOLDOWN).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          return { ok: false, msg: `Nama hanya bisa diganti 1× per 30 hari. Bisa diganti lagi pada ${next}.` };
        }
        set((s) => ({
          users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, name: clean } : u)),
          lastNameChange: Date.now(),
        }));
        return { ok: true, msg: "Nama berhasil diganti." };
      },

      resetAll: () =>
        set((s) => ({
          currentUserId: ME.id,
          users: SEED_USERS,
          posts: SEED_POSTS,
          stories: SEED_STORIES,
          conversations: SEED_CONVERSATIONS,
          groupChats: SEED_GROUP_CHATS,
          liveStreams: SEED_LIVES,
          scheduledLives: SEED_SCHEDULED,
          reminderIds: [],
          products: SEED_PRODUCTS,
          cart: [],
          orders: [],
          reviews: SEED_REVIEWS,
          wishlistIds: [],
          reels: SEED_REELS,
          reelComments: [],
          groups: SEED_GROUPS,
          joinedGroupIds: [],
          groupPosts: SEED_GROUP_POSTS,
          walletBalance: SEED_WALLET_BALANCE,
          walletTx: SEED_WALLET_TX,
          activeChatUserId: null,
          archivedChatIds: [],
          theme: s.theme,
          savedPostIds: [],
          followingIds: [],
          blockedIds: [],
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
          // selalu mulai dari Beranda & tanpa profil terbuka (cegah state view rusak)
          view: "feed",
          profileUserId: null,
        };
      },
    }
  )
);
