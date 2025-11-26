"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface ProductivityRingProps {
  dailyProgress: number // 0-100
  weeklyProgress: number // 0-100
  dailyGoal: number
  weeklyGoal: number
  tasksCompletedToday: number
  tasksCompletedThisWeek: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
}

export function ProductivityRing({
  dailyProgress,
  weeklyProgress,
  dailyGoal,
  weeklyGoal,
  tasksCompletedToday,
  tasksCompletedThisWeek,
  size = 'md',
  showTooltip = true
}: ProductivityRingProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const sizes = {
    sm: { outer: 48, inner: 42, stroke: 3 },
    md: { outer: 64, inner: 56, stroke: 4 },
    lg: { outer: 80, inner: 72, stroke: 5 }
  }

  const { outer, inner, stroke } = sizes[size]
  const radius = (outer - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const dailyOffset = circumference - (dailyProgress / 100) * circumference
  const weeklyOffset = circumference - (weeklyProgress / 100) * circumference

  const content = (
    <div className="relative" style={{ width: outer, height: outer }}>
      {/* Weekly Ring (outer) */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={outer}
        height={outer}
      >
        {/* Background circle */}
        <circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={outer / 2}
          cy={outer / 2}
          r={radius}
          fill="none"
          stroke="url(#weeklyGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? weeklyOffset : circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: weeklyOffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="weeklyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Daily Ring (inner) */}
      <svg
        className="absolute inset-0 -rotate-90"
        width={inner}
        height={inner}
        style={{
          left: (outer - inner) / 2,
          top: (outer - inner) / 2
        }}
      >
        {/* Background circle */}
        <circle
          cx={inner / 2}
          cy={inner / 2}
          r={(inner - stroke) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-muted/20"
        />
        {/* Progress circle */}
        <motion.circle
          cx={inner / 2}
          cy={inner / 2}
          r={(inner - stroke) / 2}
          fill="none"
          stroke="url(#dailyGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={mounted ? dailyOffset : circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dailyOffset }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
        />
        <defs>
          <linearGradient id="dailyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )

  if (!showTooltip) {
    return content
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {content}
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-2">
          <div>
            <p className="font-semibold text-sm">📅 Daily Progress</p>
            <p className="text-xs">
              {tasksCompletedToday} / {dailyGoal} tasks ({Math.round(dailyProgress)}%)
            </p>
          </div>
          <div>
            <p className="font-semibold text-sm">📊 Weekly Progress</p>
            <p className="text-xs">
              {tasksCompletedThisWeek} / {weeklyGoal} tasks ({Math.round(weeklyProgress)}%)
            </p>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
