<script setup lang="ts">
import { ref } from 'vue'
import { usePasswordStore } from '../stores/password'

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
    window.close()
  }, 800)
}
</script>

<template>
  <div class="quick-view">
    <div class="quick-card">
      <div class="header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
        <span>快速添加</span>
      </div>
      <div class="body">
        <input v-model="form.title" class="input" placeholder="标题 (例如: GitHub)" autofocus />
        <input v-model="form.username" class="input" placeholder="账号" />
        <input v-model="form.password" class="input" type="text" placeholder="密码" />
      </div>
      <div class="footer">
        <button class="btn btn-primary btn-full" :disabled="!form.title || !form.password || saved" @click="save">
          {{ saved ? '✓ 已保存，即将关闭' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.quick-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary);
  font-family: var(--font-family);
  -webkit-app-region: drag;
}
.quick-card {
  width: 100%;
  padding: 20px;
  -webkit-app-region: no-drag;
}
.header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 16px;
}
.header svg {
  color: var(--accent);
}
.body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}
.footer {}
.btn-full {
  width: 100%;
}
</style>
