"use client"

import { Task } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Clock, TrendingUp, TrendingDown, AlertCircle, CheckCircle } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface TimeBudgetWidgetProps {
  tasks: Task[]
}

export function TimeBudgetWidget({ tasks }: TimeBudgetWidgetProps) {
  // Calculate time budget statistics
  const tasksWithEstimates = tasks.filter(t => 
    t.timeTracking?.estimatedTime && t.timeTracking.estimatedTime > 0
  )

  const totalEstimated = tasksWithEstimates.reduce((sum, task) => 
    sum + (task.timeTracking?.estimatedTime || 0), 0
  )

  const totalActual = tasksWithEstimates.reduce((sum, task) => 
    sum + ((task.timeTracking?.totalTime || 0) / 60), 0 // Convert seconds to minutes
  )

  const variance = totalActual - totalEstimated
  const variancePercentage = totalEstimated > 0 ? (variance / totalEstimated) * 100 : 0
  const utilizationRate = totalEstimated > 0 ? (totalActual / totalEstimated) * 100 : 0

  // Categorize tasks by budget status
  const onTrack = tasksWithEstimates.filter(t => {
    const estimated = t.timeTracking?.estimatedTime || 0
    const actual = (t.timeTracking?.totalTime || 0) / 60
    return actual <= estimated * 1.1 && actual >= estimated * 0.9
  })

  const overBudget = tasksWithEstimates.filter(t => {
    const estimated = t.timeTracking?.estimatedTime || 0
    const actual = (t.timeTracking?.totalTime || 0) / 60
    return actual > estimated * 1.1
  })

  const underBudget = tasksWithEstimates.filter(t => {
    const estimated = t.timeTracking?.estimatedTime || 0
    const actual = (t.timeTracking?.totalTime || 0) / 60
    return actual < estimated * 0.9 && actual > 0
  })

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  if (tasksWithEstimates.length === 0) {
    return (
      <Card className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Clock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Time Budgets</h3>
            <p className="text-sm text-muted-foreground">Estimated vs Actual Time</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          No tasks with time estimates yet. Add estimated time to your tasks to track budgets.
        </p>
      </Card>
    )
  }

  return (
    <Card className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Clock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-semibold">Time Budgets</h3>
          <p className="text-sm text-muted-foreground">Estimated vs Actual Time</p>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Estimated</p>
          <p className="text-2xl font-bold text-primary">{formatTime(totalEstimated)}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Actual</p>
          <p className="text-2xl font-bold">{formatTime(totalActual)}</p>
        </div>
      </div>

      {/* Utilization Progress */}
      <div className="space-y-2 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Budget Utilization</span>
          <span className={`font-medium ${
            utilizationRate > 110 ? 'text-destructive' :
            utilizationRate < 90 ? 'text-blue-500' :
            'text-green-500'
          }`}>
            {utilizationRate.toFixed(0)}%
          </span>
        </div>
        <Progress 
          value={Math.min(utilizationRate, 100)} 
          className="h-2"
        />
      </div>

      {/* Variance Indicator */}
      <div className={`flex items-center gap-2 p-3 rounded-lg mb-6 ${
        Math.abs(variancePercentage) <= 10 
          ? 'bg-green-500/10 text-green-700 dark:text-green-400'
          : variancePercentage > 10
          ? 'bg-destructive/10 text-destructive'
          : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
      }`}>
        {Math.abs(variancePercentage) <= 10 ? (
          <CheckCircle className="h-4 w-4" />
        ) : variancePercentage > 10 ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
        <div className="flex-1">
          <p className="text-sm font-medium">
            {Math.abs(variancePercentage) <= 10 
              ? 'On Track'
              : variancePercentage > 10
              ? `${formatTime(variance)} Over Budget`
              : `${formatTime(Math.abs(variance))} Under Budget`
            }
          </p>
          <p className="text-xs opacity-80">
            {Math.abs(variancePercentage).toFixed(1)}% variance from estimate
          </p>
        </div>
      </div>

      {/* Budget Status Breakdown */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">Tasks by Status</h4>
        
        <div className="flex items-center justify-between p-2 rounded-lg bg-green-500/5">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
            <span className="text-sm">On Track</span>
          </div>
          <span className="text-sm font-medium">{onTrack.length}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-destructive/5">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-sm">Over Budget</span>
          </div>
          <span className="text-sm font-medium">{overBudget.length}</span>
        </div>

        <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-blue-600 dark:text-blue-500" />
            <span className="text-sm">Under Budget</span>
          </div>
          <span className="text-sm font-medium">{underBudget.length}</span>
        </div>
      </div>

      {/* Summary Info */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground text-center">
          Tracking {tasksWithEstimates.length} task{tasksWithEstimates.length !== 1 ? 's' : ''} with time estimates
        </p>
      </div>
    </Card>
  )
}
