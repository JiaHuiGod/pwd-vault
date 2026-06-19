<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usePasswordStore } from '../stores/password'
import PasswordVerify from '../components/PasswordVerify.vue'

const auth = useAuthStore()
const pswStore = usePasswordStore()

const clickCount = ref(0)
const lastClickTime = ref(0)

// Quick add form (normal page)
const form = reactive({
  title: '',
  username: '',
  password: '',
  url: '',
  notes: '',
})
const saved = ref(false)

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let pwd = ''
  for (let i = 0; i < 16; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.password = pwd
}

onMounted(() => {
  auth.checkHasPassword()
  pswStore.loadTempPasswords()
})

// Secret entrance: click the shield icon 5 times rapidly
function onLogoClick() {
  const now = Date.now()
  if (now - lastClickTime.value > 1500) {
    clickCount.value = 1
  } else {
    clickCount.value++
  }
  lastClickTime.value = now

  if (clickCount.value >= 5) {
    clickCount.value = 0
    triggerVerify()
  }
}

function triggerVerify() {
  if (!auth.hasPassword) {
    auth.pendingAction = 'setPassword'
  } else {
    auth.pendingAction = 'login'
  }
  auth.showVerifyModal = true
}

function onVerifyClose() {
  auth.showVerifyModal = false
}

function saveQuickPassword() {
  if (!form.title || !form.password || !form.username) return
  pswStore.addPassword({
    title: form.title,
    username: form.username,
    password: form.password,
    url: form.url || undefined,
    notes: form.notes || undefined,
  })
  saved.value = true
  form.title = ''
  form.username = ''
  form.password = ''
  form.url = ''
  form.notes = ''
  setTimeout(() => {
    saved.value = false
  }, 2000)
}
</script>

<template>
  <div class="normal-view">
    <!-- Background decorations -->
    <div class="bg-grid" />
    <div class="bg-orb bg-orb-1" />
    <div class="bg-orb bg-orb-2" />

    <!-- Secret trigger shield (top-right corner) -->
    <div class="secret-trigger-area" @click="onLogoClick" />

    <div class="content">
      <!-- Logo area (compact) -->
      <div class="brand">
        <div class="brand-icon" @click="onLogoClick">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 class="gradient-text">Vault</h1>
      </div>

      <!-- Quick add card -->
      <div class="add-card glass-card glow-border">
        <div class="card-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>新增密码</span>
        </div>
        <div class="card-body">
          <div class="field">
            <label class="label">标题 *</label>
            <input v-model="form.title" class="input" placeholder="例如: GitHub" />
          </div>
          <div class="form-row">
            <div class="field flex-1">
              <label class="label">用户名/邮箱 *</label>
              <input v-model="form.username" class="input" placeholder="用户名或邮箱" />
            </div>
            <div class="field flex-1">
              <label class="label">密码 *</label>
              <div class="password-input-wrap">
                <input v-model="form.password" class="input" type="text" placeholder="密码" />
                <button class="btn btn-ghost btn-sm gen-btn" @click="generatePassword" title="生成随机密码">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                </button>
              </div>
            </div>
          </div>
          <div class="field">
            <label class="label">网址</label>
            <input v-model="form.url" class="input" placeholder="https://" />
          </div>
          <div class="field">
            <label class="label">备注</label>
            <input v-model="form.notes" class="input" placeholder="备注信息..." />
          </div>
          <button class="btn btn-primary btn-save" :disabled="!form.title || !form.password || !form.username" @click="saveQuickPassword">
            <Transition name="fade" mode="out-in">
              <span v-if="saved" class="saved-indicator">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                已保存
              </span>
              <span v-else>保存密码</span>
            </Transition>
          </button>
        </div>
      </div>
      </div>

    <!-- Verify modal -->
    <PasswordVerify @close="onVerifyClose" />
  </div>
</template>

<style scoped>
.normal-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-primary);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
}

.bg-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
}
.bg-orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08), transparent);
  top: -100px;
  right: -100px;
}
.bg-orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.06), transparent);
  bottom: -50px;
  left: -50px;
}

.secret-trigger-area {
  position: fixed;
  top: 16px;
  right: 16px;
  width: 40px;
  height: 40px;
  z-index: 10;
  cursor: pointer;
  background: transparent;
}

.content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 520px;
  padding: 24px;
}

.brand {
  text-align: center;
  margin-bottom: 24px;
}

.brand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-subtle), rgba(99, 102, 241, 0.05));
  color: var(--accent);
  margin-bottom: 6px;
  transition: all var(--transition-normal);
  cursor: pointer;
}
.brand-icon:hover {
  transform: scale(1.05);
}

.brand h1 {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.add-card {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.card-header svg {
  color: var(--accent);
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
}

.flex-1 {
  flex: 1;
}

.password-input-wrap {
  display: flex;
  gap: 8px;
}
.password-input-wrap .input {
  flex: 1;
}
.gen-btn {
  white-space: nowrap;
}

.btn-save {
  width: 100%;
  margin-top: 4px;
}

.saved-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--success);
}
</style>
