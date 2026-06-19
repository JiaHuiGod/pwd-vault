import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PasswordItem } from '../types'

const STORAGE_KEY = 'psw_passwords'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

export const usePasswordStore = defineStore('passwords', () => {
  const passwords = ref<PasswordItem[]>([])
  const searchQuery = ref('')

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

  function loadPasswords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        passwords.value = JSON.parse(raw)
      }
    } catch {
      passwords.value = []
    }
  }

  function savePasswords() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(passwords.value))
  }

  function addPassword(item: Omit<PasswordItem, 'id' | 'createdAt' | 'updatedAt'>): PasswordItem {
    const now = Date.now()
    const newItem: PasswordItem = {
      ...item,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    }
    passwords.value.unshift(newItem)
    savePasswords()
    return newItem
  }

  function deletePassword(id: string) {
    passwords.value = passwords.value.filter((p) => p.id !== id)
    savePasswords()
  }

  function updatePassword(id: string, data: Partial<Omit<PasswordItem, 'id' | 'createdAt'>>) {
    const idx = passwords.value.findIndex((p) => p.id === id)
    if (idx !== -1) {
      passwords.value[idx] = {
        ...passwords.value[idx],
        ...data,
        updatedAt: Date.now(),
      }
      savePasswords()
    }
  }

  return {
    passwords,
    searchQuery,
    filteredPasswords,
    loadPasswords,
    addPassword,
    deletePassword,
    updatePassword,
  }
})
