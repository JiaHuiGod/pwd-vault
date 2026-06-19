<script setup lang="ts">
import { ref } from 'vue'
import type { CloseAction, CloseActionPreference } from '../types'

const emit = defineEmits<{
  close: []
  choose: [action: CloseActionPreference]
}>()

const remember = ref(false)

function choose(action: CloseAction) {
  emit('choose', { action, remember: remember.value })
}
</script>

<template>
  <Transition name="scale">
    <div class="tray-overlay">
      <Transition name="slide-up" appear>
        <div class="tray-card glass-card glow-border">
          <!-- Decorative glow -->
          <div class="card-glow" />

          <div class="tray-header">
            <div class="icon-box">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h2>关闭确认</h2>
            <p class="subtitle">您希望如何操作？</p>
          </div>

          <div class="tray-actions">
            <button class="action-btn" @click="choose('minimize')">
              <div class="action-icon minimize-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </div>
              <div class="action-text">
                <span class="action-title">最小化到托盘</span>
                <span class="action-desc">程序将在后台继续运行</span>
              </div>
            </button>

            <button class="action-btn" @click="choose('quit')">
              <div class="action-icon quit-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </div>
              <div class="action-text">
                <span class="action-title">彻底退出</span>
                <span class="action-desc">关闭程序所有进程</span>
              </div>
            </button>
          </div>

          <label class="checkbox-wrapper" style="justify-content: center; margin-top: 20px;">
            <input v-model="remember" type="checkbox" />
            记住我的选择，不再提示
          </label>
        </div>
      </Transition>
    </div>
  </Transition>
</template>

<style scoped>
.tray-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
}

.tray-card {
  position: relative;
  width: 400px;
  padding: 36px 28px 28px;
  overflow: hidden;
}

.card-glow {
  position: absolute;
  top: -50%;
  right: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 70% 20%, rgba(99, 102, 241, 0.06), transparent 60%);
  pointer-events: none;
}

.tray-header {
  text-align: center;
  margin-bottom: 24px;
}

.icon-box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--accent-subtle);
  color: var(--accent);
  margin-bottom: 12px;
}

.tray-header h2 {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 4px;
}

.subtitle {
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.tray-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-glass);
  border: 1px solid var(--border-glass);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  text-align: left;
  width: 100%;
}
.action-btn:hover {
  background: var(--bg-glass-hover);
  border-color: var(--border-accent);
  transform: translateX(4px);
}
.action-btn:active {
  transform: scale(0.98);
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  flex-shrink: 0;
}
.minimize-icon {
  background: rgba(99, 102, 241, 0.12);
  color: var(--accent);
}
.quit-icon {
  background: rgba(239, 68, 68, 0.12);
  color: var(--danger);
}

.action-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.action-title {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-primary);
}
.action-desc {
  font-size: 0.78rem;
  color: var(--text-muted);
}
</style>
