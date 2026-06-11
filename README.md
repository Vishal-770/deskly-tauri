# Deskly Tauri

Deskly desktop app built with Tauri + React + TypeScript.

## Quick Command Reference

Run from repository root:

pnpm install
pnpm dev
pnpm build
pnpm tauri dev
pnpm tauri build

## First-Time Updater Setup & Pre-Generated Keys

> [!IMPORTANT]
> **Updater signing keys have already been pre-generated for you!** 
> The public key is already configured in [src-tauri/tauri.conf.json](src-tauri/tauri.conf.json).
> You only need to add the private key to your GitHub Repository Secrets to complete the setup.

### 1. Pre-Generated Keys (Copy-Paste)

- **Public Key** (already set in `tauri.conf.json`):
  ```text
  dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEY1ODlCMjE1M0E1QTY4RkUKUldUK2FGbzZGYktKOVpjcDc0WHhXMENMS2srQ0YrdlJiZGF6ZjFaVHlnZWFWYW1rR0JEZ1Q4YVYK
  ```
- **Private Key** (add to GitHub Secrets as `TAURI_SIGNING_PRIVATE_KEY`):
  ```text
  <PASTE_TAURI_SIGNING_PRIVATE_KEY_FROM_CHAT_HERE>
  ```

### 2. GitHub Actions Secrets Configuration

1. Go to your GitHub repository: **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**.
2. Create the following secret:
   - **Name**: `TAURI_SIGNING_PRIVATE_KEY`
   - **Value**: (Copy and paste the private key from your chat history)
3. Do **NOT** set `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (or leave it empty/delete it if it exists) because this key was generated without a password.

### 3. (Optional) Manual Signer Key Generation

If you ever need to generate new keys in the future, run:

```bash
# Non-interactive CLI command (ideal for automated environments or quick setup)
pnpm tauri signer generate --ci
```

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

## Release Checklist (Copy-Paste, v0.1.1)

Use this block from repository root to release `v0.1.1`:

```powershell
# 0) Start clean
git checkout main
git pull origin main
git status

# 1) Update versions manually in these files to 0.1.1
#    - package.json
#    - src-tauri/Cargo.toml
#    - src-tauri/tauri.conf.json

# 2) Verify app still builds
pnpm install
pnpm build

# 3) Commit version bump
git add -A
git commit -m "chore: release v0.1.1"
git push origin main

# 4) Create and push release tag (this triggers GitHub Actions release workflow)
git tag v0.1.1
git push origin v0.1.1

# 5) Confirm workflow ran
# GitHub -> Actions -> "Tauri Release"
# Then verify release assets include installers, .sig files, and latest.json
```

Rollback tag if pushed by mistake:

```powershell
git tag -d v0.1.1
git push origin :refs/tags/v0.1.1
```

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
