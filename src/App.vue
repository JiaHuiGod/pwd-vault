<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import TrayDialog from './components/TrayDialog.vue'
import type { CloseActionPreference } from './types'
import { checkForUpdate } from './services/updater'

const showTrayDialog = ref(false)
let unlistenClose: (() => void) | null = null
let unlistenReset: (() => void) | null = null

const CLOSE_PREF_KEY = 'psw_close_preference'

onMounted(async () => {
  unlistenClose = await listen('close-requested', () => {
    const stored = localStorage.getItem(CLOSE_PREF_KEY)
    if (stored) {
      try {
        const pref: CloseActionPreference = JSON.parse(stored)
        if (pref.remember) {
          executeAction(pref.action)
          return
        }
      } catch {
        // ignore parse error, show dialog
      }
    }
    showTrayDialog.value = true
  })

  unlistenReset = await listen('reset-close-preference', () => {
    localStorage.removeItem(CLOSE_PREF_KEY)
  })

  // Silently check for updates on startup
  checkForUpdate(true)
})

onUnmounted(() => {
  unlistenClose?.()
  unlistenReset?.()
})

function onTrayChoice(pref: CloseActionPreference) {
  showTrayDialog.value = false
  if (pref.remember) {
    localStorage.setItem(CLOSE_PREF_KEY, JSON.stringify(pref))
  }
  executeAction(pref.action)
}

function executeAction(action: 'minimize' | 'quit') {
  if (action === 'minimize') {
    getCurrentWindow().hide()
  } else {
    invoke('quit_app')
  }
}
</script>

<template>
  <router-view />
  <TrayDialog
    v-if="showTrayDialog"
    @close="showTrayDialog = false"
    @choose="onTrayChoice"
  />
</template>
