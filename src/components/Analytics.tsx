"use client"

import { Task, Tag, Category } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target,
  Download,
  Calendar,
  Zap
} from 'lucide-react'
import { 
  format, 
  subDays, 
  startOfWeek, 
  endOfWeek,
  eachDayOfInterval,
  isWithinInterval,
  differenceInDays
} from 'date-fns'
import { motion } from 'framer-motion'

interface AnalyticsProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  onExport?: () => void
}

export function Analytics({ tasks, tags, categories, onExport }: AnalyticsProps) {
  // Calculate productivity heatmap (last 12 weeks)
  const last12Weeks = Array.from({ length: 12 }, (_, i) => {
    const weekStart = startOfWeek(subDays(new Date(), i * 7), { weekStartsOn: 1 })
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd })
    
    return days.map(day => {
      const completedTasks = tasks.filter(t => 
        t.completedAt && 
        format(new Date(t.completedAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      ).length
      
      return {
        date: format(day, 'yyyy-MM-dd'),
        count: completedTasks
      }
    })
  }).flat().reverse()

  const maxCompletions = Math.max(...last12Weeks.map(d => d.count), 1)

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-muted'
    const intensity = Math.min(count / maxCompletions, 1)
    if (intensity > 0.75) return 'bg-green-600'
    if (intensity > 0.5) return 'bg-green-500'
    if (intensity > 0.25) return 'bg-green-400'
    return 'bg-green-300'
  }

  // Time tracking stats
  const totalTimeTracked = tasks.reduce((sum, task) => 
    sum + (task.timeTracking?.totalTime || 0), 0
  )
  
  const avgTimePerTask = tasks.filter(t => t.timeTracking?.totalTime).length > 0
    ? totalTimeTracked / tasks.filter(t => t.timeTracking?.totalTime).length
    : 0

  // Category breakdown
  const categoryStats = categories.map(cat => {
    const catTasks = tasks.filter(t => t.categories.includes(cat.id))
    const completed = catTasks.filter(t => t.status === 'completed').length
    return {
      ...cat,
      total: catTasks.length,
      completed,
      percentage: catTasks.length > 0 ? (completed / catTasks.length) * 100 : 0
    }
  }).filter(s => s.total > 0)

  // Tag usage stats
  const tagStats = tags.map(tag => ({
    ...tag,
    count: tasks.filter(t => t.tags.includes(tag.id)).length
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count)

  // Completion rate over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), 29 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const created = tasks.filter(t => 
      format(new Date(t.createdAt), 'yyyy-MM-dd') === dateStr
    ).length
    const completed = tasks.filter(t => 
      t.completedAt && format(new Date(t.completedAt), 'yyyy-MM-dd') === dateStr
    ).length
    
    return {
      date: format(date, 'MMM d'),
      created,
      completed
    }
  })

  const maxDailyTasks = Math.max(...last30Days.map(d => Math.max(d.created, d.completed)), 1)

  // Priority distribution
  const priorityStats = [
    { priority: 'urgent', count: tasks.filter(t => t.priority === 'urgent').length, color: 'bg-red-500' },
    { priority: 'high', count: tasks.filter(t => t.priority === 'high').length, color: 'bg-orange-500' },
    { priority: 'medium', count: tasks.filter(t => t.priority === 'medium').length, color: 'bg-yellow-500' },
    { priority: 'low', count: tasks.filter(t => t.priority === 'low').length, color: 'bg-blue-500' },
  ].filter(s => s.count > 0)

  const totalPriorityTasks = priorityStats.reduce((sum, s) => sum + s.count, 0)

  // Average completion time
  const completedWithDueDate = tasks.filter(t => t.completedAt && t.dueDate)
  const avgCompletionTime = completedWithDueDate.length > 0
    ? completedWithDueDate.reduce((sum, t) => {
        const diff = differenceInDays(
          new Date(t.completedAt!),
          new Date(t.createdAt)
        )
        return sum + diff
      }, 0) / completedWithDueDate.length
    : 0

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Analytics & Reports</h1>
          <p className="text-muted-foreground">
            Deep insights into your productivity
          </p>
        </div>
        {onExport && (
          <Button onClick={onExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Target className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">{tasks.length}</p>
              <p className="text-xs text-muted-foreground">Total Tasks</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">
                {formatTime(totalTimeTracked)}
              </p>
              <p className="text-xs text-muted-foreground">Time Tracked</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-display font-bold">
                {avgCompletionTime.toFixed(1)}d
              </p>
              <p className="text-xs text-muted-foreground">Avg Completion</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Productivity Heatmap */}
      <Card className="glass-card p-6">
        <h3 className="font-display text-lg font-semibold mb-4">
          Productivity Heatmap (Last 12 Weeks)
        </h3>
        <div className="space-y-1">
          {Array.from({ length: 12 }).map((_, weekIdx) => (
            <div key={weekIdx} className="flex gap-1">
              {last12Weeks.slice(weekIdx * 7, (weekIdx + 1) * 7).map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`h-4 w-full rounded ${getHeatmapColor(day.count)} transition-colors hover:ring-2 hover:ring-primary cursor-pointer`}
                  title={`${day.date}: ${day.count} tasks completed`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="h-3 w-3 rounded bg-muted" />
            <div className="h-3 w-3 rounded bg-green-300" />
            <div className="h-3 w-3 rounded bg-green-400" />
            <div className="h-3 w-3 rounded bg-green-500" />
            <div className="h-3 w-3 rounded bg-green-600" />
          </div>
          <span>More</span>
        </div>
      </Card>

      {/* Completion Trends */}
      <Card className="glass-card p-6">
        <h3 className="font-display text-lg font-semibold mb-4">
          Task Trends (Last 30 Days)
        </h3>
        <div className="flex items-end gap-1 h-48">
          {last30Days.map((day, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <div className="w-full flex flex-col gap-0.5 items-center justify-end h-full">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.completed / maxDailyTasks) * 100}%` }}
                  transition={{ delay: idx * 0.02 }}
                  className="w-full bg-green-500 rounded-t min-h-[2px]"
                  title={`${day.date}: ${day.completed} completed`}
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(day.created / maxDailyTasks) * 100}%` }}
                  transition={{ delay: idx * 0.02 }}
                  className="w-full bg-blue-500 rounded-t min-h-[2px]"
                  title={`${day.date}: ${day.created} created`}
                />
              </div>
              {idx % 5 === 0 && (
                <span className="text-[8px] text-muted-foreground whitespace-nowrap rotate-45 origin-bottom-left">
                  {day.date}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-green-500" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-blue-500" />
            <span>Created</span>
          </div>
        </div>
      </Card>

      {/* Category & Tag Stats */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="glass-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">
            Category Breakdown
          </h3>
          <div className="space-y-3">
            {categoryStats.map(cat => (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {cat.completed}/{cat.total}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tag Usage */}
        <Card className="glass-card p-6">
          <h3 className="font-display text-lg font-semibold mb-4">
            Most Used Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {tagStats.map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="gap-1 text-sm py-1.5 px-3"
                style={{
                  backgroundColor: `${tag.color}20`,
                  color: tag.color,
                  borderColor: tag.color
                }}
              >
                #{tag.name}
                <span className="ml-1 font-bold">{tag.count}</span>
              </Badge>
            ))}
          </div>
        </Card>
      </div>

      {/* Priority Distribution */}
      <Card className="glass-card p-6">
        <h3 className="font-display text-lg font-semibold mb-4">
          Priority Distribution
        </h3>
        <div className="space-y-3">
          {priorityStats.map(stat => (
            <div key={stat.priority} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium capitalize">{stat.priority}</span>
                <span className="text-muted-foreground">
                  {stat.count} ({((stat.count / totalPriorityTasks) * 100).toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${stat.color} transition-all`}
                  style={{ width: `${(stat.count / totalPriorityTasks) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
