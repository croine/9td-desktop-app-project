"use client"

import { Task, Tag, Category, AppSettings } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { SmartSuggestions } from '@/components/SmartSuggestions'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Calendar,
  Target,
  Plus,
  Search,
  Flame,
  Zap,
  BarChart3,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format, isToday, isThisWeek, subDays } from 'date-fns'

interface DashboardProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  settings: AppSettings
  onCreateTask?: () => void
  onViewTasks?: () => void
}

export function Dashboard({ tasks, tags, categories, settings, onCreateTask, onViewTasks }: DashboardProps) {
  // Helper function to get animation class
  const getAnimationClass = (iconKey: keyof typeof settings.animationSettings.icons): string => {
    if (!settings.animationSettings.masterEnabled) return ''
    const iconSettings = settings.animationSettings.icons[iconKey]
    if (!iconSettings.enabled || iconSettings.animation === 'none') return ''
    return `animate-${iconSettings.animation}`
  }

  // Calculate statistics
  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
  const todoTasks = tasks.filter(t => t.status === 'todo').length
  const overdueTasks = tasks.filter(t => 
    t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed'
  ).length

  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  // Today's tasks
  const todayTasks = tasks.filter(t => 
    t.dueDate && isToday(new Date(t.dueDate)) && t.status !== 'completed'
  )

  // This week's tasks
  const thisWeekTasks = tasks.filter(t => 
    t.dueDate && isThisWeek(new Date(t.dueDate), { weekStartsOn: 1 }) && t.status !== 'completed'
  )

  // Calculate productivity streak
  const calculateStreak = () => {
    const completedTasksByDate = tasks
      .filter(t => t.status === 'completed' && t.createdAt)
      .reduce((acc, task) => {
        const date = format(new Date(task.createdAt), 'yyyy-MM-dd')
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {} as Record<string, number>)

    let streak = 0
    let currentDate = new Date()
    
    while (true) {
      const dateStr = format(currentDate, 'yyyy-MM-dd')
      if (completedTasksByDate[dateStr]) {
        streak++
        currentDate = subDays(currentDate, 1)
      } else {
        break
      }
    }
    
    return streak
  }

  const streak = calculateStreak()

  // Weekly productivity data (last 7 days)
  const weeklyData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const completed = tasks.filter(t => 
      t.status === 'completed' && 
      t.createdAt &&
      format(new Date(t.createdAt), 'yyyy-MM-dd') === dateStr
    ).length
    return {
      day: format(date, 'EEE'),
      date: dateStr,
      completed
    }
  })

  const maxCompleted = Math.max(...weeklyData.map(d => d.completed), 1)

  // Priority breakdown
  const urgentTasks = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length
  const highTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length

  const stats = [
    {
      label: 'Total Tasks',
      value: totalTasks,
      icon: Target,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      animationKey: 'totalTasks' as const,
    },
    {
      label: 'Completed',
      value: completedTasks,
      icon: CheckCircle2,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      animationKey: 'completed' as const,
    },
    {
      label: 'In Progress',
      value: inProgressTasks,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
      animationKey: 'inProgress' as const,
    },
    {
      label: 'Overdue',
      value: overdueTasks,
      icon: AlertCircle,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      animationKey: 'overdue' as const,
    },
  ]

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Welcome back! Here's your productivity overview
          </p>
        </div>
        <div className="flex gap-2 md:gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewTasks} 
            className="gap-1.5 h-6 px-2 text-xs font-medium"
          >
            <Search className="h-3 w-3" />
            <span className="hidden sm:inline">View All</span>
          </Button>
          <Button 
            size="sm" 
            onClick={onCreateTask} 
            className="gap-1.5 h-6 px-2 text-xs font-medium"
          >
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        </div>
      </div>

      {/* Stats Grid with Glassmorphism */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="glass-card p-4 md:p-6 hover:shadow-lg transition-all">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="space-y-1 md:space-y-2">
                    <p className="text-xs md:text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p className="text-2xl md:text-3xl font-display font-bold">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-2 md:p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color} ${getAnimationClass(stat.animationKey)}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Smart Suggestions */}
      <SmartSuggestions tasks={tasks} />

      {/* Today's Focus & Productivity Streak */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Today's Focus */}
        <Card className="glass-card lg:col-span-2 p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base md:text-lg font-semibold flex items-center gap-2">
              <Zap className={`h-4 w-4 md:h-5 md:w-5 text-yellow-600 ${getAnimationClass('todayFocus')}`} />
              Today's Focus
            </h3>
            <Badge variant="secondary" className="text-xs">
              {todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'}
            </Badge>
          </div>
          
          {todayTasks.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {todayTasks.slice(0, 3).map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2 md:gap-3 p-3 md:p-4 rounded-lg border bg-card/50 hover:shadow-md transition-all"
                >
                  <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                    task.priority === 'urgent' ? 'bg-red-500' :
                    task.priority === 'high' ? 'bg-orange-500' :
                    task.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {task.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Due today
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {todayTasks.length > 3 && (
                <Button variant="ghost" size="sm" onClick={onViewTasks} className="w-full text-xs md:text-sm">
                  View all {todayTasks.length} tasks
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium">No tasks due today</p>
              <p className="text-xs mt-1">You're all caught up! 🎉</p>
            </div>
          )}
        </Card>

        {/* Productivity Streak */}
        <Card className="glass-card p-4 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full -mr-16 -mt-16" />
          <div className="relative space-y-3 md:space-y-4">
            <div className="flex items-center gap-2">
              <Flame className={`h-4 w-4 md:h-5 md:w-5 text-orange-600 ${getAnimationClass('streak')}`} />
              <h3 className="font-display text-base md:text-lg font-semibold">Streak</h3>
            </div>
            <div className="text-center py-4 md:py-6">
              <div className="text-5xl md:text-6xl font-display font-bold text-orange-600 mb-2">
                {streak}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                {streak === 1 ? 'day' : 'days'} in a row
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Keep completing tasks daily to maintain your streak! 🔥
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Weekly Productivity & Completion Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Weekly Productivity Chart */}
        <Card className="glass-card p-4 md:p-6">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base md:text-lg font-semibold flex items-center gap-2">
                <BarChart3 className={`h-4 w-4 md:h-5 md:w-5 ${getAnimationClass('weeklyChart')}`} />
                <span className="hidden sm:inline">Weekly Productivity</span>
                <span className="sm:hidden">Weekly</span>
              </h3>
              <Badge variant="secondary" className="text-xs">
                Last 7 days
              </Badge>
            </div>
            <div className="flex items-end justify-between gap-1 md:gap-2 h-32 md:h-40">
              {weeklyData.map((day, i) => (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-1 md:gap-2">
                  <div className="w-full flex items-end justify-center h-24 md:h-32">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.completed / maxCompleted) * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-lg min-h-[4px] hover:from-primary/80 hover:to-primary/40 transition-all cursor-pointer"
                      title={`${day.completed} tasks completed`}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] md:text-xs font-medium">{day.day}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">{day.completed}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Completion Rate */}
        <Card className="glass-card p-4 md:p-6">
          <div className="space-y-3 md:space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1 min-w-0">
                <h3 className="font-display text-base md:text-lg font-semibold">Completion Rate</h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  Overall progress
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <TrendingUp className={`h-4 w-4 md:h-5 md:w-5 text-green-600 ${getAnimationClass('completionRate')}`} />
                <span className="text-2xl md:text-3xl font-display font-bold">
                  {completionRate.toFixed(0)}%
                </span>
              </div>
            </div>
            <Progress value={completionRate} className="h-3 md:h-4" />
            <div className="grid grid-cols-3 gap-2 md:gap-4 pt-2">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-display font-bold text-blue-600">
                  {todoTasks}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">To Do</p>
              </div>
              <div className="text-center">
                <p className="text-xl md:text-2xl font-display font-bold text-orange-600">
                  {inProgressTasks}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="text-center">
                <p className="text-xl md:text-2xl font-display font-bold text-green-600">
                  {completedTasks}
                </p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* This Week & Priority Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* This Week's Tasks */}
        <Card className="glass-card p-4 md:p-6">
          <h3 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <Calendar className={`h-4 w-4 md:h-5 md:w-5 ${getAnimationClass('calendar')}`} />
            This Week
          </h3>
          {thisWeekTasks.length > 0 ? (
            <div className="space-y-2">
              {thisWeekTasks.slice(0, 4).map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between gap-2 p-2 md:p-3 rounded-lg border bg-card/50 hover:shadow-sm transition-all"
                >
                  <div className="flex-1 space-y-1 min-w-0">
                    <p className="font-medium text-sm leading-tight truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {task.dueDate && format(new Date(task.dueDate), 'EEE, MMM d')}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {task.priority}
                  </Badge>
                </div>
              ))}
              {thisWeekTasks.length > 4 && (
                <Button variant="ghost" size="sm" onClick={onViewTasks} className="w-full mt-2 text-xs md:text-sm">
                  View all {thisWeekTasks.length} tasks
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8 text-muted-foreground">
              <Calendar className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No tasks this week</p>
            </div>
          )}
        </Card>

        {/* Priority Tasks */}
        <Card className="glass-card p-4 md:p-6">
          <h3 className="font-display text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center gap-2">
            <AlertCircle className={`h-4 w-4 md:h-5 md:w-5 ${getAnimationClass('needsAttention')}`} />
            Needs Attention
          </h3>
          <div className="space-y-2 md:space-y-3">
            {overdueTasks > 0 && (
              <div className="p-3 md:p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-sm md:text-base text-red-600 dark:text-red-400">Overdue Tasks</p>
                    <p className="text-xs text-muted-foreground">
                      {overdueTasks} {overdueTasks === 1 ? 'task needs' : 'tasks need'} attention
                    </p>
                  </div>
                  <div className="text-xl md:text-2xl font-display font-bold text-red-600 shrink-0">
                    {overdueTasks}
                  </div>
                </div>
              </div>
            )}
            
            {urgentTasks > 0 && (
              <div className="p-3 md:p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-sm md:text-base text-orange-600 dark:text-orange-400">Urgent Priority</p>
                    <p className="text-xs text-muted-foreground">
                      {urgentTasks} urgent {urgentTasks === 1 ? 'task' : 'tasks'}
                    </p>
                  </div>
                  <div className="text-xl md:text-2xl font-display font-bold text-orange-600 shrink-0">
                    {urgentTasks}
                  </div>
                </div>
              </div>
            )}

            {highTasks > 0 && (
              <div className="p-3 md:p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold text-sm md:text-base text-yellow-600 dark:text-yellow-500">High Priority</p>
                    <p className="text-xs text-muted-foreground">
                      {highTasks} high priority {highTasks === 1 ? 'task' : 'tasks'}
                    </p>
                  </div>
                  <div className="text-xl md:text-2xl font-display font-bold text-yellow-600 shrink-0">
                    {highTasks}
                  </div>
                </div>
              </div>
            )}

            {overdueTasks === 0 && urgentTasks === 0 && highTasks === 0 && (
              <div className="text-center py-6 md:py-8 text-muted-foreground">
                <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 opacity-50 text-green-600" />
                <p className="text-sm font-medium">All clear!</p>
                <p className="text-xs mt-1">No urgent tasks at the moment</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}