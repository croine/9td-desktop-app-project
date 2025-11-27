"use client"

import { useState, useEffect } from 'react'
import { Task, PomodoroSession } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PomodoroTimer } from '@/components/PomodoroTimer'
import { Coffee, CheckCircle2, Timer, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PomodoroTaskIntegrationProps {
  tasks: Task[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  workDuration?: number
  breakDuration?: number
  longBreakDuration?: number
  sessionsUntilLongBreak?: number
}

export function PomodoroTaskIntegration({
  tasks,
  onTaskUpdate,
  workDuration = 25,
  breakDuration = 5,
  longBreakDuration = 15,
  sessionsUntilLongBreak = 4,
}: PomodoroTaskIntegrationProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [sessionHistory, setSessionHistory] = useState<Array<{
    taskId: string
    taskTitle: string
    session: PomodoroSession
  }>>([])

  const incompleteTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')

  const handleSessionComplete = (duration: number, type: 'work' | 'break') => {
    if (type === 'work' && selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId)
      if (!task) return

      const session: PomodoroSession = {
        id: `pomodoro_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        startTime: new Date(Date.now() - duration * 1000).toISOString(),
        endTime: new Date().toISOString(),
        type: 'work',
        completed: true,
      }

      const timeTracking = task.timeTracking || {
        totalTime: 0,
        entries: [],
        pomodoroSessions: [],
      }

      const updatedTracking = {
        ...timeTracking,
        totalTime: timeTracking.totalTime + duration,
        pomodoroSessions: [...timeTracking.pomodoroSessions, session],
      }

      onTaskUpdate(selectedTaskId, { timeTracking: updatedTracking })
      
      setSessionHistory(prev => [{
        taskId: selectedTaskId,
        taskTitle: task.title,
        session,
      }, ...prev.slice(0, 9)])

      toast.success(`Pomodoro logged to "${task.title}"`, {
        description: `+${duration / 60} minutes tracked`,
      })
    }
  }

  const selectedTask = selectedTaskId ? tasks.find(t => t.id === selectedTaskId) : null
  const selectedTaskPomodoros = selectedTask?.timeTracking?.pomodoroSessions.filter(
    s => s.type === 'work' && s.completed
  ).length || 0

  return (
    <div className="space-y-6">
      {/* Task Selection */}
      <Card className="glass-card p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            <h4 className="font-semibold">Link Task to Pomodoro</h4>
          </div>
          
          <Select value={selectedTaskId || ''} onValueChange={setSelectedTaskId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a task to work on..." />
            </SelectTrigger>
            <SelectContent>
              {incompleteTasks.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No incomplete tasks available
                </div>
              ) : (
                incompleteTasks.map(task => {
                  const pomodoroCount = task.timeTracking?.pomodoroSessions.filter(
                    s => s.type === 'work' && s.completed
                  ).length || 0

                  return (
                    <SelectItem key={task.id} value={task.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate">{task.title}</span>
                        {pomodoroCount > 0 && (
                          <Badge variant="secondary" className="ml-auto">
                            {pomodoroCount} 🍅
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  )
                })
              )}
            </SelectContent>
          </Select>

          {selectedTask && (
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedTask.title}</span>
                <Badge variant="outline" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {selectedTaskPomodoros} sessions
                </Badge>
              </div>
              {selectedTask.timeTracking?.estimatedTime && (
                <div className="text-xs text-muted-foreground">
                  Estimated: {selectedTask.timeTracking.estimatedTime}m • 
                  {' '}Actual: {Math.floor((selectedTask.timeTracking.totalTime || 0) / 60)}m
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Pomodoro Timer */}
      <PomodoroTimer
        workDuration={workDuration}
        breakDuration={breakDuration}
        longBreakDuration={longBreakDuration}
        sessionsUntilLongBreak={sessionsUntilLongBreak}
        onSessionComplete={handleSessionComplete}
      />

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <Card className="glass-card p-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold">Recent Sessions</h4>
              <Badge variant="secondary" className="ml-auto">{sessionHistory.length}</Badge>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {sessionHistory.map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Coffee className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate font-medium">{entry.taskTitle}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="text-xs">
                      {workDuration}m
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(entry.session.endTime!).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Tips */}
      {!selectedTaskId && (
        <Card className="glass-card p-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="flex gap-3">
            <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-300">
                Pro Tip: Link a Task
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Select a task above to automatically track your Pomodoro time against it. 
                This helps you compare estimated vs actual time spent.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
