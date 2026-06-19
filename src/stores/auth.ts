import { defineStore } from 'pinia'
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { usePasswordStore } from './password'

const AUTH_SESSION_KEY = 'psw_auth_session'
const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const showVerifyModal = ref(false)
  const pendingAction = ref<'login' | 'setPassword'>('login')

  let idleTimer: ReturnType<typeof setTimeout> | null = null

  const hasPassword = ref(false)

  async function checkHasPassword() {
    try {
      hasPassword.value = await invoke<boolean>('has_vault_file')
    } catch {
      hasPassword.value = false
    }
  }

  function checkSession() {
    const session = localStorage.getItem(AUTH_SESSION_KEY)
    if (session) {
      const { expires } = JSON.parse(session)
      if (Date.now() < expires) {
        isLoggedIn.value = true
        startIdleTimer()
        return true
      } else {
        localStorage.removeItem(AUTH_SESSION_KEY)
      }
    }
    return false
  }

  async function login(password: string): Promise<boolean> {
    const pswStore = usePasswordStore()
    const ok = await pswStore.loadPasswords(password)
    if (ok) {
      isLoggedIn.value = true
      showVerifyModal.value = false
      const session = { expires: Date.now() + IDLE_TIMEOUT }
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
      startIdleTimer()
      return true
    }
    return false
  }

  async function setInitialPassword(password: string) {
    const pswStore = usePasswordStore()
    // Merge any temp passwords into the vault
    const tempRaw = localStorage.getItem('psw_temp_passwords')
    let data: string
    if (tempRaw) {
      data = tempRaw
      localStorage.removeItem('psw_temp_passwords')
    } else {
      data = JSON.stringify([])
    }
    await invoke('encrypt_save', { data, key: password })
    // Load vault
    await pswStore.loadPasswords(password)
    isLoggedIn.value = true
    showVerifyModal.value = false
    const session = { expires: Date.now() + IDLE_TIMEOUT }
    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
    startIdleTimer()
  }

  function logout() {
    isLoggedIn.value = false
    localStorage.removeItem(AUTH_SESSION_KEY)
    stopIdleTimer()
  }

  function startIdleTimer() {
    stopIdleTimer()
    idleTimer = setTimeout(() => {
      logout()
    }, IDLE_TIMEOUT)
  }

  function resetIdleTimer() {
    if (isLoggedIn.value) {
      startIdleTimer()
      const session = { expires: Date.now() + IDLE_TIMEOUT }
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
    }
  }

  function stopIdleTimer() {
    if (idleTimer) {
      clearTimeout(idleTimer)
      idleTimer = null
    }
  }

  return {
    isLoggedIn,
    showVerifyModal,
    pendingAction,
    hasPassword,
    checkHasPassword,
    checkSession,
    login,
    setInitialPassword,
    logout,
    resetIdleTimer,
    startIdleTimer,
  }
})
