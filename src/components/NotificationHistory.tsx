"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  BellOff,
  Clock,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  Zap,
  Calendar,
  Search,
  Filter,
  Trash2,
  CheckCheck,
  Archive,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { notificationService, NotificationPayload } from '@/lib/notificationService'

interface NotificationHistoryProps {
  onTaskClick?: (taskId: string) => void
}

export function NotificationHistory({ onTaskClick }: NotificationHistoryProps) {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([])
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notifs) => {
      setNotifications(notifs)
    })
    return unsubscribe
  }, [])

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false
    if (filter === 'read' && !n.read) return false
    if (typeFilter !== 'all' && n.type !== typeFilter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (!n.title.toLowerCase().includes(query) && !n.message.toLowerCase().includes(query)) {
        return false
      }
    }
    return true
  })

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id)
    toast.success('Notification marked as read')
  }

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead()
    toast.success('All notifications marked as read')
  }

  const handleDelete = (id: string) => {
    notificationService.delete(id)
    toast.success('Notification deleted')
  }

  const handleClearAll = () => {
    notificationService.clearAll()
    toast.success('All notifications cleared')
  }

  const handleNotificationClick = (notification: NotificationPayload) => {
    if (!notification.read) {
      notificationService.markAsRead(notification.id)
    }
    if (notification.metadata?.taskId) {
      onTaskClick?.(notification.metadata.taskId)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_due_soon': return Clock
      case 'task_overdue': return AlertCircle
      case 'task_assigned': return Calendar
      case 'mention': return MessageSquare
      case 'task_completed': return CheckCircle2
      case 'task_updated': return Zap
      case 'dependency_unblocked': return Zap
      case 'reminder': return Bell
      default: return Bell
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Notification History</h2>
          <p className="text-muted-foreground text-sm">
            View and manage all your notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Bell className="h-3 w-3" />
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card className="glass-card p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="task_due_soon">Due Soon</SelectItem>
              <SelectItem value="task_overdue">Overdue</SelectItem>
              <SelectItem value="task_completed">Completed</SelectItem>
              <SelectItem value="mention">Mentions</SelectItem>
              <SelectItem value="task_assigned">Assigned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Actions */}
      {notifications.length > 0 && (
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleClearAll} className="gap-2">
            <Trash2 className="h-4 w-4" />
            Clear All
          </Button>
        </div>
      )}

      {/* Notifications List */}
      <Card className="glass-card">
        <ScrollArea className="h-[600px]">
          {filteredNotifications.length === 0 ? (
            <div className="p-12 text-center">
              <div className="flex flex-col items-center gap-4 text-muted-foreground">
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <BellOff className="h-10 w-10" />
                </div>
                <div>
                  <div className="font-medium text-lg text-foreground mb-1">
                    {searchQuery || typeFilter !== 'all' || filter !== 'all' 
                      ? 'No notifications match your filters'
                      : 'No notifications yet'
                    }
                  </div>
                  <div className="text-sm">
                    {searchQuery || typeFilter !== 'all' || filter !== 'all'
                      ? 'Try adjusting your filters'
                      : 'You\'ll see notifications here when events occur'
                    }
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              <AnimatePresence>
                {filteredNotifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type)
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div
                        className={cn(
                          "p-4 rounded-lg border transition-all cursor-pointer group",
                          !notification.read && "bg-primary/5 border-primary/20 hover:bg-primary/10",
                          notification.read && "bg-muted/30 hover:bg-muted/50",
                          notification.priority === 'high' && "border-destructive/30"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex gap-3">
                          <div className={cn(
                            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
                            notification.priority === 'high' ? "bg-destructive/10" : "bg-primary/10"
                          )}>
                            <Icon className={cn(
                              "h-5 w-5",
                              notification.priority === 'high' ? "text-destructive" : "text-primary"
                            )} />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="font-semibold text-sm">{notification.title}</div>
                              <div className="flex items-center gap-1 shrink-0">
                                {!notification.read && (
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                )}
                                {notification.priority === 'high' && (
                                  <Badge variant="destructive" className="text-[10px] h-4">
                                    Urgent
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                              </div>
                              
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleMarkAsRead(notification.id)
                                    }}
                                    className="h-7 px-2 text-xs"
                                  >
                                    <CheckCheck className="h-3 w-3 mr-1" />
                                    Mark read
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(notification.id)
                                  }}
                                  className="h-7 w-7"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  )
}
