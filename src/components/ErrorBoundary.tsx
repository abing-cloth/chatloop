import { Component, type ReactNode } from "react";
import { asset } from "../lib/utils";

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("SUUCHAT error:", error);
  }

  reset = () => {
    try {
      localStorage.removeItem("loop-store-v1");
    } catch {
      /* abaikan */
    }
    location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 p-8 text-center dark:bg-zinc-950">
        <img src={asset("chatloop.svg")} alt="SUUCHAT" className="h-16 w-16" />
        <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">Ups, terjadi kesalahan</h1>
        <p className="max-w-sm text-sm text-zinc-500">
          Maaf, ada gangguan. Coba muat ulang. Jika masih bermasalah, pulihkan data demo.
        </p>
        <p className="max-w-sm break-words rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-400 dark:bg-zinc-900">
          {this.state.message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => location.reload()}
            className="rounded-full bg-zinc-200 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200"
          >
            Muat ulang
          </button>
          <button
            onClick={this.reset}
            className="rounded-full bg-gradient-to-r from-fuchsia-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Pulihkan data
          </button>
        </div>
      </div>
    );
  }
}
