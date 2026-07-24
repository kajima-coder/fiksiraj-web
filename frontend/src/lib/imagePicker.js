/**
 * Cross-platform image picker.
 *
 * On iOS (Capacitor WKWebView) we must NOT offer "Take Photo" (Apple rejection).
 * → Use @capacitor/camera with source=Photos to open the Photo Library only.
 *
 * On Web/Android we fall back to the standard <input type="file"> flow that the
 * caller already wired up (this helper just returns a signal telling the caller
 * to proceed with the input click).
 */
import { Capacitor } from "@capacitor/core";
import { Camera, CameraSource, CameraResultType } from "@capacitor/camera";

export const isIOS = () => Capacitor.getPlatform() === "ios";

/**
 * Ask the OS for a single image.
 * @returns {Promise<File|null>} A File object (or null if the user cancelled).
 *          Returns `undefined` when the caller should use its own <input type="file"> flow (non-iOS).
 */
export async function pickImageFromLibrary({ maxBytes } = {}) {
  if (!isIOS()) {
    // Web/Android: let the caller open its <input type="file"> as before.
    return undefined;
  }

  try {
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos, // Photo Library ONLY — never Take Photo
      allowEditing: false,
      quality: 90,
      correctOrientation: true,
    });

    if (!photo || !photo.base64String) return null;

    const mime = `image/${photo.format || "jpeg"}`;
    const bytes = Uint8Array.from(atob(photo.base64String), (c) => c.charCodeAt(0));

    if (maxBytes && bytes.byteLength > maxBytes) {
      const mb = Math.round(maxBytes / (1024 * 1024));
      throw new Error(`Slika je prevelika. Maksimalna veličina: ${mb}MB`);
    }

    const blob = new Blob([bytes], { type: mime });
    const filename = `photo-${Date.now()}.${photo.format || "jpg"}`;
    return new File([blob], filename, { type: mime });
  } catch (e) {
    // User cancelled — return null so callers can silently ignore
    const msg = String(e?.message || e || "");
    if (msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("user")) {
      return null;
    }
    throw e;
  }
}
