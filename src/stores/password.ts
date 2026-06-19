import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import type { PasswordItem } from '../types'

const TEMP_STORAGE_KEY = 'psw_temp_passwords'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const usePasswordStore = defineStore('passwords', () => {
  const passwords = ref<PasswordItem[]>([])
  const searchQuery = ref('')
  const _adminPassword = ref('')

  const filteredPasswords = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return passwords.value
    return passwords.value.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q) ||
        p.url?.toLowerCase().includes(q),
    )
  })

  /** Load passwords from encrypted vault. Must be called after login. */
  async function loadPasswords(adminPassword: string): Promise<boolean> {
    try {
      const raw = await invoke<string>('decrypt_load', { key: adminPassword })
      _adminPassword.value = adminPassword
      passwords.value = JSON.parse(raw)
      return true
    } catch {
      return false
    }
  }

  /** Load temp passwords from localStorage (normal page, not logged in). */
  function loadTempPasswords() {
    try {
      const raw = localStorage.getItem(TEMP_STORAGE_KEY)
      if (raw) {
        passwords.value = JSON.parse(raw)
      }
    } catch {
      passwords.value = []
    }
  }

  function saveTempPasswords() {
    localStorage.setItem(TEMP_STORAGE_KEY, JSON.stringify(passwords.value))
  }

  async function _save() {
    if (_adminPassword.value) {
      try {
        await invoke('encrypt_save', {
          data: JSON.stringify(passwords.value),
          key: _adminPassword.value,
        })
      } catch (e) {
        console.error('加密保存失败:', e)
      }
    } else {
      saveTempPasswords()
    }
  }

  async function addPassword(item: Omit<PasswordItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<PasswordItem> {
    const now = Date.now()
    const newItem: PasswordItem = {
      ...item,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    passwords.value.unshift(newItem)
    await _save()
    return newItem
  }

  async function deletePassword(id: string) {
    passwords.value = passwords.value.filter((p) => p.id !== id)
    await _save()
  }

  return {
    passwords,
    searchQuery,
    filteredPasswords,
    loadPasswords,
    loadTempPasswords,
    addPassword,
    deletePassword,
  }
})
