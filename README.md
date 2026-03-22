# Deskly Tauri

Deskly desktop app built with Tauri + React + TypeScript.

## Quick Command Reference

Run from repository root:

pnpm install
pnpm dev
pnpm build
pnpm tauri dev
pnpm tauri build

## First-Time Updater Setup

### 1. Generate signing keys (one time)

Windows PowerShell:

pnpm tauri signer generate -w "$HOME\\.tauri\\deskly.key"

This creates:

1. Private key file at C:\Users\YOUR_USER\.tauri\deskly.key
2. Public key file at C:\Users\YOUR_USER\.tauri\deskly.key.pub

### 2. Set updater public key in Tauri config

Open [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) and set:

1. plugins.updater.pubkey to the full content of your public key file
2. plugins.updater.endpoints to the GitHub release latest.json URL

Current endpoint used by this repo:

https://github.com/Vishal-770/deskly-tauri/releases/latest/download/latest.json

### 3. Add GitHub Actions secrets

GitHub repo -> Settings -> Secrets and variables -> Actions -> New repository secret

Add:

1. TAURI_SIGNING_PRIVATE_KEY = full content of deskly.key
2. TAURI_SIGNING_PRIVATE_KEY_PASSWORD = key password (or empty if none)

## Daily Development Commands

Install dependencies:

pnpm install

Run web app only:

pnpm dev

Run Tauri desktop in dev mode:

pnpm tauri dev

Type check + production web build:

pnpm build

## Local Release Build Commands

Build signed desktop installers locally (uses env vars):

PowerShell:

$env:TAURI_SIGNING_PRIVATE_KEY = Get-Content "$HOME\\.tauri\\deskly.key" -Raw
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = "YOUR_PASSWORD"
pnpm tauri build

After build, updater files appear under src-tauri/target/release/bundle with installer files plus matching .sig files.

## How To Publish An Update

### 1. Ensure branch and commits are ready

git checkout main
git pull
git status

### 2. Bump version

Update version consistently where required:

1. [package.json](package.json)
2. [src-tauri/Cargo.toml](src-tauri/Cargo.toml)
3. [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json)

Then commit:

git add -A
git commit -m "chore: release vX.Y.Z"
git push origin main

### 3. Create and push release tag

git tag vX.Y.Z
git push origin vX.Y.Z

Pushing this tag triggers [tauri-release.yml](.github/workflows/tauri-release.yml).

### 4. What CI does automatically

1. Builds signed installers for Windows, Linux, and macOS
2. Uploads installers and signature files
3. Generates latest.json using [generate-latest-json.mjs](scripts/generate-latest-json.mjs)
4. Publishes release assets to GitHub Release for that tag

## Commands For Update Metadata Script

The helper script can also be run manually:

pnpm updater:latest-json -- --assetsDir release-assets --repository Vishal-770/deskly-tauri --tag vX.Y.Z --version X.Y.Z --notes "Release vX.Y.Z"

## User Update Flow In App

In Settings page users can:

1. Check for updates
2. Download update with progress
3. Install update

This lets users update without manually downloading new installers.

## Troubleshooting

If workflow fails with signing errors:

1. Verify TAURI_SIGNING_PRIVATE_KEY exists and has full key content
2. Verify TAURI_SIGNING_PRIVATE_KEY_PASSWORD is correct

If app says signature mismatch:

1. Confirm pubkey in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) matches the private key used in CI
2. Confirm release assets include both installer and matching .sig files

## Recommended IDE Setup

1. [VS Code](https://code.visualstudio.com/)
2. [Tauri VS Code extension](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
3. [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
