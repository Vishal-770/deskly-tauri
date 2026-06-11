import { check } from "@tauri-apps/plugin-updater";

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
        alert("Your application is already up to date!");
      }
      return;
    }

    const confirmUpdate = silent
      ? window.confirm(`A new update (v${update.version}) is available. Would you like to install it now?`)
      : window.confirm(`A new version (v${update.version}) is available.\n\nRelease Date: ${update.date || "N/A"}\n\nWould you like to download and install this update?`);

    if (confirmUpdate) {
      if (!silent) {
        alert("Downloading and installing update. Deskly will automatically restart once completed.");
      }
      await update.downloadAndInstall();
    }
  } catch (err) {
    console.error("Failed to check for updates:", err);
    if (!silent) {
      alert(`Failed to check for updates: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
