export interface ProxyConfig {
  enabled: boolean
  host: string
  port: number
  username?: string
  password?: string
}

export interface AppSettings {
  proxy: ProxyConfig
}
