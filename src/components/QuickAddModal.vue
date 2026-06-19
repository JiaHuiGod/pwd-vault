<script setup lang="ts">
import { ref } from 'vue'
import { usePasswordStore } from '../stores/password'

const emit = defineEmits<{
  close: []
}>()

const pswStore = usePasswordStore()
const form = ref({ title: '', username: '', password: '' })
const saved = ref(false)

function save() {
  if (!form.value.title || !form.value.password) return
  pswStore.addPassword({
    title: form.value.title,
    username: form.value.username,
    password: form.value.password,
  })
  saved.value = true
  setTimeout(() => {
    saved.value = false
    emit('close')
  }, 1000)
}
</script>

<template>
  <div class="quick-modal-overlay" @click.self="emit('close')">
    <Transition name="scale" appear>
      <div class="quick-modal-card glass-card glow-border">
        <div class="qm-header">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
          <span>快速添加密码</span>
          <button class="qm-close" @click="emit('close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div class="qm-body">
          <div class="field">
            <label class="label">标题</label>
            <input v-model="form.title" class="input" placeholder="例如: GitHub" autofocus />
          </div>
          <div class="field">
            <label class="label">账号</label>
            <input v-model="form.username" class="input" placeholder="用户名或邮箱" />
          </div>
          <div class="field">
            <label class="label">密码</label>
            <input v-model="form.password" class="input" type="text" placeholder="密码" />
          </div>
        </div>
        <div class="qm-footer">
          <button class="btn btn-primary btn-full" :disabled="!form.title || !form.password || saved" @click="save">
            <Transition name="fade" mode="out-in">
              <span v-if="saved" style="color: var(--success);">✓ 已保存</span>
              <span v-else>保存</span>
            </Transition>
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.quick-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 80px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
}

.quick-modal-card {
  width: 360px;
  padding: 0;
  overflow: hidden;
}

.qm-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  font-size: 0.9rem;
  font-weight: 600;
  border-bottom: 1px solid var(--border-glass);
}

.qm-header svg {
  color: var(--accent);
}

.qm-close {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all var(--transition-fast);
}
.qm-close:hover {
  background: var(--bg-glass-hover);
  color: var(--text-primary);
}

.qm-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
}

.qm-footer {
  padding: 0 20px 16px;
}

.btn-full {
  width: 100%;
}
</style>
