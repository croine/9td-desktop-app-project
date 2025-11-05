"use client"

import { useMemo } from 'react'
import { ActivityLog } from '@/types/task'
import { eachDayOfInterval, startOfMonth, endOfMonth, format, isSameDay, getDay, startOfWeek } from 'date-fns'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ActivityLogHeatmapProps {
  logs: ActivityLog[]
}

export function ActivityLogHeatmap({ logs }: ActivityLogHeatmapProps) {
  const heatmapData = useMemo(() => {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    
    const activityByDay = new Map<string, number>()
    
    logs.forEach(log => {
      const logDate = format(new Date(log.timestamp), 'yyyy-MM-dd')
      activityByDay.set(logDate, (activityByDay.get(logDate) || 0) + 1)
    })
    
    return days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd')
      return {
        date: day,
        count: activityByDay.get(dateKey) || 0,
      }
    })
  }, [logs])
  
  const maxCount = Math.max(...heatmapData.map(d => d.count), 1)
  
  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-muted'
    const ratio = count / maxCount
    if (ratio > 0.75) return 'bg-green-600'
    if (ratio > 0.5) return 'bg-green-500'
    if (ratio > 0.25) return 'bg-green-400'
    return 'bg-green-300'
  }
  
  // Group by weeks
  const weeks: typeof heatmapData[][] = []
  let currentWeek: typeof heatmapData = []
  
  heatmapData.forEach((day, idx) => {
    if (idx === 0) {
      // Pad beginning of month
      const dayOfWeek = getDay(day.date)
      for (let i = 0; i < dayOfWeek; i++) {
        currentWeek.push({ date: new Date(), count: -1 })
      }
    }
    
    currentWeek.push(day)
    
    if (getDay(day.date) === 6 || idx === heatmapData.length - 1) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-display font-semibold text-sm">Activity Heatmap</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <div className="w-3 h-3 rounded-sm bg-green-300" />
            <div className="w-3 h-3 rounded-sm bg-green-400" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <div className="w-3 h-3 rounded-sm bg-green-600" />
          </div>
          <span>More</span>
        </div>
      </div>
      
      <div className="space-y-1">
        <div className="grid grid-cols-7 gap-1 text-xs text-muted-foreground mb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <TooltipProvider>
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIdx) => {
                if (day.count === -1) {
                  return <div key={dayIdx} className="w-full aspect-square" />
                }
                
                return (
                  <Tooltip key={dayIdx}>
                    <TooltipTrigger asChild>
                      <div
                        className={`w-full aspect-square rounded-sm ${getIntensity(day.count)} transition-colors cursor-pointer hover:ring-2 hover:ring-primary`}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">{format(day.date, 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">
                        {day.count} {day.count === 1 ? 'activity' : 'activities'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </div>
          ))}
        </TooltipProvider>
      </div>
    </div>
  )
}
