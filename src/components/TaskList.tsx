"use client"

import { Task, Tag, Category } from '@/types/task'
import { TaskCard } from './TaskCard'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { 
  LayoutGrid, 
  LayoutList, 
  Rows3, 
  Calendar,
  Flag,
  FolderKanban,
  CheckSquare,
  Trash2,
  Archive,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Pin,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from './ui/dropdown-menu'
import { cn } from '@/lib/utils'

type ViewMode = 'grid' | 'list' | 'compact'
type GroupBy = 'none' | 'status' | 'priority' | 'category' | 'dueDate'
type SortBy = 'dueDate' | 'priority' | 'created' | 'title' | 'updated'
type SortOrder = 'asc' | 'desc'

interface TaskListProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: Task['status']) => void
  onArchive?: (taskId: string) => void
  emptyMessage?: string
  onBulkArchive?: (taskIds: string[]) => void
  onBulkDelete?: (taskIds: string[]) => void
  onBulkStatusChange?: (taskIds: string[], status: Task['status']) => void
}

// Local storage keys
const STORAGE_KEYS = {
  VIEW_MODE: 'taskList_viewMode',
  GROUP_BY: 'taskList_groupBy',
  SORT_BY: 'taskList_sortBy',
  SORT_ORDER: 'taskList_sortOrder',
  PINNED_TASKS: 'taskList_pinnedTasks'
}

