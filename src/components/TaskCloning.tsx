"use client"

import { Task } from '@/types/task'
import { Button } from '@/components/ui/button'
import { Copy, Edit } from 'lucide-react'
import { toast } from 'sonner'

interface TaskCloningProps {
  task: Task
  onClone: (task: Task) => void
  compact?: boolean
}

export function TaskCloning({ task, onClone, compact = false }: TaskCloningProps) {
  const handleClone = () => {
    const clonedTask: Task = {
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${task.title} (Copy)`,
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: undefined,
      // Clone subtasks with new IDs
      subtasks: task.subtasks?.map(subtask => ({
        ...subtask,
        id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        completed: false
      })),
      // Reset time tracking
      timeTracking: task.timeTracking ? {
        ...task.timeTracking,
        totalTime: 0,
        entries: [],
        pomodoroSessions: []
      } : undefined
    }

    onClone(clonedTask)
    toast.success(`Task "${task.title}" cloned successfully`)
  }

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClone}
        className="h-8 w-8"
      >
        <Copy className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClone}
      className="gap-2"
    >
      <Copy className="h-4 w-4" />
      Clone Task
    </Button>
  )
}

// Bulk clone component
interface BulkCloneProps {
  tasks: Task[]
  selectedTaskIds: string[]
  onBulkClone: (tasks: Task[]) => void
}

export function BulkClone({ tasks, selectedTaskIds, onBulkClone }: BulkCloneProps) {
  const handleBulkClone = () => {
    const tasksToClone = tasks.filter(t => selectedTaskIds.includes(t.id))
    
    const clonedTasks = tasksToClone.map(task => ({
      ...task,
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: `${task.title} (Copy)`,
      status: 'todo' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: undefined,
      subtasks: task.subtasks?.map(subtask => ({
        ...subtask,
        id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        completed: false
      })),
      timeTracking: task.timeTracking ? {
        ...task.timeTracking,
        totalTime: 0,
        entries: [],
        pomodoroSessions: []
      } : undefined
    }))

    onBulkClone(clonedTasks)
    toast.success(`${clonedTasks.length} tasks cloned successfully`)
  }

  if (selectedTaskIds.length === 0) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBulkClone}
      className="gap-2"
    >
      <Copy className="h-4 w-4" />
      Clone {selectedTaskIds.length} Tasks
    </Button>
  )
}
