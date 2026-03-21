# Tauri Native Auth Implementation

This project now has a Tauri-native auth flow in `src-tauri` with a React integration in `src`.

## What is implemented

- Rust commands for auth/session lifecycle:
  - `auth_login`
  - `auth_logout`
  - `auth_get_state`
  - `auth_restore_session`
  - `auth_set_tokens`
  - `auth_get_tokens`
  - `auth_clear_tokens`
- In-memory + persisted auth storage in:
  - `src-tauri/src/auth.rs`
- React invoke wrapper in:
  - `src/lib/tauri-auth.ts`
- React auth context/provider in:
  - `src/components/auth-provider.tsx`
- UI wired to backend:
  - Login page: `src/pages/index.tsx`
  - Dashboard page: `src/pages/dashboard.tsx`

## Persistence model

Auth data is saved as JSON in Tauri app data dir under `auth_state.json`.

Stored keys:
- `state`: `{ userId, loggedIn, lastLogin }`
- `tokens`: `{ authorizedID, csrf, cookies }`

## Notes

- `auth_login` currently validates username/password are non-empty and then creates a session.
- This is intentionally backend-driven and does not depend on any code from `Deskly/`.
- You can later plug your real upstream API login in `src-tauri/src/auth.rs` while keeping frontend API unchanged.

## Quick verify

```powershell
pnpm run build
pnpm run tauri dev
```

## Optional hardening

- Move token persistence to OS keychain/secure storage plugin.
- Add command-level rate limiting and structured error codes.
- Replace demo login behavior with real remote authentication.

