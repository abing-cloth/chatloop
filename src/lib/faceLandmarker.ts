import { FaceLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";

let instance: FaceLandmarker | null = null;
let loading: Promise<FaceLandmarker | null> | null = null;

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";

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
        numFaces: 5,
      });
      return instance;
    } catch {
      try {
        // fallback CPU
        const vision = await FilesetResolver.forVisionTasks(WASM);
        instance = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL, delegate: "CPU" },
          runningMode: "VIDEO",
          numFaces: 5,
        });
        return instance;
      } catch {
        return null;
      }
    }
  })();
  return loading;
}
