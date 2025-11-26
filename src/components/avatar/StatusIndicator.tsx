"use client"

import { motion } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface StatusIndicatorProps {
  status: 'active' | 'away' | 'busy' | 'offline'
  customMessage?: string | null
  size?: 'sm' | 'md' | 'lg'
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  showTooltip?: boolean
}

const statusConfig = {
  active: {
    color: 'bg-green-500',
    label: 'Active',
    description: 'Currently online and working',
    pulse: true
  },
  away: {
    color: 'bg-yellow-500',
    label: 'Away',
    description: 'Stepped away from keyboard',
    pulse: false
  },
  busy: {
    color: 'bg-red-500',
    label: 'Busy',
    description: 'In a meeting or focused',
    pulse: true
  },
  offline: {
    color: 'bg-gray-500',
    label: 'Offline',
    description: 'Not currently active',
    pulse: false
  }
}

export function StatusIndicator({
  status,
  customMessage,
  size = 'md',
  position = 'bottom-right',
  showTooltip = true
}: StatusIndicatorProps) {
  const config = statusConfig[status]

  const sizeClasses = {
    sm: 'h-2.5 w-2.5',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  const positionClasses = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0'
  }

  const indicator = (
    <div className={`absolute ${positionClasses[position]} z-10`}>
      <div className="relative">
        <motion.div
          className={`${sizeClasses[size]} rounded-full ${config.color} border-2 border-background`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
        {config.pulse && (
          <motion.div
            className={`absolute inset-0 ${sizeClasses[size]} rounded-full ${config.color} opacity-75`}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.75, 0, 0.75]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}
      </div>
    </div>
  )

  if (!showTooltip) {
    return indicator
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {indicator}
      </TooltipTrigger>
      <TooltipContent side="top">
        <div className="space-y-1">
          <p className="font-semibold text-sm">{config.label}</p>
          <p className="text-xs text-muted-foreground">{config.description}</p>
          {customMessage && (
            <p className="text-xs italic">"{customMessage}"</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
