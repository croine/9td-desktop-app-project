"use client"

import { Task, Tag, Category, TaskStatus } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EisenhowerMatrix } from '@/components/EisenhowerMatrix'
import { Calendar, User, MoreVertical, Edit, Trash2, CheckCircle2, Grid2x2, Columns3 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { updateTask } from '@/lib/storage'
import { toast } from 'sonner'

interface KanbanBoardProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
}

const columns: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'To Do', color: 'bg-gray-500/10 border-gray-500/30' },
  { status: 'in-progress', label: 'In Progress', color: 'bg-blue-500/10 border-blue-500/30' },
  { status: 'review', label: 'Review', color: 'bg-purple-500/10 border-purple-500/30' },
  { status: 'completed', label: 'Completed', color: 'bg-green-500/10 border-green-500/30' },
]

const priorityColors = {
  low: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export function KanbanBoard({ tasks, tags, categories, onEdit, onDelete, onStatusChange }: KanbanBoardProps) {
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (status: TaskStatus) => {
    if (draggedTask && draggedTask.status !== status) {
      onStatusChange(draggedTask.id, status)
    }
    setDraggedTask(null)
  }

  const handleTaskMove = (taskId: string, importance: Task['importance'], urgency: Task['urgency']) => {
    updateTask(taskId, { importance, urgency })
    toast.success('Task moved successfully')
  }

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status)
  }

  return (
    <Tabs defaultValue="kanban" className="w-full">
      <div className="flex items-center justify-between mb-6">
        <TabsList>
          <TabsTrigger value="kanban" className="gap-2">
            <Columns3 className="h-4 w-4" />
            Kanban
          </TabsTrigger>
          <TabsTrigger value="eisenhower" className="gap-2">
            <Grid2x2 className="h-4 w-4" />
            Eisenhower Matrix
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="kanban" className="mt-0">
        <div className="flex gap-4 md:gap-6 h-full overflow-x-auto pb-6 px-2 md:px-0">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.status)
            
            return (
              <div
                key={column.status}
                className="flex-shrink-0 w-72 md:w-80 flex flex-col"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(column.status)}
              >
                {/* Column Header */}
                <div className={`glass-card rounded-lg border-2 ${column.color} p-3 md:p-4 mb-3 md:mb-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-base md:text-lg">{column.label}</h3>
                    <Badge variant="secondary" className="font-medium text-xs">
                      {columnTasks.length}
                    </Badge>
                  </div>
                </div>

                {/* Column Tasks */}
                <div className="flex-1 space-y-2 md:space-y-3 overflow-y-auto">
                  {columnTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg text-muted-foreground text-sm">
                      Drop tasks here
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <KanbanCard
                        key={task.id}
                        task={task}
                        tags={tags}
                        categories={categories}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStatusChange={onStatusChange}
                        onDragStart={() => handleDragStart(task)}
                      />
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </TabsContent>

      <TabsContent value="eisenhower" className="mt-0">
        <EisenhowerMatrix
          tasks={tasks}
          tags={tags}
          categories={categories}
          onTaskClick={onEdit}
          onTaskMove={handleTaskMove}
        />
      </TabsContent>
    </Tabs>
  )
}

interface KanbanCardProps {
  task: Task
  tags: Tag[]
  categories: Category[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onDragStart: () => void
}

function KanbanCard({ task, tags, categories, onEdit, onDelete, onStatusChange, onDragStart }: KanbanCardProps) {
  const taskTags = tags.filter(tag => (task.tags || []).includes(tag.id))
  const taskCategories = categories.filter(cat => (task.categories || []).includes(cat.id))
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
  
  const completedSubtasks = (task.subtasks || []).filter(st => st.completed).length
  const totalSubtasks = (task.subtasks || []).length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      draggable
      onDragStart={onDragStart}
    >
      <Card className="glass-card p-3 md:p-4 hover:shadow-lg transition-all cursor-move border-2">
        <div className="space-y-2 md:space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-1.5 md:space-y-2 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge className={`${priorityColors[task.priority]} border text-xs`}>
                  {task.priority}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs">
                    Overdue
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-sm leading-tight line-clamp-2">
                {task.title}
              </h4>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Subtasks Progress */}
          {totalSubtasks > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Subtasks
                </span>
                <span className="font-medium">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Categories */}
          {taskCategories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {taskCategories.map(category => (
                <div
                  key={category.id}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium"
                  style={{
                    backgroundColor: `${category.color}15`,
                    color: category.color,
                  }}
                >
                  {category.icon && <span className="text-xs">{category.icon}</span>}
                  <span>{category.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {taskTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {taskTags.slice(0, 3).map(tag => (
                <div
                  key={tag.id}
                  className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  #{tag.name}
                </div>
              ))}
              {taskTags.length > 3 && (
                <span className="text-xs text-muted-foreground">+{taskTags.length - 3}</span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            {task.dueDate && (
              <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
                <Calendar className="h-3 w-3" />
                <span className="font-medium">
                  {new Date(task.dueDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            )}
            {(task.assignees || []).length > 0 && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{(task.assignees || []).length}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  )
}