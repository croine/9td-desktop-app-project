"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Task, Tag, Category } from '@/types/task'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { 
  Plus, 
  Sparkles, 
  Calendar, 
  Repeat, 
  ListChecks,
  Mic,
  FileText,
  Mail,
  ClipboardList,
  TrendingUp,
  Clock,
  Target,
  Zap,
  Lightbulb,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Timer,
  Tag as TagIcon,
  Folder
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface AdvancedCreateTaskProps {
  onCreateTask: () => void
  onCreateFromTemplate: () => void
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
}

export const AdvancedCreateTask = ({ 
  onCreateTask, 
  onCreateFromTemplate,
  tasks,
  tags,
  categories 
}: AdvancedCreateTaskProps) => {
  // Calculate statistics
  const today = new Date()
  const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const tasksCreatedToday = tasks.filter(t => 
    new Date(t.createdAt).toDateString() === today.toDateString()
  ).length
  
  const tasksCreatedThisWeek = tasks.filter(t => 
    new Date(t.createdAt) >= thisWeek
  ).length
  
  const tasksCreatedThisMonth = tasks.filter(t => 
    new Date(t.createdAt) >= thisMonth
  ).length
  
  const completedThisWeek = tasks.filter(t => 
    t.status === 'completed' && new Date(t.createdAt) >= thisWeek
  ).length
  
  const completionRate = tasksCreatedThisWeek > 0 
    ? Math.round((completedThisWeek / tasksCreatedThisWeek) * 100) 
    : 0

  // Get recent tasks
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Smart suggestions based on time of day
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  
  const suggestions = {
    morning: [
      { icon: Target, text: 'Plan your day', priority: 'high' as const },
      { icon: Mail, text: 'Check emails', priority: 'medium' as const },
      { icon: TrendingUp, text: 'Review goals', priority: 'high' as const }
    ],
    afternoon: [
      { icon: ListChecks, text: 'Complete pending tasks', priority: 'medium' as const },
      { icon: Clock, text: 'Schedule meetings', priority: 'low' as const },
      { icon: FileText, text: 'Update documentation', priority: 'medium' as const }
    ],
    evening: [
      { icon: CheckCircle2, text: 'Review completed tasks', priority: 'low' as const },
      { icon: Calendar, text: 'Plan tomorrow', priority: 'high' as const },
      { icon: Target, text: 'Set weekly goals', priority: 'medium' as const }
    ]
  }

  const currentSuggestions = suggestions[timeOfDay]

  // Creation methods
  const creationMethods = [
    {
      icon: Plus,
      title: 'Blank Task',
      description: 'Start from scratch',
      color: 'from-blue-500 to-cyan-500',
      action: onCreateTask
    },
    {
      icon: FileText,
      title: 'From Template',
      description: 'Use saved templates',
      color: 'from-purple-500 to-pink-500',
      action: onCreateFromTemplate
    },
    {
      icon: Repeat,
      title: 'Recurring Task',
      description: 'Set up repeating tasks',
      color: 'from-green-500 to-emerald-500',
      action: onCreateTask,
      badge: 'Pro'
    },
    {
      icon: ListChecks,
      title: 'Bulk Create',
      description: 'Add multiple tasks',
      color: 'from-orange-500 to-red-500',
      action: onCreateTask,
      badge: 'New'
    },
    {
      icon: Mic,
      title: 'Voice Input',
      description: 'Speak your task',
      color: 'from-indigo-500 to-purple-500',
      action: onCreateTask,
      badge: 'Beta'
    },
    {
      icon: Sparkles,
      title: 'AI Assistant',
      description: 'Smart task breakdown',
      color: 'from-yellow-500 to-orange-500',
      action: onCreateTask,
      badge: 'AI'
    }
  ]

  // Quick actions
  const quickActions = [
    { icon: Mail, label: 'From Email', color: 'text-blue-500' },
    { icon: Calendar, label: 'From Calendar', color: 'text-purple-500' },
    { icon: ClipboardList, label: 'From Clipboard', color: 'text-green-500' },
    { icon: Timer, label: 'Scheduled', color: 'text-orange-500' }
  ]

  // Best practices tips
  const tips = [
    {
      icon: Target,
      title: 'Be Specific',
      description: 'Use action verbs and clear outcomes'
    },
    {
      icon: Clock,
      title: 'Set Due Dates',
      description: 'Tasks with deadlines get done 2x faster'
    },
    {
      icon: TagIcon,
      title: 'Use Tags',
      description: 'Organize tasks for quick filtering'
    },
    {
      icon: AlertCircle,
      title: 'Set Priority',
      description: 'Focus on what matters most'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-7 w-7 text-primary animate-pulse shrink-0" />
          <h1 className="font-display text-3xl font-bold whitespace-nowrap">
            Create New Task
          </h1>
        </div>
        <Button
          size="sm"
          className="gap-2 shrink-0"
          onClick={onCreateTask}
        >
          <Plus className="h-4 w-4" />
          Create Task Now
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">{tasksCreatedToday}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">{tasksCreatedThisWeek}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold">{tasksCreatedThisMonth}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completion</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Creation Methods Grid */}
      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Creation Methods</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creationMethods.map((method, index) => (
            <motion.div
              key={method.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * index }}
              whileHover={{ scale: 1.03, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card 
                className="glass-card p-6 cursor-pointer group hover:shadow-lg transition-all"
                onClick={method.action}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <method.icon className="h-6 w-6 text-white" />
                  </div>
                  {method.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {method.badge}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold mb-1">{method.title}</h3>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Smart Suggestions */}
          <Card className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
              <h2 className="font-display text-lg font-semibold">
                Smart Suggestions for {timeOfDay}
              </h2>
            </div>
            <div className="space-y-3">
              {currentSuggestions.map((suggestion, index) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ x: 5 }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
                  onClick={onCreateTask}
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <suggestion.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium flex-1">{suggestion.text}</span>
                  <Badge 
                    variant={
                      suggestion.priority === 'high' ? 'destructive' : 
                      suggestion.priority === 'medium' ? 'default' : 
                      'secondary'
                    }
                    className="text-xs"
                  >
                    {suggestion.priority}
                  </Badge>
                </motion.button>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="glass-card p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-secondary/50 transition-colors"
                  onClick={onCreateTask}
                >
                  <action.icon className={`h-6 w-6 ${action.color}`} />
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.button>
              ))}
            </div>
          </Card>

          {/* Best Practices */}
          <Card className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="h-5 w-5 text-yellow-500 animate-pulse" />
              <h2 className="font-display text-lg font-semibold">Task Creation Tips</h2>
            </div>
            <div className="space-y-4">
              {tips.map((tip, index) => (
                <motion.div
                  key={tip.title}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex gap-3"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <tip.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{tip.title}</h3>
                    <p className="text-xs text-muted-foreground">{tip.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Recent Tasks */}
          <Card className="glass-card p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Recent Tasks</h2>
            {recentTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ListChecks className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks created yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(task.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          task.priority === 'urgent' || task.priority === 'high' 
                            ? 'destructive' 
                            : task.priority === 'medium' 
                            ? 'default' 
                            : 'secondary'
                        }
                        className="text-xs shrink-0"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Stats */}
          <Card className="glass-card p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TagIcon className="h-4 w-4 text-primary" />
                  <span className="text-sm">Total Tags</span>
                </div>
                <span className="font-bold">{tags.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Folder className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Total Categories</span>
                </div>
                <span className="font-bold">{categories.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListChecks className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Total Tasks</span>
                </div>
                <span className="font-bold">{tasks.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="font-bold">
                  {tasks.filter(t => t.status === 'completed').length}
                </span>
              </div>
            </div>
          </Card>

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button 
              size="default" 
              className="w-full gap-2"
              onClick={onCreateTask}
            >
              <Plus className="h-4 w-4" />
              Create New Task Now
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}