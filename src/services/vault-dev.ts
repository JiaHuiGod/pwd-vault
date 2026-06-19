import { invoke } from '@tauri-apps/api/core'

/** Dev: save plain JSON (no encryption) */
export async function save(data: string, _key: string): Promise<void> {
  return invoke('plain_save', { data })
}

/** Dev: load plain JSON (no decryption) */
export async function load(_key: string): Promise<string> {
  return invoke('plain_load')
}

/** Dev: check if vault file exists */
export async function exists(): Promise<boolean> {
  return invoke('has_vault_file')
}
