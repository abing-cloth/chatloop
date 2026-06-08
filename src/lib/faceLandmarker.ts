import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { asset } from "./utils";

let instance: FaceLandmarker | null = null;
let loading: Promise<FaceLandmarker | null> | null = null;

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
// model di-host sendiri (same-origin) -> andal & cepat, tak bergantung storage.googleapis
const MODEL = asset("mp/face_landmarker.task");

/** Muat FaceLandmarker sekali (lacak hingga 5 wajah). Null jika gagal/tak didukung. */
export async function getFaceLandmarker(): Promise<FaceLandmarker | null> {
  if (instance) return instance;
  if (loading) return loading;
  loading = (async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM);
      instance = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
        runningMode: "VIDEO",
        numFaces: 3,
      });
      return instance;
    } catch {
      try {
        // fallback CPU
        const vision = await FilesetResolver.forVisionTasks(WASM);
        instance = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 3,
        });
        return instance;
      } catch {
        return null;
      }
    }
  })();
  return loading;
}
