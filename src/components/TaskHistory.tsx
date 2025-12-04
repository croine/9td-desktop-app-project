"use client"

import { useState, useEffect } from 'react'
import { Task, ActivityLog } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  History,
  Clock,
  User,
  Edit,
  CheckCircle2,
  XCircle,
  Archive,
  Tag as TagIcon,
  Folder,
  Calendar
} from 'lucide-react'
import { motion } from 'framer-motion'

interface TaskHistoryProps {
  task: Task
  logs?: ActivityLog[]
}

interface ChangeEntry {
  id: string
  timestamp: string
  action: string
  field?: string
  oldValue?: any
  newValue?: any
  description: string
}

export function TaskHistory({ task, logs = [] }: TaskHistoryProps) {
  const [history, setHistory] = useState<ChangeEntry[]>([])

  useEffect(() => {
    // Generate history from task and logs
    const entries: ChangeEntry[] = []

    // Add creation entry
    entries.push({
      id: '0',
      timestamp: task.createdAt,
      action: 'created',
      description: 'Task created'
    })

    // Add entries from activity logs
    logs
      .filter(log => log.taskId === task.id)
      .forEach((log, index) => {
        entries.push({
          id: String(index + 1),
          timestamp: log.timestamp,
          action: log.action,
          description: log.description,
          ...(log.changes && log.changes.length > 0 && {
            field: log.changes[0].field,
            oldValue: log.changes[0].oldValue,
            newValue: log.changes[0].newValue
          })
        })
      })

    // Sort by timestamp (newest first)
    entries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    setHistory(entries)
  }, [task, logs])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created': return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'updated': return <Edit className="h-4 w-4 text-blue-500" />
      case 'deleted': return <XCircle className="h-4 w-4 text-red-500" />
      case 'status_changed': return <CheckCircle2 className="h-4 w-4 text-purple-500" />
      case 'assigned': return <User className="h-4 w-4 text-orange-500" />
      case 'archived': return <Archive className="h-4 w-4 text-gray-500" />
      default: return <History className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-900/30'
      case 'updated': return 'bg-blue-100 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30'
      case 'status_changed': return 'bg-purple-100 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900/30'
      case 'deleted': return 'bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-900/30'
      default: return 'bg-muted border-border'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
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

  if (history.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground space-y-3">
          <History className="h-12 w-12 mx-auto opacity-50" />
          <h3 className="font-semibold">No history available</h3>
          <p className="text-sm">Changes to this task will appear here</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5" />
          <h3 className="font-semibold">Task History</h3>
          <Badge variant="outline">{history.length} changes</Badge>
        </div>

        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-3">
            {history.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`p-4 ${getActionColor(entry.action)}`}>
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {getActionIcon(entry.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm capitalize">
                          {entry.action.replace('_', ' ')}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {entry.description}
                      </p>
                      {entry.field && entry.oldValue !== undefined && entry.newValue !== undefined && (
                        <div className="mt-2 p-2 bg-background/50 rounded text-xs space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Field:</span>
                            <span className="font-medium">{entry.field}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">From:</span>
                            <Badge variant="outline" className="text-xs">
                              {String(entry.oldValue)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">To:</span>
                            <Badge variant="default" className="text-xs">
                              {String(entry.newValue)}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  )
}
