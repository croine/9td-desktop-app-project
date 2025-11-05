"use client"

import { useState, useEffect } from 'react'
import { Task, Tag, Category } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Target, Play, CheckCircle2, X, Timer, Volume2, VolumeX } from 'lucide-react'
import { TimeTracker } from '@/components/TimeTracker'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface FocusModeProps {
  task: Task | null
  allTasks: Task[]
  tags: Tag[]
  categories: Category[]
  settings: {
    pomodoroWorkDuration: number
    pomodoroBreakDuration: number
    pomodoroLongBreakDuration: number
    pomodoroSessionsUntilLongBreak: number
    focusModeSound: boolean
    focusModeHideCompleted: boolean
  }
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onStatusChange: (taskId: string, status: Task['status']) => void
  onExitFocus: () => void
  onSelectTask: (task: Task) => void
}

export function FocusMode({ 
  task, 
  allTasks,
  tags, 
  categories, 
  settings,
  onTaskUpdate,
  onStatusChange,
  onExitFocus,
  onSelectTask
}: FocusModeProps) {
  const [soundEnabled, setSoundEnabled] = useState(settings.focusModeSound)

  if (!task) {
    // Task selection view
    const availableTasks = settings.focusModeHideCompleted 
      ? allTasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
      : allTasks

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-4xl w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-full bg-primary/10">
                <Target className="h-12 w-12 text-primary" />
              </div>
            </div>
            <h1 className="font-display text-4xl font-bold">Focus Mode</h1>
            <p className="text-muted-foreground text-lg">
              Select a task to focus on and eliminate all distractions
            </p>
          </div>

          <Card className="glass-card p-6">
            <h3 className="font-semibold mb-4">Choose a Task to Focus On</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {availableTasks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p>No tasks available. Create a task first!</p>
                </div>
              ) : (
                availableTasks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="w-full text-left p-4 rounded-lg border-2 border-transparent hover:border-primary hover:bg-accent transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold group-hover:text-primary transition-colors">
                            {t.title}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {t.priority}
                          </Badge>
                        </div>
                        {t.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {t.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 flex-wrap">
                          {t.dueDate && (
                            <span className="text-xs text-muted-foreground">
                              Due: {format(new Date(t.dueDate), 'MMM d')}
                            </span>
                          )}
                          {t.subtasks && t.subtasks.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {t.subtasks.filter(s => s.completed).length}/{t.subtasks.length} subtasks
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Play className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </button>
                ))
              )}
            </div>
          </Card>

          <div className="text-center">
            <Button onClick={onExitFocus} variant="outline">
              Exit Focus Mode
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Focused task view
  const completedSubtasks = (task.subtasks || []).filter(s => s.completed).length
  const totalSubtasks = (task.subtasks || []).length
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0

  const taskTags = tags.filter(tag => (task.tags || []).includes(tag.id))
  const taskCategories = categories.filter(cat => (task.categories || []).includes(cat.id))

  const handleSubtaskToggle = (subtaskId: string) => {
    const updatedSubtasks = task.subtasks?.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    )
    onTaskUpdate(task.id, { subtasks: updatedSubtasks })
  }

  const handleComplete = () => {
    onStatusChange(task.id, 'completed')
    onExitFocus()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold">Focus Mode</h2>
                <p className="text-xs text-muted-foreground">Stay focused on your task</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4" />
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={onExitFocus} variant="ghost" size="sm" className="gap-2">
                <X className="h-4 w-4" />
                Exit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Task Header */}
          <Card className="glass-card p-6 md:p-8">
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{task.priority}</Badge>
                    <Badge variant="secondary">{task.status}</Badge>
                  </div>
                  <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">
                    {task.title}
                  </h1>
                </div>
              </div>

              {task.description && (
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {task.description}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                {taskCategories.map(cat => (
                  <Badge
                    key={cat.id}
                    variant="secondary"
                    style={{
                      backgroundColor: `${cat.color}20`,
                      color: cat.color
                    }}
                  >
                    {cat.icon} {cat.name}
                  </Badge>
                ))}
                {taskTags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    style={{
                      borderColor: tag.color,
                      color: tag.color
                    }}
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>

              {task.dueDate && (
                <div className="text-sm text-muted-foreground">
                  Due: {format(new Date(task.dueDate), 'EEEE, MMMM d, yyyy')}
                </div>
              )}
            </div>
          </Card>

          {/* Subtasks */}
          {totalSubtasks > 0 && (
            <Card className="glass-card p-6">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Progress</h3>
                    <span className="text-sm text-muted-foreground">
                      {completedSubtasks} / {totalSubtasks} completed
                    </span>
                  </div>
                  <Progress value={progress} className="h-3" />
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold mb-3">Subtasks</h3>
                  {task.subtasks?.map(subtask => (
                    <button
                      key={subtask.id}
                      onClick={() => handleSubtaskToggle(subtask.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border-2 transition-all hover:bg-accent group",
                        subtask.completed ? "border-green-500/50 bg-green-500/5" : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                          subtask.completed 
                            ? "bg-green-500 border-green-500" 
                            : "border-muted-foreground group-hover:border-primary"
                        )}>
                          {subtask.completed && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </div>
                        <span className={cn(
                          "flex-1 font-medium",
                          subtask.completed && "line-through text-muted-foreground"
                        )}>
                          {subtask.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* Time Tracker */}
          <div>
            <h3 className="font-semibold mb-3">Time Tracking</h3>
            <TimeTracker
              task={task}
              onUpdate={(updates) => onTaskUpdate(task.id, updates)}
              pomodoroSettings={{
                workDuration: settings.pomodoroWorkDuration,
                breakDuration: settings.pomodoroBreakDuration,
                longBreakDuration: settings.pomodoroLongBreakDuration,
                sessionsUntilLongBreak: settings.pomodoroSessionsUntilLongBreak
              }}
            />
          </div>

          {/* Actions */}
          <Card className="glass-card p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleComplete}
                className="flex-1 gap-2"
                size="lg"
              >
                <CheckCircle2 className="h-5 w-5" />
                Mark as Complete
              </Button>
              <Button
                onClick={() => onStatusChange(task.id, 'in-progress')}
                variant="outline"
                className="flex-1"
                size="lg"
                disabled={task.status === 'in-progress'}
              >
                {task.status === 'in-progress' ? 'In Progress' : 'Start Working'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}