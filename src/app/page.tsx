"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { useCustomer } from 'autumn-js/react'
import { Task, Tag, Category, ActivityLog, TaskTemplate } from '@/types/task'
import {
  getTasks,
  getTags,
  getCategories,
  getLogs,
  getSettings,
  addTask,
  updateTask,
  deleteTask,
  addTag,
  updateTag,
  deleteTag,
  addCategory,
  updateCategory,
  deleteCategory,
  saveSettings,
  getInboxItems,
  getTemplates,
  addTemplate,
  updateTemplate,
  deleteTemplate,
  archiveTask,
  unarchiveTask,
  getActiveTasks,
  getArchivedTasks,
  processRecurringTasks,
} from '@/lib/storage'
import { notificationService, scheduleDueDateNotifications } from '@/lib/notificationService'
import { automationEngine } from '@/lib/automationEngine'
import { AnimatedTitle } from '@/components/AnimatedTitle'
import { NavigationSidebar, SidebarView } from '@/components/NavigationSidebar'
import { Dashboard } from '@/components/Dashboard'
import { TaskList } from '@/components/TaskList'
import { CreateTaskModal } from '@/components/CreateTaskModal'
import { AdvancedSearchBar, AdvancedSearchFilters } from '@/components/AdvancedSearchBar'
import { SettingsHub } from '@/components/SettingsHub'
import { ActivityLog as ActivityLogComponent } from '@/components/ActivityLog'
import { OwnerPanel } from '@/components/OwnerPanel'
import { CalendarView } from '@/components/CalendarView'
import { KanbanBoard } from '@/components/KanbanBoard'
import { GanttView } from '@/components/GanttView'
import { Analytics } from '@/components/Analytics'
import { PomodoroTimer } from '@/components/PomodoroTimer'
import { TimeBlockingCalendar } from '@/components/TimeBlockingCalendar'
import { ThemeToggle } from '@/components/ThemeToggle'
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal'
import { QuickLinksDropdown } from '@/components/QuickLinksDropdown'
import { Logo } from '@/components/Logo'
import { DashboardTitle } from '@/components/DashboardTitle'
import { NotificationCenter } from '@/components/NotificationCenter'
import { Button } from '@/components/ui/button'
import { Plus, Menu, X, MessageSquare, Lock, LogIn, UserPlus, KeyRound } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { showToast, keyboardShortcutToast } from '@/lib/toast-utils'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications'
import { Card } from '@/components/ui/card'
import { UserAvatar } from '@/components/UserAvatar'
import { MessageSystem } from '@/components/MessageSystem/MessageSystem'
import { PomodoroTaskIntegration } from '@/components/PomodoroTaskIntegration'
import { TimeAnalytics } from '@/components/TimeAnalytics'
import { PageContainer, ViewTransitionLoader } from '@/components/LoadingStates'
import { AnimatePresence } from 'framer-motion'
import { PaymentWarning } from '@/components/PaymentWarning'
import { FeatureGate } from '@/components/FeatureGate'
import { PlanUsageIndicator } from '@/components/PlanUsageIndicator'
import { GamificationDashboard } from '@/components/GamificationDashboard'
import { AvatarCustomization } from '@/components/AvatarCustomization'
import { TaskDependencyGraph } from '@/components/TaskDependencyGraph'
import { DailyPlanningRitual } from '@/components/DailyPlanningRitual'
import { EnhancedFocusMode } from '@/components/EnhancedFocusMode'
import { 
  getActiveWorkspaceId, 
  getWorkspaces, 
  setActiveWorkspaceId 
} from '@/lib/workspaceStorage'
import { PrintView } from '@/components/PrintView'
import { cloneTask, bulkCloneTasks } from '@/lib/storage'
import Loading from '@/app/loading'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// ========================================================================
// VERSION v8.0 - ALL FEATURES + NOTIFICATIONS + AUTOMATION + ERROR HANDLING
// ========================================================================
const APP_VERSION = "v8.0-COMPLETE-" + Date.now()
const FORCE_RELOAD_KEY = "9td-v8.0-complete"

