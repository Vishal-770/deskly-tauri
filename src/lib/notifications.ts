import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

/**
 * Triggers a native OS notification. If permission is not yet granted,
 * it requests permission.
 */
export async function showNotification(title: string, body: string): Promise<boolean> {
  try {
    let permissionGranted = await isPermissionGranted();
    if (!permissionGranted) {
      const permission = await requestPermission();
      permissionGranted = permission === "granted";
    }

    if (permissionGranted) {
      sendNotification({ title, body });
      return true;
    } else {
      console.warn("Notification permission denied by user. Message:", body);
      return false;
    }
  } catch (err) {
    console.error("Failed to show native notification:", err);
    return false;
  }
}
