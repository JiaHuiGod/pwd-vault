<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { invoke } from '@tauri-apps/api/core'
import { useAuthStore } from '../stores/auth'
import type { ProxyConfig } from '../types'

const router = useRouter()
const auth = useAuthStore()

const config = reactive<ProxyConfig>({
  enabled: false,
  host: '',
  port: 8080,
  username: undefined,
  password: undefined,
})

const saving = ref(false)
const loading = ref(true)
const errorMsg = ref('')
const successMsg = ref('')

onMounted(async () => {
  if (!auth.isLoggedIn) {
    router.push('/')
    return
  }
  try {
    const result = await invoke<ProxyConfig>('get_proxy_config')
    Object.assign(config, result)
  } catch {
    errorMsg.value = '加载设置失败'
  } finally {
    loading.value = false
  }
})

function goBack() {
  router.push('/admin')
}

async function saveConfig() {
  errorMsg.value = ''
  successMsg.value = ''
  saving.value = true
  try {
    const payload: ProxyConfig = { ...config }
    if (payload.username === '') payload.username = undefined
    if (payload.password === '') payload.password = undefined
    await invoke('set_proxy_config', { config: payload })
    successMsg.value = '已保存'
    setTimeout(() => { successMsg.value = '' }, 2000)
  } catch (e) {
    errorMsg.value = typeof e === 'string' ? e : '保存失败'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="settings-view">
    <div class="bg-grid" />
    <div class="bg-orb bg-orb-1" />
    <div class="bg-orb bg-orb-2" />

    <header class="settings-header glass-card">
      <div class="header-left">
        <button class="btn btn-ghost btn-sm" @click="goBack">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          返回
        </button>
        <div class="header-info">
          <h1 class="gradient-text">设置</h1>
        </div>
      </div>
    </header>

    <div class="settings-body">
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <span>加载中...</span>
      </div>

      <Transition name="fade" mode="out-in">
        <div v-if="!loading" class="settings-sections">
          <!-- 网络代理 -->
          <div class="settings-card glass-card glow-border">
            <div class="settings-card-header">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>网络代理</span>
            </div>
            <p class="settings-desc">配置后，应用将通过代理服务器进行网络连接（更新检查等）。</p>

            <div class="settings-form">
              <label class="checkbox-wrapper">
                <input type="checkbox" v-model="config.enabled" />
                启用代理
              </label>

              <div class="field">
                <label class="label">主机地址</label>
                <input v-model="config.host" class="input" placeholder="例如: 127.0.0.1" :disabled="!config.enabled" />
              </div>

              <div class="field">
                <label class="label">端口</label>
                <input v-model.number="config.port" class="input" type="number" placeholder="8080" :disabled="!config.enabled" min="1" max="65535" />
              </div>

              <div class="field">
                <label class="label">用户名（可选）</label>
                <input v-model="config.username" class="input" placeholder="用户名" :disabled="!config.enabled" />
              </div>

              <div class="field">
                <label class="label">密码（可选）</label>
                <input v-model="config.password" class="input" type="password" placeholder="密码" :disabled="!config.enabled" />
              </div>

              <Transition name="fade">
                <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
                <p v-else-if="successMsg" class="success-msg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  已保存
                </p>
              </Transition>

              <button class="btn btn-primary btn-full" :disabled="saving || loading" @click="saveConfig">
                <span v-if="saving" class="spinner" />
                <span v-else>保存设置</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.bg-grid {
  position: fixed;
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

.settings-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  margin: 12px 16px;
  border-radius: var(--radius-md);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-info h1 {
  font-size: 1.1rem;
  font-weight: 700;
}

.settings-body {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 20px 16px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--text-secondary);
  padding-top: 80px;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-glass);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  display: inline-block;
}

.settings-sections {
  width: 100%;
  max-width: 500px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-card {
  padding: 24px;
}

.settings-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.settings-card-header svg {
  color: var(--accent);
}

.settings-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 20px;
  line-height: 1.5;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
}

.error-msg {
  color: var(--danger);
  font-size: 0.82rem;
  text-align: center;
}

.success-msg {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--success);
  font-size: 0.85rem;
}

.btn-full {
  width: 100%;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
