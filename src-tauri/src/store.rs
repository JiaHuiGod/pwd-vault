use std::fs;
use std::path::PathBuf;
use tauri::Manager;

/// Returns the config directory path for vault data.
/// - Dev mode: `<project_root>/config`
/// - Production: `<app_data_dir>/config`
pub fn config_dir(app_handle: &tauri::AppHandle) -> PathBuf {
    if tauri::is_dev() {
        // In dev mode, try to find the project root from the current dir
        // The dev server runs from the frontend dir, so we need to go up
        let cwd = std::env::current_dir().unwrap_or_default();
        let mut path = cwd.clone();
        // Walk up looking for package.json or src-tauri directory
        loop {
            if path.join("package.json").exists() || path.join("src-tauri").is_dir() {
                break;
            }
            if !path.pop() {
                path = cwd.clone();
                break;
            }
        }
        path.join("config")
    } else {
        let data_dir = app_handle
            .path()
            .app_data_dir()
            .unwrap_or_else(|_| PathBuf::from("."));
        data_dir.join("config")
    }
}

/// Full path to the vault data file.
pub fn vault_path(app_handle: &tauri::AppHandle) -> PathBuf {
    config_dir(app_handle).join("vault.json")
}

/// Ensure config directory exists.
pub fn ensure_config_dir(app_handle: &tauri::AppHandle) -> Result<(), String> {
    let dir = config_dir(app_handle);
    fs::create_dir_all(&dir).map_err(|e| format!("创建配置目录失败: {}", e))
}

/// Write encrypted data to vault file.
pub fn write_vault(app_handle: &tauri::AppHandle, encrypted_data: &str) -> Result<(), String> {
    ensure_config_dir(app_handle)?;
    let path = vault_path(app_handle);
    fs::write(&path, encrypted_data).map_err(|e| format!("写入保险库文件失败: {}", e))
}

/// Read encrypted data from vault file.
pub fn read_vault(app_handle: &tauri::AppHandle) -> Result<String, String> {
    let path = vault_path(app_handle);
    if !path.exists() {
        return Err("保险库文件不存在".to_string());
    }
    fs::read_to_string(&path).map_err(|e| format!("读取保险库文件失败: {}", e))
}

/// Check if vault file exists.
pub fn vault_exists(app_handle: &tauri::AppHandle) -> bool {
    vault_path(app_handle).exists()
}

/// Get config dir as string (for display).
pub fn config_dir_string(app_handle: &tauri::AppHandle) -> String {
    config_dir(app_handle).to_string_lossy().to_string()
}
