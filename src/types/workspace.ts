// Workspace and Custom Fields Types

export interface Workspace {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  createdAt: string
  isDefault?: boolean
}

export type CustomFieldType = 'text' | 'number' | 'date' | 'dropdown' | 'checkbox' | 'url' | 'email'

export interface CustomField {
  id: string
  name: string
  type: CustomFieldType
  description?: string
  required?: boolean
  options?: string[] // For dropdown type
  defaultValue?: any
  workspaceId?: string // Optional: field can be workspace-specific
  createdAt: string
}

export interface CustomFieldValue {
  fieldId: string
  value: any
}

export interface WorkspaceStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  overdueTasksCount: number
}
