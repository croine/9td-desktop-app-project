// Workspace and Custom Fields Storage Management
import { Workspace, CustomField, WorkspaceStats, CustomFieldValue } from '@/types/workspace'
import { Task } from '@/types/task'

const WORKSPACES_KEY = '9td-workspaces'
const CUSTOM_FIELDS_KEY = '9td-custom-fields'
const ACTIVE_WORKSPACE_KEY = '9td-active-workspace'

// Default workspace
const DEFAULT_WORKSPACE: Workspace = {
  id: 'default',
  name: 'Personal',
  description: 'Your default workspace',
  color: '#3b82f6',
  icon: '📁',
  createdAt: new Date().toISOString(),
  isDefault: true,
}

// Workspaces Management
export function getWorkspaces(): Workspace[] {
  if (typeof window === 'undefined') return [DEFAULT_WORKSPACE]
  
  try {
    const stored = localStorage.getItem(WORKSPACES_KEY)
    if (!stored) {
      localStorage.setItem(WORKSPACES_KEY, JSON.stringify([DEFAULT_WORKSPACE]))
      return [DEFAULT_WORKSPACE]
    }
    const workspaces = JSON.parse(stored)
    
    // Ensure default workspace exists
    if (!workspaces.find((w: Workspace) => w.isDefault)) {
      workspaces.unshift(DEFAULT_WORKSPACE)
      localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces))
    }
    
    return workspaces
  } catch (error) {
    console.error('Error loading workspaces:', error)
    return [DEFAULT_WORKSPACE]
  }
}

export function addWorkspace(workspace: Omit<Workspace, 'id' | 'createdAt'>): Workspace {
  const workspaces = getWorkspaces()
  const newWorkspace: Workspace = {
    ...workspace,
    id: `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  
  workspaces.push(newWorkspace)
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces))
  
  return newWorkspace
}

export function updateWorkspace(workspaceId: string, updates: Partial<Workspace>): void {
  const workspaces = getWorkspaces()
  const index = workspaces.findIndex(w => w.id === workspaceId)
  
  if (index !== -1) {
    workspaces[index] = { ...workspaces[index], ...updates }
    localStorage.setItem(WORKSPACES_KEY, JSON.stringify(workspaces))
  }
}

export function deleteWorkspace(workspaceId: string): void {
  const workspaces = getWorkspaces()
  const workspace = workspaces.find(w => w.id === workspaceId)
  
  if (workspace?.isDefault) {
    throw new Error('Cannot delete default workspace')
  }
  
  const filtered = workspaces.filter(w => w.id !== workspaceId)
  localStorage.setItem(WORKSPACES_KEY, JSON.stringify(filtered))
  
  // If this was the active workspace, switch to default
  if (getActiveWorkspaceId() === workspaceId) {
    setActiveWorkspaceId('default')
  }
}

export function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return 'default'
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY) || 'default'
}

export function setActiveWorkspaceId(workspaceId: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACTIVE_WORKSPACE_KEY, workspaceId)
}

export function getWorkspaceStats(workspaceId: string, tasks: Task[]): WorkspaceStats {
  const workspaceTasks = tasks.filter(t => t.workspaceId === workspaceId)
  const now = new Date()
  
  return {
    totalTasks: workspaceTasks.length,
    completedTasks: workspaceTasks.filter(t => t.status === 'completed').length,
    inProgressTasks: workspaceTasks.filter(t => t.status === 'in-progress').length,
    overdueTasksCount: workspaceTasks.filter(t => {
      if (t.status === 'completed' || !t.dueDate) return false
      return new Date(t.dueDate) < now
    }).length,
  }
}

export function getAllWorkspaceStats(tasks: Task[]): { [workspaceId: string]: WorkspaceStats } {
  const workspaces = getWorkspaces()
  const stats: { [workspaceId: string]: WorkspaceStats } = {}
  
  workspaces.forEach(workspace => {
    stats[workspace.id] = getWorkspaceStats(workspace.id, tasks)
  })
  
  return stats
}

// Custom Fields Management
export function getCustomFields(): CustomField[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(CUSTOM_FIELDS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Error loading custom fields:', error)
    return []
  }
}

export function addCustomField(field: Omit<CustomField, 'id' | 'createdAt'>): CustomField {
  const fields = getCustomFields()
  const newField: CustomField = {
    ...field,
    id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  }
  
  fields.push(newField)
  localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(fields))
  
  return newField
}

export function updateCustomField(fieldId: string, updates: Partial<CustomField>): void {
  const fields = getCustomFields()
  const index = fields.findIndex(f => f.id === fieldId)
  
  if (index !== -1) {
    fields[index] = { ...fields[index], ...updates }
    localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(fields))
  }
}

export function deleteCustomField(fieldId: string): void {
  const fields = getCustomFields()
  const filtered = fields.filter(f => f.id !== fieldId)
  localStorage.setItem(CUSTOM_FIELDS_KEY, JSON.stringify(filtered))
}

// Helper to validate custom field value
export function validateCustomFieldValue(field: CustomField, value: any): boolean {
  if (field.required && (value === null || value === undefined || value === '')) {
    return false
  }
  
  switch (field.type) {
    case 'number':
      return !isNaN(Number(value))
    case 'email':
      return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    case 'url':
      try {
        if (!value) return true
        new URL(value)
        return true
      } catch {
        return false
      }
    case 'dropdown':
      return !value || (field.options?.includes(value) ?? false)
    default:
      return true
  }
}
