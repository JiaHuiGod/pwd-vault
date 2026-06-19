import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const ADMIN_PASSWORD_KEY = 'psw_admin_password'
const AUTH_SESSION_KEY = 'psw_auth_session'
const IDLE_TIMEOUT = 30 * 60 * 1000 // 30 minutes

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const showVerifyModal = ref(false)
  const pendingAction = ref<'login' | 'setPassword'>('login')

  let idleTimer: ReturnType<typeof setTimeout> | null = null

  const hasPassword = computed(() => {
    return !!localStorage.getItem(ADMIN_PASSWORD_KEY)
  })

  function getStoredPassword(): string {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || ''
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

  function login(password: string): boolean {
    const stored = getStoredPassword()
    if (stored && password === stored) {
      isLoggedIn.value = true
      showVerifyModal.value = false
      const session = { expires: Date.now() + IDLE_TIMEOUT }
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
      startIdleTimer()
      return true
    }
    return false
  }

  function setInitialPassword(password: string) {
    localStorage.setItem(ADMIN_PASSWORD_KEY, password)
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
      // Extend session in storage
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
    checkSession,
    login,
    setInitialPassword,
    logout,
    resetIdleTimer,
    startIdleTimer,
    stopIdleTimer,
  }
})
