import { useStore } from "../lib/store";

export function MentionText({ text }: { text: string }) {
  const users = useStore((s) => s.users);
  const openProfile = useStore((s) => s.openProfile);
  const parts = text.split(/(@[a-zA-Z0-9_.]+)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("@")) {
          const uname = part.slice(1).toLowerCase();
          const u = users.find((x) => x.username.toLowerCase() === uname);
          if (u) {
            return (
              <button
                key={i}
                onClick={() => openProfile(u.id)}
                className="font-semibold text-fuchsia-600 hover:underline dark:text-fuchsia-400"
              >
                {part}
              </button>
            );
          }
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
