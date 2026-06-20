<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { useAuthStore } from '../stores/auth'
import { usePasswordStore } from '../stores/password'
import PasswordVerify from '../components/PasswordVerify.vue'
import { checkForUpdate } from '../services/updater'

const auth = useAuthStore();
const pswStore = usePasswordStore();

const SHORTCUT_STORAGE_KEY = 'psw_global_shortcut';

const clickCount = ref(0);
const lastClickTime = ref(0);

// Quick add form (normal page)
const form = reactive({
  title: '',
  username: '',
  password: '',
  url: '',
  notes: ''
});
const saved = ref(false);
const copyOk = ref(false);

// Shortcut settings
const showShortcutModal = ref(false);
const isRecording = ref(false);
const currentShortcut = ref('');
const pendingShortcut = ref('');
const recorderRef = ref<HTMLElement | null>(null)
const liveKey = ref('');

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pwd = '';
  for (let i = 0; i < 16; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  form.password = pwd;
}

async function restoreShortcut() {
  try {
    const saved = localStorage.getItem(SHORTCUT_STORAGE_KEY);
    if (saved) {
      currentShortcut.value = saved;
      await invoke('set_global_shortcut', { combo: saved });
    }
  } catch {
    // ignore — shortcut may fail to register (e.g. conflict)
  }
}

function openShortcutModal() {
  pendingShortcut.value = '';
  isRecording.value = false;
  showShortcutModal.value = true;
}

async function startRecording() {
  pendingShortcut.value = '';
  liveKey.value = '';
  isRecording.value = true;
  await nextTick();
  recorderRef.value?.focus();
}

function onRecordKeydown(e: KeyboardEvent) {
  if (!isRecording.value) return;
  e.preventDefault();
  e.stopPropagation();

  // Build live display including currently-held modifiers
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Cmd');

  // Ignore modifier-only presses
  if (e.key === 'Control' || e.key === 'Shift' || e.key === 'Alt' || e.key === 'Meta') {
    liveKey.value = parts.join('+') || '';
    return;
  }

  let mainKey = '';
  if (e.code.startsWith('Key')) {
    mainKey = e.code.slice(3); // "KeyQ" → "Q"
  } else if (/^F\d+$/.test(e.code)) {
    mainKey = e.code; // F1-F12
  }

  if (!mainKey) return;
  if (parts.length === 0) return; // require at least one modifier

  liveKey.value = [...parts, mainKey].join('+');
  pendingShortcut.value = liveKey.value;
  isRecording.value = false;
}

async function saveShortcut() {
  if (!pendingShortcut.value) return;
  try {
    await invoke('set_global_shortcut', { combo: pendingShortcut.value });
    currentShortcut.value = pendingShortcut.value;
    localStorage.setItem(SHORTCUT_STORAGE_KEY, currentShortcut.value);
    showShortcutModal.value = false;
  } catch (e) {
    console.error('快捷键注册失败:', e);
  }
}

async function clearShortcut() {
  try {
    await invoke('set_global_shortcut', { combo: '' });
  } catch {
    // ignore
  }
  currentShortcut.value = '';
  pendingShortcut.value = '';
  localStorage.removeItem(SHORTCUT_STORAGE_KEY);
  showShortcutModal.value = false;
}

onMounted(() => {
  auth.checkHasPassword();
  pswStore.loadTempPasswords();
  restoreShortcut();
});

// Secret entrance: click the shield icon 5 times rapidly
function onLogoClick() {
  const now = Date.now();
  if (now - lastClickTime.value > 1500) {
    clickCount.value = 1;
  } else {
    clickCount.value++;
  }
  lastClickTime.value = now;

  if (clickCount.value >= 5) {
    clickCount.value = 0;
    triggerVerify();
  }
}

function triggerVerify() {
  if (!auth.hasPassword) {
    auth.pendingAction = 'setPassword';
  } else {
    auth.pendingAction = 'login';
  }
  auth.showVerifyModal = true;
}

function onVerifyClose() {
  auth.showVerifyModal = false;
}

function copyPassword() {
  if (!form.password) return;
  navigator.clipboard.writeText(form.password);
  copyOk.value = true;
  setTimeout(() => {
    copyOk.value = false;
  }, 1200);
}

