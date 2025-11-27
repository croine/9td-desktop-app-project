"use client"

import { Task } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Coffee,
  AlertCircle,
  CheckCircle2,
  Timer,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeAnalyticsProps {
  tasks: Task[]
}

export function TimeAnalytics({ tasks }: TimeAnalyticsProps) {
  // Calculate statistics
  const tasksWithEstimates = tasks.filter(t => 
    t.timeTracking?.estimatedTime && t.timeTracking.estimatedTime > 0
  )

  const completedTasksWithEstimates = tasksWithEstimates.filter(t => 
    t.status === 'completed' && t.timeTracking!.totalTime > 0
  )

  const totalEstimatedMinutes = tasksWithEstimates.reduce(
    (sum, t) => sum + (t.timeTracking!.estimatedTime || 0),
    0
  )

  const totalActualMinutes = tasksWithEstimates.reduce(
    (sum, t) => sum + Math.floor((t.timeTracking!.totalTime || 0) / 60),
    0
  )

  const variance = totalActualMinutes - totalEstimatedMinutes
  const accuracyPercent = totalEstimatedMinutes > 0
    ? Math.round((1 - Math.abs(variance) / totalEstimatedMinutes) * 100)
    : 0

  // Over/Under Estimates
  const overEstimatedTasks = completedTasksWithEstimates.filter(t => {
    const actual = Math.floor((t.timeTracking!.totalTime || 0) / 60)
    const estimated = t.timeTracking!.estimatedTime || 0
    return actual > estimated
  })

  const underEstimatedTasks = completedTasksWithEstimates.filter(t => {
    const actual = Math.floor((t.timeTracking!.totalTime || 0) / 60)
    const estimated = t.timeTracking!.estimatedTime || 0
    return actual < estimated
  })

  const accurateTasks = completedTasksWithEstimates.filter(t => {
    const actual = Math.floor((t.timeTracking!.totalTime || 0) / 60)
    const estimated = t.timeTracking!.estimatedTime || 0
    const diff = Math.abs(actual - estimated)
    return diff <= estimated * 0.1 // Within 10%
  })

  // Pomodoro stats
  const totalPomodoros = tasks.reduce((sum, t) => 
    sum + (t.timeTracking?.pomodoroSessions.filter(s => s.type === 'work' && s.completed).length || 0),
    0
  )

  const avgPomodorosPerTask = tasks.filter(t => 
    t.timeTracking?.pomodoroSessions && t.timeTracking.pomodoroSessions.length > 0
  ).length > 0
    ? Math.round(totalPomodoros / tasks.filter(t => 
        t.timeTracking?.pomodoroSessions && t.timeTracking.pomodoroSessions.length > 0
      ).length)
    : 0

  // Time tracking adoption
  const tasksWithTime = tasks.filter(t => t.timeTracking && t.timeTracking.totalTime > 0).length
  const timeTrackingRate = tasks.length > 0
    ? Math.round((tasksWithTime / tasks.length) * 100)
    : 0

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Total Tracked</span>
            </div>
            <div className="text-2xl font-bold">{formatTime(totalActualMinutes)}</div>
            <p className="text-xs text-muted-foreground">
              Across {tasksWithTime} tasks
            </p>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Estimate Accuracy</span>
            </div>
            <div className="text-2xl font-bold">{accuracyPercent}%</div>
            <p className="text-xs text-muted-foreground">
              {completedTasksWithEstimates.length} tasks analyzed
            </p>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coffee className="h-4 w-4" />
              <span className="text-xs font-medium">Pomodoros</span>
            </div>
            <div className="text-2xl font-bold">{totalPomodoros}</div>
            <p className="text-xs text-muted-foreground">
              {avgPomodorosPerTask} avg per task
            </p>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span className="text-xs font-medium">Tracking Rate</span>
            </div>
            <div className="text-2xl font-bold">{timeTrackingRate}%</div>
            <Progress value={timeTrackingRate} className="h-1.5 mt-2" />
          </div>
        </Card>
      </div>

      {/* Estimate vs Actual */}
      {totalEstimatedMinutes > 0 && (
        <Card className="glass-card p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">Estimate vs Actual</h3>
              <Badge 
                variant="outline" 
                className={cn(
                  "gap-1",
                  variance > 0 && "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400",
                  variance < 0 && "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400",
                  variance === 0 && "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400"
                )}
              >
                {variance > 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3" />
                    Over by {formatTime(Math.abs(variance))}
                  </>
                ) : variance < 0 ? (
                  <>
                    <TrendingDown className="h-3 w-3" />
                    Under by {formatTime(Math.abs(variance))}
                  </>
                ) : (
                  <>
                    <Target className="h-3 w-3" />
                    Perfect Match
                  </>
                )}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Estimated</div>
                <div className="text-3xl font-bold">{formatTime(totalEstimatedMinutes)}</div>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Actual</div>
                <div className="text-3xl font-bold">{formatTime(totalActualMinutes)}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Accuracy</span>
                <span className="font-semibold">{accuracyPercent}%</span>
              </div>
              <Progress value={accuracyPercent} className="h-2" />
            </div>
          </div>
        </Card>
      )}

      {/* Estimation Breakdown */}
      {completedTasksWithEstimates.length > 0 && (
        <Card className="glass-card p-6">
          <div className="space-y-4">
            <h3 className="font-display text-lg font-semibold">Estimation Breakdown</h3>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-300">
                    Accurate
                  </span>
                </div>
                <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                  {accurateTasks.length}
                </div>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                  Within 10% of estimate
                </p>
              </div>

              <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-orange-900 dark:text-orange-300">
                    Over
                  </span>
                </div>
                <div className="text-3xl font-bold text-orange-700 dark:text-orange-400">
                  {overEstimatedTasks.length}
                </div>
                <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                  Took longer than expected
                </p>
              </div>

              <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingDown className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    Under
                  </span>
                </div>
                <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                  {underEstimatedTasks.length}
                </div>
                <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                  Finished faster
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Insights */}
      {completedTasksWithEstimates.length >= 5 && (
        <Card className="glass-card p-6">
          <div className="space-y-3">
            <h3 className="font-display text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Insights & Recommendations
            </h3>

            <div className="space-y-2">
              {accuracyPercent >= 80 && (
                <div className="flex gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-green-900 dark:text-green-300">
                      Great estimation skills!
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400">
                      Your time estimates are {accuracyPercent}% accurate. Keep up the excellent work!
                    </p>
                  </div>
                </div>
              )}

              {overEstimatedTasks.length > completedTasksWithEstimates.length * 0.6 && (
                <div className="flex gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                  <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-orange-900 dark:text-orange-300">
                      Tasks often take longer than expected
                    </div>
                    <p className="text-xs text-orange-700 dark:text-orange-400">
                      Consider adding buffer time (20-30%) to your estimates to account for unexpected delays.
                    </p>
                  </div>
                </div>
              )}

              {timeTrackingRate < 50 && (
                <div className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <Timer className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-blue-900 dark:text-blue-300">
                      Track more tasks
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-400">
                      You're only tracking {timeTrackingRate}% of tasks. Track more to get better insights and improve estimates.
                    </p>
                  </div>
                </div>
              )}

              {avgPomodorosPerTask >= 3 && (
                <div className="flex gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                  <Coffee className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-semibold text-sm text-purple-900 dark:text-purple-300">
                      Pomodoro power user!
                    </div>
                    <p className="text-xs text-purple-700 dark:text-purple-400">
                      You average {avgPomodorosPerTask} Pomodoros per task. Your focused work sessions are paying off!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {completedTasksWithEstimates.length === 0 && (
        <Card className="glass-card p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Timer className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-display text-xl font-semibold">
                No Time Data Yet
              </h3>
              <p className="text-muted-foreground text-sm">
                Start tracking time and adding estimates to your tasks to see analytics here.
                Complete a few tasks with time tracking to unlock insights!
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