export default function Home() {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = useSession()
  const { customer, check, track, refetch: refetchCustomer, isLoading: isLoadingCustomer } = useCustomer()
  const [currentView, setCurrentView] = useState<SidebarView>('dashboard')
  const [tasks, setTasks] = useState<Task[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [settings, setSettings] = useState(getSettings())
  const [inboxItems, setInboxItems] = useState(getInboxItems())
  const [templates, setTemplates] = useState(getTemplates())
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<string>('general')
  
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [focusTask, setFocusTask] = useState<Task | null>(null)
  
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    query: '',
    tags: [],
    categories: [],
  })

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Add loading state for view transitions
  const [isLoadingView, setIsLoadingView] = useState(false)

  // Ultimate cache clearing on mount
  useEffect(() => {
    const hasReloaded = sessionStorage.getItem(FORCE_RELOAD_KEY)
    if (!hasReloaded) {
      console.log('🔥 Ultimate cache clear starting...')
      sessionStorage.setItem(FORCE_RELOAD_KEY, 'true')
      
      // Clear all caches
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
    }
  }, [])

  // Initialize browser notifications
  useBrowserNotifications(tasks)

  // Initialize notification service and automation engine
  useEffect(() => {
    // Request notification permissions
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Schedule due date notifications
    const notificationInterval = setInterval(() => {
      if (session?.user) {
        scheduleDueDateNotifications(tasks, settings.notificationTimings || [15, 60, 1440])
      }
    }, 60000) // Check every minute

    // Process automation rules
    const automationInterval = setInterval(() => {
      if (session?.user) {
        const triggeredRules = automationEngine.processAutomationRules(tasks)
        
        triggeredRules.forEach(({ rule, task, actions }) => {
          const updates = automationEngine.executeActions(task, actions)
          updateTask(task.id, updates)
          
          notificationService.send({
            type: 'task_updated',
            title: '⚡ Automation Rule Triggered',
            message: `Rule "${rule.name}" updated task "${task.title}"`,
            priority: 'low',
            metadata: { taskId: task.id, ruleId: rule.id }
          })
        })

        if (triggeredRules.length > 0) {
          refreshData()
        }
      }
    }, 5 * 60000) // Check every 5 minutes

    return () => {
      clearInterval(notificationInterval)
      clearInterval(automationInterval)
    }
  }, [tasks, session, settings.notificationTimings])

  const viewMap: { [key: string]: SidebarView } = {
    '1': 'dashboard',
    '2': 'your-tasks',
    '3': 'calendar',
    '4': 'kanban',
    '5': 'gantt',
    '6': 'pomodoro',
    '7': 'time-blocking',
    '8': 'analytics',
    '9': 'activity-logs',
  }

  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      meta: true,
      callback: () => {
        setEditingTask(null)
        setCreateModalOpen(true)
        toast.info('⌨️ Create new task')
      },
      description: 'Create new task'
    },
    {
      key: '/',
      ctrl: true,
      meta: true,
      callback: () => {
        const searchInput = document.querySelector('input[type="text"]') as HTMLInputElement
        if (searchInput) {
          searchInput.focus()
          toast.info('⌨️ Search focused')
        }
      },
      description: 'Focus search'
    },
    {
      key: '?',
      callback: () => {
        setShortcutsModalOpen(true)
        toast.info('⌨️ Keyboard shortcuts')
      },
      description: 'Show keyboard shortcuts'
    },
    ...Object.keys(viewMap).map(key => ({
      key,
      callback: () => {
        setCurrentView(viewMap[key])
        const viewName = viewMap[key].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        toast.info(`⌨️ Navigated to ${viewName}`)
      },
      description: `Navigate to ${viewMap[key].replace(/-/g, ' ')}`
    }))
  ])

  useEffect(() => {
    setTasks(getActiveTasks())
    setTags(getTags())
    setCategories(getCategories())
    setLogs(getLogs())
    setInboxItems(getInboxItems())
    setTemplates(getTemplates())
    setArchivedTasks(getArchivedTasks())
    
    processRecurringTasks()
  }, [])

  // Check for recurring tasks every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      processRecurringTasks()
      refreshData()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [])

  const refreshData = () => {
    setTasks(getActiveTasks())
    setLogs(getLogs())
    setInboxItems(getInboxItems())
    setTemplates(getTemplates())
    setArchivedTasks(getArchivedTasks())
    setTags(getTags())
    setCategories(getCategories())
  }

  const handleExportJSON = async () => {
    if (!session?.user) {
      showToast.error('Please sign in to export data')
      router.push('/login')
      return
    }

    // Check advanced export feature
    const { data } = await check({ featureId: 'advanced_export', requiredBalance: 1 })
    if (!data?.allowed) {
      showToast.error('Advanced export requires Pro plan. Please upgrade.')
      router.push('/pricing')
      return
    }

    try {
      const data = {
        tasks: getTasks(),
        tags: getTags(),
        categories: getCategories(),
        templates: getTemplates(),
        settings: getSettings(),
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `9td-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Track usage
      await track({ 
        featureId: 'advanced_export', 
        value: 1, 
        idempotencyKey: `export-json-${Date.now()}` 
      })
      await refetchCustomer()
      
      showToast.exportSuccess('JSON')
    } catch (error) {
      showToast.error('Failed to export data')
      console.error('Export error:', error)
    }
  }

  const handleExportCSV = async () => {
    if (!session?.user) {
      showToast.error('Please sign in to export data')
      router.push('/login')
      return
    }

    // Check advanced export feature
    const { data } = await check({ featureId: 'advanced_export', requiredBalance: 1 })
    if (!data?.allowed) {
      showToast.error('Advanced export requires Pro plan. Please upgrade.')
      router.push('/pricing')
      return
    }

    try {
      const tasks = getTasks()
      const headers = ['Title', 'Description', 'Status', 'Priority', 'Due Date', 'Created At']
      const rows = tasks.map(task => [
        task.title,
        task.description || '',
        task.status,
        task.priority,
        task.dueDate || '',
        task.createdAt
      ])
      
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `9td-tasks-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Track usage
      await track({ 
        featureId: 'advanced_export', 
        value: 1, 
        idempotencyKey: `export-csv-${Date.now()}` 
      })
      await refetchCustomer()
      
      showToast.exportSuccess('CSV')
    } catch (error) {
      showToast.error('Failed to export CSV')
      console.error('CSV export error:', error)
    }
  }

  const handleImport = (data: any): boolean => {
    try {
      if (!data || typeof data !== 'object') {
        showToast.importError('Invalid data format')
        return false
      }
      
      let itemCount = 0
      
      if (Array.isArray(data.tasks)) {
        data.tasks.forEach((task: any) => {
          addTask(task)
          itemCount++
        })
      }
      
      if (Array.isArray(data.tags)) {
        data.tags.forEach((tag: any) => {
          addTag(tag)
          itemCount++
        })
      }
      
      if (Array.isArray(data.categories)) {
        data.categories.forEach((category: any) => {
          addCategory(category)
          itemCount++
        })
      }
      
      if (Array.isArray(data.templates)) {
        data.templates.forEach((template: any) => {
          addTemplate(template)
          itemCount++
        })
      }
      
      if (data.settings) {
        saveSettings(data.settings)
        setSettings(data.settings)
        itemCount++
      }
      
      refreshData()
      showToast.importSuccess(itemCount)
      return true
    } catch (error) {
      console.error('Import error:', error)
      showToast.importError('Failed to import data')
      return false
    }
  }

  const handleSaveTask = async (task: Task) => {
    if (!session?.user) {
      showToast.error('Please sign in to save tasks')
      return
    }

    // Check task limit before creating new task
    if (!editingTask) {
      const { data } = await check({ featureId: 'tasks', requiredBalance: 1 })
      if (!data?.allowed) {
        showToast.error('Task limit reached. Please upgrade your plan.')
        router.push('/pricing')
        return
      }
    }

    if (editingTask) {
      updateTask(task.id, task)
      showToast.taskUpdated(task.title)
      
      notificationService.send({
        type: 'task_updated',
        title: '✏️ Task Updated',
        message: `"${task.title}" has been updated`,
        priority: 'low',
        metadata: { taskId: task.id }
      })
    } else {
      addTask(task)
      showToast.taskCreated(task.title)
      
      // Track task creation
      try {
        await track({ 
          featureId: 'tasks', 
          value: 1, 
          idempotencyKey: `task-create-${task.id}-${Date.now()}` 
        })
        await refetchCustomer()
      } catch (error) {
        console.error('Failed to track task creation:', error)
      }
      
      notificationService.send({
        type: 'task_updated',
        title: '✨ Task Created',
        message: `New task: "${task.title}"`,
        priority: 'low',
        metadata: { taskId: task.id }
      })
    }
    refreshData()
    setEditingTask(null)
    setCreateModalOpen(false)
  }

  const handleEditTask = (task: Task) => {
    if (!session?.user) {
      showToast.error('Please sign in to edit tasks')
      router.push('/login')
      return
    }
    setEditingTask(task)
    setCreateModalOpen(true)
  }

  const handleEditTaskById = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) {
      handleEditTask(task)
    }
  }

  const handleDeleteTask = (taskId: string) => {
    if (!session?.user) {
      showToast.error('Please sign in to delete tasks')
      return
    }
    const task = tasks.find(t => t.id === taskId)
    deleteTask(taskId)
    showToast.taskDeleted(task?.title || 'Task')
    refreshData()
  }

  const handleArchiveTask = (taskId: string) => {
    archiveTask(taskId)
    showToast.taskArchived(1)
    refreshData()
  }

  const handleUnarchiveTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId) || archivedTasks.find(t => t.id === taskId)
    unarchiveTask(taskId)
    showToast.taskRestored(task?.title || 'Task')
    refreshData()
  }

  const handleStatusChange = (taskId: string, status: Task['status']) => {
    const task = tasks.find(t => t.id === taskId)
    updateTask(taskId, { status })
    
    if (status === 'completed' && task) {
      showToast.taskCompleted(task.title)
      notificationService.send({
        type: 'task_completed',
        title: '🎉 Task Completed',
        message: `"${task.title}" has been completed!`,
        priority: 'medium',
        metadata: { taskId }
      })
    } else if (task) {
      showToast.statusChanged(task.title, status)
    }
    
    refreshData()
  }

  const handleAddTag = (tag: Tag) => {
    addTag(tag)
    setTags(getTags())
  }

  const handleUpdateTag = (tagId: string, updates: Partial<Tag>) => {
    updateTag(tagId, updates)
    setTags(getTags())
  }

  const handleDeleteTag = (tagId: string) => {
    deleteTag(tagId)
    setTags(getTags())
  }

  const handleAddCategory = (category: Category) => {
    addCategory(category)
    setCategories(getCategories())
  }

  const handleUpdateCategory = (categoryId: string, updates: Partial<Category>) => {
    updateCategory(categoryId, updates)
    setCategories(getCategories())
  }

  const handleDeleteCategory = (categoryId: string) => {
    deleteCategory(categoryId)
    setCategories(getCategories())
  }

  const handleSettingsChange = (newSettings: typeof settings) => {
    setSettings(newSettings)
    saveSettings(newSettings)
  }

  const handleCreateTaskClick = () => {
    if (!session?.user) {
      showToast.error('Please sign in to create tasks')
      router.push('/login')
      return
    }
    setEditingTask(null)
    setCreateModalOpen(true)
  }

  const handleViewChange = (view: SidebarView) => {
    // Check if view requires authentication
    const protectedViews: SidebarView[] = [
      'your-tasks',
      'calendar',
      'kanban', 
      'gantt',
      'pomodoro',
      'time-blocking',
      'analytics',
      'gamification',
      'avatar-customization',
      'activity-logs',
      'owner-panel',
      'settings',
      'message-system'
    ]
    
    if (protectedViews.includes(view) && !session?.user) {
      showToast.error('Please sign in to access this feature')
      router.push('/login')
      return
    }
    
    // Add smooth transition
    setIsLoadingView(true)
    setTimeout(() => {
      setCurrentView(view)
      setMobileMenuOpen(false)
      setIsLoadingView(false)
    }, 150)
  }

  const handleOpenQuickLinksSettings = () => {
    setSettingsInitialTab('quick-links')
    setCurrentView('settings')
  }

  const handleOpenAccountSettings = () => {
    setSettingsInitialTab('account')
    setCurrentView('settings')
  }

  const handleViewTasksClick = () => {
    setCurrentView('your-tasks')
  }

  const handleExitFocus = () => {
    setFocusTask(null)
    setCurrentView('settings')
  }

  const handleSelectFocusTask = (task: Task) => {
    setFocusTask(task)
  }

  const handleAddTemplate = (template: TaskTemplate) => {
    addTemplate(template)
    setTemplates(getTemplates())
    showToast.templateCreated(template.name)
  }

  const handleUpdateTemplate = (templateId: string, updates: Partial<TaskTemplate>) => {
    updateTemplate(templateId, updates)
    setTemplates(getTemplates())
    showToast.success('Template Updated', 'Your template has been updated successfully')
  }

  const handleDeleteTemplate = (templateId: string) => {
    deleteTemplate(templateId)
    setTemplates(getTemplates())
    showToast.success('Template Deleted', 'Template has been removed')
  }

  const handleCreateFromTemplate = (template: TaskTemplate) => {
    const newTask: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: template.name,
      description: template.description,
      priority: template.defaultValues.priority,
      status: template.defaultValues.status,
      tags: [],
      categories: [],
      subtasks: template.defaultValues.subtasks || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeTracking: template.defaultValues.timeTracking,
    }
    addTask(newTask)
    showToast.templateApplied(template.name)
    refreshData()
    setCurrentView('your-tasks')
  }

  const handleBulkArchive = (taskIds: string[]) => {
    taskIds.forEach(id => archiveTask(id))
    showToast.taskArchived(taskIds.length)
    refreshData()
  }

  const handleBulkDelete = (taskIds: string[]) => {
    taskIds.forEach(id => deleteTask(id))
    showToast.bulkOperation('deleted', taskIds.length)
    refreshData()
  }

  const handleBulkStatusChange = (taskIds: string[], status: Task['status']) => {
    taskIds.forEach(id => updateTask(id, { status }))
    showToast.bulkOperation(`updated to ${status}`, taskIds.length)
    refreshData()
  }

  const handleTaskReschedule = (taskId: string, newDate: Date) => {
    updateTask(taskId, { dueDate: newDate.toISOString() })
    showToast.success('Task Rescheduled', 'Due date has been updated successfully')
    refreshData()
  }

  const handleCloneTask = (taskId: string) => {
    if (!session?.user) {
      showToast.error('Please sign in to clone tasks')
      return
    }
    
    const clonedTask = cloneTask(taskId)
    if (clonedTask) {
      showToast.success('Task Cloned', `"${clonedTask.title}" has been created`)
      refreshData()
    } else {
      showToast.error('Failed to clone task')
    }
  }

  const handleBulkClone = (taskIds: string[]) => {
    const clonedTasks = bulkCloneTasks(taskIds)
    showToast.success('Tasks Cloned', `${clonedTasks.length} task${clonedTasks.length > 1 ? 's' : ''} cloned successfully`)
    refreshData()
  }

  const handlePrintView = () => {
    setShowPrintView(true)
    // Trigger print after a short delay to ensure rendering
    setTimeout(() => {
      window.print()
      setShowPrintView(false)
    }, 500)
  }

  const [showPrintView, setShowPrintView] = useState(false)

  // Protected View Component
  const ProtectedViewPlaceholder = ({ viewName }: { viewName: string }) => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="glass-card p-12 max-w-md">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display text-xl font-semibold">
              Sign In Required
            </h3>
            <p className="text-muted-foreground">
              Please sign in to access {viewName}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={() => router.push('/login')}>
              Sign In
            </Button>
            <Button variant="outline" onClick={() => router.push('/register')}>
              Create Account
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [workspaces, setWorkspaces] = useState(getWorkspaces())

  useEffect(() => {
    const activeId = getActiveWorkspaceId()
    setCurrentWorkspaceId(activeId)
    setWorkspaces(getWorkspaces())
  }, [])

  const filteredTasks = tasks.filter(task => {
    // Filter by workspace
    if (currentWorkspaceId && task.workspaceId !== currentWorkspaceId) {
      return false
    }

    if (filters.query) {
      const query = filters.query.toLowerCase()
      if (
        !task.title.toLowerCase().includes(query) &&
        !task.description.toLowerCase().includes(query)
      ) {
        return false
      }
    }

    if (filters.priority && task.priority !== filters.priority) {
      return false
    }

    if (filters.status && task.status !== filters.status) {
      return false
    }

    if (filters.tags.length > 0) {
      if (!filters.tags.some(tagId => (task.tags || []).includes(tagId))) {
        return false
      }
    }

    if (filters.categories.length > 0) {
      if (!filters.categories.some(catId => (task.categories || []).includes(catId))) {
        return false
      }
    }

    if (filters.dateRange && task.dueDate) {
      const dueDate = new Date(task.dueDate)
      const now = new Date()
      
      switch (filters.dateRange) {
        case 'today':
          if (dueDate.toDateString() !== now.toDateString()) return false
          break
        case 'week':
          const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          if (dueDate < now || dueDate > weekFromNow) return false
          break
        case 'month':
          const monthFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          if (dueDate < now || dueDate > monthFromNow) return false
          break
        case 'overdue':
          if (dueDate >= now || task.status === 'completed') return false
          break
      }
    }

    return true
  })

  // Sort filtered tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const sortBy = filters.sortBy || 'dueDate'
    const sortOrder = filters.sortOrder || 'asc'
    const multiplier = sortOrder === 'asc' ? 1 : -1

    switch (sortBy) {
      case 'dueDate':
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
        return (aDate - bDate) * multiplier
      case 'priority':
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 }
        return (priorityOrder[a.priority] - priorityOrder[b.priority]) * multiplier
      case 'created':
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * multiplier
      case 'title':
        return a.title.localeCompare(b.title) * multiplier
      default:
        return 0
    }
  })

  // Get current workspace info for display
  const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId)

  // Show loading screen while checking session
  if (sessionPending) {
    return <Loading />
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen overflow-hidden" key={APP_VERSION}>
        <Toaster position="top-right" />
        
        {/* Desktop Sidebar - 10 TABS */}
        <div className="w-64 shrink-0 hidden md:block">
          <div className="glass-sidebar h-full">
            <NavigationSidebar
              currentView={currentView}
              onViewChange={handleViewChange}
              taskCount={tasks.length}
              inboxCount={inboxItems.length}
              session={session}
              sessionPending={sessionPending}
            />
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        <div className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="glass-sidebar h-full">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <span className="font-display text-lg font-semibold">Menu</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavigationSidebar
              currentView={currentView}
              onViewChange={handleViewChange}
              taskCount={tasks.length}
              inboxCount={inboxItems.length}
              session={session}
              sessionPending={sessionPending}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="glass-header px-4 md:px-8 py-4 md:py-6 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-9 w-9"
                  onClick={() => setMobileMenuOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </Button>
                {settings.showLogo && <Logo />}
                <DashboardTitle settings={settings} />
                <AnimatedTitle />
              </div>
              
              {/* Search Bar and Actions */}
              <div className="flex items-center gap-4 flex-shrink-0">
                {/* Search Bar */}
                <div className="hidden md:block">
                  <div className="w-full max-w-sm">
                    <AdvancedSearchBar
                      filters={filters}
                      onFiltersChange={setFilters}
                      tags={tags}
                      categories={categories}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Logged in user actions */}
                  {session?.user && (
                    <>
                      <NotificationCenter tasks={tasks} onTaskClick={handleEditTaskById} />
                      <UserAvatar 
                        session={session} 
                        onOpenSettings={() => {
                          setSettingsInitialTab('general')
                          setCurrentView('settings')
                        }}
                        onOpenAccountSettings={handleOpenAccountSettings}
                      />
                      <QuickLinksDropdown onOpenSettings={handleOpenQuickLinksSettings} />
                    </>
                  )}
                  
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            {/* Payment Warning */}
            {session?.user && (
              <div className="w-full max-w-7xl mx-auto px-4 md:px-8 pt-4">
                <PaymentWarning />
              </div>
            )}

            <div className="w-full max-w-7xl mx-auto px-4 md:px-8 py-4 md:py-8">
              <ErrorBoundary>
                <AnimatePresence mode="wait">
                  {isLoadingView ? (
                    <ViewTransitionLoader key="loader" />
                  ) : (
                    <PageContainer key={currentView}>
                      {currentView === 'dashboard' && (
                        <div className="mt-0">
                          <Dashboard 
                            tasks={sortedTasks} 
                            tags={tags} 
                            categories={categories}
                            settings={settings}
                            onCreateTask={handleCreateTaskClick}
                            onViewTasks={handleViewTasksClick}
                          />
                        </div>
                      )}

                      {currentView === 'your-tasks' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Your Tasks" />
                        ) : (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h1 className="font-display text-3xl font-bold mb-2">Your Tasks</h1>
                                <p className="text-foreground/70 font-medium">
                                  Manage and organize all your tasks
                                </p>
                              </div>
                              <Button
                                className="gap-2"
                                onClick={() => {
                                  setEditingTask(null)
                                  setCreateModalOpen(true)
                                }}
                              >
                                <Plus className="h-5 w-5" />
                                Create Task
                              </Button>
                            </div>

                            <TaskList
                              tasks={sortedTasks}
                              tags={tags}
                              categories={categories}
                              onEdit={handleEditTask}
                              onDelete={handleDeleteTask}
                              onStatusChange={handleStatusChange}
                              onArchive={handleArchiveTask}
                              onBulkArchive={handleBulkArchive}
                              onBulkDelete={handleBulkDelete}
                              onBulkStatusChange={handleBulkStatusChange}
                              onClone={handleCloneTask}
                              onBulkClone={handleBulkClone}
                              onPrint={handlePrintView}
                              emptyMessage={
                                filters.query || filters.priority || filters.status || 
                                filters.tags.length > 0 || filters.categories.length > 0
                                  ? "No tasks match your filters"
                                  : "No tasks yet"
                              }
                            />
                          </div>
                        )
                      )}

                      {currentView === 'calendar' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Calendar View" />
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <h1 className="font-display text-3xl font-bold mb-2">Calendar</h1>
                              <p className="text-foreground/70 font-medium">
                                View and manage tasks in calendar format
                              </p>
                            </div>
                            <CalendarView
                              tasks={sortedTasks}
                              tags={tags}
                              categories={categories}
                              onTaskClick={handleEditTask}
                              onDateClick={(date) => {
                                setEditingTask(null)
                                setCreateModalOpen(true)
                              }}
                              onTaskReschedule={handleTaskReschedule}
                            />
                          </div>
                        )
                      )}

                      {currentView === 'kanban' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Kanban Board" />
                        ) : (
                          <FeatureGate 
                            featureId="advanced_views"
                            upgradeMessage="Upgrade to Pro to access Kanban board and advanced task views"
                          >
                            <div className="space-y-6">
                              <div>
                                <h1 className="font-display text-3xl font-bold mb-2">Kanban Board</h1>
                                <p className="text-foreground/70 font-medium">
                                  Visualize and manage tasks with drag-and-drop
                                </p>
                              </div>
                              <KanbanBoard
                                tasks={sortedTasks}
                                tags={tags}
                                categories={categories}
                                onEdit={handleEditTask}
                                onDelete={handleDeleteTask}
                                onStatusChange={handleStatusChange}
                              />
                            </div>
                          </FeatureGate>
                        )
                      )}

                      {currentView === 'gantt' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Gantt View" />
                        ) : (
                          <FeatureGate 
                            featureId="advanced_views"
                            upgradeMessage="Upgrade to Pro to access Gantt charts and project timeline views"
                          >
                            <GanttView
                              tasks={sortedTasks}
                              tags={tags}
                              categories={categories}
                              onTaskClick={handleEditTask}
                            />
                          </FeatureGate>
                        )
                      )}

                      {currentView === 'dependencies' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Task Dependencies" />
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <h1 className="font-display text-3xl font-bold mb-2">📊 Task Dependencies</h1>
                              <p className="text-foreground/70 font-medium">
                                Visualize task relationships, identify critical paths, and detect circular dependencies
                              </p>
                            </div>
                            <TaskDependencyGraph
                              tasks={sortedTasks}
                              tags={tags}
                              categories={categories}
                              selectedTaskId={editingTask?.id}
                              onTaskClick={handleEditTask}
                            />
                          </div>
                        )
                      )}

                      {currentView === 'daily-planning' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Daily Planning" />
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <h1 className="font-display text-3xl font-bold mb-2">☀️ Daily Planning</h1>
                              <p className="text-foreground/70 font-medium">
                                Start your day with purpose: morning planning, evening reflection, and weekly goals
                              </p>
                            </div>
                            <DailyPlanningRitual
                              tasks={sortedTasks}
                              onTaskSelect={(taskIds) => {
                                taskIds.forEach(id => {
                                  const task = tasks.find(t => t.id === id)
                                  if (task) {
                                    updateTask(id, { 
                                      tags: [...(task.tags || []), 'today-priority']
                                    })
                                  }
                                })
                                refreshData()
                                toast.success('Daily priorities set! 🎯')
                              }}
                              onReflectionSave={(reflection) => {
                                const reflections = JSON.parse(localStorage.getItem('daily-reflections') || '[]')
                                reflections.push({
                                  date: new Date().toISOString(),
                                  text: reflection
                                })
                                localStorage.setItem('daily-reflections', JSON.stringify(reflections))
                                toast.success('Reflection saved! 📝')
                              }}
                            />
                          </div>
                        )
                      )}

                      {currentView === 'focus-mode' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Focus Mode" />
                        ) : focusTask ? (
                          <EnhancedFocusMode
                            task={focusTask}
                            onExit={() => {
                              setFocusTask(null)
                              setCurrentView('your-tasks')
                            }}
                            onTaskUpdate={(updates) => {
                              updateTask(focusTask.id, updates)
                              setFocusTask({ ...focusTask, ...updates })
                              refreshData()
                            }}
                          />
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <h1 className="font-display text-3xl font-bold mb-2">🎯 Focus Mode</h1>
                              <p className="text-foreground/70 font-medium">
                                Select a task to enter distraction-free deep work mode with timer and ambient sounds
                              </p>
                            </div>
                            <Card className="glass-card p-8">
                              <div className="space-y-6">
                                <div className="text-center space-y-4">
                                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                                    <Lock className="h-10 w-10 text-primary" />
                                  </div>
                                  <div className="space-y-2">
                                    <h3 className="font-display text-xl font-semibold">
                                      No Task Selected
                                    </h3>
                                    <p className="text-foreground/70 font-medium">
                                      Choose a task below to enter focus mode
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <h4 className="font-semibold">Available Tasks:</h4>
                                  {sortedTasks.filter(t => t.status !== 'completed').slice(0, 10).map(task => (
                                    <Button
                                      key={task.id}
                                      variant="outline"
                                      className="w-full justify-between h-auto py-4"
                                      onClick={() => {
                                        setFocusTask(task)
                                      }}
                                    >
                                      <div className="text-left">
                                        <div className="font-semibold">{task.title}</div>
                                        {task.description && (
                                          <div className="text-sm text-muted-foreground truncate">
                                            {task.description}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          task.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                                          task.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300' :
                                          task.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300' :
                                          'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                        }`}>
                                          {task.priority}
                                        </span>
                                      </div>
                                    </Button>
                                  ))}
                                  {sortedTasks.filter(t => t.status !== 'completed').length === 0 && (
                                    <p className="text-center text-foreground/70 font-medium py-8">
                                      No active tasks available. Create a task to get started!
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </div>
                        )
                      )}

                      {currentView === 'pomodoro' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Pomodoro Timer" />
                        ) : (
                          <FeatureGate 
                            featureId="pomodoro"
                            upgradeMessage="Upgrade to Pro to access Pomodoro timer with task integration"
                          >
                            <div className="space-y-6">
                              <div>
                                <h1 className="font-display text-3xl font-bold mb-2">Pomodoro Timer</h1>
                                <p className="text-foreground/70 font-medium">
                                  Focus with structured work/break intervals and track time against tasks
                                </p>
                              </div>
                              <div className="max-w-3xl mx-auto">
                                <PomodoroTaskIntegration
                                  tasks={sortedTasks}
                                  onTaskUpdate={(taskId, updates) => {
                                    updateTask(taskId, updates)
                                    refreshData()
                                  }}
                                  workDuration={settings.pomodoroWorkDuration || 25}
                                  breakDuration={settings.pomodoroBreakDuration || 5}
                                  longBreakDuration={settings.pomodoroLongBreakDuration || 15}
                                  sessionsUntilLongBreak={settings.pomodoroSessionsUntilLongBreak || 4}
                                />
                              </div>
                            </div>
                          </FeatureGate>
                        )
                      )}

                      {currentView === 'time-blocking' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Time Blocking" />
                        ) : (
                          <FeatureGate 
                            featureId="advanced_views"
                            upgradeMessage="Upgrade to Pro to access Time Blocking calendar"
                          >
                            <div className="space-y-6">
                              <div>
                                <h1 className="font-display text-3xl font-bold mb-2">Time Blocking</h1>
                                <p className="text-foreground/70 font-medium">
                                  Schedule and organize your tasks throughout the week
                                </p>
                              </div>
                              <TimeBlockingCalendar
                                tasks={sortedTasks}
                                onTaskClick={handleEditTask}
                                onBlockCreate={(block) => {
                                  toast.success('Time block created')
                                }}
                              />
                            </div>
                          </FeatureGate>
                        )
                      )}

                      {currentView === 'analytics' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Analytics" />
                        ) : (
                          <div className="space-y-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h1 className="font-display text-3xl font-bold mb-2">Analytics & Insights</h1>
                                <p className="text-foreground/70 font-medium">
                                  Comprehensive analytics including time tracking and productivity insights
                                </p>
                              </div>
                              
                              <FeatureGate
                                featureId="advanced_export"
                                upgradeMessage="Upgrade to Pro to export your data to JSON, CSV, and PDF formats"
                                fallback={
                                  <div className="flex gap-2">
                                    <Button variant="outline" disabled className="gap-2">
                                      <Lock className="h-4 w-4" />
                                      Export JSON
                                    </Button>
                                    <Button variant="outline" disabled className="gap-2">
                                      <Lock className="h-4 w-4" />
                                      Export CSV
                                    </Button>
                                  </div>
                                }
                              >
                                <div className="flex gap-2">
                                  <Button variant="outline" onClick={handleExportJSON} className="gap-2">
                                    Export JSON
                                  </Button>
                                  <Button variant="outline" onClick={handleExportCSV} className="gap-2">
                                    Export CSV
                                  </Button>
                                </div>
                              </FeatureGate>
                            </div>
                            
                            <FeatureGate 
                              featureId="advanced_analytics"
                              upgradeMessage="Upgrade to Pro to access detailed time tracking and productivity insights"
                            >
                              <div>
                                <h2 className="font-display text-xl font-semibold mb-4">Time Management Analytics</h2>
                                <TimeAnalytics tasks={tasks} />
                              </div>
                            </FeatureGate>

                            <div>
                              <h2 className="font-display text-xl font-semibold mb-4">Task Analytics</h2>
                              <Analytics
                                tasks={tasks}
                                tags={tags}
                                categories={categories}
                                onExport={handleExportJSON}
                              />
                            </div>
                          </div>
                        )
                      )}

                      {currentView === 'gamification' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Achievements & Gamification" />
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <h1 className="font-display text-3xl font-bold mb-2">🏆 Achievements & Progress</h1>
                              <p className="text-foreground/70 font-medium">
                                Track your productivity journey with XP, levels, streaks, and achievement badges
                              </p>
                            </div>
                            <GamificationDashboard onFeatureGateRedirect={() => router.push('/pricing')} />
                          </div>
                        )
                      )}

                      {currentView === 'avatar-customization' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Avatar Studio" />
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <h1 className="font-display text-3xl font-bold mb-2">🎨 Avatar Studio</h1>
                              <p className="text-foreground/70 font-medium">
                                Personalize your profile with custom avatars, frames, and visual effects
                              </p>
                            </div>
                            <AvatarCustomization />
                          </div>
                        )
                      )}

                      {currentView === 'activity-logs' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Activity Logs" />
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <h1 className="font-display text-3xl font-bold mb-2">Activity Logs</h1>
                              <p className="text-foreground/70 font-medium">
                                Track all changes and updates to your tasks
                              </p>
                            </div>
                            <Card className="glass-card p-6">
                              <ActivityLogComponent 
                                logs={logs} 
                                tags={tags}
                                onRefresh={refreshData}
                                onTaskClick={handleEditTask}
                              />
                            </Card>
                          </div>
                        )
                      )}

                      {currentView === 'owner-panel' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Owner Panel" />
                        ) : (
                          <div className="space-y-6">
                            <div>
                              <h1 className="font-display text-3xl font-bold mb-2">Owner Panel</h1>
                              <p className="text-foreground/70 font-medium">
                                Manage tags, categories, and organize your workspace
                              </p>
                            </div>
                            <Card className="glass-card p-6">
                              <OwnerPanel
                                tags={tags}
                                categories={categories}
                                tasks={tasks}
                                onAddTag={handleAddTag}
                                onUpdateTag={handleUpdateTag}
                                onDeleteTag={handleDeleteTag}
                                onAddCategory={handleAddCategory}
                                onUpdateCategory={handleUpdateCategory}
                                onDeleteCategory={handleDeleteCategory}
                              />
                            </Card>
                          </div>
                        )
                      )}

                      {currentView === 'message-system' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Message System" />
                        ) : (
                          <FeatureGate 
                            featureId="message_system"
                            upgradeMessage="Upgrade to Team plan to access team messaging and collaboration features"
                          >
                            <div className="space-y-6">
                              <div>
                                <h1 className="font-display text-3xl font-bold mb-2">Message System</h1>
                                <p className="text-foreground/70 font-medium">
                                  Team communication and collaboration hub
                                </p>
                              </div>
                              <MessageSystem />
                            </div>
                          </FeatureGate>
                        )
                      )}

                      {currentView === 'settings' && (
                        !session?.user ? (
                          <ProtectedViewPlaceholder viewName="Settings" />
                        ) : (
                          <SettingsHub
                            settings={settings}
                            onSettingsChange={handleSettingsChange}
                            onExportJSON={handleExportJSON}
                            onExportCSV={handleExportCSV}
                            onImport={handleImport}
                            stats={{
                              totalTasks: tasks.length,
                              totalTags: tags.length,
                              totalCategories: categories.length,
                              totalTemplates: templates.length
                            }}
                            tags={tags}
                            categories={categories}
                            templates={templates}
                            onAddTemplate={handleAddTemplate}
                            onUpdateTemplate={handleUpdateTemplate}
                            onDeleteTemplate={handleDeleteTemplate}
                            onCreateFromTemplate={handleCreateFromTemplate}
                            onTaskRestore={handleUnarchiveTask}
                            onTaskDelete={handleDeleteTask}
                            onTaskArchive={handleArchiveTask}
                            tasks={tasks}
                            onTaskClick={handleEditTask}
                            onTaskEdit={handleEditTask}
                            onTaskStatusChange={handleStatusChange}
                            onTaskUpdate={(taskId, updates) => {
                              updateTask(taskId, updates)
                              refreshData()
                              if (focusTask?.id === taskId) {
                                setFocusTask({ ...focusTask, ...updates })
                              }
                            }}
                            onCreateTask={handleCreateTaskClick}
                            onRefresh={refreshData}
                            focusTask={focusTask}
                            onExitFocus={handleExitFocus}
                            onSelectFocusTask={handleSelectFocusTask}
                            onSaveTask={handleSaveTask}
                            initialTab={settingsInitialTab}
                          />
                        )
                      )}
                    </PageContainer>
                  )}
                </AnimatePresence>
              </ErrorBoundary>
            </div>
          </main>
        </div>

        <CreateTaskModal
          open={createModalOpen}
          onOpenChange={(open) => {
            setCreateModalOpen(open)
            if (!open) setEditingTask(null)
          }}
          onSave={handleSaveTask}
          editTask={editingTask}
          tags={tags}
          categories={categories}
          allTasks={tasks}
          templates={templates}
          logs={logs}
        />

        <KeyboardShortcutsModal
          open={shortcutsModalOpen}
          onOpenChange={setShortcutsModalOpen}
        />

        {/* Print View Component */}
        {showPrintView && (
          <PrintView
            tasks={sortedTasks}
            tags={tags}
            categories={categories}
            title="9TD Task List"
            showFilters={true}
            filters={{
              status: filters.status,
              priority: filters.priority,
              tags: filters.tags,
              categories: filters.categories,
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}