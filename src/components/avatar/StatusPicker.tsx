"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Circle,
  Coffee,
  Moon,
  Clock,
  MessageSquare,
  Zap,
  Calendar,
  Settings as SettingsIcon,
  Check,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type StatusType = 'active' | 'away' | 'busy' | 'offline'

interface StatusConfig {
  value: StatusType
  label: string
  color: string
  icon: React.ElementType
  description: string
}

interface StatusPreset {
  id: string
  status: StatusType
  message: string
  icon: React.ElementType
}

interface ScheduledStatus {
  id: string
  status: StatusType
  message: string
  startTime: string
  endTime: string
  days: number[] // 0-6 (Sunday-Saturday)
  enabled: boolean
}

interface StatusPickerProps {
  currentStatus: StatusType
  customMessage?: string | null
  onStatusChange: (status: StatusType, message?: string) => void
  compact?: boolean
}

const statusConfigs: StatusConfig[] = [
  {
    value: 'active',
    label: 'Active',
    color: 'text-green-500',
    icon: Circle,
    description: 'Online and available'
  },
  {
    value: 'busy',
    label: 'Busy',
    color: 'text-red-500',
    icon: Zap,
    description: 'Do not disturb'
  },
  {
    value: 'away',
    label: 'Away',
    color: 'text-yellow-500',
    icon: Coffee,
    description: 'Temporarily unavailable'
  },
  {
    value: 'offline',
    label: 'Offline',
    color: 'text-gray-500',
    icon: Moon,
    description: 'Not available'
  }
]

const statusPresets: StatusPreset[] = [
  { id: 'working', status: 'active', message: 'Working on tasks', icon: Circle },
  { id: 'meeting', status: 'busy', message: 'In a meeting', icon: Zap },
  { id: 'lunch', status: 'away', message: 'Out for lunch', icon: Coffee },
  { id: 'break', status: 'away', message: 'Taking a break', icon: Coffee },
  { id: 'commute', status: 'away', message: 'Commuting', icon: Coffee },
  { id: 'focus', status: 'busy', message: 'Deep focus mode', icon: Zap },
  { id: 'vacation', status: 'offline', message: 'On vacation', icon: Moon },
  { id: 'sleep', status: 'offline', message: 'Sleeping', icon: Moon },
]

