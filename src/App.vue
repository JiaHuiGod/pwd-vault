<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import TrayDialog from './components/TrayDialog.vue'
import type { CloseActionPreference } from './types'

const showTrayDialog = ref(false)
let unlisten: (() => void) | null = null

const CLOSE_PREF_KEY = 'psw_close_preference'

onMounted(async () => {
  // Listen for close-requested from Rust backend
  unlisten = await listen('close-requested', () => {
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
})

onUnmounted(() => {
  unlisten?.()
})

function onTrayChoice(pref: CloseActionPreference) {
  showTrayDialog.value = false
  if (pref.remember) {
    localStorage.setItem(CLOSE_PREF_KEY, JSON.stringify(pref))
  }
  executeAction(pref.action)
}

async function executeAction(action: 'minimize' | 'quit') {
  const win = getCurrentWindow()
  if (action === 'minimize') {
    await win.hide()
  } else {
    await win.close()
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
