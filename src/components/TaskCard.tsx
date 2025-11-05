"use client"

import { Task, Tag, Category } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, User, MoreVertical, Trash2, Edit, CheckCircle2, Archive, Bell, TrendingUp } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface TaskCardProps {
  task: Task
  tags: Tag[]
  categories: Category[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: Task['status']) => void
  onArchive?: (taskId: string) => void
  compact?: boolean
}

const priorityColors = {
  low: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
}

const statusColors = {
  'todo': 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  'in-progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'review': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'completed': 'bg-green-500/10 text-green-600 border-green-500/20',
  'cancelled': 'bg-red-500/10 text-red-600 border-red-500/20',
}

export function TaskCard({ task, tags, categories, onEdit, onDelete, onStatusChange, onArchive, compact = false }: TaskCardProps) {
  const taskTags = tags.filter(tag => (task.tags || []).includes(tag.id))
  const taskCategories = categories.filter(cat => (task.categories || []).includes(cat.id))
  
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed'
  
  const completedSubtasks = (task.subtasks || []).filter(st => st.completed).length
  const totalSubtasks = (task.subtasks || []).length
  
  const hasReminders = (task.reminders || []).length > 0
  const progress = task.progress || 0

  // Compact View
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
      >
        <Card className={cn(
          "glass-card p-3 hover:shadow-md transition-all duration-200 cursor-pointer border-l-4",
          task.status === 'completed' && "opacity-60",
          task.priority === 'urgent' && "border-l-red-500",
          task.priority === 'high' && "border-l-orange-500",
          task.priority === 'medium' && "border-l-yellow-500",
          task.priority === 'low' && "border-l-blue-500"
        )}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2">
                <Badge className={`${priorityColors[task.priority]} border font-medium text-xs px-1.5 py-0`}>
                  {task.priority.charAt(0).toUpperCase()}
                </Badge>
                <Badge className={`${statusColors[task.status]} border font-medium text-xs px-1.5 py-0`}>
                  {task.status === 'in-progress' ? 'IP' : task.status.charAt(0).toUpperCase()}
                </Badge>
              </div>
              
              <h3 className="font-semibold text-sm truncate flex-1">
                {task.title}
              </h3>
              
              {progress > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span className="hidden sm:inline">{progress}%</span>
                </div>
              )}
              
              {hasReminders && (
                <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                  <Bell className="h-3 w-3" />
                </div>
              )}
              
              {task.dueDate && (
                <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`}>
                  <Calendar className="h-3 w-3" />
                  <span className="hidden sm:inline">
                    {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              )}
              
              {totalSubtasks > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  <span className="hidden sm:inline">{completedSubtasks}/{totalSubtasks}</span>
                </div>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                  <MoreVertical className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStatusChange(task.id, 'in-progress')}
                  disabled={task.status === 'in-progress'}
                >
                  Mark In Progress
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStatusChange(task.id, 'completed')}
                  disabled={task.status === 'completed'}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onArchive && (
                  <DropdownMenuItem onClick={() => onArchive(task.id)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Task
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </Card>
      </motion.div>
    )
  }

  // Regular View
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}
      transition={{ duration: 0.2 }}
    >
      <Card className="glass-card p-4 md:p-5 hover:shadow-xl transition-all duration-200 cursor-pointer border-2">
        <div className="space-y-3 md:space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 md:gap-3">
            <div className="flex-1 space-y-1.5 md:space-y-2 min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                <Badge className={`${priorityColors[task.priority]} border font-medium text-xs`}>
                  {task.priority}
                </Badge>
                <Badge className={`${statusColors[task.status]} border font-medium text-xs`}>
                  {task.status}
                </Badge>
                {isOverdue && (
                  <Badge variant="destructive" className="font-medium text-xs">
                    Overdue
                  </Badge>
                )}
                {hasReminders && (
                  <Badge variant="outline" className="font-medium text-xs text-blue-600 dark:text-blue-400 border-blue-500/30">
                    <Bell className="h-3 w-3 mr-1" />
                    {task.reminders?.length} Reminder{task.reminders?.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <h3 className="font-display font-semibold text-base md:text-lg leading-tight text-foreground">
                {task.title}
              </h3>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Task
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStatusChange(task.id, 'in-progress')}
                  disabled={task.status === 'in-progress'}
                >
                  Mark In Progress
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onStatusChange(task.id, 'completed')}
                  disabled={task.status === 'completed'}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onArchive && (
                  <DropdownMenuItem onClick={() => onArchive(task.id)}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive Task
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => onDelete(task.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          {task.description && (
            <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Progress Bar (Manual) */}
          {progress > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Progress
                </span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all",
                    progress < 25 && "bg-red-500",
                    progress >= 25 && progress < 50 && "bg-orange-500",
                    progress >= 50 && progress < 75 && "bg-yellow-500",
                    progress >= 75 && "bg-green-500"
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Subtasks Progress */}
          {totalSubtasks > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Subtasks
                </span>
                <span className="font-medium">
                  {completedSubtasks}/{totalSubtasks}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(completedSubtasks / totalSubtasks) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Categories */}
          {taskCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {taskCategories.map(category => (
                <div
                  key={category.id}
                  className="inline-flex items-center gap-1 md:gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: `${category.color}15`,
                    borderColor: `${category.color}30`,
                    color: category.color,
                  }}
                >
                  {category.icon && <span>{category.icon}</span>}
                  <span>{category.name}</span>
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          {taskTags.length > 0 && (
            <div className="flex flex-wrap gap-1 md:gap-1.5">
              {taskTags.map(tag => (
                <div
                  key={tag.id}
                  className="inline-flex items-center px-1.5 md:px-2 py-0.5 rounded-md text-xs font-medium"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                  }}
                >
                  #{tag.name}
                </div>
              ))}
            </div>
          )}

          {/* Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-3 md:gap-4">
              {task.dueDate && (
                <div className={`flex items-center gap-1 md:gap-1.5 ${isOverdue ? 'text-destructive' : ''}`}>
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="font-medium">
                    {new Date(task.dueDate).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}
              {(task.assignees || []).length > 0 && (
                <div className="flex items-center gap-1 md:gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>{(task.assignees || []).length}</span>
                </div>
              )}
            </div>
            <span className="text-xs">
              Updated {new Date(task.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}