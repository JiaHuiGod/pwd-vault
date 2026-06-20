import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'

/**
 * Check for updates. When `silent` is true, only show a notification when
 * an update is actually found (for startup auto-check).
 * When `silent` is false, also show a "已是最新版" message when up to date
 * (for manual check via button).
 */
export async function checkForUpdate(silent = true): Promise<void> {
  try {
    const update = await check({ timeout: 10000 })
    if (!update) {
      if (!silent) {
        alertTip('已是最新版', `当前版本已是最新 (v${import.meta.env.APP_VERSION || '0.1.0'})`)
      }
      return
    }

    const proceed = await confirmTip(
      '发现新版本',
      `v${update.version} 可用，是否立即下载更新？`,
    )
    if (!proceed) return

    await update.downloadAndInstall((event) => {
      if (event.event === 'Finished') {
        console.log('更新下载完成')
      }
    })

    const restart = await confirmTip('更新完成', '已下载并安装更新，是否重启应用？')
    if (restart) {
      await relaunch()
    }
  } catch (e) {
    console.error('检查更新失败:', e)
    if (!silent) {
      alertTip('检查更新失败', '无法连接到更新服务器，请稍后再试')
    }
  }
}

/** Simple confirm dialog using window.confirm (no extra deps needed) */
async function confirmTip(title: string, message: string): Promise<boolean> {
  return window.confirm(`${title}\n\n${message}`)
}

/** Simple alert dialog */
function alertTip(title: string, message: string): void {
  window.alert(`${title}\n\n${message}`)
}
