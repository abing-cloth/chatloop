// Buka kunci dengan biometrik perangkat (sidik jari / Face ID) via WebAuthn.
// Best-effort & lokal (tanpa server) — untuk demo. Gagal/anggun ke PIN bila tak didukung.

function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function b64ToBuf(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr.buffer;
}

export function biometricSupported(): boolean {
  return typeof window !== "undefined" && !!window.PublicKeyCredential;
}

export async function biometricAvailable(): Promise<boolean> {
  if (!biometricSupported()) return false;
  try {
    return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/** Daftarkan biometrik; kembalikan credential id (base64) atau null bila gagal. */
export async function registerBiometric(userName: string): Promise<string | null> {
  if (!biometricSupported()) return null;
  try {
    const cred = (await navigator.credentials.create({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        rp: { name: "ChatLoop" },
        user: {
          id: crypto.getRandomValues(new Uint8Array(16)),
          name: userName,
          displayName: userName,
        },
        pubKeyCredParams: [
          { type: "public-key", alg: -7 },
          { type: "public-key", alg: -257 },
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
      },
    })) as PublicKeyCredential | null;
    return cred ? bufToB64(cred.rawId) : null;
  } catch {
    return null;
  }
}

/** Verifikasi biometrik dengan credential id tersimpan. */
export async function verifyBiometric(credId: string): Promise<boolean> {
  if (!biometricSupported() || !credId) return false;
  try {
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [{ type: "public-key", id: b64ToBuf(credId) }],
        userVerification: "required",
        timeout: 60000,
      },
    });
    return !!assertion;
  } catch {
    return false;
  }
}
