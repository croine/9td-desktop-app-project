/**
 * Automation Engine
 * Handles automation rules for tasks (auto-archive, status changes, etc.)
 */

import { Task } from '@/types/task'

export type AutomationRuleType =
  | 'auto_archive_completed'
  | 'auto_status_change'
  | 'auto_tag'
  | 'auto_category'
  | 'auto_priority_escalate'
  | 'auto_assign'
  | 'auto_create_subtask'

export type AutomationCondition = {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'days_after' | 'status_for_duration'
  value: any
}

export type AutomationAction = {
  type: 'set_status' | 'archive' | 'add_tag' | 'add_category' | 'set_priority' | 'assign' | 'create_subtask' | 'delete'
  value: any
}

export interface AutomationRule {
  id: string
  name: string
  description: string
  type: AutomationRuleType
  enabled: boolean
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  createdAt: string
  lastTriggered?: string
  triggerCount: number
}

const STORAGE_KEY = '9td_automation_rules'

class AutomationEngine {
  private static instance: AutomationEngine
  private rules: AutomationRule[] = []
  private checkInterval: NodeJS.Timeout | null = null

  private constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.loadRules()
      this.startAutomation()
    }
  }

  static getInstance(): AutomationEngine {
    if (!AutomationEngine.instance) {
      AutomationEngine.instance = new AutomationEngine()
    }
    return AutomationEngine.instance
  }

  private loadRules(): void {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.rules = JSON.parse(stored)
      } else {
        // Create default rules
        this.rules = this.getDefaultRules()
        this.saveRules()
      }
    } catch (error) {
      console.error('Failed to load automation rules:', error)
      this.rules = this.getDefaultRules()
    }
  }

  private saveRules(): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.rules))
    } catch (error) {
      console.error('Failed to save automation rules:', error)
    }
  }

  private getDefaultRules(): AutomationRule[] {
    return [
      {
        id: 'rule_auto_archive',
        name: 'Auto-archive completed tasks',
        description: 'Automatically archive tasks 7 days after completion',
        type: 'auto_archive_completed',
        enabled: true,
        conditions: [
          { field: 'status', operator: 'equals', value: 'completed' },
          { field: 'completedAt', operator: 'days_after', value: 7 }
        ],
        actions: [
          { type: 'archive', value: true }
        ],
        createdAt: new Date().toISOString(),
        triggerCount: 0
      },
      {
        id: 'rule_escalate_overdue',
        name: 'Escalate overdue tasks',
        description: 'Automatically increase priority of overdue tasks',
        type: 'auto_priority_escalate',
        enabled: true,
        conditions: [
          { field: 'dueDate', operator: 'less_than', value: 'now' },
          { field: 'status', operator: 'not_equals', value: 'completed' },
          { field: 'priority', operator: 'not_equals', value: 'urgent' }
        ],
        actions: [
          { type: 'set_priority', value: 'urgent' }
        ],
        createdAt: new Date().toISOString(),
        triggerCount: 0
      }
    ]
  }

  private startAutomation(): void {
    // Check automation rules every 5 minutes
    this.checkInterval = setInterval(() => {
      this.processAutomationRules()
    }, 5 * 60 * 1000)
  }

  stopAutomation(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private evaluateCondition(task: Task, condition: AutomationCondition): boolean {
    const fieldValue = (task as any)[condition.field]

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value

      case 'not_equals':
        return fieldValue !== condition.value

      case 'contains':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(condition.value)
        }
        return String(fieldValue).includes(String(condition.value))

      case 'greater_than':
        return fieldValue > condition.value

      case 'less_than':
        if (condition.value === 'now') {
          return new Date(fieldValue) < new Date()
        }
        return fieldValue < condition.value

      case 'days_after':
        if (!fieldValue) return false
        const daysSince = (Date.now() - new Date(fieldValue).getTime()) / (1000 * 60 * 60 * 24)
        return daysSince >= condition.value

      case 'status_for_duration':
        // Check if task has been in status for X days
        const statusDays = (Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        return statusDays >= condition.value

      default:
        return false
    }
  }

  private evaluateRule(task: Task, rule: AutomationRule): boolean {
    if (!rule.enabled) return false
    return rule.conditions.every(condition => this.evaluateCondition(task, condition))
  }

  processAutomationRules(tasks?: Task[]): { rule: AutomationRule; task: Task; actions: AutomationAction[] }[] {
    if (typeof window === 'undefined') return []
    
    if (!tasks) {
      // Load tasks from storage if not provided
      try {
        const storedTasks = localStorage.getItem('9td_tasks')
        tasks = storedTasks ? JSON.parse(storedTasks) : []
      } catch {
        return []
      }
    }

    const triggeredRules: { rule: AutomationRule; task: Task; actions: AutomationAction[] }[] = []

    for (const rule of this.rules) {
      if (!rule.enabled) continue

      for (const task of tasks) {
        if (task.archived) continue // Skip archived tasks

        if (this.evaluateRule(task, rule)) {
          triggeredRules.push({
            rule,
            task,
            actions: rule.actions
          })

          // Update trigger count
          rule.lastTriggered = new Date().toISOString()
          rule.triggerCount++
        }
      }
    }

    if (triggeredRules.length > 0) {
      this.saveRules()
    }

    return triggeredRules
  }

  executeActions(task: Task, actions: AutomationAction[]): Partial<Task> {
    const updates: Partial<Task> = {}

    for (const action of actions) {
      switch (action.type) {
        case 'archive':
          updates.archived = action.value
          updates.archivedAt = new Date().toISOString()
          break

        case 'set_status':
          updates.status = action.value
          break

        case 'add_tag':
          if (!updates.tags) updates.tags = [...(task.tags || [])]
          if (!updates.tags.includes(action.value)) {
            updates.tags.push(action.value)
          }
          break

        case 'add_category':
          if (!updates.categories) updates.categories = [...(task.categories || [])]
          if (!updates.categories.includes(action.value)) {
            updates.categories.push(action.value)
          }
          break

        case 'set_priority':
          updates.priority = action.value
          break

        case 'create_subtask':
          if (!updates.subtasks) updates.subtasks = [...(task.subtasks || [])]
          updates.subtasks.push({
            id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: action.value,
            completed: false,
            createdAt: new Date().toISOString()
          })
          break

        case 'delete':
          // Mark for deletion (caller should handle actual deletion)
          updates.archived = true
          updates.archivedAt = new Date().toISOString()
          break
      }
    }

    return updates
  }

  // CRUD operations for rules
  getRules(): AutomationRule[] {
    return this.rules
  }

  getRule(id: string): AutomationRule | undefined {
    return this.rules.find(r => r.id === id)
  }

  addRule(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      triggerCount: 0
    }
    this.rules.push(newRule)
    this.saveRules()
    return newRule
  }

  updateRule(id: string, updates: Partial<AutomationRule>): void {
    const index = this.rules.findIndex(r => r.id === id)
    if (index !== -1) {
      this.rules[index] = { ...this.rules[index], ...updates }
      this.saveRules()
    }
  }

  deleteRule(id: string): void {
    this.rules = this.rules.filter(r => r.id !== id)
    this.saveRules()
  }

  toggleRule(id: string): void {
    const rule = this.rules.find(r => r.id === id)
    if (rule) {
      rule.enabled = !rule.enabled
      this.saveRules()
    }
  }
}

let _automationEngineInstance: AutomationEngine | null = null;

export const automationEngine = new Proxy({} as AutomationEngine, {
  get(target, prop) {
    if (typeof window === 'undefined') {
      // Return no-op functions during SSR
      if (prop === 'processAutomationRules') return () => [];
      return () => {};
    }
    if (!_automationEngineInstance) {
      _automationEngineInstance = AutomationEngine.getInstance();
    }
    const value = (_automationEngineInstance as any)[prop];
    return typeof value === 'function' ? value.bind(_automationEngineInstance) : value;
  }
});