export function StatusPicker({ 
  currentStatus, 
  customMessage, 
  onStatusChange,
  compact = false
}: StatusPickerProps) {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState(customMessage || '')
  const [autoAway, setAutoAway] = useState(false)
  const [autoAwayMinutes, setAutoAwayMinutes] = useState(15)
  const [scheduledStatuses, setScheduledStatuses] = useState<ScheduledStatus[]>([])
  const [recentStatuses, setRecentStatuses] = useState<Array<{ status: StatusType, message: string, timestamp: number }>>([])
  
  // Load preferences
  useEffect(() => {
    const saved = localStorage.getItem('status-preferences')
    if (saved) {
      try {
        const prefs = JSON.parse(saved)
        setAutoAway(prefs.autoAway || false)
        setAutoAwayMinutes(prefs.autoAwayMinutes || 15)
        setScheduledStatuses(prefs.scheduledStatuses || [])
        setRecentStatuses(prefs.recentStatuses || [])
      } catch (e) {
        console.error('Failed to load status preferences:', e)
      }
    }
  }, [])

  // Save preferences
  const savePreferences = () => {
    localStorage.setItem('status-preferences', JSON.stringify({
      autoAway,
      autoAwayMinutes,
      scheduledStatuses,
      recentStatuses: recentStatuses.slice(0, 10) // Keep last 10
    }))
  }

  // Auto-away detection
  useEffect(() => {
    if (!autoAway || currentStatus === 'offline') return

    let lastActivity = Date.now()
    const checkInterval = 60000 // Check every minute

    const updateActivity = () => {
      lastActivity = Date.now()
      if (currentStatus === 'away') {
        onStatusChange('active', message)
      }
    }

    const checkAway = () => {
      const idleTime = Date.now() - lastActivity
      const threshold = autoAwayMinutes * 60000
      
      if (idleTime > threshold && currentStatus === 'active') {
        onStatusChange('away', message || 'Away from keyboard')
        toast.info('Status automatically set to Away')
      }
    }

    // Track user activity
    window.addEventListener('mousemove', updateActivity)
    window.addEventListener('keydown', updateActivity)
    window.addEventListener('click', updateActivity)
    
    const interval = setInterval(checkAway, checkInterval)

    return () => {
      window.removeEventListener('mousemove', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('click', updateActivity)
      clearInterval(interval)
    }
  }, [autoAway, autoAwayMinutes, currentStatus, message, onStatusChange])

  // Scheduled statuses
  useEffect(() => {
    const checkSchedules = () => {
      const now = new Date()
      const currentDay = now.getDay()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      scheduledStatuses.forEach(schedule => {
        if (
          schedule.enabled &&
          schedule.days.includes(currentDay) &&
          currentTime >= schedule.startTime &&
          currentTime < schedule.endTime
        ) {
          onStatusChange(schedule.status, schedule.message)
          toast.info(`Status automatically changed: ${schedule.message}`)
        }
      })
    }

    const interval = setInterval(checkSchedules, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [scheduledStatuses, onStatusChange])

  const handleStatusChange = (status: StatusType, msg?: string) => {
    const newMessage = msg || message
    onStatusChange(status, newMessage)
    
    // Add to recent statuses
    const newRecent = [
      { status, message: newMessage, timestamp: Date.now() },
      ...recentStatuses.filter(r => !(r.status === status && r.message === newMessage))
    ].slice(0, 10)
    setRecentStatuses(newRecent)
    
    savePreferences()
    setOpen(false)
    toast.success(`Status updated to ${statusConfigs.find(s => s.value === status)?.label}`)
  }

  const currentConfig = statusConfigs.find(s => s.value === currentStatus) || statusConfigs[0]
  const CurrentIcon = currentConfig.icon

  // Compact view for small spaces
  if (compact) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2 gap-1.5 text-xs",
              currentConfig.color
            )}
          >
            <CurrentIcon className="h-3 w-3" />
            <span>{currentConfig.label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0" align="start">
          <StatusPickerContent
            currentStatus={currentStatus}
            message={message}
            setMessage={setMessage}
            handleStatusChange={handleStatusChange}
            statusPresets={statusPresets}
            recentStatuses={recentStatuses}
            autoAway={autoAway}
            setAutoAway={setAutoAway}
            autoAwayMinutes={autoAwayMinutes}
            setAutoAwayMinutes={setAutoAwayMinutes}
            savePreferences={savePreferences}
          />
        </PopoverContent>
      </Popover>
    )
  }

  // Full view
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between gap-2 h-10",
            currentConfig.color
          )}
        >
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-4 w-4" />
            <div className="flex flex-col items-start">
              <span className="font-semibold text-xs">{currentConfig.label}</span>
              {customMessage && (
                <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                  {customMessage}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <StatusPickerContent
          currentStatus={currentStatus}
          message={message}
          setMessage={setMessage}
          handleStatusChange={handleStatusChange}
          statusPresets={statusPresets}
          recentStatuses={recentStatuses}
          autoAway={autoAway}
          setAutoAway={setAutoAway}
          autoAwayMinutes={autoAwayMinutes}
          setAutoAwayMinutes={setAutoAwayMinutes}
          savePreferences={savePreferences}
        />
      </PopoverContent>
    </Popover>
  )
}

interface StatusPickerContentProps {
  currentStatus: StatusType
  message: string
  setMessage: (msg: string) => void
  handleStatusChange: (status: StatusType, msg?: string) => void
  statusPresets: StatusPreset[]
  recentStatuses: Array<{ status: StatusType, message: string, timestamp: number }>
  autoAway: boolean
  setAutoAway: (val: boolean) => void
  autoAwayMinutes: number
  setAutoAwayMinutes: (val: number) => void
  savePreferences: () => void
}

