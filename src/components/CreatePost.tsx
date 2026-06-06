import { useRef, useState } from "react";
import { Camera, FileText, ImagePlus, Send, Trash2, X } from "lucide-react";
import { useStore } from "../lib/store";
import { fileToDataUrl, timeAgo } from "../lib/utils";
import { useT } from "../lib/i18n";
import { EmojiPicker } from "./EmojiPicker";
import { CameraCapture } from "./CameraCapture";

export function CreatePost() {
  const me = useStore((s) => s.me());
  const addPost = useStore((s) => s.addPost);
  const drafts = useStore((s) => s.drafts);
  const saveDraft = useStore((s) => s.saveDraft);
  const deleteDraft = useStore((s) => s.deleteDraft);
  const tr = useT();

  const [text, setText] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [saved, setSaved] = useState(false);
  const [showDrafts, setShowDrafts] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const canPost = text.trim().length > 0 || image;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setImage(await fileToDataUrl(file));
    e.target.value = "";
  }

  function submit() {
    if (!canPost) return;
    addPost(text, image);
    setText("");
    setImage(undefined);
  }

  function doSaveDraft() {
    saveDraft({ text, image });
    setSaved(true);
    setText("");
    setImage(undefined);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex gap-3">
        <img src={me.avatar} alt={me.name} className="h-10 w-10 rounded-full object-cover" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tr("post.placeholder")}
          rows={2}
          className="min-h-[44px] flex-1 resize-none rounded-xl bg-zinc-100 px-4 py-2.5 text-[15px] outline-none placeholder:text-zinc-400 focus:bg-zinc-50 focus:ring-2 focus:ring-fuchsia-200 dark:bg-zinc-800 dark:focus:bg-zinc-800"
        />
      </div>

      {image && (
        <div className="relative mt-3 ml-13 overflow-hidden rounded-xl">
          <img src={image} alt="preview" className="max-h-80 w-full object-cover" />
          <button onClick={() => setImage(undefined)} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"><X size={16} /></button>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
        <div className="flex items-center gap-1">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40">
            <ImagePlus size={18} /> {tr("post.photo")}
          </button>
          <button onClick={() => setShowCamera(true)} className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/40">
            <Camera size={18} /> Kamera
          </button>
          <div className="rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <EmojiPicker onPick={(e) => setText((t) => t + e)} />
          </div>
          {canPost && (
            <button onClick={doSaveDraft} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800">
              <FileText size={16} /> {saved ? tr("post.draftSaved") : tr("post.draft")}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
        <button
          onClick={submit}
          disabled={!canPost}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {tr("post.send")} <Send size={15} />
        </button>
      </div>

      {showCamera && (
        <CameraCapture
          onClose={() => setShowCamera(false)}
          onCapture={(d) => { setImage(d); setShowCamera(false); }}
        />
      )}

      {/* daftar draf tersimpan */}
      {drafts.length > 0 && (
        <div className="mt-3 border-t border-zinc-100 pt-2 dark:border-zinc-800">
          <button onClick={() => setShowDrafts((v) => !v)} className="flex w-full items-center justify-between text-xs font-medium text-zinc-500">
            <span>📝 {tr("post.drafts")} ({drafts.length})</span>
            <span>{showDrafts ? "▲" : "▼"}</span>
          </button>
          {showDrafts && (
            <div className="mt-2 space-y-1.5">
              {drafts.map((d) => (
                <div key={d.id} className="flex items-center gap-2 rounded-lg bg-zinc-50 p-2 dark:bg-zinc-800/50">
                  {d.image && <img src={d.image} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />}
                  <button onClick={() => { setText(d.text); setImage(d.image); deleteDraft(d.id); setShowDrafts(false); }} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm">{d.text || "(foto saja)"}</p>
                    <p className="text-[11px] text-zinc-400">{timeAgo(d.createdAt)} · ketuk untuk lanjut</p>
                  </button>
                  <button onClick={() => deleteDraft(d.id)} className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"><Trash2 size={14} /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
