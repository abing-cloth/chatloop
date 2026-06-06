import { useState } from "react";
import {
  Bookmark,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  Trash2,
} from "lucide-react";
import { useStore } from "../lib/store";
import { cn, timeAgo } from "../lib/utils";
import type { Post } from "../lib/types";

export function PostCard({ post }: { post: Post }) {
  const me = useStore((s) => s.currentUserId);
  const user = useStore((s) => s.user);
  const toggleLike = useStore((s) => s.toggleLike);
  const addComment = useStore((s) => s.addComment);
  const deletePost = useStore((s) => s.deletePost);

  const toggleSave = useStore((s) => s.toggleSave);
  const saved = useStore((s) => s.savedPostIds.includes(post.id));

  const author = user(post.userId);
  const liked = post.likedBy.includes(me);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [menu, setMenu] = useState(false);

  function sendComment() {
    if (!comment.trim()) return;
    addComment(post.id, comment);
    setComment("");
    setShowComments(true);
  }

  return (
    <article className="animate-fade overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* header */}
      <div className="flex items-center gap-3 p-4">
        <img src={author.avatar} alt={author.name} className="h-10 w-10 rounded-full object-cover" />
        <div className="flex-1">
          <p className="text-sm font-semibold leading-tight">{author.name}</p>
          <p className="text-xs text-zinc-500">
            @{author.username} · {timeAgo(post.createdAt)}
          </p>
        </div>
        {post.userId === me && (
          <div className="relative">
            <button
              onClick={() => setMenu((v) => !v)}
              className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <MoreHorizontal size={20} />
            </button>
            {menu && (
              <div
                className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
                onMouseLeave={() => setMenu(false)}
              >
                <button
                  onClick={() => deletePost(post.id)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                >
                  <Trash2 size={16} /> Hapus
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* text */}
      {post.text && (
        <p className="whitespace-pre-wrap px-4 pb-3 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">
          {post.text}
        </p>
      )}

      {/* image */}
      {post.image && (
        <img
          src={post.image}
          alt="post"
          className="max-h-[600px] w-full bg-zinc-100 object-cover"
          onDoubleClick={() => !liked && toggleLike(post.id)}
        />
      )}

      {/* counts */}
      <div className="flex items-center justify-between px-4 pt-3 text-sm text-zinc-500">
        <span>{post.likedBy.length > 0 && `${post.likedBy.length} suka`}</span>
        <span>{post.comments.length > 0 && `${post.comments.length} komentar`}</span>
      </div>

      {/* actions */}
      <div className="mt-2 flex items-center gap-1 border-t border-zinc-100 px-2 py-1 dark:border-zinc-800">
        <button
          onClick={() => toggleLike(post.id)}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition hover:bg-zinc-100",
            liked ? "text-red-500" : "text-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          )}
        >
          <Heart size={20} className={liked ? "fill-red-500" : ""} /> Suka
        </button>
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <MessageCircle size={20} /> Komentar
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <Share2 size={20} /> Bagikan
        </button>
        <button
          onClick={() => toggleSave(post.id)}
          className={cn(
            "rounded-lg p-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800",
            saved ? "text-fuchsia-600" : "text-zinc-600 dark:text-zinc-300"
          )}
        >
          <Bookmark size={20} className={saved ? "fill-fuchsia-600" : ""} />
        </button>
      </div>

      {/* comments */}
      {showComments && (
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="space-y-3">
            {post.comments.map((c) => {
              const cu = user(c.userId);
              return (
                <div key={c.id} className="flex gap-2.5">
                  <img src={cu.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                  <div className="rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-zinc-800">
                    <p className="text-xs font-semibold">{cu.name}</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-200">{c.text}</p>
                  </div>
                </div>
              );
            })}
            {post.comments.length === 0 && (
              <p className="py-1 text-center text-sm text-zinc-400">
                Belum ada komentar. Jadi yang pertama!
              </p>
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendComment()}
              placeholder="Tulis komentar..."
              className="flex-1 rounded-full bg-white px-4 py-2 text-sm outline-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800 dark:ring-zinc-700"
            />
            <button
              onClick={sendComment}
              disabled={!comment.trim()}
              className="grid h-9 w-9 place-items-center rounded-full bg-fuchsia-600 text-white disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
