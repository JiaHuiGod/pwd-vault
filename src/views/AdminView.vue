<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { usePasswordStore } from '../stores/password'
import type { PasswordItem } from '../types'

const router = useRouter()
const auth = useAuthStore()
const pswStore = usePasswordStore()

// Form state
const form = ref({ title: '', username: '', password: '', url: '', notes: '' })
const showAddForm = ref(false)
const adding = ref(false)
const added = ref(false)

// Detail modal
const detailItem = ref<PasswordItem | null>(null)

// Edit modal
const editItem = ref<PasswordItem | null>(null)
const editForm = ref({ title: '', username: '', password: '', url: '', notes: '' })
const editing = ref(false)

// Delete confirm
const deletingId = ref<string | null>(null)

// Copy feedback
const copiedField = ref<string | null>(null)

onMounted(() => {
  if (!auth.isLoggedIn) {
    router.push('/')
    return
  }
  // Passwords already loaded during login; no need to load again
  document.addEventListener('click', onActivity)
  document.addEventListener('keydown', onActivity)
})

onUnmounted(() => {
  document.removeEventListener('click', onActivity)
  document.removeEventListener('keydown', onActivity)
})

function onActivity() {
  auth.resetIdleTimer()
}

function toggleForm() {
  showAddForm.value = !showAddForm.value
  if (!showAddForm.value) {
    form.value = { title: '', username: '', password: '', url: '', notes: '' }
  }
}

function addPassword() {
  if (!form.value.title || !form.value.password || !form.value.username) return
  adding.value = true
  setTimeout(() => {
    pswStore.addPassword({
      title: form.value.title,
      username: form.value.username,
      password: form.value.password,
      url: form.value.url || undefined,
      notes: form.value.notes || undefined,
    })
    added.value = true
    form.value = { title: '', username: '', password: '', url: '', notes: '' }
    setTimeout(() => {
      added.value = false
      showAddForm.value = false
      adding.value = false
    }, 800)
  }, 200)
}

function confirmDelete(id: string) {
  deletingId.value = id
}

function doDelete() {
  if (deletingId.value) {
    pswStore.deletePassword(deletingId.value)
    deletingId.value = null
  }
}

function cancelDelete() {
  deletingId.value = null
}

let copyTimer: ReturnType<typeof setTimeout> | null = null

function copyToClipboard(text: string, field: string) {
  navigator.clipboard.writeText(text)
  if (copyTimer) clearTimeout(copyTimer)
  copiedField.value = field
  copyTimer = setTimeout(() => {
    copiedField.value = null
    copyTimer = null
  }, 1200)
}

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let pwd = ''
  for (let i = 0; i < 16; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.password = pwd
  return pwd
}

function handleLogout() {
  auth.logout()
  router.push('/')
}

function maskPassword(pwd: string): string {
  return '•'.repeat(Math.min(pwd.length, 12))
}

function startEdit(item: PasswordItem) {
  editItem.value = item
  editForm.value = {
    title: item.title,
    username: item.username,
    password: item.password,
    url: item.url || '',
    notes: item.notes || '',
  }
}

function cancelEdit() {
  editItem.value = null
}

async function saveEdit() {
  if (!editItem.value || !editForm.value.title || !editForm.value.password || !editForm.value.username) return
  editing.value = true
  await pswStore.updatePassword(editItem.value.id, editForm.value)
  editing.value = false
  editItem.value = null
}
</script>

