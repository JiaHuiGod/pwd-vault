<script setup lang="ts">
import { ref } from 'vue';
import { usePasswordStore } from '../stores/password';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { emit } from '@tauri-apps/api/event';

const pswStore = usePasswordStore();
const form = ref({ title: '', username: '', password: '', url: '', notes: '' });
const saved = ref(false);
const copied = ref(false);

function generatePassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pwd = '';
  for (let i = 0; i < 16; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  form.value.password = pwd;
}

function copyPassword() {
  if (!form.value.password) return;
  navigator.clipboard.writeText(form.value.password);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 1200);
}

async function closeWindow() {
  // window.close()
  // 获取当前子窗口的实例
  const currentWindow = getCurrentWindow();
  // 调用 Tauri 的窗口关闭方法，这会正常触发 Rust 端的 CloseRequested 事件
  await currentWindow.close();
}

function save() {
  if (!form.value.title || !form.value.password || !form.value.username) return;
  pswStore.addPassword({
    title: form.value.title,
    username: form.value.username,
    password: form.value.password,
    url: form.value.url || undefined,
    notes: form.value.notes || undefined
  });
  saved.value = true;
  form.value = { title: '', username: '', password: '', url: '', notes: '' };
  setTimeout(() => {
    saved.value = false;
  }, 1500);

  // If the admin page is open, force it to reload the password list
  emit('quick-add-saved');
}
</script>

<template>
  <div class="quick-view">
    <div class="quick-card">
      <div class="header">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>快速添加</span>
        <button class="close-btn" @click="closeWindow" title="关闭">
          <svg
            width="16"
            height="16"
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
      <div class="body">
        <input v-model="form.title" class="input" placeholder="标题 *" autofocus />
        <input v-model="form.username" class="input" placeholder="用户名/邮箱 *" />
        <div class="pwd-row">
          <input v-model="form.password" class="input" type="text" placeholder="密码 *" />
          <button class="btn btn-sm gen-btn" @click="generatePassword" title="生成随机密码">
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
            class="btn btn-sm copy-btn"
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
        <input v-model="form.url" class="input" placeholder="网址" />
        <input v-model="form.notes" class="input" placeholder="备注" />
      </div>
      <div class="footer">
        <button
          class="btn btn-primary btn-full"
          :disabled="!form.title || !form.password || !form.username || saved"
          @click="save"
        >
          {{ saved ? '✓ 已保存，即将关闭' : '保存' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
html,
body {
  height: 100%;
  background: #0a0a0f;
  color: #e8e8ed;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  -webkit-font-smoothing: antialiased;
}
#app {
  height: 100%;
}
.quick-view {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0a0a0f;
  -webkit-app-region: drag;
}
.quick-card {
  width: 100%;
  height: 100%;
  padding: 0 24px 15px;
  display: flex;
  flex-direction: column;
  /* justify-content: space-between; */
  -webkit-app-region: no-drag;
}
.header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #e8e8ed;
  padding: 15px 0;
  -webkit-app-region: drag;
}
.header svg:first-child {
  color: #6366f1;
}
.close-btn {
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  color: #5c5c6e;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s;
  -webkit-app-region: no-drag;
}
.body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1;
  /* justify-content: space-evenly; */
  /* margin-bottom: 14px; */
}
.body .input {
  width: 100%;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  color: #e8e8ed;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 0.875rem;
  outline: none;
  transition: border-color 0.15s;
}
.body .input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.body .input::placeholder {
  color: #5c5c6e;
}
.pwd-row {
  display: flex;
  gap: 6px;
}
.pwd-row .input {
  flex: 1;
}
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 12px;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    sans-serif;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.btn:active {
  transform: scale(0.96);
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn-sm {
  padding: 6px 10px;
  font-size: 0.8rem;
  border-radius: 8px;
}
.gen-btn,
.copy-btn {
  background: transparent;
  color: #9898a8;
  border: 1px solid rgba(255, 255, 255, 0.08);
  flex-shrink: 0;
}
.gen-btn:hover,
.copy-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e8e8ed;
  border-color: rgba(99, 102, 241, 0.4);
}
.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: #fff;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.25);
}
.btn-full {
  width: 100%;
}
</style>
