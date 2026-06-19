/// <reference types="vite/client" />

/**
 * Vault storage service — dev uses plain JSON, prod uses AES-256-GCM encryption.
 *
 * In dev mode (`import.meta.env.DEV === true`) the vault file is readable
 * directly so you can inspect it during development.
 * In production the vault file is encrypted with the admin password.
 *
 * Vite tree-shakes the unused import at build time.
 */

import * as dev from './vault-dev'
import * as prod from './vault-prod'

const { save, load, exists } = import.meta.env.DEV ? dev : prod

export { save, load, exists }
