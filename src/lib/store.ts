import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Comment, Conversation, LiveStream, Post, Story, Theme, User } from "./types";
import {
  ME,
  SEED_CONVERSATIONS,
  SEED_LIVES,
  SEED_POSTS,
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
  showActivity: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  privateAccount: false,
  notifLikes: true,
  notifComments: true,
  notifFollows: true,
  showActivity: true,
};

interface State {
  currentUserId: string;
  users: User[];
  posts: Post[];
  stories: Story[];
  conversations: Conversation[];
  liveStreams: LiveStream[];
  theme: Theme;
  savedPostIds: string[];
  followingIds: string[];
  isAuthed: boolean;
  settings: Settings;

  user: (id: string) => User;
  me: () => User;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;

  login: (userId: string) => void;
  register: (data: { name: string; username: string }) => void;
  logout: () => void;

  toggleTheme: () => void;
  sendMessage: (userId: string, text: string) => void;
  toggleSave: (postId: string) => void;
  toggleFollow: (userId: string) => void;

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

      register: ({ name, username }) =>
        set((s) => {
          const id = uid("u");
          const clean = username.trim().toLowerCase().replace(/\s+/g, "");
          const newUser: User = {
            id,
            name: name.trim(),
            username: clean,
            avatar: `https://i.pravatar.cc/150?u=${encodeURIComponent(clean || id)}`,
            bio: "Pengguna baru di ChatLoop 🔄",
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
          theme: s.theme,
          savedPostIds: [],
          followingIds: [],
          isAuthed: true,
        })),
    }),
    { name: "loop-store-v1" }
  )
);
