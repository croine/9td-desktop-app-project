"use client"

import { useState, useEffect } from 'react'
import { Task } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { 
  Sunrise, 
  Sunset, 
  CalendarDays,
  Target,
  CheckCircle2,
  TrendingUp,
  Star,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface DailyPlanningRitualProps {
  tasks: Task[]
  onTaskSelect?: (taskIds: string[]) => void
  onReflectionSave?: (reflection: string) => void
}

type RitualType = 'morning' | 'evening' | 'weekly' | null

interface WeeklyGoal {
  id: string
  text: string
  completed: boolean
}

export function DailyPlanningRitual({
  tasks,
  onTaskSelect,
  onReflectionSave
}: DailyPlanningRitualProps) {
  const [activeRitual, setActiveRitual] = useState<RitualType>(null)
  const [selectedTasks, setSelectedTasks] = useState<string[]>([])
  const [reflection, setReflection] = useState('')
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([])
  const [currentStep, setCurrentStep] = useState(0)

  // Load saved data
  useEffect(() => {
    const saved = localStorage.getItem('daily_planning_ritual')
    if (saved) {
      const data = JSON.parse(saved)
      setWeeklyGoals(data.weeklyGoals || [])
    }
  }, [])

  // Save data
  const saveData = () => {
    const data = {
      weeklyGoals,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem('daily_planning_ritual', JSON.stringify(data))
  }

  // Morning Planning Steps
  const morningSteps = [
    {
      title: '☀️ Good Morning!',
      description: 'Let\'s plan your day for maximum productivity',
      component: (
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
            <Sunrise className="h-10 w-10 text-orange-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Ready to make today count?</h3>
            <p className="text-muted-foreground">
              Take 5 minutes to plan your priorities and set your intentions
            </p>
          </div>
        </div>
      )
    },
    {
      title: '🎯 Select Priority Tasks',
      description: 'Choose 3-5 tasks you\'ll focus on today',
      component: (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          <div className="mb-4">
            <h4 className="font-semibold mb-2">Today's Focus Tasks</h4>
            <p className="text-sm text-muted-foreground">
              Selected: {selectedTasks.length} tasks
            </p>
          </div>
          {tasks
            .filter(t => t.status !== 'completed' && t.status !== 'cancelled')
            .sort((a, b) => {
              const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
              return priorityOrder[b.priority] - priorityOrder[a.priority]
            })
            .map(task => (
              <Card
                key={task.id}
                className={`p-3 cursor-pointer transition-all ${
                  selectedTasks.includes(task.id)
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary/50'
                }`}
                onClick={() => {
                  if (selectedTasks.includes(task.id)) {
                    setSelectedTasks(selectedTasks.filter(id => id !== task.id))
                  } else {
                    setSelectedTasks([...selectedTasks, task.id])
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedTasks.includes(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs capitalize">
                        {task.priority}
                      </Badge>
                      {task.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due: {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
        </div>
      )
    },
    {
      title: '✨ Set Your Intention',
      description: 'What\'s your goal for today?',
      component: (
        <div className="space-y-4">
          <Textarea
            placeholder="Today, I will focus on..."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="min-h-32"
          />
          <div className="space-y-2">
            <p className="text-sm font-medium">Suggested intentions:</p>
            <div className="flex flex-wrap gap-2">
              {[
                'Complete my top priorities',
                'Stay focused and avoid distractions',
                'Make progress on my long-term goals',
                'Help my team succeed'
              ].map(suggestion => (
                <Badge
                  key={suggestion}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setReflection(suggestion)}
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      title: '🚀 Ready to Go!',
      description: 'Your day is planned. Let\'s make it happen!',
      component: (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">You're all set!</h3>
            <p className="text-muted-foreground mb-4">
              {selectedTasks.length} priority tasks selected
            </p>
          </div>
          {reflection && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <p className="text-sm font-medium mb-2">Today's Intention:</p>
              <p className="text-sm italic">"{reflection}"</p>
            </Card>
          )}
        </div>
      )
    }
  ]

  // Evening Review Steps
  const eveningSteps = [
    {
      title: '🌙 Evening Reflection',
      description: 'Let\'s review your day',
      component: (
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
            <Sunset className="h-10 w-10 text-purple-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">How was your day?</h3>
            <p className="text-muted-foreground">
              Take a moment to reflect on what you accomplished
            </p>
          </div>
        </div>
      )
    },
    {
      title: '✅ Tasks Completed',
      description: 'Review what you\'ve accomplished today',
      component: (
        <div className="space-y-4">
          <Card className="p-6 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900/30">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                {tasks.filter(t => {
                  if (!t.completedAt) return false
                  const completedDate = new Date(t.completedAt)
                  const today = new Date()
                  return completedDate.toDateString() === today.toDateString()
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">Tasks completed today</p>
            </div>
          </Card>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tasks
              .filter(t => {
                if (!t.completedAt) return false
                const completedDate = new Date(t.completedAt)
                const today = new Date()
                return completedDate.toDateString() === today.toDateString()
              })
              .map(task => (
                <Card key={task.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <p className="font-medium">{task.title}</p>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )
    },
    {
      title: '📝 What Went Well?',
      description: 'Celebrate your wins',
      component: (
        <div className="space-y-4">
          <Textarea
            placeholder="What went well today? What are you proud of?"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            className="min-h-32"
          />
        </div>
      )
    },
    {
      title: '🌟 Done for the Day!',
      description: 'Rest well, you\'ve earned it',
      component: (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full flex items-center justify-center">
            <Star className="h-10 w-10 text-blue-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Great work today!</h3>
            <p className="text-muted-foreground">
              You completed {tasks.filter(t => {
                if (!t.completedAt) return false
                const completedDate = new Date(t.completedAt)
                const today = new Date()
                return completedDate.toDateString() === today.toDateString()
              }).length} tasks. Rest and recharge for tomorrow!
            </p>
          </div>
        </div>
      )
    }
  ]

  // Weekly Planning Steps
  const weeklySteps = [
    {
      title: '📅 Weekly Planning',
      description: 'Set your goals for the week ahead',
      component: (
        <div className="space-y-4 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-full flex items-center justify-center">
            <CalendarDays className="h-10 w-10 text-pink-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Plan Your Week</h3>
            <p className="text-muted-foreground">
              Set clear goals and priorities for the next 7 days
            </p>
          </div>
        </div>
      )
    },
    {
      title: '🎯 Weekly Goals',
      description: 'What do you want to accomplish this week?',
      component: (
        <div className="space-y-4">
          <div className="space-y-2">
            {weeklyGoals.map(goal => (
              <Card key={goal.id} className="p-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={goal.completed}
                    onCheckedChange={(checked) => {
                      setWeeklyGoals(weeklyGoals.map(g =>
                        g.id === goal.id ? { ...g, completed: checked as boolean } : g
                      ))
                    }}
                  />
                  <p className={goal.completed ? 'line-through text-muted-foreground' : ''}>
                    {goal.text}
                  </p>
                </div>
              </Card>
            ))}
          </div>
          <Textarea
            placeholder="Add a new weekly goal..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                const text = e.currentTarget.value.trim()
                if (text) {
                  setWeeklyGoals([
                    ...weeklyGoals,
                    { id: Date.now().toString(), text, completed: false }
                  ])
                  e.currentTarget.value = ''
                }
              }
            }}
          />
        </div>
      )
    },
    {
      title: '🚀 Week Ahead',
      description: 'Your week is planned!',
      component: (
        <div className="space-y-6 text-center">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
            <TrendingUp className="h-10 w-10 text-violet-500" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">Ready for a great week!</h3>
            <p className="text-muted-foreground mb-4">
              {weeklyGoals.length} goals set for this week
            </p>
          </div>
        </div>
      )
    }
  ]

  const steps = activeRitual === 'morning' ? morningSteps : 
                activeRitual === 'evening' ? eveningSteps : 
                weeklySteps

  const handleComplete = () => {
    if (activeRitual === 'morning' && onTaskSelect) {
      onTaskSelect(selectedTasks)
    }
    
    if (reflection && onReflectionSave) {
      onReflectionSave(reflection)
    }
    
    saveData()
    
    toast.success(
      activeRitual === 'morning' ? '🌅 Morning planning complete!' :
      activeRitual === 'evening' ? '🌙 Evening reflection saved!' :
      '📅 Weekly planning complete!'
    )
    
    setActiveRitual(null)
    setCurrentStep(0)
    setSelectedTasks([])
    setReflection('')
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="space-y-4">
      {/* Ritual Trigger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10 border-yellow-200 dark:border-yellow-900/30"
          onClick={() => {
            setActiveRitual('morning')
            setCurrentStep(0)
          }}
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-full flex items-center justify-center">
              <Sunrise className="h-8 w-8 text-orange-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Morning Planning</h3>
              <p className="text-sm text-muted-foreground">
                Start your day with focus
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Begin <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>

        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10 border-purple-200 dark:border-purple-900/30"
          onClick={() => {
            setActiveRitual('evening')
            setCurrentStep(0)
          }}
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full flex items-center justify-center">
              <Sunset className="h-8 w-8 text-purple-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Evening Review</h3>
              <p className="text-sm text-muted-foreground">
                Reflect on your day
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Begin <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>

        <Card 
          className="p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-900/10 dark:to-rose-900/10 border-pink-200 dark:border-pink-900/30"
          onClick={() => {
            setActiveRitual('weekly')
            setCurrentStep(0)
          }}
        >
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30 rounded-full flex items-center justify-center">
              <CalendarDays className="h-8 w-8 text-pink-500" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Weekly Planning</h3>
              <p className="text-sm text-muted-foreground">
                Set your week's goals
              </p>
            </div>
            <Button variant="outline" size="sm" className="w-full">
              Begin <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Ritual Dialog */}
      <Dialog open={activeRitual !== null} onOpenChange={() => setActiveRitual(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {steps[currentStep].title}
            </DialogTitle>
            <DialogDescription>{steps[currentStep].description}</DialogDescription>
          </DialogHeader>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Step Content */}
          <div className="py-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {steps[currentStep].component}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              Back
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
