import { Task, Tag, Category } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle,
  Play,
  BarChart3,
  Filter
} from 'lucide-react'
import { useState } from 'react'

interface TimeBudgetPageProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  onTaskClick: (task: Task) => void
}

type FilterType = 'all' | 'on-track' | 'over-budget' | 'under-budget' | 'not-started'

export function TimeBudgetPage({ tasks, tags, categories, onTaskClick }: TimeBudgetPageProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  
  // Filter tasks with time estimates
  const tasksWithEstimates = tasks.filter(t => 
    t.timeTracking?.estimatedTime && t.timeTracking.estimatedTime > 0
  )

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getTaskStatus = (task: Task): 'on-track' | 'over-budget' | 'under-budget' | 'not-started' => {
    const estimated = task.timeTracking?.estimatedTime || 0
    const actual = (task.timeTracking?.totalTime || 0) / 60
    
    if (actual === 0) return 'not-started'
    if (actual > estimated * 1.1) return 'over-budget'
    if (actual < estimated * 0.9) return 'under-budget'
    return 'on-track'
  }

  const getProgressPercentage = (task: Task): number => {
    const estimated = task.timeTracking?.estimatedTime || 0
    const actual = (task.timeTracking?.totalTime || 0) / 60
    return estimated > 0 ? Math.min((actual / estimated) * 100, 100) : 0
  }

  const getVariance = (task: Task): number => {
    const estimated = task.timeTracking?.estimatedTime || 0
    const actual = (task.timeTracking?.totalTime || 0) / 60
    return actual - estimated
  }

  const filteredTasks = tasksWithEstimates.filter(task => {
    if (filter === 'all') return true
    return getTaskStatus(task) === filter
  })

  // Sort by variance (most over budget first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const varianceA = getVariance(a)
    const varianceB = getVariance(b)
    return varianceB - varianceA
  })

  // Calculate summary statistics
  const totalEstimated = tasksWithEstimates.reduce((sum, task) => 
    sum + (task.timeTracking?.estimatedTime || 0), 0
  )

  const totalActual = tasksWithEstimates.reduce((sum, task) => 
    sum + ((task.timeTracking?.totalTime || 0) / 60), 0
  )

  const onTrackCount = tasksWithEstimates.filter(t => getTaskStatus(t) === 'on-track').length
  const overBudgetCount = tasksWithEstimates.filter(t => getTaskStatus(t) === 'over-budget').length
  const underBudgetCount = tasksWithEstimates.filter(t => getTaskStatus(t) === 'under-budget').length
  const notStartedCount = tasksWithEstimates.filter(t => getTaskStatus(t) === 'not-started').length

  const getTag = (tagId: string) => tags.find(t => t.id === tagId)
  const getCategory = (catId: string) => categories.find(c => c.id === catId)

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
    }
  }

  const getStatusColor = (status: 'on-track' | 'over-budget' | 'under-budget' | 'not-started') => {
    switch (status) {
      case 'on-track': return 'text-green-600 dark:text-green-500'
      case 'over-budget': return 'text-destructive'
      case 'under-budget': return 'text-blue-600 dark:text-blue-500'
      case 'not-started': return 'text-muted-foreground'
    }
  }

  const getStatusIcon = (status: 'on-track' | 'over-budget' | 'under-budget' | 'not-started') => {
    switch (status) {
      case 'on-track': return <CheckCircle className="h-4 w-4" />
      case 'over-budget': return <TrendingUp className="h-4 w-4" />
      case 'under-budget': return <TrendingDown className="h-4 w-4" />
      case 'not-started': return <Clock className="h-4 w-4" />
    }
  }

  if (tasksWithEstimates.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Time Budget Tracker</h1>
            <p className="text-muted-foreground">
              Track estimated vs actual time across all tasks
            </p>
          </div>
        </div>

        <Card className="glass-card p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
              <BarChart3 className="h-12 w-12 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold">No Time Budgets Yet</h3>
            <p className="text-muted-foreground">
              Start adding estimated time to your tasks to track time budgets and see how actual time compares to estimates.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Time Budget Tracker</h1>
          <p className="text-muted-foreground">
            Track estimated vs actual time across all tasks
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Estimated</p>
            <p className="text-2xl font-bold text-primary">{formatTime(totalEstimated)}</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Total Actual</p>
            <p className="text-2xl font-bold">{formatTime(totalActual)}</p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Variance</p>
            <p className={`text-2xl font-bold ${
              totalActual > totalEstimated ? 'text-destructive' : 'text-green-600 dark:text-green-500'
            }`}>
              {totalActual > totalEstimated ? '+' : ''}{formatTime(totalActual - totalEstimated)}
            </p>
          </div>
        </Card>
        <Card className="glass-card p-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Utilization</p>
            <p className="text-2xl font-bold">
              {totalEstimated > 0 ? ((totalActual / totalEstimated) * 100).toFixed(0) : 0}%
            </p>
          </div>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All ({tasksWithEstimates.length})
        </Button>
        <Button
          variant={filter === 'on-track' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('on-track')}
          className={filter === 'on-track' ? '' : 'border-green-500/50 text-green-600 dark:text-green-500 hover:bg-green-500/10'}
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          On Track ({onTrackCount})
        </Button>
        <Button
          variant={filter === 'over-budget' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('over-budget')}
          className={filter === 'over-budget' ? '' : 'border-destructive/50 text-destructive hover:bg-destructive/10'}
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Over Budget ({overBudgetCount})
        </Button>
        <Button
          variant={filter === 'under-budget' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('under-budget')}
          className={filter === 'under-budget' ? '' : 'border-blue-500/50 text-blue-600 dark:text-blue-500 hover:bg-blue-500/10'}
        >
          <TrendingDown className="h-4 w-4 mr-1" />
          Under Budget ({underBudgetCount})
        </Button>
        <Button
          variant={filter === 'not-started' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('not-started')}
          className={filter === 'not-started' ? '' : 'text-muted-foreground'}
        >
          <Clock className="h-4 w-4 mr-1" />
          Not Started ({notStartedCount})
        </Button>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {sortedTasks.map(task => {
          const status = getTaskStatus(task)
          const estimated = task.timeTracking?.estimatedTime || 0
          const actual = (task.timeTracking?.totalTime || 0) / 60
          const variance = getVariance(task)
          const progress = getProgressPercentage(task)
          const isActive = task.timeTracking?.entries?.some(e => !e.endTime)

          return (
            <Card 
              key={task.id} 
              className="glass-card p-4 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => onTaskClick(task)}
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{task.title}</h3>
                      {isActive && (
                        <Badge variant="secondary" className="gap-1 bg-green-500/10 text-green-700 dark:text-green-400">
                          <Play className="h-3 w-3 fill-current" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className={`h-1.5 w-1.5 rounded-full ${getPriorityColor(task.priority)}`} />
                      <span className="text-xs text-muted-foreground capitalize">{task.status.replace('-', ' ')}</span>
                      {task.tags && task.tags.length > 0 && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <div className="flex gap-1">
                            {task.tags.slice(0, 2).map(tagId => {
                              const tag = getTag(tagId)
                              return tag ? (
                                <Badge 
                                  key={tag.id} 
                                  variant="secondary"
                                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                                  className="text-xs"
                                >
                                  {tag.name}
                                </Badge>
                              ) : null
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${getStatusColor(status)}`}>
                    {getStatusIcon(status)}
                  </div>
                </div>

                {/* Time Comparison */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Estimated</p>
                    <p className="font-medium">{formatTime(estimated)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Actual</p>
                    <p className="font-medium">{formatTime(actual)}</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className={`font-medium ${
                      progress > 110 ? 'text-destructive' :
                      progress < 90 && actual > 0 ? 'text-blue-600 dark:text-blue-500' :
                      'text-green-600 dark:text-green-500'
                    }`}>
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                {/* Variance */}
                {variance !== 0 && actual > 0 && (
                  <div className={`flex items-center justify-between text-xs p-2 rounded ${
                    Math.abs(variance) <= estimated * 0.1
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                      : variance > 0
                      ? 'bg-destructive/10 text-destructive'
                      : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                  }`}>
                    <span>
                      {variance > 0 ? '+' : ''}{formatTime(Math.abs(variance))} variance
                    </span>
                    <span className="font-medium">
                      {variance > 0 ? 'Over' : 'Under'} by {Math.abs((variance / estimated) * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="glass-card p-8 text-center">
          <p className="text-muted-foreground">
            No tasks match the selected filter
          </p>
        </Card>
      )}
    </div>
  )
}
