"use client"

import { Task } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface TimeBudgetTrackerProps {
  task: Task
}

export function TimeBudgetTracker({ task }: TimeBudgetTrackerProps) {
  const estimatedMinutes = task.timeTracking?.estimatedMinutes || 0
  const actualMinutes = task.timeTracking?.totalMinutes || 0

  if (!estimatedMinutes) {
    return null
  }

  const percentage = (actualMinutes / estimatedMinutes) * 100
  const difference = actualMinutes - estimatedMinutes
  const isOverBudget = difference > 0
  const isOnTrack = Math.abs(difference) <= estimatedMinutes * 0.1 // Within 10%

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours === 0) return `${mins}m`
    return `${hours}h ${mins}m`
  }

  const getStatusColor = () => {
    if (isOnTrack) return 'text-green-600 dark:text-green-400'
    if (isOverBudget) return 'text-orange-600 dark:text-orange-400'
    return 'text-blue-600 dark:text-blue-400'
  }

  const getStatusIcon = () => {
    if (isOnTrack) return <Minus className="h-4 w-4" />
    if (isOverBudget) return <TrendingUp className="h-4 w-4" />
    return <TrendingDown className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (isOnTrack) return 'On Track'
    if (isOverBudget) return `${formatTime(difference)} over`
    return `${formatTime(Math.abs(difference))} under`
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Time Budget</span>
        </div>
        <Badge variant="outline" className={`gap-1 ${getStatusColor()}`}>
          {getStatusIcon()}
          {getStatusText()}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Estimated</span>
          <span className="font-medium">{formatTime(estimatedMinutes)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Actual</span>
          <span className="font-medium">{formatTime(actualMinutes)}</span>
        </div>

        <Progress 
          value={Math.min(percentage, 100)} 
          className="h-2"
        />

        <div className="text-xs text-muted-foreground text-center">
          {percentage.toFixed(0)}% of estimated time used
        </div>
      </div>
    </Card>
  )
}
