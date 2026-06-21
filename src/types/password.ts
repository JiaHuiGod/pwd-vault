export interface PasswordItem {
  id: string
  title: string
  username: string
  password: string
  url?: string
  notes?: string
  createdAt: number
  updatedAt: number
  pinned?: boolean
}

export interface QuickPassword {
  title: string
  username: string
  password: string
}

export type CloseAction = 'minimize' | 'quit'

export interface CloseActionPreference {
  action: CloseAction
  remember: boolean
}

