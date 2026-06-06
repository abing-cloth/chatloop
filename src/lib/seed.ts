import type { Conversation, LiveStream, Post, ScheduledLive, Story, User } from "./types";

const img = (seed: string, w = 800, h = 800) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;
const avatar = (seed: string) =>
  `https://i.pravatar.cc/150?u=${seed}`;

export const ME: User = {
  id: "me",
  name: "Kamu",
  username: "kamu",
  avatar: avatar("kamu-loop"),
  bio: "Halo! Aku pengguna baru di ChatLoop 🔄",
  verified: true,
};

export const SEED_USERS: User[] = [
  ME,
  { id: "u1", name: "Sari Dewi", username: "saridewi", avatar: avatar("sari"), bio: "Pecinta kopi & senja ☕🌇", verified: true },
  { id: "u2", name: "Budi Santoso", username: "budisantoso", avatar: avatar("budi"), bio: "Fotografi jalanan 📷", verified: true },
  { id: "u3", name: "Maya Putri", username: "mayaputri", avatar: avatar("maya"), bio: "Travel | Food | Vibes ✈️", verified: true },
  { id: "u4", name: "Rizky Pratama", username: "rizkypratama", avatar: avatar("rizky"), bio: "Developer & gamer 🎮", verified: true },
  { id: "u5", name: "Indah Lestari", username: "indahlestari", avatar: avatar("indah"), bio: "Yoga every morning 🧘‍♀️", verified: true },
];

const now = Date.now();
const min = 60 * 1000;
const hr = 60 * min;

export const SEED_POSTS: Post[] = [
  {
    id: "p1",
    userId: "u1",
    text: "Senja hari ini benar-benar juara 🌅 Siapa yang juga suka momen golden hour?",
    image: img("sunset-loop"),
    createdAt: now - 25 * min,
    likedBy: ["u2", "u3", "u4"],
    comments: [
      { id: "c1", userId: "u3", text: "Indah banget Sar! 😍", createdAt: now - 20 * min },
      { id: "c2", userId: "u2", text: "Pakai kamera apa nih?", createdAt: now - 18 * min },
    ],
  },
  {
    id: "p2",
    userId: "u2",
    text: "Hunting foto di kota tua. Sudut-sudut lama selalu punya cerita. 🏛️📷",
    image: img("street-loop"),
    createdAt: now - 2 * hr,
    likedBy: ["u1", "u5"],
    comments: [{ id: "c3", userId: "u5", text: "Komposisinya keren!", createdAt: now - 1 * hr }],
  },
  {
    id: "p3",
    userId: "u3",
    text: "Throwback ke pantai minggu lalu. Pengen balik lagi 🏖️",
    image: img("beach-loop"),
    createdAt: now - 5 * hr,
    likedBy: ["u1", "u2", "u4", "u5"],
    comments: [],
  },
  {
    id: "p4",
    userId: "u4",
    text: "Akhirnya rilis fitur baru di project-ku. Ngoding sampai subuh worth it banget 🚀💻",
    createdAt: now - 8 * hr,
    likedBy: ["u5"],
    comments: [{ id: "c4", userId: "u1", text: "Selamat! 🎉", createdAt: now - 7 * hr }],
  },
  {
    id: "p5",
    userId: "u5",
    text: "Pagi yang tenang dengan secangkir teh. Mulai hari dengan rasa syukur 🍵✨",
    image: img("tea-loop"),
    createdAt: now - 12 * hr,
    likedBy: ["u3"],
    comments: [],
  },
];

export const SEED_STORIES: Story[] = SEED_USERS.slice(1).map((u, i) => ({
  id: `s${i}`,
  userId: u.id,
  image: img(`story-${u.id}`, 600, 1000),
  createdAt: now - i * hr,
  seen: false,
}));

export const SEED_LIVES: LiveStream[] = [
  { id: "l1", userId: "u4", title: "Live coding: bikin fitur baru 💻🚀", thumbnail: img("live-code", 600, 800), viewers: 2104, category: "Teknologi" },
  { id: "l2", userId: "u3", title: "Jalan-jalan sore di pantai 🏖️", thumbnail: img("live-beach", 600, 800), viewers: 1243, category: "Travel" },
  { id: "l3", userId: "u1", title: "Ngopi & ngobrol santai bareng ☕", thumbnail: img("live-coffee", 600, 800), viewers: 876, category: "Obrolan" },
  { id: "l4", userId: "u5", title: "Yoga pagi, yuk gerak bareng 🧘‍♀️", thumbnail: img("live-yoga", 600, 800), viewers: 654, category: "Kesehatan" },
  { id: "l5", userId: "u2", title: "Hunting foto street photography 📷", thumbnail: img("live-street", 600, 800), viewers: 432, category: "Fotografi" },
];

const day = 24 * hr;
export const SEED_SCHEDULED: ScheduledLive[] = [
  { id: "sc1", userId: "u1", title: "Workshop seduh kopi manual ☕", category: "Obrolan", thumbnail: img("sched-coffee", 600, 400), startsAt: now + 3 * hr },
  { id: "sc2", userId: "u4", title: "Bedah fitur baru ChatLoop bareng 💻", category: "Teknologi", thumbnail: img("sched-tech", 600, 400), startsAt: now + 1 * day },
  { id: "sc3", userId: "u3", title: "Live trip ke Raja Ampat 🐠", category: "Travel", thumbnail: img("sched-travel", 600, 400), startsAt: now + 2 * day + 5 * hr },
];

export const SEED_CONVERSATIONS: Conversation[] = [
  {
    userId: "u1",
    messages: [
      { id: "m1", fromId: "u1", text: "Hai! Foto senjamu keren banget 😍", createdAt: now - 30 * min },
      { id: "m2", fromId: "me", text: "Makasih Sari! Kapan-kapan hunting bareng yuk", createdAt: now - 28 * min },
      { id: "m3", fromId: "u1", text: "Boleh banget! Weekend ini gimana?", createdAt: now - 26 * min },
    ],
  },
  {
    userId: "u4",
    messages: [
      { id: "m4", fromId: "u4", text: "Bro, fitur baru di ChatLoop mantap juga 🚀", createdAt: now - 3 * hr },
      { id: "m5", fromId: "me", text: "Haha makasih, masih banyak yang mau ditambah", createdAt: now - 2.5 * hr },
    ],
  },
  {
    userId: "u3",
    messages: [
      { id: "m6", fromId: "u3", text: "Rekomendasi tempat liburan dong!", createdAt: now - 26 * hr },
    ],
  },
];
