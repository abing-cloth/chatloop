import { ImageSegmenter, FilesetResolver } from "@mediapipe/tasks-vision";

let instance: ImageSegmenter | null = null;
let loading: Promise<ImageSegmenter | null> | null = null;

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL = "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite";

async function create(delegate: "GPU" | "CPU") {
  const vision = await FilesetResolver.forVisionTasks(WASM);
  return ImageSegmenter.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL, delegate },
    runningMode: "VIDEO",
    outputCategoryMask: false,
    outputConfidenceMasks: true,
  });
}

/** Muat Selfie Segmenter (mask orang/badan). Null bila gagal. */
export async function getSelfieSegmenter(): Promise<ImageSegmenter | null> {
  if (instance) return instance;
  if (loading) return loading;
  loading = (async () => {
    try { instance = await create("GPU"); return instance; }
    catch { try { instance = await create("CPU"); return instance; } catch { return null; } }
  })();
  return loading;
}
