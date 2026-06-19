import { invoke } from '@tauri-apps/api/core'

/** Prod: save with AES-256-GCM encryption */
export async function save(data: string, key: string): Promise<void> {
  return invoke('encrypt_save', { data, key })
}

/** Prod: load with AES-256-GCM decryption */
export async function load(key: string): Promise<string> {
  return invoke('decrypt_load', { key })
}

/** Prod: check if vault file exists */
export async function exists(): Promise<boolean> {
  return invoke('has_vault_file')
}
