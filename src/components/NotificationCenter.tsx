"use client"

import { useState, useEffect } from 'react'
import { Task } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  Trash2,
  AlertCircle,
  Calendar,
  MessageSquare,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface Notification {
  id: string
  type: 'task-due' | 'task-overdue' | 'task-assigned' | 'comment' | 'reminder'
  title: string
  message: string
  taskId?: string
  timestamp: string
  read: boolean
  urgent: boolean
}

interface NotificationCenterProps {
  tasks: Task[]
  onTaskClick?: (taskId: string) => void
}

export function NotificationCenter({ tasks, onTaskClick }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  // Generate notifications from tasks
  useEffect(() => {
    const now = new Date()
    const generatedNotifications: Notification[] = []

    tasks.forEach(task => {
      if (!task.dueDate || task.status === 'completed') return

      const dueDate = new Date(task.dueDate)
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      // Overdue tasks
      if (hoursUntilDue < 0) {
        const daysPast = Math.floor(Math.abs(hoursUntilDue) / 24)
        generatedNotifications.push({
          id: `overdue-${task.id}`,
          type: 'task-overdue',
          title: 'Task Overdue',
          message: `"${task.title}" is ${daysPast} day${daysPast !== 1 ? 's' : ''} overdue`,
          taskId: task.id,
          timestamp: task.dueDate,
          read: false,
          urgent: true
        })
      }
      // Due soon (within 24 hours)
      else if (hoursUntilDue < 24 && hoursUntilDue > 0) {
        generatedNotifications.push({
          id: `due-soon-${task.id}`,
          type: 'task-due',
          title: 'Task Due Soon',
          message: `"${task.title}" is due in ${Math.floor(hoursUntilDue)} hour${Math.floor(hoursUntilDue) !== 1 ? 's' : ''}`,
          taskId: task.id,
          timestamp: task.dueDate,
          read: false,
          urgent: hoursUntilDue < 2
        })
      }
    })

    // Sort by urgency and timestamp
    generatedNotifications.sort((a, b) => {
      if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    setNotifications(generatedNotifications)
  }, [tasks])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const handleClearAll = () => {
    setNotifications([])
    toast.success('All notifications cleared')
  }

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id)
    if (notification.taskId) {
      onTaskClick?.(notification.taskId)
      setOpen(false)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task-due': return Clock
      case 'task-overdue': return AlertCircle
      case 'task-assigned': return Calendar
      case 'comment': return MessageSquare
      case 'reminder': return Bell
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <div className="flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-display font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} new</Badge>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="flex gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="h-7 text-xs"
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearAll}
                  className="h-7 w-7"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <BellOff className="h-8 w-8" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">All caught up!</div>
                    <div className="text-sm">No new notifications</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2">
                <AnimatePresence>
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type)
                    
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className={cn(
                            "w-full p-3 rounded-lg text-left hover:bg-muted/50 transition-colors mb-2",
                            !notification.read && "bg-primary/5 border border-primary/20",
                            notification.urgent && "border-destructive/30"
                          )}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                              notification.urgent ? "bg-destructive/10" : "bg-primary/10"
                            )}>
                              <Icon className={cn(
                                "h-5 w-5",
                                notification.urgent ? "text-destructive" : "text-primary"
                              )} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="font-medium text-sm">{notification.title}</div>
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(notification.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
