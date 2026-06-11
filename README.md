# Deskly Tauri

Deskly desktop app built with Tauri + React + TypeScript.

## Quick Start

### 1. Installation
Install project dependencies:
```bash
pnpm install
```

### 2. Run Desktop App (Dev Mode)
Start the app locally:
```bash
pnpm tauri dev
```

### 3. Build Desktop App (Production)
Build the app locally:
```bash
pnpm tauri build
```

---

## Publishing a Release

We use GitHub Actions to automatically build, sign, and release Deskly.

### Steps to Release a New Version:
1. Update version number consistently in:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
2. Commit and push the changes:
   ```bash
   git add -A
   git commit -m "chore: release vX.Y.Z"
   git push origin master
   ```
3. Tag and push the new version:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
