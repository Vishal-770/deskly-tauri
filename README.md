# Deskly Tauri

Deskly desktop app built with Tauri + React + TypeScript.

## Updater Setup

The app now uses the Tauri updater plugin with static metadata from GitHub Releases.

### 1. Generate signing keys (one-time)

Run this once on a secure machine and store the private key safely:

```bash
pnpm tauri signer generate -w ~/.tauri/deskly.key
```

This produces:

1. Private key file (`deskly.key`) used only in CI or local release builds.
2. Public key content (`deskly.key.pub`) to copy into Tauri config.

### 2. Configure updater public key

Set the updater public key in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json):

1. Replace `REPLACE_WITH_TAURI_PUBLIC_KEY` with the full public key string.
2. Keep the endpoint pointing at GitHub latest metadata:
	`https://github.com/Vishal-770/deskly-tauri/releases/latest/download/latest.json`

### 3. Configure GitHub secrets

Add these repository secrets:

1. `TAURI_SIGNING_PRIVATE_KEY`: contents of your private key (or secure path style if your runner supports it).
2. `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: private key password (can be empty if no password).

## Release Workflow

Release automation is defined in [.github/workflows/tauri-release.yml](.github/workflows/tauri-release.yml).

Trigger:

1. Push a semantic version tag: `vX.Y.Z`

What it does:

1. Builds signed installers for Windows, Linux, macOS.
2. Uploads installer artifacts and `.sig` signature files.
3. Generates `latest.json` using [scripts/generate-latest-json.mjs](scripts/generate-latest-json.mjs).
4. Publishes everything to the GitHub Release for that tag.

## Settings Update Flow

The Settings page includes manual updater actions:

1. Check for updates.
2. Download update with progress.
3. Install update when download is complete.

This lets users update in-app without manually re-downloading installers.

## Recommended IDE Setup

1. [VS Code](https://code.visualstudio.com/)
2. [Tauri VS Code extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
3. [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
