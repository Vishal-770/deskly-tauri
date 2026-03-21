import { invoke } from '@tauri-apps/api/core'

export type AuthState = {
  userId: string
  loggedIn: boolean
  lastLogin: number
}

export type AuthTokens = {
  authorizedID: string
  csrf: string
  cookies: string
}

export async function authLogin(username: string, password: string) {
  return invoke<AuthState>('auth_login', { username, password })
}

export async function authLogout() {
  return invoke<boolean>('auth_logout')
}

export async function authGetState() {
  return invoke<AuthState | null>('auth_get_state')
}

export async function authRestoreSession() {
  return invoke<AuthState | null>('auth_restore_session')
}

export async function authSetTokens(tokens: AuthTokens) {
  return invoke<boolean>('auth_set_tokens', { tokens })
}

export async function authGetTokens() {
  return invoke<AuthTokens | null>('auth_get_tokens')
}

export async function authClearTokens() {
  return invoke<boolean>('auth_clear_tokens')
}