function StatusPickerContent({
  currentStatus,
  message,
  setMessage,
  handleStatusChange,
  statusPresets,
  recentStatuses,
  autoAway,
  setAutoAway,
  autoAwayMinutes,
  setAutoAwayMinutes,
  savePreferences
}: StatusPickerContentProps) {
  return (
    <Tabs defaultValue="status" className="w-full">
      <TabsList className="w-full rounded-none border-b h-10">
        <TabsTrigger value="status" className="flex-1 text-xs">
          <Circle className="h-3 w-3 mr-1" />
          Status
        </TabsTrigger>
        <TabsTrigger value="presets" className="flex-1 text-xs">
          <Sparkles className="h-3 w-3 mr-1" />
          Presets
        </TabsTrigger>
        <TabsTrigger value="settings" className="flex-1 text-xs">
          <SettingsIcon className="h-3 w-3 mr-1" />
          Settings
        </TabsTrigger>
      </TabsList>

      <TabsContent value="status" className="p-3 space-y-3 m-0">
        {/* Status Options */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Set Status
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {statusConfigs.map(config => {
              const Icon = config.icon
              return (
                <motion.div
                  key={config.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant={currentStatus === config.value ? 'default' : 'outline'}
                    className={cn(
                      "w-full h-auto p-2.5 flex flex-col items-start gap-1",
                      currentStatus === config.value && config.color
                    )}
                    onClick={() => handleStatusChange(config.value)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="h-4 w-4" />
                      <span className="font-semibold text-xs">{config.label}</span>
                      {currentStatus === config.value && (
                        <Check className="h-3 w-3 ml-auto" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground text-left">
                      {config.description}
                    </span>
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Custom Message */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground uppercase tracking-wider">
            Custom Message
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="What's your status?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-8 text-xs"
              maxLength={100}
            />
            <Button
              size="sm"
              onClick={() => handleStatusChange(currentStatus, message)}
              className="h-8 px-3"
            >
              <MessageSquare className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Recent Statuses */}
        {recentStatuses.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Recent
            </Label>
            <ScrollArea className="h-24">
              <div className="space-y-1 pr-2">
                {recentStatuses.map((recent, index) => {
                  const config = statusConfigs.find(s => s.value === recent.status)
                  if (!config) return null
                  const Icon = config.icon
                  
                  return (
                    <Button
                      key={`${recent.status}-${recent.message}-${index}`}
                      variant="ghost"
                      className="w-full justify-start h-auto p-2 text-xs"
                      onClick={() => handleStatusChange(recent.status, recent.message)}
                    >
                      <Icon className={cn("h-3 w-3 mr-2", config.color)} />
                      <div className="flex-1 text-left truncate">
                        <span className="font-medium">{config.label}</span>
                        {recent.message && (
                          <span className="text-muted-foreground"> - {recent.message}</span>
                        )}
                      </div>
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        )}
      </TabsContent>

      <TabsContent value="presets" className="p-3 space-y-1.5 m-0">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Quick Presets
        </Label>
        <ScrollArea className="h-64">
          <div className="space-y-1 pr-2">
            {statusPresets.map(preset => {
              const config = statusConfigs.find(s => s.value === preset.status)
              if (!config) return null
              const Icon = config.icon
              
              return (
                <motion.div
                  key={preset.id}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-auto p-2.5 text-xs"
                    onClick={() => handleStatusChange(preset.status, preset.message)}
                  >
                    <Icon className={cn("h-4 w-4 mr-3", config.color)} />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{preset.message}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {config.label}
                      </div>
                    </div>
                  </Button>
                </motion.div>
              )
            })}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="settings" className="p-3 space-y-4 m-0">
        {/* Auto-Away */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs font-semibold">Auto-Away</Label>
              <p className="text-[10px] text-muted-foreground">
                Automatically set status to Away when idle
              </p>
            </div>
            <Switch
              checked={autoAway}
              onCheckedChange={(checked) => {
                setAutoAway(checked)
                savePreferences()
                if (checked) {
                  toast.success('Auto-away enabled')
                } else {
                  toast.info('Auto-away disabled')
                }
              }}
            />
          </div>
          
          {autoAway && (
            <div className="space-y-1">
              <Label className="text-xs">Idle time (minutes)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={autoAwayMinutes}
                  onChange={(e) => setAutoAwayMinutes(parseInt(e.target.value) || 15)}
                  onBlur={savePreferences}
                  min={1}
                  max={120}
                  className="h-8 text-xs"
                />
                <Badge variant="secondary" className="text-xs">
                  <Clock className="h-3 w-3 mr-1" />
                  {autoAwayMinutes}m
                </Badge>
              </div>
            </div>
          )}
        </div>

        {/* Clear History */}
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs"
            onClick={() => {
              localStorage.removeItem('status-preferences')
              toast.success('Status history cleared')
            }}
          >
            Clear Status History
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  )
}