<template>
  <div class="admin-view">
    <!-- Background -->
    <div class="bg-grid" />
    <div class="bg-orb bg-orb-1" />
    <div class="bg-orb bg-orb-2" />

    <!-- Header -->
    <header class="admin-header glass-card">
      <div class="header-left">
        <div class="header-logo" @click="handleLogout" title="退出管理">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <div>
          <h1 class="header-title">Vault 管理</h1>
          <p class="header-sub">密码管理中心</p>
        </div>
      </div>
      <div class="header-right">
        <button class="btn btn-primary btn-sm" @click="toggleForm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          {{ showAddForm ? '取消' : '新增' }}
        </button>
        <button class="btn btn-ghost btn-sm" @click="handleLogout">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          退出
        </button>
      </div>
    </header>

    <div class="admin-body">
      <!-- Search bar -->
      <div class="search-bar">
        <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input v-model="pswStore.searchQuery" class="input search-input" placeholder="搜索标题、账号或网址..." />
      </div>

      <!-- Add form -->
      <Transition name="slide-up">
        <div v-if="showAddForm" class="add-form glass-card">
          <div class="add-form-grid">
            <div class="field">
              <label class="label">标题 *</label>
              <input v-model="form.title" class="input" placeholder="例如: GitHub" />
            </div>
            <div class="field">
              <label class="label">网址</label>
              <input v-model="form.url" class="input" placeholder="https://" />
            </div>
            <div class="field">
              <label class="label">用户名/邮箱 *</label>
              <input v-model="form.username" class="input" placeholder="用户名或邮箱" />
            </div>
            <div class="field">
              <label class="label">密码 *</label>
              <div class="password-input-wrap">
                <input v-model="form.password" class="input" type="text" placeholder="密码" />
                <button class="btn btn-ghost btn-sm gen-btn" @click="generatePassword">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  生成
                </button>
              </div>
            </div>
            <div class="field field-full">
              <label class="label">备注</label>
              <input v-model="form.notes" class="input" placeholder="备注信息..." />
            </div>
          </div>
          <button class="btn btn-primary btn-full" :disabled="!form.title || !form.password || !form.username || adding" @click="addPassword">
            <Transition name="fade" mode="out-in">
              <span v-if="adding && !added" class="spinner" />
              <span v-else-if="added" class="saved-text">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                已添加
              </span>
              <span v-else>添加密码</span>
            </Transition>
          </button>
        </div>
      </Transition>

      <!-- Password list -->
      <div class="list-container">
        <TransitionGroup name="list" tag="div" class="list">
          <div v-for="item in pswStore.filteredPasswords" :key="item.id" class="password-item glass-card">
            <div class="item-main">
              <div class="item-icon">
                {{ item.title.charAt(0).toUpperCase() }}
              </div>
              <div class="item-info">
                <span class="item-title">{{ item.title }}</span>
                <span class="item-meta">
                  <span v-if="item.username" class="meta-chip" @click="copyToClipboard(item.username, `user-${item.id}`)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                    {{ item.username }}
                  </span>
                  <span class="meta-chip password-chip" @click="copyToClipboard(item.password, `psw-${item.id}`)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    {{ maskPassword(item.password) }}
                  </span>
                  <span v-if="item.url" class="meta-chip" @click="copyToClipboard(item.url!, `url-${item.id}`)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    {{ item.url }}
                  </span>
                </span>
              </div>
            </div>
            <div class="item-actions">
              <Transition name="fade">
                <span v-if="copiedField === `user-${item.id}`" class="copy-toast">账号已复制</span>
                <span v-else-if="copiedField === `psw-${item.id}`" class="copy-toast">密码已复制</span>
                <span v-else-if="copiedField === `url-${item.id}`" class="copy-toast">网址已复制</span>
              </Transition>
              <button class="btn btn-ghost btn-sm detail-btn" title="详情" @click="detailItem = item">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              </button>
              <button class="btn btn-ghost btn-sm detail-btn" title="编辑" @click="startEdit(item)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
              </button>
              <button class="btn btn-ghost btn-sm btn-icon-only" title="删除" @click="confirmDelete(item.id)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
              </button>
            </div>
          </div>
        </TransitionGroup>

        <!-- Empty state -->
        <Transition name="fade">
          <div v-if="pswStore.filteredPasswords.length === 0" class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <p>{{ pswStore.searchQuery ? '没有匹配的结果' : '还没有密码，点击右上角新增' }}</p>
          </div>
        </Transition>
      </div>
    </div>

    <!-- Delete confirm dialog -->
    <Transition name="scale">
      <div v-if="deletingId" class="delete-overlay">
        <Transition name="slide-up" appear>
          <div class="delete-dialog glass-card">
            <div class="delete-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <h3>确认删除</h3>
            <p>删除后无法恢复，确定要删除吗？</p>
            <div class="delete-actions">
              <button class="btn btn-ghost" @click="cancelDelete">取消</button>
              <button class="btn btn-danger" @click="doDelete">删除</button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Detail modal -->
    <Transition name="scale">
      <div v-if="detailItem" class="detail-overlay" @click.self="detailItem = null">
        <Transition name="slide-up" appear>
          <div class="detail-card glass-card glow-border">
            <div class="detail-glow" />
            <div class="detail-header">
              <div class="detail-icon">{{ detailItem.title.charAt(0).toUpperCase() }}</div>
              <div>
                <h3>{{ detailItem.title }}</h3>
                <p class="detail-sub">密码详情</p>
              </div>
              <button class="detail-close" @click="detailItem = null">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div class="detail-body">
              <div class="detail-row">
                <label class="detail-label">用户名/邮箱</label>
                <div class="detail-value">
                  <span>{{ detailItem.username || '—' }}</span>
                  <Transition name="fade">
                    <span v-if="copiedField === 'det-user'" class="copy-badge">已复制</span>
                  </Transition>
                  <button v-if="detailItem.username" class="detail-copy" @click="copyToClipboard(detailItem.username, 'det-user')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  </button>
                </div>
              </div>
              <div class="detail-row">
                <label class="detail-label">密码</label>
                <div class="detail-value">
                  <span>{{ detailItem.password }}</span>
                  <Transition name="fade">
                    <span v-if="copiedField === 'det-psw'" class="copy-badge">已复制</span>
                  </Transition>
                  <button class="detail-copy" @click="copyToClipboard(detailItem.password, 'det-psw')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  </button>
                </div>
              </div>
              <div v-if="detailItem.url" class="detail-row">
                <label class="detail-label">网址</label>
                <div class="detail-value">
                  <span>{{ detailItem.url }}</span>
                  <Transition name="fade">
                    <span v-if="copiedField === 'det-url'" class="copy-badge">已复制</span>
                  </Transition>
                  <button class="detail-copy" @click="copyToClipboard(detailItem.url!, 'det-url')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  </button>
                </div>
              </div>
              <div v-if="detailItem.notes" class="detail-row detail-row-full">
                <label class="detail-label">备注</label>
                <p class="detail-notes">{{ detailItem.notes }}</p>
              </div>
            </div>
            <div class="detail-footer">
              <span class="detail-time">创建于 {{ new Date(detailItem.createdAt).toLocaleString() }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- Edit modal -->
    <Transition name="scale">
      <div v-if="editItem" class="detail-overlay" @click.self="cancelEdit">
        <Transition name="slide-up" appear>
          <div class="detail-card glass-card glow-border">
            <div class="detail-glow" />
            <div class="detail-header">
              <div class="detail-icon">{{ editItem.title.charAt(0).toUpperCase() }}</div>
              <div>
                <h3>修改密码</h3>
                <p class="detail-sub">{{ editItem.title }}</p>
              </div>
              <button class="detail-close" @click="cancelEdit">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
            <div class="edit-body">
              <div class="field">
                <label class="label">标题 *</label>
                <input v-model="editForm.title" class="input" placeholder="例如: GitHub" />
              </div>
              <div class="field">
                <label class="label">用户名/邮箱 *</label>
                <input v-model="editForm.username" class="input" placeholder="用户名或邮箱" />
              </div>
              <div class="field">
                <label class="label">密码 *</label>
                <div class="password-input-wrap">
                  <input v-model="editForm.password" class="input" type="text" placeholder="密码" />
                  <button class="btn btn-ghost btn-sm gen-btn" @click="editForm.password = generatePassword()">生成</button>
                </div>
              </div>
              <div class="field">
                <label class="label">网址</label>
                <input v-model="editForm.url" class="input" placeholder="https://" />
              </div>
              <div class="field">
                <label class="label">备注</label>
                <input v-model="editForm.notes" class="input" placeholder="备注信息..." />
              </div>
            </div>
            <div class="edit-footer">
              <button class="btn btn-ghost" @click="cancelEdit">取消</button>
              <button class="btn btn-primary" :disabled="!editForm.title || !editForm.password || !editForm.username || editing" @click="saveEdit">
                {{ editing ? '保存中...' : '保存修改' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.admin-view {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  background: var(--bg-primary);
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
  position: fixed;
  border-radius: 50%;
  filter: blur(100px);
  pointer-events: none;
}
.bg-orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.08), transparent);
  top: -150px;
  right: -150px;
}
.bg-orb-2 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(129, 140, 248, 0.05), transparent);
  bottom: -100px;
  left: -100px;
}