function saveQuickPassword() {
  if (!form.title || !form.password || !form.username) return;
  pswStore.addPassword({
    title: form.title,
    username: form.username,
    password: form.password,
    url: form.url || undefined,
    notes: form.notes || undefined
  });
  saved.value = true;
  form.title = '';
  form.username = '';
  form.password = '';
  form.url = '';
  form.notes = '';
  setTimeout(() => {
    saved.value = false;
  }, 2000);
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
      <!-- Logo area (horizontal) -->
      <div class="brand">
        <div class="brand-icon" @click="onLogoClick">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <h1 class="gradient-text">Password Vault</h1>
        <button class="shortcut-btn" title="设置全局快捷键" @click="openShortcutModal">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path
              d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h.01M10 16h.01M14 16h.01M18 16h.01"
            />
          </svg>
          <span v-if="currentShortcut" class="shortcut-badge">{{ currentShortcut }}</span>
        </button>
        <button class="shortcut-btn" title="检查更新" @click="checkForUpdate(false)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>
        </button>
      </div>

      <!-- Quick add card -->
      <div class="add-card glass-card glow-border">
        <div class="card-header">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path
              d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"
            />
          </svg>
          <span>新增密码</span>
        </div>
        <div class="card-body">
          <div class="field">
            <label class="label">标题 *</label>
            <input v-model="form.title" class="input" placeholder="例如: GitHub" />
          </div>
          <div class="field">
            <label class="label">用户名/邮箱 *</label>
            <input v-model="form.username" class="input" placeholder="用户名或邮箱" />
          </div>
          <div class="field">
            <label class="label">密码 *</label>
            <div class="password-input-wrap">
              <input v-model="form.password" class="input" type="text" placeholder="密码" />
              <button
                class="btn btn-ghost btn-sm gen-btn"
                @click="generatePassword"
                title="生成随机密码"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </button>
              <button
                class="btn btn-ghost btn-sm copy-btn"
                :disabled="!form.password"
                title="复制密码"
                @click="copyPassword"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
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
          <button
            class="btn btn-primary btn-save"
            :disabled="!form.title || !form.password || !form.username"
            @click="saveQuickPassword"
          >
            <Transition name="fade" mode="out-in">
              <span v-if="saved" class="saved-indicator">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
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

    <!-- Shortcut settings modal -->
    <Transition name="scale">
      <div v-if="showShortcutModal" class="modal-overlay" @click.self="showShortcutModal = false">
        <Transition name="slide-up" appear>
          <div class="modal-card glass-card glow-border">
            <div class="modal-glow" />
            <div class="modal-header">
              <h2>全局快捷键</h2>
              <p class="modal-subtitle">设置后，即使在后台也能通过快捷键快速打开密码添加窗口</p>
            </div>
            <div class="modal-body">
              <div
                class="shortcut-recorder"
                ref="recorderRef"
                @keydown="onRecordKeydown"
                tabindex="0"
              >
                <div v-if="isRecording" class="recording-hint">
                  <span v-if="liveKey" class="shortcut-keys">{{ liveKey }}</span>
                  <span v-else>请按下快捷键组合...</span>
                </div>
                <div v-else class="shortcut-display">
                  <span v-if="pendingShortcut" class="shortcut-keys">{{ pendingShortcut }}</span>
                  <span v-else class="shortcut-placeholder">点击下方按钮开始录制</span>
                </div>
              </div>
              <button
                v-if="!isRecording && !pendingShortcut"
                class="btn btn-primary btn-full"
                @click="startRecording"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                录制快捷键
              </button>
              <div v-if="pendingShortcut && !isRecording" class="shortcut-actions">
                <button class="btn btn-primary" @click="saveShortcut">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  保存
                </button>
                <button class="btn btn-ghost" @click="startRecording">重新录制</button>
              </div>
              <div v-if="currentShortcut" class="shortcut-info">
                <span
                  >当前已设置：<strong>{{ currentShortcut }}</strong></span
                >
                <button class="btn btn-ghost btn-sm" @click="clearShortcut">清除</button>
              </div>
              <div v-else class="shortcut-info muted">
                <span>暂未设置全局快捷键</span>
              </div>
            </div>
            <button class="modal-close" @click="showShortcutModal = false">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.normal-view {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
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
  max-height: 100vh;
  overflow-y: auto;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 24px;
  user-select: none;
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
  transition: all var(--transition-normal);
  cursor: pointer;
  flex-shrink: 0;
}
.brand-icon:hover {
  transform: scale(1.05);
}

.brand h1 {
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.shortcut-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 8px;
  padding: 6px 10px;
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  border-radius: 8px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.shortcut-btn:hover {
  border-color: var(--border-accent);
  color: var(--accent);
  background: var(--accent-subtle);
}
.shortcut-badge {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--accent-subtle);
  color: var(--accent);
  font-family: monospace;
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

.field {
  display: flex;
  flex-direction: column;
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
.copy-btn {
  white-space: nowrap;
  padding: 6px 10px;
  color: var(--text-muted);
}
.copy-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.copy-btn:not(:disabled):hover {
  color: var(--accent);
  background: var(--accent-subtle);
  border-color: transparent;
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

/* Shortcut modal */
.shortcut-recorder {
  width: 100%;
  padding: 20px;
  border: 2px dashed var(--border-glass);
  border-radius: 12px;
  text-align: center;
  outline: none;
  transition: border-color var(--transition-fast);
}
.shortcut-recorder:focus {
  border-color: var(--accent);
}
.recording-hint {
  color: var(--accent);
  font-weight: 500;
  animation: pulse 1.2s ease-in-out infinite;
}
.shortcut-display {
  min-height: 24px;
}
.shortcut-keys {
  font-family: monospace;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--accent);
  letter-spacing: 2px;
}
.shortcut-placeholder {
  color: var(--text-muted);
  font-size: 0.85rem;
}
.shortcut-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}
.shortcut-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-glass);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}
.shortcut-info.muted {
  justify-content: center;
  color: var(--text-muted);
}
.shortcut-info strong {
  font-family: monospace;
  color: var(--accent);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* Reuse the same modal overlay styles as PasswordVerify */
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
  padding: 36px 28px 28px;
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
  margin-bottom: 24px;
}
.modal-header h2 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-bottom: 6px;
}
.modal-subtitle {
  font-size: 0.82rem;
  color: var(--text-secondary);
  line-height: 1.5;
}
.modal-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

/* Reuse btn-full */
.btn-full {
  width: 100%;
}
</style>
