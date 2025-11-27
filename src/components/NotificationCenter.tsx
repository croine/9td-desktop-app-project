"use client"

import { useState, useEffect } from 'react'
import { Task } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  AtSign,
  Link2,
  Zap,
  Filter,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { notificationService, NotificationPayload } from '@/lib/notificationService'

interface NotificationCenterProps {
  tasks: Task[]
  onTaskClick?: (taskId: string) => void
}

export function NotificationCenter({ tasks, onTaskClick }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([])
  const [taskNotifications, setTaskNotifications] = useState<NotificationPayload[]>([])
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'mentions'>('all')

  // Subscribe to notification service
  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notifs) => {
      setNotifications(notifs)
    })
    return unsubscribe
  }, [])

  // Generate task-based notifications
  useEffect(() => {
    const now = new Date()
    const generatedNotifications: NotificationPayload[] = []

    tasks.forEach(task => {
      if (!task.dueDate || task.status === 'completed') return

      const dueDate = new Date(task.dueDate)
      const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

      // Overdue tasks
      if (hoursUntilDue < 0) {
        const daysPast = Math.floor(Math.abs(hoursUntilDue) / 24)
        generatedNotifications.push({
          id: `overdue-${task.id}`,
          type: 'task_overdue',
          title: 'Task Overdue',
          message: `"${task.title}" is ${daysPast} day${daysPast !== 1 ? 's' : ''} overdue`,
          timestamp: new Date(task.dueDate),
          read: false,
          priority: 'high',
          metadata: { taskId: task.id }
        })
      }
      // Due soon (within 24 hours)
      else if (hoursUntilDue < 24 && hoursUntilDue > 0) {
        generatedNotifications.push({
          id: `due-soon-${task.id}`,
          type: 'task_due_soon',
          title: 'Task Due Soon',
          message: `"${task.title}" is due in ${Math.floor(hoursUntilDue)} hour${Math.floor(hoursUntilDue) !== 1 ? 's' : ''}`,
          timestamp: new Date(task.dueDate),
          read: false,
          priority: hoursUntilDue < 2 ? 'high' : 'medium',
          metadata: { taskId: task.id }
        })
      }
    })

    setTaskNotifications(generatedNotifications)
  }, [tasks])

  // Combine all notifications
  const allNotifications = [...notifications, ...taskNotifications].sort((a, b) => {
    // Sort by priority first
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    const aPriority = priorityOrder[a.priority || 'medium']
    const bPriority = priorityOrder[b.priority || 'medium']
    if (aPriority !== bPriority) return bPriority - aPriority
    
    // Then by timestamp
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  const unreadNotifications = allNotifications.filter(n => !n.read)
  const mentionNotifications = allNotifications.filter(n => n.type === 'mention')
  const unreadCount = unreadNotifications.length

  const displayedNotifications = 
    activeTab === 'unread' ? unreadNotifications :
    activeTab === 'mentions' ? mentionNotifications :
    allNotifications

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id)
    setTaskNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
    setTaskNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read')
  }

  const handleClearAll = () => {
    notificationService.clearAll()
    setTaskNotifications([])
    toast.success('All notifications cleared')
  }

  const handleNotificationClick = (notification: NotificationPayload) => {
    handleMarkAsRead(notification.id)
    if (notification.metadata?.taskId) {
      onTaskClick?.(notification.metadata.taskId)
      setOpen(false)
    }
  }

  const getNotificationIcon = (type: NotificationPayload['type']) => {
    switch (type) {
      case 'task_due_soon': return Clock
      case 'task_overdue': return AlertCircle
      case 'task_assigned': return Calendar
      case 'mention': return AtSign
      case 'task_completed': return Check
      case 'task_updated': return Bell
      case 'dependency_unblocked': return Link2
      case 'reminder': return Bell
    }
  }

  const getNotificationColor = (type: NotificationPayload['type'], priority?: string) => {
    if (priority === 'high') return 'text-destructive'
    switch (type) {
      case 'task_overdue': return 'text-destructive'
      case 'task_completed': return 'text-green-500'
      case 'mention': return 'text-blue-500'
      case 'dependency_unblocked': return 'text-purple-500'
      default: return 'text-primary'
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
      <PopoverContent className="w-[450px] p-0" align="end">
        <div className="flex flex-col max-h-[600px]">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-display font-semibold">Notifications</h3>
                {unreadCount > 0 && (
                  <Badge variant="secondary">{unreadCount} new</Badge>
                )}
              </div>
              {allNotifications.length > 0 && (
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

            {/* Filter Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="w-full grid grid-cols-3 h-8">
                <TabsTrigger value="all" className="text-xs">
                  All ({allNotifications.length})
                </TabsTrigger>
                <TabsTrigger value="unread" className="text-xs">
                  Unread ({unreadNotifications.length})
                </TabsTrigger>
                <TabsTrigger value="mentions" className="text-xs">
                  <AtSign className="h-3 w-3 mr-1" />
                  Mentions ({mentionNotifications.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Notifications List */}
          <ScrollArea className="flex-1">
            {displayedNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    {activeTab === 'mentions' ? (
                      <AtSign className="h-8 w-8" />
                    ) : activeTab === 'unread' ? (
                      <Filter className="h-8 w-8" />
                    ) : (
                      <BellOff className="h-8 w-8" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {activeTab === 'mentions' ? 'No mentions' :
                       activeTab === 'unread' ? 'All caught up!' :
                       'No notifications'}
                    </div>
                    <div className="text-sm">
                      {activeTab === 'mentions' ? 'No one has mentioned you yet' :
                       activeTab === 'unread' ? 'You have no unread notifications' :
                       'You have no notifications'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-2">
                <AnimatePresence>
                  {displayedNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type)
                    const iconColor = getNotificationColor(notification.type, notification.priority)
                    
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
                            "w-full p-3 rounded-lg text-left hover:bg-muted/50 transition-colors mb-2 group",
                            !notification.read && "bg-primary/5 border border-primary/20",
                            notification.priority === 'high' && "border-destructive/30"
                          )}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                              notification.priority === 'high' ? "bg-destructive/10" : "bg-primary/10"
                            )}>
                              <Icon className={cn("h-5 w-5", iconColor)} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <div className="flex items-center gap-2">
                                  <div className="font-medium text-sm">{notification.title}</div>
                                  {notification.priority === 'high' && (
                                    <Badge variant="destructive" className="text-xs px-1 py-0 h-4">
                                      Urgent
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {!notification.read && (
                                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMarkAsRead(notification.id)
                                    }}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {notification.message}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatTimestamp(notification.timestamp)}
                                {notification.type === 'mention' && (
                                  <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                                    <AtSign className="h-2.5 w-2.5 mr-0.5" />
                                    Mention
                                  </Badge>
                                )}
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

function formatTimestamp(timestamp: Date): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}