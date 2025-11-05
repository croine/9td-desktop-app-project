"use client"

import { useState } from 'react'
import { Task, Tag, Category } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek
} from 'date-fns'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  onTaskClick?: (task: Task) => void
  onDateClick?: (date: Date) => void
  onTaskReschedule?: (taskId: string, newDate: Date) => void
}

export function CalendarView({ 
  tasks, 
  tags, 
  categories, 
  onTaskClick, 
  onDateClick,
  onTaskReschedule 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => 
      task.dueDate && isSameDay(new Date(task.dueDate), date)
    )
  }

  const handlePrevious = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1))
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000))
    }
  }

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1))
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const handleDragStart = (task: Task) => {
    setDraggedTask(task)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (date: Date) => {
    if (draggedTask && onTaskReschedule) {
      onTaskReschedule(draggedTask.id, date)
      setDraggedTask(null)
    }
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed': return 'line-through opacity-60'
      case 'in-progress': return 'font-medium'
      default: return ''
    }
  }

  const displayDays = view === 'month' ? days : weekDays

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button onClick={handlePrevious} variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="font-display text-xl md:text-2xl font-bold min-w-[180px] text-center">
            {format(currentDate, view === 'month' ? 'MMMM yyyy' : "'Week of' MMM d, yyyy")}
          </h2>
          <Button onClick={handleNext} variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleToday} variant="outline" size="sm">
            Today
          </Button>
          <Button
            onClick={() => setView('month')}
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
          >
            Month
          </Button>
          <Button
            onClick={() => setView('week')}
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
          >
            Week
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="glass-card p-4">
        {/* Day Headers */}
        <div className={cn(
          "grid gap-2 mb-2",
          view === 'month' ? "grid-cols-7" : "grid-cols-7"
        )}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center font-semibold text-sm text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className={cn(
          "grid gap-2",
          view === 'month' ? "grid-cols-7" : "grid-cols-7"
        )}>
          {displayDays.map((day, idx) => {
            const dayTasks = getTasksForDate(day)
            const isCurrentMonth = isSameMonth(day, currentDate)
            const isDayToday = isToday(day)

            return (
              <div
                key={idx}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(day)}
                onClick={() => onDateClick?.(day)}
                className={cn(
                  "min-h-[100px] p-2 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50",
                  isDayToday && "border-primary bg-primary/5",
                  !isCurrentMonth && view === 'month' && "opacity-40",
                  "hover:shadow-md"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-sm font-medium",
                    isDayToday && "text-primary font-bold"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayTasks.length > 0 && (
                    <Badge variant="secondary" className="text-xs h-5 px-1.5">
                      {dayTasks.length}
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, view === 'month' ? 3 : 5).map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task)}
                      onClick={(e) => {
                        e.stopPropagation()
                        onTaskClick?.(task)
                      }}
                      className={cn(
                        "text-xs p-1.5 rounded border-l-2 bg-card hover:bg-accent transition-colors cursor-move",
                        getPriorityColor(task.priority)
                      )}
                    >
                      <div className={cn("truncate", getStatusColor(task.status))}>
                        {task.title}
                      </div>
                    </div>
                  ))}
                  {dayTasks.length > (view === 'month' ? 3 : 5) && (
                    <div className="text-xs text-muted-foreground text-center py-1">
                      +{dayTasks.length - (view === 'month' ? 3 : 5)} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Mini Calendar Widget */}
      <Card className="glass-card p-4">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CalendarIcon className="h-4 w-4" />
          Quick Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-blue-600">
              {tasks.filter(t => t.dueDate && isSameMonth(new Date(t.dueDate), currentDate)).length}
            </div>
            <div className="text-xs text-muted-foreground">This Month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-green-600">
              {tasks.filter(t => t.dueDate && isSameMonth(new Date(t.dueDate), currentDate) && t.status === 'completed').length}
            </div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-orange-600">
              {tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length}
            </div>
            <div className="text-xs text-muted-foreground">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-display font-bold text-purple-600">
              {tasks.filter(t => t.dueDate && isToday(new Date(t.dueDate))).length}
            </div>
            <div className="text-xs text-muted-foreground">Due Today</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