.admin-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  margin: 12px 16px;
  border-radius: var(--radius-md);
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--accent-subtle);
  color: var(--accent);
  cursor: pointer;
  transition: all var(--transition-fast);
}
.header-logo:hover {
  background: var(--accent);
  color: #fff;
}
.header-title {
  font-size: 1rem;
  font-weight: 600;
}
.header-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.header-right {
  display: flex;
  gap: 8px;
}

.admin-body {
  flex: 1;
  padding: 0 16px 80px;
  max-width: 800px;
  width: 100%;
  margin: 0 auto;
}

.search-bar {
  position: relative;
  margin-bottom: 16px;
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  z-index: 1;
}
.search-input {
  padding-left: 42px;
}

.add-form {
  padding: 20px;
  margin-bottom: 16px;
}
.add-form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}
.field-full {
  grid-column: 1 / -1;
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
.btn-full {
  width: 100%;
}
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
.saved-text {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--success);
}

.list-container {
  flex: 1;
}

.list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.password-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  transition: all var(--transition-normal);
  cursor: default;
}
.password-item:hover {
  border-color: var(--border-accent);
  transform: translateX(4px);
}

.item-main {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.item-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--accent-subtle), rgba(99, 102, 241, 0.05));
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.item-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}
.item-title {
  font-weight: 500;
  font-size: 0.9rem;
}
.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--text-muted);
  padding: 2px 8px;
  background: var(--bg-glass);
  border-radius: 6px;
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.meta-chip:hover {
  background: var(--accent-subtle);
  color: var(--accent);
}
.password-chip {
  font-family: monospace;
  letter-spacing: 1px;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.btn-icon-only {
  padding: 8px;
  border-radius: 8px;
  color: var(--text-muted);
}
.btn-icon-only:hover {
  color: var(--danger);
  background: rgba(239, 68, 68, 0.1);
  border-color: transparent;
}
.copy-toast {
  font-size: 0.75rem;
  color: var(--success);
  font-weight: 500;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-muted);
  gap: 12px;
  text-align: center;
  font-size: 0.9rem;
}

