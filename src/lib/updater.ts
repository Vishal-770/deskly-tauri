import { check } from "@tauri-apps/plugin-updater";
import { showNotification } from "./notifications";

/**
 * Checks for software updates from GitHub Releases.
 * @param silent If true, doesn't display "Up to date" or download started dialogs. Only alerts if an update is found.
 * @returns A promise that resolves when the check completes.
 */
export async function checkForUpdates(silent = false): Promise<void> {
  try {
    const update = await check();
    if (!update) {
      if (!silent) {
        await showNotification("Software Update", "Your application is already up to date!");
      }
      return;
    }

    if (silent) {
      // For background startup checks, notify natively without blocking the thread
      await showNotification(
        "Update Available",
        `A new version (v${update.version}) is available. You can download and install it from Settings.`
      );
    } else {
      // Fallback/Manual check via notifier (though settings UI has a dedicated checker)
      await showNotification(
        "Update Available",
        `Deskly v${update.version} is available. Go to Settings to view changelog and install.`
      );
    }
  } catch (err) {
    console.error("Failed to check for updates:", err);
    if (!silent) {
      await showNotification(
        "Software Update Error",
        `Failed to check for updates: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}

