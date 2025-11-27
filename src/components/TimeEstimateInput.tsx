"use client"

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, Zap, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TimeEstimateInputProps {
  estimatedMinutes?: number
  onChange: (minutes: number) => void
  actualMinutes?: number
  className?: string
}

export function TimeEstimateInput({ 
  estimatedMinutes = 0, 
  onChange, 
  actualMinutes = 0,
  className 
}: TimeEstimateInputProps) {
  const [hours, setHours] = useState(Math.floor(estimatedMinutes / 60).toString())
  const [minutes, setMinutes] = useState((estimatedMinutes % 60).toString())

  useEffect(() => {
    setHours(Math.floor(estimatedMinutes / 60).toString())
    setMinutes((estimatedMinutes % 60).toString())
  }, [estimatedMinutes])

  const handleChange = (newHours: string, newMinutes: string) => {
    const h = parseInt(newHours) || 0
    const m = parseInt(newMinutes) || 0
    onChange(h * 60 + m)
  }

  const setQuickEstimate = (mins: number) => {
    const h = Math.floor(mins / 60)
    const m = mins % 60
    setHours(h.toString())
    setMinutes(m.toString())
    onChange(mins)
  }

  const variance = actualMinutes - estimatedMinutes
  const variancePercent = estimatedMinutes > 0 
    ? Math.round((variance / estimatedMinutes) * 100) 
    : 0

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Time Estimate
        </Label>
        {actualMinutes > 0 && estimatedMinutes > 0 && (
          <Badge 
            variant="outline" 
            className={cn(
              "gap-1 text-xs",
              variance > 0 && "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400",
              variance < 0 && "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/30 dark:text-green-400"
            )}
          >
            <TrendingUp className="h-3 w-3" />
            {variance > 0 ? '+' : ''}{variance}m ({variancePercent > 0 ? '+' : ''}{variancePercent}%)
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="hours" className="text-xs text-muted-foreground">Hours</Label>
          <Input
            id="hours"
            type="number"
            min="0"
            placeholder="0"
            value={hours}
            onChange={(e) => {
              setHours(e.target.value)
              handleChange(e.target.value, minutes)
            }}
            className="h-9"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="mins" className="text-xs text-muted-foreground">Minutes</Label>
          <Input
            id="mins"
            type="number"
            min="0"
            max="59"
            placeholder="0"
            value={minutes}
            onChange={(e) => {
              setMinutes(e.target.value)
              handleChange(hours, e.target.value)
            }}
            className="h-9"
          />
        </div>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Quick:
        </span>
        {[15, 30, 45, 60, 90, 120].map((mins) => (
          <Button
            key={mins}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setQuickEstimate(mins)}
            className="h-6 px-2 text-xs"
          >
            {mins < 60 ? `${mins}m` : `${mins / 60}h`}
          </Button>
        ))}
      </div>

      {/* Actual vs Estimate Comparison */}
      {actualMinutes > 0 && estimatedMinutes > 0 && (
        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Estimated</span>
            <span className="font-medium">{Math.floor(estimatedMinutes / 60)}h {estimatedMinutes % 60}m</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Actual</span>
            <span className="font-medium">{Math.floor(actualMinutes / 60)}h {actualMinutes % 60}m</span>
          </div>
          <div className="flex items-center justify-between text-xs font-semibold pt-2 border-t">
            <span className={cn(
              variance > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
            )}>
              {variance > 0 ? 'Over' : 'Under'} by
            </span>
            <span className={cn(
              variance > 0 ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
            )}>
              {Math.abs(variance)}m ({Math.abs(variancePercent)}%)
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
