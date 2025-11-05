"use client"

import { useState, useEffect } from 'react'
import { Task, Tag, Category } from '@/types/task'
import { getArchivedTasks, getTags, getCategories, unarchiveTask, deleteTask } from '@/lib/storage'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Archive as ArchiveIcon, RotateCcw, Trash2, Calendar, Tag as TagIcon, Folder } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ArchiveProps {
  onTaskRestore: (taskId: string) => void
  onTaskDelete: (taskId: string) => void
}

export function Archive({ onTaskRestore, onTaskDelete }: ArchiveProps) {
  const [archivedTasks, setArchivedTasks] = useState<Task[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    refreshArchive()
  }, [])

  const refreshArchive = () => {
    setArchivedTasks(getArchivedTasks())
    setTags(getTags())
    setCategories(getCategories())
  }

  const handleRestore = (taskId: string) => {
    onTaskRestore(taskId)
    refreshArchive()
  }

  const handleDelete = (taskId: string) => {
    if (confirm('Are you sure you want to permanently delete this task? This action cannot be undone.')) {
      onTaskDelete(taskId)
      refreshArchive()
    }
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const taskTags = tags.filter(tag => (task.tags || []).includes(tag.id))
    const taskCategories = categories.filter(cat => (task.categories || []).includes(cat.id))

    return (
      <Card className="glass-card p-4 hover:shadow-lg transition-all">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn(
                  "text-xs",
                  task.priority === 'urgent' && "border-red-500 text-red-500",
                  task.priority === 'high' && "border-orange-500 text-orange-500",
                  task.priority === 'medium' && "border-yellow-500 text-yellow-500",
                  task.priority === 'low' && "border-blue-500 text-blue-500"
                )}>
                  {task.priority}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {task.status}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg leading-tight">{task.title}</h3>
              {task.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
            {task.archivedAt && (
              <div className="flex items-center gap-1">
                <ArchiveIcon className="h-3 w-3" />
                <span>Archived {format(new Date(task.archivedAt), 'MMM d, yyyy')}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Due {format(new Date(task.dueDate), 'MMM d')}</span>
              </div>
            )}
          </div>

          {/* Tags & Categories */}
          {(taskTags.length > 0 || taskCategories.length > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {taskCategories.map(cat => (
                <Badge
                  key={cat.id}
                  variant="secondary"
                  className="text-xs"
                  style={{
                    backgroundColor: `${cat.color}20`,
                    color: cat.color
                  }}
                >
                  <Folder className="h-3 w-3 mr-1" />
                  {cat.name}
                </Badge>
              ))}
              {taskTags.map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-xs"
                  style={{
                    borderColor: tag.color,
                    color: tag.color
                  }}
                >
                  <TagIcon className="h-3 w-3 mr-1" />
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRestore(task.id)}
              className="flex-1 gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleDelete(task.id)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-muted">
            <ArchiveIcon className="h-6 w-6 text-muted-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold">Archive</h1>
        </div>
        <p className="text-muted-foreground">
          View and restore archived tasks. Archived tasks are hidden from your active task views.
        </p>
      </div>

      {/* Stats */}
      <Card className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Archived Tasks</p>
            <p className="text-2xl font-bold">{archivedTasks.length}</p>
          </div>
          <ArchiveIcon className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
      </Card>

      {/* Task List */}
      {archivedTasks.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <ArchiveIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-lg mb-2">No Archived Tasks</h3>
          <p className="text-muted-foreground">
            Tasks you archive will appear here. Archive tasks to keep your workspace clean while preserving task history.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {archivedTasks.map(task => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
