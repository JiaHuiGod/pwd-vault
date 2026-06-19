use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use argon2::Argon2;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};
use rand::rngs::OsRng;
use rand::RngCore;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
struct VaultPayload {
    salt: String,
    nonce: String,
    data: String,
}

fn derive_key(passphrase: &str, salt: &[u8]) -> Result<[u8; 32], String> {
    let mut key = [0u8; 32];
    Argon2::default()
        .hash_password_into(passphrase.as_bytes(), salt, &mut key)
        .map_err(|e| format!("密钥派生失败: {}", e))?;
    Ok(key)
}

pub fn encrypt(plaintext: &str, passphrase: &str) -> Result<String, String> {
    // Generate random salt
    let mut salt = [0u8; 16];
    OsRng.fill_bytes(&mut salt);

    // Derive 256-bit key from passphrase
    let key = derive_key(passphrase, &salt)?;

    // Generate random nonce
    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    // Encrypt
    let cipher =
        Aes256Gcm::new_from_slice(&key).map_err(|e| format!("AES 初始化失败: {}", e))?;
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("加密失败: {}", e))?;

    let payload = VaultPayload {
        salt: BASE64.encode(salt),
        nonce: BASE64.encode(nonce_bytes),
        data: BASE64.encode(ciphertext),
    };

    serde_json::to_string(&payload).map_err(|e| format!("序列化失败: {}", e))
}

pub fn decrypt(payload_json: &str, passphrase: &str) -> Result<String, String> {
    let payload: VaultPayload =
        serde_json::from_str(payload_json).map_err(|_| "无效的保险库格式".to_string())?;

    let salt = BASE64.decode(&payload.salt).map_err(|_| "无效的 salt")?;
    let nonce_bytes = BASE64
        .decode(&payload.nonce)
        .map_err(|_| "无效的 nonce")?;
    let ciphertext = BASE64
        .decode(&payload.data)
        .map_err(|_| "无效的加密数据")?;

    let key = derive_key(passphrase, &salt)?;
    let cipher =
        Aes256Gcm::new_from_slice(&key).map_err(|e| format!("AES 初始化失败: {}", e))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext.as_ref())
        .map_err(|_| "密码错误或数据已损坏")?;

    String::from_utf8(plaintext).map_err(|_| "解密数据编码错误".to_string())
}
