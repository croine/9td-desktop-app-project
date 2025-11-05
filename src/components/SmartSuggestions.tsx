"use client"

import { useState, useEffect } from 'react'
import { Task } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

interface Suggestion {
  id: string
  type: 'priority' | 'deadline' | 'workload' | 'completion'
  title: string
  description: string
  action?: () => void
  actionLabel?: string
  severity: 'info' | 'warning' | 'success'
}

interface SmartSuggestionsProps {
  tasks: Task[]
  onApplySuggestion?: (taskId: string, updates: Partial<Task>) => void
}

export function SmartSuggestions({ tasks, onApplySuggestion }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    generateSuggestions()
  }, [tasks])

  const generateSuggestions = () => {
    const newSuggestions: Suggestion[] = []

    // Analyze overdue tasks
    const overdueTasks = tasks.filter(task => {
      if (task.status === 'completed' || !task.dueDate) return false
      return new Date(task.dueDate) < new Date()
    })

    if (overdueTasks.length > 0) {
      newSuggestions.push({
        id: 'overdue-tasks',
        type: 'deadline',
        title: `${overdueTasks.length} Overdue Task${overdueTasks.length > 1 ? 's' : ''}`,
        description: `You have overdue tasks that need attention. Consider updating deadlines or marking as completed.`,
        severity: 'warning',
      })
    }

    // Analyze tasks without priority
    const noPriorityTasks = tasks.filter(task => 
      task.status !== 'completed' && task.priority === 'low'
    )

    if (noPriorityTasks.length >= 3) {
      newSuggestions.push({
        id: 'low-priority',
        type: 'priority',
        title: 'Set Task Priorities',
        description: `${noPriorityTasks.length} tasks are set to low priority. Review and adjust priorities for better focus.`,
        severity: 'info',
      })
    }

    // Analyze workload
    const inProgressTasks = tasks.filter(task => task.status === 'in-progress')
    if (inProgressTasks.length > 5) {
      newSuggestions.push({
        id: 'high-workload',
        type: 'workload',
        title: 'High Work In Progress',
        description: `You have ${inProgressTasks.length} tasks in progress. Consider focusing on completing some before starting new ones.`,
        severity: 'warning',
      })
    }

    // Analyze completion rate
    const completedTasks = tasks.filter(task => task.status === 'completed')
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0

    if (completionRate >= 70 && tasks.length >= 5) {
      newSuggestions.push({
        id: 'good-progress',
        type: 'completion',
        title: 'Excellent Progress!',
        description: `You've completed ${completionRate.toFixed(0)}% of your tasks. Keep up the great work!`,
        severity: 'success',
      })
    }

    // Analyze tasks due soon
    const dueSoonTasks = tasks.filter(task => {
      if (task.status === 'completed' || !task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      const today = new Date()
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= 2
    })

    if (dueSoonTasks.length > 0) {
      newSuggestions.push({
        id: 'due-soon',
        type: 'deadline',
        title: `${dueSoonTasks.length} Task${dueSoonTasks.length > 1 ? 's' : ''} Due Soon`,
        description: `Tasks are due within the next 2 days. Prioritize them to avoid last-minute rush.`,
        severity: 'warning',
      })
    }

    // Analyze urgent tasks without progress
    const urgentStuckTasks = tasks.filter(task => 
      task.priority === 'urgent' && task.status === 'todo'
    )

    if (urgentStuckTasks.length > 0) {
      newSuggestions.push({
        id: 'urgent-stuck',
        type: 'priority',
        title: 'Urgent Tasks Waiting',
        description: `${urgentStuckTasks.length} urgent task${urgentStuckTasks.length > 1 ? 's are' : ' is'} still in "To Do" status. Start working on them soon.`,
        severity: 'warning',
      })
    }

    setSuggestions(newSuggestions)
  }

  const getSeverityIcon = (severity: Suggestion['severity']) => {
    switch (severity) {
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      default:
        return <Lightbulb className="h-5 w-5 text-blue-500" />
    }
  }

  const getSeverityColor = (severity: Suggestion['severity']) => {
    switch (severity) {
      case 'warning':
        return 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
      default:
        return 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
    }
  }

  if (suggestions.length === 0) {
    return null
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-lg">Smart Suggestions</h3>
        <Badge variant="secondary" className="ml-auto">
          {suggestions.length} insight{suggestions.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-3">
        {suggestions.map(suggestion => (
          <Card
            key={suggestion.id}
            className={`p-4 border-2 ${getSeverityColor(suggestion.severity)}`}
          >
            <div className="flex gap-3">
              <div className="shrink-0 mt-0.5">
                {getSeverityIcon(suggestion.severity)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium mb-1">{suggestion.title}</h4>
                <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                {suggestion.action && suggestion.actionLabel && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={suggestion.action}
                  >
                    {suggestion.actionLabel}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}
