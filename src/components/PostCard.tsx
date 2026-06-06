import { useState } from "react";
import {
  Bookmark,
  Check,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Send,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import { useStore } from "../lib/store";
import { cn, timeAgo } from "../lib/utils";
import { useT } from "../lib/i18n";
import { VerifiedBadge } from "./VerifiedBadge";
import { EmojiPicker } from "./EmojiPicker";
import { MentionText } from "./MentionText";
import type { Comment, Post } from "../lib/types";

export function PostCard({ post }: { post: Post }) {
  const me = useStore((s) => s.currentUserId);
  const user = useStore((s) => s.user);
  const toggleLike = useStore((s) => s.toggleLike);
  const addComment = useStore((s) => s.addComment);
  const deletePost = useStore((s) => s.deletePost);
  const editPost = useStore((s) => s.editPost);
  const editComment = useStore((s) => s.editComment);
  const deleteComment = useStore((s) => s.deleteComment);
  const toggleCommentLike = useStore((s) => s.toggleCommentLike);
  const users = useStore((s) => s.users);
  const toggleSave = useStore((s) => s.toggleSave);
  const saved = useStore((s) => s.savedPostIds.includes(post.id));
  const openProfile = useStore((s) => s.openProfile);
  const tr = useT();

  const author = user(post.userId);
  const liked = post.likedBy.includes(me);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState("");
  const [menu, setMenu] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [postText, setPostText] = useState(post.text);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [editingC, setEditingC] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const tops = post.comments.filter((c) => !c.parentId);
  const repliesOf = (id: string) => post.comments.filter((c) => c.parentId === id);

  function sendComment() {
    if (!comment.trim()) return;
    addComment(post.id, comment, replyTo?.id);
    setComment("");
    setReplyTo(null);
    setShowComments(true);
  }
  function savePost() {
    editPost(post.id, postText);
    setEditingPost(false);
  }

  const mentionMatch = comment.match(/@([a-zA-Z0-9_.]*)$/);
  const mentionList = mentionMatch
    ? users
        .filter((u) => u.id !== me)
        .filter((u) => {
          const q = mentionMatch[1].toLowerCase();
          return u.username.toLowerCase().includes(q) || u.name.toLowerCase().includes(q);
        })
        .slice(0, 5)
    : [];
  function pickMention(username: string) {
    setComment(comment.replace(/@[a-zA-Z0-9_.]*$/, `@${username} `));
  }

  function CommentItem({ c, reply = false }: { c: Comment; reply?: boolean }) {
    const cu = user(c.userId);
    const canEdit = c.userId === me;
    const canDelete = c.userId === me || post.userId === me;
    const editingThis = editingC === c.id;
    return (
      <div className={cn("flex gap-2.5", reply && "ml-10")}>
        <button onClick={() => openProfile(cu.id)}>
          <img src={cu.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="inline-block rounded-2xl bg-white px-3 py-2 shadow-sm dark:bg-zinc-800">
            <button onClick={() => openProfile(cu.id)} className="flex items-center gap-1 text-xs font-semibold hover:underline">
              {cu.name} {cu.verified && <VerifiedBadge size={11} />}
            </button>
            {editingThis ? (
              <div className="mt-1 flex items-center gap-1">
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (editComment(post.id, c.id, editText), setEditingC(null))}
                  className="rounded-lg bg-zinc-100 px-2 py-1 text-sm outline-none dark:bg-zinc-700"
                  autoFocus
                />
                <button onClick={() => { editComment(post.id, c.id, editText); setEditingC(null); }} className="text-emerald-600"><Check size={16} /></button>
                <button onClick={() => setEditingC(null)} className="text-zinc-400"><X size={16} /></button>
              </div>
            ) : (
              <p className="text-sm text-zinc-700 dark:text-zinc-200"><MentionText text={c.text} /></p>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-3 pl-2 text-[11px] text-zinc-400">
            <span>{timeAgo(c.createdAt)}</span>
            <button onClick={() => toggleCommentLike(post.id, c.id)} className={cn("flex items-center gap-1 font-semibold", (c.likedBy ?? []).includes(me) ? "text-red-500" : "hover:text-zinc-600 dark:hover:text-zinc-300")}>
              <Heart size={12} className={(c.likedBy ?? []).includes(me) ? "fill-red-500" : ""} /> {(c.likedBy ?? []).length || ""}
            </button>
            {!reply && (
              <button onClick={() => { setReplyTo({ id: c.id, name: cu.name }); }} className="font-semibold hover:text-zinc-600 dark:hover:text-zinc-300">{tr("act.reply")}</button>
            )}
            {canEdit && !editingThis && (
              <button onClick={() => { setEditingC(c.id); setEditText(c.text); }} className="font-semibold hover:text-zinc-600 dark:hover:text-zinc-300">{tr("common.edit")}</button>
            )}
            {canDelete && (
              <button onClick={() => deleteComment(post.id, c.id)} className="font-semibold text-red-400 hover:text-red-600">{tr("common.delete")}</button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="animate-fade overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3 p-4">
        <button onClick={() => openProfile(author.id)}>
          <img src={author.avatar} alt={author.name} className="h-10 w-10 rounded-full object-cover" />
        </button>
        <div className="flex-1">
          <button onClick={() => openProfile(author.id)} className="flex items-center gap-1 text-sm font-semibold leading-tight hover:underline">
            {author.name}
            {author.verified && <VerifiedBadge size={15} />}
          </button>
          <p className="text-xs text-zinc-500">@{author.username} · {timeAgo(post.createdAt)}</p>
        </div>
        {post.userId === me && (
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} className="rounded-full p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><MoreHorizontal size={20} /></button>
            {menu && (
              <div className="absolute right-0 top-9 z-10 w-40 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800" onMouseLeave={() => setMenu(false)}>
                <button onClick={() => { setEditingPost(true); setPostText(post.text); setMenu(false); }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700"><Pencil size={16} /> {tr("common.edit")}</button>
                <button onClick={() => deletePost(post.id)} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"><Trash2 size={16} /> {tr("common.delete")}</button>
              </div>
            )}
          </div>
        )}
      </div>

      {editingPost ? (
        <div className="px-4 pb-3">
          <textarea value={postText} onChange={(e) => setPostText(e.target.value)} rows={3} className="w-full resize-none rounded-xl bg-zinc-100 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-fuchsia-300 dark:bg-zinc-800" autoFocus />
          <div className="mt-2 flex gap-2">
            <button onClick={savePost} className="rounded-full bg-fuchsia-600 px-4 py-1.5 text-sm font-semibold text-white">{tr("common.save")}</button>
            <button onClick={() => setEditingPost(false)} className="rounded-full bg-zinc-100 px-4 py-1.5 text-sm font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{tr("common.cancel")}</button>
          </div>
        </div>
      ) : (
        post.text && <p className="whitespace-pre-wrap px-4 pb-3 text-[15px] leading-relaxed text-zinc-800 dark:text-zinc-200">{post.text}</p>
      )}

      {post.image && (
        <img src={post.image} alt="post" className="max-h-[600px] w-full bg-zinc-100 object-cover" onDoubleClick={() => !liked && toggleLike(post.id)} />
      )}

      <div className="flex items-center justify-between px-4 pt-3 text-sm text-zinc-500">
        <span>{post.likedBy.length > 0 && `${post.likedBy.length} ${tr("act.likes")}`}</span>
        <span>{post.comments.length > 0 && `${post.comments.length} ${tr("act.comments")}`}</span>
      </div>

      <div className="mt-2 flex items-center gap-1 border-t border-zinc-100 px-2 py-1 dark:border-zinc-800">
        <button onClick={() => toggleLike(post.id)} className={cn("flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition hover:bg-zinc-100", liked ? "text-red-500" : "text-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800")}>
          <Heart size={20} className={liked ? "fill-red-500" : ""} /> {tr("act.like")}
        </button>
        <button onClick={() => setShowComments((v) => !v)} className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <MessageCircle size={20} /> {tr("act.comment")}
        </button>
        <button className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800">
          <Share2 size={20} /> {tr("act.share")}
        </button>
        <button onClick={() => toggleSave(post.id)} className={cn("rounded-lg p-2 transition hover:bg-zinc-100 dark:hover:bg-zinc-800", saved ? "text-fuchsia-600" : "text-zinc-600 dark:text-zinc-300")}>
          <Bookmark size={20} className={saved ? "fill-fuchsia-600" : ""} />
        </button>
      </div>

      {showComments && (
        <div className="border-t border-zinc-100 bg-zinc-50/60 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          <div className="space-y-3">
            {tops.map((c) => (
              <div key={c.id} className="space-y-2">
                <CommentItem c={c} />
                {repliesOf(c.id).map((r) => <CommentItem key={r.id} c={r} reply />)}
              </div>
            ))}
            {post.comments.length === 0 && <p className="py-1 text-center text-sm text-zinc-400">{tr("act.noComments")}</p>}
          </div>

          {replyTo && (
            <div className="mt-3 flex items-center justify-between rounded-lg bg-fuchsia-50 px-3 py-1.5 text-xs text-fuchsia-700 dark:bg-fuchsia-950/40 dark:text-fuchsia-300">
              <span>{tr("act.replyTo")} {replyTo.name}</span>
              <button onClick={() => setReplyTo(null)}><X size={14} /></button>
            </div>
          )}

          <div className="relative mt-3 flex items-center gap-2">
            {/* saran @mention */}
            {mentionList.length > 0 && (
              <div className="absolute bottom-full left-0 mb-2 w-60 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-800">
                {mentionList.map((u) => (
                  <button key={u.id} onClick={() => pickMention(u.username)} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-700">
                    <img src={u.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                    <span className="flex items-center gap-1 text-sm font-medium">{u.name} {u.verified && <VerifiedBadge size={11} />}</span>
                    <span className="ml-auto text-xs text-zinc-400">@{u.username}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex flex-1 items-center gap-1 rounded-full bg-white px-3 ring-1 ring-zinc-200 focus-within:ring-2 focus-within:ring-fuchsia-300 dark:bg-zinc-800 dark:ring-zinc-700">
              <input value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendComment()} placeholder={tr("act.commentPlaceholder")} className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
              <EmojiPicker onPick={(e) => setComment((c) => c + e)} />
            </div>
            <button onClick={sendComment} disabled={!comment.trim()} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fuchsia-600 text-white disabled:opacity-40"><Send size={16} /></button>
          </div>
        </div>
      )}
    </article>
  );
}
