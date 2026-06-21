import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PasswordItem } from '../types'
import * as vault from '../services/vault'

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
    let list = passwords.value
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.username.toLowerCase().includes(q) ||
          p.url?.toLowerCase().includes(q),
      )
    }
    return list.slice().sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.createdAt - a.createdAt
    })
  })

  /** Load passwords from vault. Must be called after login. */
  async function loadPasswords(adminPassword: string): Promise<boolean> {
    try {
      const raw = await vault.load(adminPassword)
      _adminPassword.value = adminPassword
      passwords.value = JSON.parse(raw)
      // Absorb any temp passwords left by QuickAdd while admin was closed
      await mergeAndClearTemp()
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

  /** Merge temp passwords into vault and clear temp storage. */
  async function mergeAndClearTemp() {
    if (!_adminPassword.value) return
    let merged = false
    try {
      const raw = localStorage.getItem(TEMP_STORAGE_KEY)
      if (raw) {
        const tempItems: PasswordItem[] = JSON.parse(raw)
        for (const item of tempItems) {
          if (!passwords.value.some((p) => p.id === item.id)) {
            passwords.value.push(item)
            merged = true
          }
        }
        localStorage.removeItem(TEMP_STORAGE_KEY)
      }
    } catch {
      // ignore parse error
    }
    if (merged) {
      await vault.save(JSON.stringify(passwords.value), _adminPassword.value)
    }
  }

  async function _save() {
    if (_adminPassword.value) {
      try {
        // Merge with existing vault data to add any entries not in current memory,
        // but remove any entries that were deleted from memory
        const raw = await vault.load(_adminPassword.value)
        const existing: PasswordItem[] = JSON.parse(raw)
        const existingMap = new Map(existing.map((p) => [p.id, p]))
        // Remove entries that were explicitly deleted from memory
        for (const [id] of existingMap) {
          if (!passwords.value.some((p) => p.id === id)) {
            existingMap.delete(id)
          }
        }
        // Update/add with current in-memory state
        for (const p of passwords.value) {
          existingMap.set(p.id, p)
        }
        const merged = Array.from(existingMap.values())
        await vault.save(JSON.stringify(merged), _adminPassword.value)
        passwords.value = merged
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

  async function updatePassword(id: string, data: Partial<Omit<PasswordItem, 'id' | 'createdAt'>>) {
    const idx = passwords.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      passwords.value[idx] = {
        ...passwords.value[idx],
        ...data,
        updatedAt: Date.now(),
      }
      await _save()
    }
  }

  async function togglePin(id: string) {
    const idx = passwords.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      passwords.value[idx].pinned = !passwords.value[idx].pinned
      await _save()
    }
  }

  /** Reload from vault using the cached admin password. */
  async function reloadIfLoggedIn(): Promise<boolean> {
    if (!_adminPassword.value) return false
    return loadPasswords(_adminPassword.value)
  }

  return {
    passwords,
    searchQuery,
    filteredPasswords,
    loadPasswords,
    loadTempPasswords,
    addPassword,
    deletePassword,
    updatePassword,
    togglePin,
    reloadIfLoggedIn,
  }
})