/* Delete dialog */
.delete-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(8px);
}
.delete-dialog {
  width: 340px;
  padding: 32px 24px 24px;
  text-align: center;
}
.delete-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
  margin-bottom: 12px;
}
.delete-dialog h3 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 6px;
}
.delete-dialog p {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-bottom: 20px;
}
.delete-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

/* List animations */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
.list-move {
  transition: transform 0.3s ease;
}

/* Detail button */
.detail-btn {
  padding: 8px;
  border-radius: 8px;
  color: var(--text-muted);
}
.detail-btn:hover {
  color: var(--accent);
  background: var(--accent-subtle);
  border-color: transparent;
}

/* Detail modal */
.detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
}
.detail-card {
  position: relative;
  width: 400px;
  padding: 32px 28px 20px;
  overflow: hidden;
}
.detail-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 70% 20%, rgba(99, 102, 241, 0.06), transparent 60%);
  pointer-events: none;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
}
.detail-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-subtle), rgba(99, 102, 241, 0.05));
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
  flex-shrink: 0;
}
.detail-header h3 {
  font-size: 1.1rem;
  font-weight: 600;
}
.detail-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.detail-close {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 8px;
  transition: all var(--transition-fast);
}
.detail-close:hover {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
}
.detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.detail-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
  letter-spacing: 0.03em;
}
.detail-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  background: var(--bg-glass);
  border-radius: var(--radius-sm);
  font-size: 0.88rem;
  color: var(--text-primary);
  word-break: break-all;
}
.copy-badge {
  font-size: 0.7rem;
  color: var(--success);
  font-weight: 500;
  flex-shrink: 0;
}
.detail-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}
.detail-copy:hover {
  background: var(--accent-subtle);
  color: var(--accent);
}
.detail-notes {
  padding: 10px 12px;
  background: var(--bg-glass);
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  color: var(--text-secondary);
  line-height: 1.5;
}
.detail-footer {
  margin-top: 20px;
  padding-top: 12px;
  border-top: 1px solid var(--border-glass);
  text-align: center;
}
.detail-time {
  font-size: 0.72rem;
  color: var(--text-muted);
}

/* Edit modal */
.edit-body {
  padding: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.edit-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--border-glass);
}
.edit-footer .btn {
  min-width: 80px;
}
</style>
