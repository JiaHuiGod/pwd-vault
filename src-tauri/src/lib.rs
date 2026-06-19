mod crypto;
mod store;

use std::sync::Mutex;
use tauri::{
    Emitter, Manager,
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, Modifiers, Shortcut, GlobalShortcutExt};

static CURRENT_SHORTCUT: Mutex<Option<String>> = Mutex::new(None);

// ─── Vault Commands ───────────────────────────────────────────────

#[tauri::command]
fn encrypt_save(app: tauri::AppHandle, data: String, key: String) -> Result<(), String> {
    let encrypted = crypto::encrypt(&data, &key)?;
    store::write_vault(&app, &encrypted)
}

#[tauri::command]
fn decrypt_load(app: tauri::AppHandle, key: String) -> Result<String, String> {
    let raw = store::read_vault(&app)?;
    crypto::decrypt(&raw, &key)
}

#[tauri::command]
fn has_vault_file(app: tauri::AppHandle) -> bool {
    store::vault_exists(&app)
}

#[tauri::command]
fn get_config_dir(app: tauri::AppHandle) -> String {
    store::config_dir_string(&app)
}

// ─── Quick Add Window ────────────────────────────────────────────

#[tauri::command]
fn create_quick_add_window(app: tauri::AppHandle) {
    let existing = app.get_webview_window("quick-add");
    if let Some(win) = existing {
        let _ = win.show();
        let _ = win.set_focus();
    } else {
        let win = tauri::WebviewWindowBuilder::new(
            &app,
            "quick-add",
            tauri::WebviewUrl::App("index.html#/quick-add".into()),
        )
        .title("快速添加密码")
        .inner_size(380.0, 340.0)
        .resizable(false)
        .decorations(false)
        .always_on_top(true)
        .center()
        .build()
        .expect("Failed to create quick-add window");

        let handle = win.clone();
        let _ = win.on_window_event(move |event| {
            if let WindowEvent::CloseRequested { .. } = event {
                let _ = handle.hide();
            }
        });
    }
}

// ─── Shortcut ────────────────────────────────────────────────────

fn parse_shortcut(combo: &str) -> Result<Shortcut, String> {
    let parts: Vec<&str> = combo.split('+').collect();
    let mut modifiers = Modifiers::empty();
    let mut code = None;

    for part in parts {
        match part.trim().to_lowercase().as_str() {
            "cmdorctrl" | "cmd" | "ctrl" | "control" => {
                #[cfg(target_os = "macos")]
                {
                    modifiers |= Modifiers::SUPER;
                }
                #[cfg(not(target_os = "macos"))]
                {
                    modifiers |= Modifiers::CONTROL;
                }
            }
            "alt" | "option" => modifiers |= Modifiers::ALT,
            "shift" => modifiers |= Modifiers::SHIFT,
            _ => {
                let c = match part.trim().to_uppercase().as_str() {
                    "A" => Code::KeyA,
                    "B" => Code::KeyB,
                    "C" => Code::KeyC,
                    "D" => Code::KeyD,
                    "E" => Code::KeyE,
                    "F" => Code::KeyF,
                    "G" => Code::KeyG,
                    "H" => Code::KeyH,
                    "I" => Code::KeyI,
                    "J" => Code::KeyJ,
                    "K" => Code::KeyK,
                    "L" => Code::KeyL,
                    "M" => Code::KeyM,
                    "N" => Code::KeyN,
                    "O" => Code::KeyO,
                    "P" => Code::KeyP,
                    "Q" => Code::KeyQ,
                    "R" => Code::KeyR,
                    "S" => Code::KeyS,
                    "T" => Code::KeyT,
                    "U" => Code::KeyU,
                    "V" => Code::KeyV,
                    "W" => Code::KeyW,
                    "X" => Code::KeyX,
                    "Y" => Code::KeyY,
                    "Z" => Code::KeyZ,
                    "F1" => Code::F1,
                    "F2" => Code::F2,
                    "F3" => Code::F3,
                    "F4" => Code::F4,
                    "F5" => Code::F5,
                    "F6" => Code::F6,
                    "F7" => Code::F7,
                    "F8" => Code::F8,
                    "F9" => Code::F9,
                    "F10" => Code::F10,
                    "F11" => Code::F11,
                    "F12" => Code::F12,
                    _ => return Err(format!("Unknown key: {}", part)),
                };
                code = Some(c);
            }
        }
    }

    let c = code.ok_or("No key code found in shortcut")?;
    Ok(Shortcut::new(Some(modifiers), c))
}

#[tauri::command]
fn set_global_shortcut(app: tauri::AppHandle, combo: String) -> Result<(), String> {
    let prev = CURRENT_SHORTCUT.lock().unwrap().take();
    if let Some(ref prev_combo) = prev {
        if let Ok(shortcut) = parse_shortcut(prev_combo) {
            let _ = app.global_shortcut().unregister(shortcut);
        }
    }

    if combo.is_empty() {
        return Ok(());
    }

    let shortcut = parse_shortcut(&combo)?;
    app.global_shortcut()
        .on_shortcut(
            shortcut,
            move |_app, _event, _handle| {
                create_quick_add_window(_app.clone());
            },
        )
        .map_err(|e| e.to_string())?;

    *CURRENT_SHORTCUT.lock().unwrap() = Some(combo);
    Ok(())
}

// ─── Entry Point ─────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let show = MenuItem::with_id(app, "show", "显示主窗口", true, None::<&str>)?;
            let quick_add =
                MenuItem::with_id(app, "quick_add", "快速添加密码", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quick_add, &quit])?;

            TrayIconBuilder::new()
                .tooltip("Vault 密码管理器")
                .menu(&menu)
                .on_menu_event(|app, event| match event.id().as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quick_add" => {
                        create_quick_add_window(app.clone());
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.emit("close-requested", ());
            }
        })
        .invoke_handler(tauri::generate_handler![
            create_quick_add_window,
            set_global_shortcut,
            encrypt_save,
            decrypt_load,
            has_vault_file,
            get_config_dir,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
