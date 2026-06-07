// Deteksi gender (cewek/cowok) via face-api (lazy, dari CDN). Untuk auto-atur kekuatan filter.
// Gagal/offline -> null (pemanggil pakai default). Tidak menambah bobot bundle (import URL saat dipakai).
/* eslint-disable @typescript-eslint/no-explicit-any */
let api: any = null;
let loaded = false;
let loading: Promise<boolean> | null = null;

const CDN = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.esm.js";
const MODELS = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

export async function loadGender(): Promise<boolean> {
  if (loaded) return true;
  if (loading) return loading;
  loading = (async () => {
    try {
      api = await import(/* @vite-ignore */ CDN);
      await api.nets.tinyFaceDetector.loadFromUri(MODELS);
      await api.nets.ageGenderNet.loadFromUri(MODELS);
      loaded = true;
      return true;
    } catch {
      return false;
    }
  })();
  return loading;
}

/** "male" | "female" | null. */
export async function detectGender(video: HTMLVideoElement): Promise<"male" | "female" | null> {
  if (!loaded || !api || !video.videoWidth) return null;
  try {
    const r = await api
      .detectSingleFace(video, new api.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 }))
      .withAgeAndGender();
    if (r && (r.gender === "male" || r.gender === "female") && r.genderProbability > 0.6) return r.gender;
    return null;
  } catch {
    return null;
  }
}