export function TaskList({ 
  tasks, 
  tags, 
  categories, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onArchive,
  emptyMessage = "No tasks found",
  onBulkArchive,
  onBulkDelete,
  onBulkStatusChange
}: TaskListProps) {
  // Load preferences from localStorage
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as ViewMode) || 'grid'
    }
    return 'grid'
  })
  
  const [groupBy, setGroupBy] = useState<GroupBy>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEYS.GROUP_BY) as GroupBy) || 'none'
    }
    return 'none'
  })
  
  const [sortBy, setSortBy] = useState<SortBy>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEYS.SORT_BY) as SortBy) || 'dueDate'
    }
    return 'dueDate'
  })
  
  const [sortOrder, setSortOrder] = useState<SortOrder>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem(STORAGE_KEYS.SORT_ORDER) as SortOrder) || 'asc'
    }
    return 'asc'
  })
  
  const [pinnedTaskIds, setPinnedTaskIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.PINNED_TASKS)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    }
    return new Set()
  })
  
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [quickFilter, setQuickFilter] = useState<string | null>(null)

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode)
  }, [viewMode])
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GROUP_BY, groupBy)
  }, [groupBy])
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_BY, sortBy)
  }, [sortBy])
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SORT_ORDER, sortOrder)
  }, [sortOrder])
  
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PINNED_TASKS, JSON.stringify(Array.from(pinnedTaskIds)))
  }, [pinnedTaskIds])

  // Pin/Unpin task
  const togglePinTask = (taskId: string) => {
    const newPinned = new Set(pinnedTaskIds)
    if (newPinned.has(taskId)) {
      newPinned.delete(taskId)
    } else {
      newPinned.add(taskId)
    }
    setPinnedTaskIds(newPinned)
  }

  // Calculate statistics
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    highPriority: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
    pinned: Array.from(pinnedTaskIds).filter(id => tasks.some(t => t.id === id)).length,
  }

  // Apply quick filters
  const filteredTasks = tasks.filter(task => {
    if (!quickFilter) return true
    
    switch (quickFilter) {
      case 'today':
        return task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString()
      case 'overdue':
        return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
      case 'high-priority':
        return task.priority === 'high' || task.priority === 'urgent'
      case 'completed':
        return task.status === 'completed'
      case 'in-progress':
        return task.status === 'in-progress'
      case 'pinned':
        return pinnedTaskIds.has(task.id)
      default:
        return true
    }
  })

  // Sort tasks
  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
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
        case 'updated':
          const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime()
          const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime()
          return (aUpdated - bUpdated) * multiplier
        case 'title':
          return a.title.localeCompare(b.title) * multiplier
        default:
          return 0
      }
    })
  }

  // Separate pinned and unpinned tasks
  const pinnedTasks = sortTasks(filteredTasks.filter(task => pinnedTaskIds.has(task.id)))
  const unpinnedTasks = sortTasks(filteredTasks.filter(task => !pinnedTaskIds.has(task.id)))

  // Group tasks
  const groupTasks = (tasksToGroup: Task[]) => {
    const groups: { [key: string]: Task[] } = {}
    
    if (groupBy === 'none') {
      return { 'All Tasks': tasksToGroup }
    }
    
    tasksToGroup.forEach(task => {
      let groupKey = ''
      
      switch (groupBy) {
        case 'status':
          groupKey = task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ')
          break
        case 'priority':
          groupKey = task.priority.charAt(0).toUpperCase() + task.priority.slice(1)
          break
        case 'category':
          if (task.categories && task.categories.length > 0) {
            const category = categories.find(c => c.id === task.categories![0])
            groupKey = category?.name || 'Uncategorized'
          } else {
            groupKey = 'Uncategorized'
          }
          break
        case 'dueDate':
          if (!task.dueDate) {
            groupKey = 'No Due Date'
          } else {
            const dueDate = new Date(task.dueDate)
            const today = new Date()
            const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
            
            if (diffDays < 0 && task.status !== 'completed') {
              groupKey = 'Overdue'
            } else if (diffDays === 0) {
              groupKey = 'Today'
            } else if (diffDays === 1) {
              groupKey = 'Tomorrow'
            } else if (diffDays <= 7) {
              groupKey = 'This Week'
            } else if (diffDays <= 30) {
              groupKey = 'This Month'
            } else {
              groupKey = 'Later'
            }
          }
          break
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(task)
    })
    
    return groups
  }

  const groupedPinnedTasks = groupTasks(pinnedTasks)
  const groupedUnpinnedTasks = groupTasks(unpinnedTasks)

  // Bulk action handlers
  const handleSelectAll = () => {
    if (selectedTasks.size === filteredTasks.length) {
      setSelectedTasks(new Set())
    } else {
      setSelectedTasks(new Set(filteredTasks.map(t => t.id)))
    }
  }

  const handleToggleTask = (taskId: string) => {
    const newSelected = new Set(selectedTasks)
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId)
    } else {
      newSelected.add(taskId)
    }
    setSelectedTasks(newSelected)
  }

  const handleBulkAction = (action: 'archive' | 'delete' | 'complete' | 'todo' | 'in-progress') => {
    const taskIds = Array.from(selectedTasks)
    
    switch (action) {
      case 'archive':
        onBulkArchive?.(taskIds)
        break
      case 'delete':
        onBulkDelete?.(taskIds)
        break
      case 'complete':
        onBulkStatusChange?.(taskIds, 'completed')
        break
      case 'todo':
        onBulkStatusChange?.(taskIds, 'todo')
        break
      case 'in-progress':
        onBulkStatusChange?.(taskIds, 'in-progress')
        break
    }
    
    setSelectedTasks(new Set())
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center space-y-3">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-display font-semibold text-foreground">
            {emptyMessage}
          </h3>
          <p className="text-muted-foreground max-w-md">
            Create your first task to get started with managing your work efficiently.
          </p>
        </div>
      </div>
    )
  }

  const getGridClass = () => {
    switch (viewMode) {
      case 'grid':
        return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
      case 'list':
        return 'grid grid-cols-1 gap-4'
      case 'compact':
        return 'grid grid-cols-1 gap-2'
    }
  }

  const renderTaskGroup = (groupName: string, groupTasks: Task[], isPinned: boolean = false) => (
    <div key={groupName} className="space-y-4">
      {(groupBy !== 'none' || isPinned) && (
        <div className="flex items-center gap-3">
          {isPinned && <Pin className="h-5 w-5 text-primary" />}
          <h3 className="font-display text-xl font-semibold">{groupName}</h3>
          <Badge variant="secondary">{groupTasks.length}</Badge>
        </div>
      )}
      
      <div className={getGridClass()}>
        <AnimatePresence mode="popLayout">
          {groupTasks.map(task => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative"
            >
              {/* Selection Checkbox */}
              <div className="absolute top-2 left-2 z-10">
                <Checkbox
                  checked={selectedTasks.has(task.id)}
                  onCheckedChange={() => handleToggleTask(task.id)}
                  className="bg-background/80 backdrop-blur-sm"
                />
              </div>
              
              {/* Pin Button */}
              <div className="absolute top-2 right-2 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background",
                    pinnedTaskIds.has(task.id) && "text-primary"
                  )}
                  onClick={() => togglePinTask(task.id)}
                >
                  <Pin className={cn("h-4 w-4", pinnedTaskIds.has(task.id) && "fill-current")} />
                </Button>
              </div>
              
              <TaskCard
                task={task}
                tags={tags}
                categories={categories}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
                onArchive={onArchive}
                compact={viewMode === 'compact'}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Statistics Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">{stats.todo}</div>
            <div className="text-xs text-muted-foreground">To Do</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-500">{stats.inProgress}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{stats.overdue}</div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{stats.highPriority}</div>
            <div className="text-xs text-muted-foreground">High Priority</div>
          </div>
        </div>
        
        {stats.total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Progress</span>
              <span className="text-sm font-medium">{Math.round((stats.completed / stats.total) * 100)}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-primary to-green-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(stats.completed / stats.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={quickFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickFilter(null)}
          >
            All Tasks
          </Button>
          {stats.pinned > 0 && (
            <Button
              variant={quickFilter === 'pinned' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setQuickFilter('pinned')}
              className="gap-2"
            >
              <Pin className="h-4 w-4" />
              Pinned ({stats.pinned})
            </Button>
          )}
          <Button
            variant={quickFilter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickFilter('today')}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            Today
          </Button>
          <Button
            variant={quickFilter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickFilter('overdue')}
            className="gap-2"
          >
            <AlertCircle className="h-4 w-4" />
            Overdue
          </Button>
          <Button
            variant={quickFilter === 'high-priority' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickFilter('high-priority')}
            className="gap-2"
          >
            <Flag className="h-4 w-4" />
            High Priority
          </Button>
          <Button
            variant={quickFilter === 'in-progress' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setQuickFilter('in-progress')}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            In Progress
          </Button>
        </div>

        {/* View Controls */}
        <div className="flex gap-2">
          {/* Sort By */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                Sort: {sortBy === 'dueDate' ? 'Due Date' : sortBy === 'priority' ? 'Priority' : sortBy === 'created' ? 'Created' : sortBy === 'updated' ? 'Updated' : 'Title'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort By</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
                <DropdownMenuRadioItem value="dueDate">Due Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="priority">Priority</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="created">Created Date</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="updated">Last Updated</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="title">Title (A-Z)</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Sort Order</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
                <DropdownMenuRadioItem value="asc">Ascending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="desc">Descending</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Group By */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <FolderKanban className="h-4 w-4" />
                Group: {groupBy === 'none' ? 'None' : groupBy === 'dueDate' ? 'Due Date' : groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setGroupBy('none')}>
                None
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('status')}>
                By Status
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('priority')}>
                By Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('category')}>
                By Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setGroupBy('dueDate')}>
                By Due Date
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Mode */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
              title="Grid View"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
              title="List View"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('compact')}
              className="h-8 w-8 p-0"
              title="Compact View"
            >
              <Rows3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedTasks.size > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedTasks.size} task{selectedTasks.size > 1 ? 's' : ''} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTasks(new Set())}
              >
                Clear Selection
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('complete')}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('in-progress')}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                In Progress
              </Button>
              {onBulkArchive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('archive')}
                  className="gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Archive
                </Button>
              )}
              {onBulkDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Select All */}
      <div className="flex items-center gap-2">
        <Checkbox
          checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
          onCheckedChange={handleSelectAll}
          id="select-all"
        />
        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
          Select All ({filteredTasks.length})
        </label>
      </div>

      {/* Task Groups */}
      <div className="space-y-8">
        {/* Pinned Tasks Section */}
        {pinnedTasks.length > 0 && quickFilter !== 'pinned' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-2 border-b-2 border-primary/20">
              <Pin className="h-5 w-5 text-primary" />
              <h2 className="font-display text-2xl font-bold">Pinned Tasks</h2>
              <Badge variant="default">{pinnedTasks.length}</Badge>
            </div>
            {Object.entries(groupedPinnedTasks).map(([groupName, groupTasks]) =>
              renderTaskGroup(groupBy === 'none' ? 'Pinned Tasks' : groupName, groupTasks, true)
            )}
          </div>
        )}

        {/* Unpinned Tasks Section */}
        {unpinnedTasks.length > 0 && quickFilter !== 'pinned' && (
          <div className="space-y-8">
            {pinnedTasks.length > 0 && (
              <div className="flex items-center gap-3">
                <h2 className="font-display text-2xl font-bold">All Tasks</h2>
                <Badge variant="secondary">{unpinnedTasks.length}</Badge>
              </div>
            )}
            {Object.entries(groupedUnpinnedTasks).map(([groupName, groupTasks]) =>
              renderTaskGroup(groupName, groupTasks, false)
            )}
          </div>
        )}

        {/* Pinned Only View */}
        {quickFilter === 'pinned' && pinnedTasks.length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedPinnedTasks).map(([groupName, groupTasks]) =>
              renderTaskGroup(groupName, groupTasks, true)
            )}
          </div>
        )}
      </div>

      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-center space-y-3">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-display font-semibold text-foreground">
              No tasks match your filter
            </h3>
            <p className="text-muted-foreground max-w-md">
              Try adjusting your filters to see more tasks.
            </p>
            <Button variant="outline" onClick={() => setQuickFilter(null)}>
              Clear Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}