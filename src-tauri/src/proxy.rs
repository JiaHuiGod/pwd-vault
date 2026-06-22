use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub enabled: bool,
    pub host: String,
    pub port: u16,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub username: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            host: String::new(),
            port: 8080,
            username: None,
            password: None,
        }
    }
}

/// 通用应用设置，所有设置项作为子字段存放
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub proxy: ProxyConfig,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            proxy: ProxyConfig::default(),
        }
    }
}

fn settings_path(app_handle: &tauri::AppHandle) -> std::path::PathBuf {
    crate::store::config_dir(app_handle).join("settings.json")
}

fn load_settings(app_handle: &tauri::AppHandle) -> AppSettings {
    let path = settings_path(app_handle);
    if !path.exists() {
        return AppSettings::default();
    }
    let content = match fs::read_to_string(&path) {
        Ok(c) => c,
        Err(_) => return AppSettings::default(),
    };
    serde_json::from_str(&content).unwrap_or_default()
}

fn save_settings(app_handle: &tauri::AppHandle, settings: &AppSettings) -> Result<(), String> {
    let path = settings_path(app_handle);
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| format!("创建设置目录失败: {}", e))?;
    }
    let content =
        serde_json::to_string_pretty(settings).map_err(|e| format!("序列化设置失败: {}", e))?;
    fs::write(&path, &content).map_err(|e| format!("写入设置失败: {}", e))
}

/// 设置或移除 HTTP_PROXY / HTTPS_PROXY 环境变量
pub fn apply_proxy(app_handle: &tauri::AppHandle) {
    let settings = load_settings(app_handle);
    let config = &settings.proxy;
    if config.enabled && !config.host.trim().is_empty() && config.port > 0 {
        let proxy_url = build_proxy_url(config);
        std::env::set_var("HTTP_PROXY", &proxy_url);
        std::env::set_var("HTTPS_PROXY", &proxy_url);
    } else {
        std::env::remove_var("HTTP_PROXY");
        std::env::remove_var("HTTPS_PROXY");
    }
}

fn build_proxy_url(config: &ProxyConfig) -> String {
    match (&config.username, &config.password) {
        (Some(user), Some(pass)) if !user.is_empty() && !pass.is_empty() => {
            format!("http://{}:{}@{}:{}", encode_cred(user), encode_cred(pass), config.host, config.port)
        }
        _ => {
            format!("http://{}:{}", config.host, config.port)
        }
    }
}

/// 对代理认证信息中的特殊字符进行百分号编码
fn encode_cred(s: &str) -> String {
    let mut result = String::with_capacity(s.len());
    for byte in s.bytes() {
        match byte {
            b':' | b'/' | b'%' | b'@' | b' ' | 0x00..=0x1F | 0x7F..=0xFF => {
                result.push_str(&format!("%{:02X}", byte));
            }
            _ => result.push(byte as char),
        }
    }
    result
}

// ─── Tauri Commands ─────────────────────────────────────

#[tauri::command]
pub fn get_proxy_config(app: tauri::AppHandle) -> ProxyConfig {
    load_settings(&app).proxy
}

#[tauri::command]
pub fn set_proxy_config(app: tauri::AppHandle, config: ProxyConfig) -> Result<(), String> {
    if config.enabled {
        if config.host.trim().is_empty() {
            return Err("代理主机地址不能为空".to_string());
        }
        if config.port == 0 {
            return Err("代理端口不能为 0".to_string());
        }
    }
    let mut settings = load_settings(&app);
    settings.proxy = config;
    save_settings(&app, &settings)?;
    apply_proxy(&app);
    Ok(())
}
