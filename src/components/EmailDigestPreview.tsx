"use client"

import { Task, Tag, Category } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Zap,
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns'

interface EmailDigestPreviewProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  frequency: 'daily' | 'weekly' | 'monthly'
}

export function EmailDigestPreview({
  tasks,
  tags,
  categories,
  frequency,
}: EmailDigestPreviewProps) {
  const now = new Date()
  
  // Calculate date range based on frequency
  let dateRange = { start: now, end: now }
  let periodLabel = 'Today'
  
  if (frequency === 'weekly') {
    dateRange = { start: startOfWeek(now), end: endOfWeek(now) }
    periodLabel = 'This Week'
  } else if (frequency === 'monthly') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    dateRange = { start, end }
    periodLabel = 'This Month'
  }

  // Filter tasks for the period
  const overdueTasks = tasks.filter(t => 
    t.dueDate && 
    new Date(t.dueDate) < now && 
    t.status !== 'completed'
  )

  const dueSoonTasks = tasks.filter(t => {
    if (!t.dueDate || t.status === 'completed') return false
    const dueDate = new Date(t.dueDate)
    const hoursUntil = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntil > 0 && hoursUntil < 24
  })

  const completedTasks = tasks.filter(t => 
    t.status === 'completed' && 
    t.completedAt &&
    isWithinInterval(new Date(t.completedAt), dateRange)
  )

  const inProgressTasks = tasks.filter(t => t.status === 'in-progress')

  const stats = {
    total: tasks.length,
    completed: completedTasks.length,
    inProgress: inProgressTasks.length,
    overdue: overdueTasks.length,
    completionRate: tasks.length > 0 
      ? Math.round((completedTasks.length / tasks.length) * 100) 
      : 0,
  }

  return (
    <Card className="glass-card overflow-hidden">
      {/* Email Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Mail className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">9TD Task Digest</h2>
              <p className="text-primary-foreground/80 text-sm">{periodLabel} Summary</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-primary-foreground border-white/30">
            {format(now, 'MMM d, yyyy')}
          </Badge>
        </div>
      </div>

      {/* Email Body */}
      <div className="p-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-lg bg-muted/50">
            <div className="text-3xl font-bold mb-1">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Tasks</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
              {stats.completed}
            </div>
            <div className="text-xs text-green-700 dark:text-green-500">Completed</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
              {stats.inProgress}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-500">In Progress</div>
          </div>
          <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20">
            <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
              {stats.overdue}
            </div>
            <div className="text-xs text-orange-700 dark:text-orange-500">Overdue</div>
          </div>
        </div>

        {/* Completion Rate */}
        {stats.completed > 0 && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-green-900 dark:text-green-300">
                  {stats.completionRate}% Completion Rate
                </div>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Great progress! You completed {stats.completed} task{stats.completed !== 1 ? 's' : ''} {periodLabel.toLowerCase()}.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Urgent: Overdue Tasks */}
        {overdueTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <h3 className="font-semibold">Overdue Tasks ({overdueTasks.length})</h3>
            </div>
            <div className="space-y-2">
              {overdueTasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-destructive/20 bg-destructive/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{task.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Due: {format(new Date(task.dueDate!), 'MMM d')}
                      </div>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Due Soon */}
        {dueSoonTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
              <Clock className="h-5 w-5" />
              <h3 className="font-semibold">Due Today ({dueSoonTasks.length})</h3>
            </div>
            <div className="space-y-2">
              {dueSoonTasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{task.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Due: {format(new Date(task.dueDate!), 'h:mm a')}
                      </div>
                    </div>
                    <Badge className="text-xs bg-orange-500/10 text-orange-700 dark:text-orange-400">
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recently Completed */}
        {completedTasks.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <h3 className="font-semibold">Completed {periodLabel} ({completedTasks.length})</h3>
            </div>
            <div className="space-y-2">
              {completedTasks.slice(0, 5).map(task => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-medium text-sm mb-1">{task.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed: {format(new Date(task.completedAt!), 'MMM d, h:mm a')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="pt-4 border-t">
          <Button className="w-full gap-2" size="lg">
            <Target className="h-5 w-5" />
            View All Tasks in 9TD
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4">
          <p>You're receiving this digest because you enabled email notifications in 9TD.</p>
          <p className="mt-1">Manage your notification preferences in Settings.</p>
        </div>
      </div>
    </Card>
  )
}
