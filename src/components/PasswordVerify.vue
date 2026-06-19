<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()
const auth = useAuthStore()
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const isSettingPassword = computed(() => auth.pendingAction === 'setPassword')

watch(
  () => auth.showVerifyModal,
  (v) => {
    if (!v) {
      password.value = ''
      confirmPassword.value = ''
      error.value = ''
    }
  },
)

async function handleSubmit() {
  error.value = ''
  if (!password.value) {
    error.value = '请输入密码'
    return
  }

  loading.value = true

  if (isSettingPassword.value) {
    if (password.value !== confirmPassword.value) {
      error.value = '两次输入的密码不一致'
      loading.value = false
      return
    }
    if (password.value.length < 4) {
      error.value = '密码至少 4 位'
      loading.value = false
      return
    }
    await auth.setInitialPassword(password.value)
    loading.value = false
    auth.showVerifyModal = false
    router.push('/admin')
  } else {
    const ok = await auth.login(password.value)
    if (ok) {
      loading.value = false
      auth.showVerifyModal = false
      router.push('/admin')
    } else {
      error.value = '密码错误'
      loading.value = false
    }
  }
}
</script>

<template>
  <Transition name="scale">
    <div v-if="auth.showVerifyModal" class="modal-overlay" @click.self="emit('close')">
      <Transition name="slide-up" appear>
        <div class="modal-card glass-card glow-border">
          <!-- Decoration -->
          <div class="modal-glow" />

          <div class="modal-header">
            <div class="lock-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 v-if="isSettingPassword">设置管理员密码</h2>
            <h2 v-else>管理员验证</h2>
            <p class="modal-subtitle">
              {{ isSettingPassword ? '首次使用，请设置您的管理员密码' : '请输入管理员密码以继续' }}
            </p>
          </div>

          <form class="modal-body" @submit.prevent="handleSubmit">
            <div class="field">
              <label class="label">密码</label>
              <input
                v-model="password"
                class="input"
                type="password"
                placeholder="输入密码"
                autofocus
              />
            </div>

            <div v-if="isSettingPassword" class="field">
              <label class="label">确认密码</label>
              <input
                v-model="confirmPassword"
                class="input"
                type="password"
                placeholder="再次输入密码"
              />
            </div>

            <!-- no success banner, go immediately -->

            <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
              <span v-if="loading" class="spinner" />
              {{ loading ? '验证中...' : isSettingPassword ? '设置密码' : '验证' }}
            </button>
          </form>

          <button class="modal-close" @click="emit('close')">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
}

.modal-card {
  position: relative;
  width: 380px;
  padding: 40px 32px 32px;
  overflow: hidden;
}

.modal-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.08), transparent 60%);
  pointer-events: none;
}

.modal-header {
  text-align: center;
  margin-bottom: 28px;
}

.lock-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--accent-subtle);
  color: var(--accent);
  margin-bottom: 16px;
}

.modal-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 6px;
}

.modal-subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
}

.btn-full {
  width: 100%;
  margin-top: 4px;
}

.error-msg {
  color: var(--danger);
  font-size: 0.8rem;
  text-align: center;
}

.success-msg {
  color: var(--success);
  font-size: 0.85rem;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.check-icon {
  display: inline-block;
  animation: check-pop 0.3s ease-out;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 8px;
  transition: all var(--transition-fast);
}
.modal-close:hover {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
}
</style>
