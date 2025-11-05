"use client"

import { useState, useRef, useEffect } from 'react'
import { Task, Tag, Category } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  differenceInDays,
  addMonths,
  subMonths,
  isSameDay,
  startOfDay,
  addDays
} from 'date-fns'

interface GanttViewProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  onTaskClick: (task: Task) => void
}

type ZoomLevel = 'day' | 'week' | 'month'

export function GanttView({ tasks, tags, categories, onTaskClick }: GanttViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('day')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Filter tasks with due dates
  const tasksWithDates = tasks.filter(t => t.dueDate && !t.archived)
  
  // Calculate date range
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  
  const today = startOfDay(new Date())
  
  const priorityColors = {
    low: 'bg-blue-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    urgent: 'bg-red-500',
  }
  
  const statusColors = {
    'todo': 'bg-gray-400',
    'in-progress': 'bg-blue-500',
    'review': 'bg-purple-500',
    'completed': 'bg-green-500',
    'cancelled': 'bg-gray-300',
  }
  
  const getTaskPosition = (task: Task) => {
    if (!task.dueDate) return null
    
    const dueDate = startOfDay(new Date(task.dueDate))
    const createdDate = startOfDay(new Date(task.createdAt))
    
    // Calculate start position (from created date or month start, whichever is later)
    const startDate = createdDate < monthStart ? monthStart : createdDate
    const endDate = dueDate > monthEnd ? monthEnd : dueDate
    
    // Don't show if completely outside range
    if (endDate < monthStart || startDate > monthEnd) return null
    
    const startDay = differenceInDays(startDate, monthStart)
    const duration = differenceInDays(endDate, startDate) + 1
    
    return { startDay, duration }
  }
  
  const getTaskStatus = (task: Task) => {
    if (task.status === 'completed') return 'completed'
    if (!task.dueDate) return 'on-track'
    
    const dueDate = new Date(task.dueDate)
    if (dueDate < today) return 'overdue'
    if (differenceInDays(dueDate, today) <= 3) return 'due-soon'
    
    return 'on-track'
  }
  
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
  const handleToday = () => setCurrentMonth(new Date())
  
  // Auto-scroll to today
  useEffect(() => {
    if (scrollContainerRef.current) {
      const todayIndex = days.findIndex(day => isSameDay(day, today))
      if (todayIndex !== -1) {
        const dayWidth = 80
        const scrollPosition = todayIndex * dayWidth - 200
        scrollContainerRef.current.scrollLeft = Math.max(0, scrollPosition)
      }
    }
  }, [currentMonth])
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Gantt Chart</h1>
          <p className="text-muted-foreground">
            Timeline visualization of your tasks
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            onClick={handleToday}
            className="min-w-[100px]"
          >
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <Card className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-gray-100 dark:bg-gray-900">
              <div className="w-3 h-3 bg-gray-400 rounded mr-2" />
              To Do
            </Badge>
            <Badge variant="outline" className="bg-blue-100 dark:bg-blue-900/30">
              <div className="w-3 h-3 bg-blue-500 rounded mr-2" />
              In Progress
            </Badge>
            <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30">
              <div className="w-3 h-3 bg-green-500 rounded mr-2" />
              Completed
            </Badge>
            <Badge variant="outline" className="bg-red-100 dark:bg-red-900/30">
              <div className="w-3 h-3 bg-red-500 rounded mr-2" />
              Overdue
            </Badge>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          {/* Timeline header */}
          <div className="flex border-b bg-muted/30">
            <div className="w-64 shrink-0 border-r p-3 font-medium">
              Task Name
            </div>
            <div ref={scrollContainerRef} className="flex-1 overflow-x-auto">
              <div className="flex" style={{ minWidth: `${days.length * 80}px` }}>
                {days.map((day, i) => {
                  const isToday = isSameDay(day, today)
                  const isWeekend = day.getDay() === 0 || day.getDay() === 6
                  
                  return (
                    <div
                      key={i}
                      className={cn(
                        'w-20 border-r p-2 text-center text-xs',
                        isToday && 'bg-primary/10 font-semibold',
                        isWeekend && !isToday && 'bg-muted/50'
                      )}
                    >
                      <div className={cn(isToday && 'text-primary')}>
                        {format(day, 'EEE')}
                      </div>
                      <div className={cn('text-lg', isToday && 'text-primary font-bold')}>
                        {format(day, 'd')}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Task rows */}
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {tasksWithDates.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No tasks with due dates
              </div>
            ) : (
              tasksWithDates.map((task) => {
                const position = getTaskPosition(task)
                const status = getTaskStatus(task)
                
                if (!position) return null
                
                return (
                  <div key={task.id} className="flex hover:bg-muted/30 transition-colors">
                    <div className="w-64 shrink-0 border-r p-3">
                      <div className="font-medium text-sm truncate">{task.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={cn('text-xs', statusColors[task.status]?.replace('bg-', 'text-'))}
                        >
                          {task.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {task.priority}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex-1 relative" style={{ minWidth: `${days.length * 80}px` }}>
                      <div className="absolute inset-0 flex">
                        {days.map((day, i) => {
                          const isToday = isSameDay(day, today)
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6
                          
                          return (
                            <div
                              key={i}
                              className={cn(
                                'w-20 border-r',
                                isToday && 'bg-primary/5',
                                isWeekend && !isToday && 'bg-muted/20'
                              )}
                            />
                          )
                        })}
                      </div>
                      
                      <div
                        className="absolute top-1/2 -translate-y-1/2 h-8 rounded-md cursor-pointer hover:opacity-80 transition-opacity flex items-center px-3 text-white text-xs font-medium"
                        style={{
                          left: `${position.startDay * 80 + 4}px`,
                          width: `${position.duration * 80 - 8}px`,
                        }}
                        onClick={() => onTaskClick(task)}
                      >
                        <div className={cn(
                          'absolute inset-0 rounded-md',
                          statusColors[task.status],
                          status === 'overdue' && 'animate-pulse'
                        )} />
                        <span className="relative truncate">{task.title}</span>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </Card>
      
      {/* Dependencies visualization */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Critical Path & Dependencies</h3>
        <div className="text-sm text-muted-foreground">
          {tasksWithDates.filter(t => t.dependencies && t.dependencies.length > 0).length > 0 ? (
            <div className="space-y-2">
              {tasksWithDates
                .filter(t => t.dependencies && t.dependencies.length > 0)
                .map(task => (
                  <div key={task.id} className="flex items-center gap-2">
                    <Badge variant="outline">{task.title}</Badge>
                    <span>→</span>
                    <span className="text-muted-foreground">
                      {task.dependencies!.length} {task.dependencies!.length === 1 ? 'dependency' : 'dependencies'}
                    </span>
                  </div>
                ))
              }
            </div>
          ) : (
            'No task dependencies defined yet'
          )}
        </div>
      </Card>
    </div>
  )
}
