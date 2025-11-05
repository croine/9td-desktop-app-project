"use client"

import { useState, useMemo } from 'react'
import { ActivityLog as ActivityLogType, Tag, Task } from '@/types/task'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  CheckCircle2, 
  Edit, 
  Trash2, 
  UserPlus, 
  MessageSquare,
  Clock,
  Search,
  Download,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  Calendar,
  BarChart3,
  Sparkles,
  FileText,
  Paperclip,
  Timer,
  Pin,
  PinOff,
  ExternalLink,
  Layers,
  Bookmark,
  BookmarkCheck,
  Link2,
  StickyNote,
  Undo2,
  Save,
  Smile,
  Archive,
  ArchiveRestore,
  Plus,
  TrendingUp
} from 'lucide-react'
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek, isThisMonth, differenceInDays } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  pinLog, 
  unpinLog, 
  deleteLog, 
  bulkDeleteLogs, 
  bulkPinLogs,
  getTasks,
  updateLogDescription,
  addLogComment,
  updateLogComment,
  deleteLogComment,
  addLogReaction,
  removeLogReaction,
  bookmarkLog,
  unbookmarkLog,
  archiveLog,
  unarchiveLog,
  autoArchiveOldLogs,
  linkLogs,
  unlinkLogs,
  updateLogNotes,
  undoTaskChange,
  getLogFilterPresets,
  saveLogFilterPreset,
  deleteLogFilterPreset,
  type LogFilterPreset
} from '@/lib/storage'
import { ActivityLogHeatmap } from '@/components/ActivityLogHeatmap'

interface ActivityLogProps {
  logs: ActivityLogType[]
  tags?: Tag[]
  onRefresh?: () => void
  onTaskClick?: (task: Task) => void
}

const actionIcons = {
  created: CheckCircle2,
  updated: Edit,
  deleted: Trash2,
  status_changed: Clock,
  assigned: UserPlus,
  commented: MessageSquare,
  time_tracked: Timer,
  attachment_added: Paperclip,
}

const actionColors = {
  created: 'text-green-600 bg-green-500/10 border-green-500/20',
  updated: 'text-blue-600 bg-blue-500/10 border-blue-500/20',
  deleted: 'text-red-600 bg-red-500/10 border-red-500/20',
  status_changed: 'text-purple-600 bg-purple-500/10 border-purple-500/20',
  assigned: 'text-orange-600 bg-orange-500/10 border-orange-500/20',
  commented: 'text-cyan-600 bg-cyan-500/10 border-cyan-500/20',
  time_tracked: 'text-indigo-600 bg-indigo-500/10 border-indigo-500/20',
  attachment_added: 'text-pink-600 bg-pink-500/10 border-pink-500/20',
}

const actionLabels = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  status_changed: 'Status Changed',
  assigned: 'Assigned',
  commented: 'Commented',
  time_tracked: 'Time Tracked',
  attachment_added: 'Attachment Added',
}

const REACTION_EMOJIS = ['👍', '❤️', '🎉', '👀', '🚀', '💡', '✅', '🔥']

type DateFilter = 'all' | 'today' | 'yesterday' | 'week' | 'month'
type ViewMode = 'detailed' | 'compact'
type GroupBy = 'date' | 'action' | 'task' | 'none'

export function ActivityLog({ logs, tags = [], onRefresh, onTaskClick }: ActivityLogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedActions, setSelectedActions] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('detailed')
  const [groupBy, setGroupBy] = useState<GroupBy>('date')
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set())
  const [showStats, setShowStats] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [showOnlyPinned, setShowOnlyPinned] = useState(false)
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false)
  const [selectedLogIds, setSelectedLogIds] = useState<Set<string>>(new Set())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [logToDelete, setLogToDelete] = useState<string | null>(null)
  const [editingLogId, setEditingLogId] = useState<string | null>(null)
  const [editedDescription, setEditedDescription] = useState('')
  const [commentingLogId, setCommentingLogId] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editedCommentText, setEditedCommentText] = useState('')
  const [notesDialogOpen, setNotesDialogOpen] = useState(false)
  const [notesLogId, setNotesLogId] = useState<string | null>(null)
  const [customNotes, setCustomNotes] = useState('')
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkingLogId, setLinkingLogId] = useState<string | null>(null)
  const [selectedRelatedLogId, setSelectedRelatedLogId] = useState('')
  const [filterPresets, setFilterPresets] = useState<LogFilterPreset[]>(getLogFilterPresets())
  const [savePresetDialogOpen, setSavePresetDialogOpen] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [insightsDialogOpen, setInsightsDialogOpen] = useState(false)

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = logs.filter(log => {
      // Show archived filter
      if (!showArchived && log.archived) return false
      
      // Show only pinned filter
      if (showOnlyPinned && !log.pinned) return false
      
      // Show only bookmarked filter
      if (showOnlyBookmarked && !log.bookmarked) return false
      
      // Search filter
      if (searchQuery && !log.description.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      // Action type filter
      if (selectedActions.length > 0 && !selectedActions.includes(log.action)) {
        return false
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const logTags = log.tags || []
        if (!selectedTags.some(tagId => logTags.includes(tagId))) {
          return false
        }
      }

      // Date filter
      const logDate = new Date(log.timestamp)
      switch (dateFilter) {
        case 'today':
          if (!isToday(logDate)) return false
          break
        case 'yesterday':
          if (!isYesterday(logDate)) return false
          break
        case 'week':
          if (!isThisWeek(logDate)) return false
          break
        case 'month':
          if (!isThisMonth(logDate)) return false
          break
      }

      return true
    })

    // Sort: pinned first, then bookmarked, then by date
    filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      if (a.bookmarked && !b.bookmarked) return -1
      if (!a.bookmarked && b.bookmarked) return 1
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    return filtered
  }, [logs, searchQuery, selectedActions, selectedTags, dateFilter, showArchived, showOnlyPinned, showOnlyBookmarked])

  // Group logs
  const groupedLogs = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Activities': filteredLogs }
    }

    const groups: { [key: string]: ActivityLogType[] } = {}
    
    filteredLogs.forEach(log => {
      let groupKey = ''
      
      switch (groupBy) {
        case 'date':
          const logDate = new Date(log.timestamp)
          if (isToday(logDate)) {
            groupKey = 'Today'
          } else if (isYesterday(logDate)) {
            groupKey = 'Yesterday'
          } else if (isThisWeek(logDate)) {
            groupKey = 'This Week'
          } else if (isThisMonth(logDate)) {
            groupKey = 'This Month'
          } else {
            groupKey = format(logDate, 'MMMM yyyy')
          }
          break
        
        case 'action':
          groupKey = actionLabels[log.action]
          break
        
        case 'task':
          const tasks = getTasks()
          const task = tasks.find(t => t.id === log.taskId)
          groupKey = task ? task.title : 'Unknown Task'
          break
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(log)
    })
    
    return groups
  }, [filteredLogs, groupBy])

  // Calculate statistics
  const stats = useMemo(() => {
    const actionCounts = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const last7Days = logs.filter(log => {
      const daysDiff = differenceInDays(new Date(), new Date(log.timestamp))
      return daysDiff <= 7
    }).length

    const last30Days = logs.filter(log => {
      const daysDiff = differenceInDays(new Date(), new Date(log.timestamp))
      return daysDiff <= 30
    }).length

    const pinnedCount = logs.filter(log => log.pinned).length
    const bookmarkedCount = logs.filter(log => log.bookmarked).length
    const archivedCount = logs.filter(log => log.archived).length
    
    // Activity trends
    const dailyActivity = new Map<string, number>()
    logs.forEach(log => {
      const dateKey = format(new Date(log.timestamp), 'yyyy-MM-dd')
      dailyActivity.set(dateKey, (dailyActivity.get(dateKey) || 0) + 1)
    })
    
    const avgDailyActivity = Array.from(dailyActivity.values()).reduce((a, b) => a + b, 0) / (dailyActivity.size || 1)
    
    // Most edited task
    const taskEditCounts = new Map<string, number>()
    logs.forEach(log => {
      if (log.action === 'updated' || log.action === 'status_changed') {
        taskEditCounts.set(log.taskId, (taskEditCounts.get(log.taskId) || 0) + 1)
      }
    })
    
    const mostEditedTaskId = Array.from(taskEditCounts.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0]
    
    const tasks = getTasks()
    const mostEditedTask = mostEditedTaskId ? tasks.find(t => t.id === mostEditedTaskId) : null

    return {
      total: logs.length,
      actionCounts,
      last7Days,
      last30Days,
      filtered: filteredLogs.length,
      pinned: pinnedCount,
      bookmarked: bookmarkedCount,
      archived: archivedCount,
      avgDailyActivity: Math.round(avgDailyActivity * 10) / 10,
      mostEditedTask,
      mostEditedCount: mostEditedTaskId ? taskEditCounts.get(mostEditedTaskId) : 0
    }
  }, [logs, filteredLogs])

  const toggleAction = (action: string) => {
    setSelectedActions(prev => 
      prev.includes(action) 
        ? prev.filter(a => a !== action)
        : [...prev, action]
    )
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    )
  }

  const toggleLogExpansion = (logId: string) => {
    setExpandedLogs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  const toggleLogSelection = (logId: string) => {
    setSelectedLogIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(logId)) {
        newSet.delete(logId)
      } else {
        newSet.add(logId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedLogIds.size === filteredLogs.length) {
      setSelectedLogIds(new Set())
    } else {
      setSelectedLogIds(new Set(filteredLogs.map(log => log.id)))
    }
  }

  const handlePinLog = (logId: string) => {
    pinLog(logId)
    toast.success('Activity log pinned')
    onRefresh?.()
  }

  const handleUnpinLog = (logId: string) => {
    unpinLog(logId)
    toast.success('Activity log unpinned')
    onRefresh?.()
  }

  const handleBookmarkLog = (logId: string) => {
    bookmarkLog(logId)
    toast.success('Activity log bookmarked')
    onRefresh?.()
  }

  const handleUnbookmarkLog = (logId: string) => {
    unbookmarkLog(logId)
    toast.success('Bookmark removed')
    onRefresh?.()
  }

  const handleArchiveLog = (logId: string) => {
    archiveLog(logId)
    toast.success('Activity log archived')
    onRefresh?.()
  }

  const handleUnarchiveLog = (logId: string) => {
    unarchiveLog(logId)
    toast.success('Activity log unarchived')
    onRefresh?.()
  }

  const handleDeleteLog = (logId: string) => {
    setLogToDelete(logId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (logToDelete) {
      deleteLog(logToDelete)
      toast.success('Activity log deleted')
      setLogToDelete(null)
      setDeleteDialogOpen(false)
      onRefresh?.()
    }
  }

  const handleBulkPin = () => {
    bulkPinLogs(Array.from(selectedLogIds))
    toast.success(`${selectedLogIds.size} log${selectedLogIds.size > 1 ? 's' : ''} pinned`)
    setSelectedLogIds(new Set())
    onRefresh?.()
  }

  const handleBulkDelete = () => {
    bulkDeleteLogs(Array.from(selectedLogIds))
    toast.success(`${selectedLogIds.size} log${selectedLogIds.size > 1 ? 's' : ''} deleted`)
    setSelectedLogIds(new Set())
    onRefresh?.()
  }

  const startEditingDescription = (log: ActivityLogType) => {
    setEditingLogId(log.id)
    setEditedDescription(log.description)
  }

  const saveDescriptionEdit = (logId: string) => {
    updateLogDescription(logId, editedDescription)
    toast.success('Description updated')
    setEditingLogId(null)
    onRefresh?.()
  }

  const cancelDescriptionEdit = () => {
    setEditingLogId(null)
    setEditedDescription('')
  }

  const startCommenting = (logId: string) => {
    setCommentingLogId(logId)
    setNewComment('')
  }

  const saveComment = (logId: string) => {
    if (newComment.trim()) {
      addLogComment(logId, newComment.trim())
      toast.success('Comment added')
      setCommentingLogId(null)
      setNewComment('')
      onRefresh?.()
    }
  }

  const startEditingComment = (comment: any) => {
    setEditingCommentId(comment.id)
    setEditedCommentText(comment.content)
  }

  const saveCommentEdit = (logId: string, commentId: string) => {
    updateLogComment(logId, commentId, editedCommentText)
    toast.success('Comment updated')
    setEditingCommentId(null)
    onRefresh?.()
  }

  const handleDeleteComment = (logId: string, commentId: string) => {
    deleteLogComment(logId, commentId)
    toast.success('Comment deleted')
    onRefresh?.()
  }

  const handleReaction = (logId: string, emoji: string) => {
    const log = logs.find(l => l.id === logId)
    const hasReacted = log?.reactions?.some(r => r.emoji === emoji && r.userId === 'user')
    
    if (hasReacted) {
      removeLogReaction(logId, emoji)
    } else {
      addLogReaction(logId, emoji)
    }
    onRefresh?.()
  }

  const openNotesDialog = (log: ActivityLogType) => {
    setNotesLogId(log.id)
    setCustomNotes(log.customNotes || '')
    setNotesDialogOpen(true)
  }

  const saveNotes = () => {
    if (notesLogId) {
      updateLogNotes(notesLogId, customNotes)
      toast.success('Notes saved')
      setNotesDialogOpen(false)
      setNotesLogId(null)
      onRefresh?.()
    }
  }

  const openLinkDialog = (logId: string) => {
    setLinkingLogId(logId)
    setSelectedRelatedLogId('')
    setLinkDialogOpen(true)
  }

  const saveLinkage = () => {
    if (linkingLogId && selectedRelatedLogId) {
      linkLogs(linkingLogId, selectedRelatedLogId)
      // Also link back
      linkLogs(selectedRelatedLogId, linkingLogId)
      toast.success('Logs linked successfully')
      setLinkDialogOpen(false)
      setLinkingLogId(null)
      onRefresh?.()
    }
  }

  const handleUnlinkLog = (logId: string, relatedLogId: string) => {
    unlinkLogs(logId, relatedLogId)
    unlinkLogs(relatedLogId, logId)
    toast.success('Logs unlinked')
    onRefresh?.()
  }

  const handleUndo = (taskId: string) => {
    const success = undoTaskChange(taskId)
    if (success) {
      toast.success('Change undone successfully')
      onRefresh?.()
    } else {
      toast.error('No history available to undo')
    }
  }

  const handleAutoArchive = () => {
    const archived = autoArchiveOldLogs(90)
    toast.success(`${archived} old logs auto-archived`)
    onRefresh?.()
  }

  const saveCurrentFiltersAsPreset = () => {
    if (presetName.trim()) {
      const preset: LogFilterPreset = {
        id: `preset_${Date.now()}`,
        name: presetName.trim(),
        filters: {
          searchQuery,
          selectedActions,
          selectedTags,
          dateFilter,
          showPinned: showOnlyPinned,
          showBookmarked: showOnlyBookmarked,
          showArchived,
        },
        createdAt: new Date().toISOString(),
      }
      saveLogFilterPreset(preset)
      setFilterPresets(getLogFilterPresets())
      toast.success(`Preset "${presetName}" saved`)
      setSavePresetDialogOpen(false)
      setPresetName('')
    }
  }

  const applyPreset = (presetId: string) => {
    const preset = filterPresets.find(p => p.id === presetId)
    if (preset) {
      setSearchQuery(preset.filters.searchQuery || '')
      setSelectedActions(preset.filters.selectedActions || [])
      setSelectedTags(preset.filters.selectedTags || [])
      setDateFilter((preset.filters.dateFilter as DateFilter) || 'all')
      setShowOnlyPinned(preset.filters.showPinned || false)
      setShowOnlyBookmarked(preset.filters.showBookmarked || false)
      setShowArchived(preset.filters.showArchived || false)
      toast.success(`Preset "${preset.name}" applied`)
    }
  }

  const deletePreset = (presetId: string) => {
    deleteLogFilterPreset(presetId)
    setFilterPresets(getLogFilterPresets())
    toast.success('Preset deleted')
  }

  const handleExportJSON = () => {
    try {
      const data = {
        logs: filteredLogs,
        exportedAt: new Date().toISOString(),
        filters: {
          searchQuery,
          selectedActions,
          selectedTags,
          dateFilter
        },
        stats
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Activity logs exported successfully')
    } catch (error) {
      toast.error('Failed to export logs')
    }
  }

  const handleExportCSV = () => {
    try {
      const headers = ['Timestamp', 'Action', 'Description', 'User ID', 'Task ID', 'Pinned', 'Bookmarked', 'Tags']
      const rows = filteredLogs.map(log => [
        format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
        actionLabels[log.action],
        log.description,
        log.userId || '',
        log.taskId,
        log.pinned ? 'Yes' : 'No',
        log.bookmarked ? 'Yes' : 'No',
        (log.tags || []).map(tagId => tags.find(t => t.id === tagId)?.name || tagId).join('; ')
      ])
      
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')
      
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Activity logs exported to CSV')
    } catch (error) {
      toast.error('Failed to export CSV')
    }
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedActions([])
    setSelectedTags([])
    setDateFilter('all')
    setShowOnlyPinned(false)
    setShowOnlyBookmarked(false)
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center space-y-3 py-12">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-10 w-10 text-primary" />
        </div>
        <h3 className="font-display font-semibold text-xl">No Activity Yet</h3>
        <p className="text-muted-foreground text-sm max-w-md">
          Activity logs will appear here as you create and manage tasks.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Advanced Toolbar */}
      <Card className="p-4">
        <div className="space-y-4">
          {/* Top Row - Main Actions */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant={showStats ? "default" : "outline"}
                size="sm"
                onClick={() => setShowStats(!showStats)}
                className="gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Statistics
              </Button>
              <Button
                variant={showHeatmap ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHeatmap(!showHeatmap)}
                className="gap-2"
              >
                <Calendar className="h-4 w-4" />
                Heatmap
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setInsightsDialogOpen(true)}
                className="gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Insights
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAutoArchive}
                className="gap-2"
              >
                <Archive className="h-4 w-4" />
                Auto-Archive
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Save className="h-4 w-4" />
                    Presets
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Filter Presets</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSavePresetDialogOpen(true)}
                        className="h-7 gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Save
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {filterPresets.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No saved presets</p>
                      ) : (
                        filterPresets.map(preset => (
                          <div key={preset.id} className="flex items-center justify-between gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="flex-1 justify-start text-xs h-8"
                              onClick={() => applyPreset(preset.id)}
                            >
                              {preset.name}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deletePreset(preset.id)}
                              className="h-7 w-7 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJSON} className="gap-2">
                <Download className="h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>

          {/* Search and View Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activity logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={dateFilter} onValueChange={(value) => setDateFilter(value as DateFilter)}>
                <SelectTrigger className="w-[140px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as GroupBy)}>
                <SelectTrigger className="w-[130px]">
                  <Layers className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">By Date</SelectItem>
                  <SelectItem value="action">By Action</SelectItem>
                  <SelectItem value="task">By Task</SelectItem>
                  <SelectItem value="none">No Grouping</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="detailed">Detailed</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showOnlyPinned}
                onCheckedChange={(checked) => setShowOnlyPinned(checked as boolean)}
              />
              <label className="text-sm">Pinned only</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showOnlyBookmarked}
                onCheckedChange={(checked) => setShowOnlyBookmarked(checked as boolean)}
              />
              <label className="text-sm">Bookmarked only</label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={showArchived}
                onCheckedChange={(checked) => setShowArchived(checked as boolean)}
              />
              <label className="text-sm">Show archived</label>
            </div>
          </div>

          {/* Action Type Filters */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(actionIcons).map(([action, Icon]) => {
              const isSelected = selectedActions.includes(action)
              const colorClass = actionColors[action as keyof typeof actionColors]
              return (
                <Button
                  key={action}
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleAction(action)}
                  className={`gap-2 ${isSelected ? '' : colorClass}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {actionLabels[action as keyof typeof actionLabels]}
                  {isSelected && <X className="h-3 w-3 ml-1" />}
                </Button>
              )
            })}
          </div>

          {/* Tag Filters */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => {
                const isSelected = selectedTags.includes(tag.id)
                return (
                  <Button
                    key={tag.id}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag.id)}
                    className="gap-2"
                    style={!isSelected ? { 
                      borderColor: tag.color + '40',
                      color: tag.color 
                    } : undefined}
                  >
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                    {isSelected && <X className="h-3 w-3 ml-1" />}
                  </Button>
                )
              })}
            </div>
          )}

          {/* Active Filters Summary */}
          {(searchQuery || selectedActions.length > 0 || selectedTags.length > 0 || dateFilter !== 'all' || selectedLogIds.size > 0 || showOnlyPinned || showOnlyBookmarked) && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4">
                {selectedLogIds.size > 0 ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedLogIds.size} selected
                    </span>
                    <Button variant="outline" size="sm" onClick={handleBulkPin} className="gap-2">
                      <Pin className="h-4 w-4" />
                      Pin
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleBulkDelete} className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedLogIds(new Set())}>
                      Clear Selection
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span>{stats.filtered} results</span>
                  </div>
                )}
              </div>
              {selectedLogIds.size === 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Select All */}
          {filteredLogs.length > 0 && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Checkbox 
                checked={selectedLogIds.size === filteredLogs.length}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>
          )}
        </div>
      </Card>

      {/* Statistics Dashboard */}
      <Collapsible open={showStats} onOpenChange={setShowStats}>
        <CollapsibleContent>
          <Card className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Activities</p>
                <p className="text-3xl font-bold font-display">{stats.total}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Last 7 Days</p>
                <p className="text-3xl font-bold font-display text-blue-600">{stats.last7Days}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Last 30 Days</p>
                <p className="text-3xl font-bold font-display text-purple-600">{stats.last30Days}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Pinned</p>
                <p className="text-3xl font-bold font-display text-amber-600">{stats.pinned}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Bookmarked</p>
                <p className="text-3xl font-bold font-display text-green-600">{stats.bookmarked}</p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-display font-semibold mb-4">Action Breakdown</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(stats.actionCounts).map(([action, count]) => {
                  const Icon = actionIcons[action as keyof typeof actionIcons]
                  const colorClass = actionColors[action as keyof typeof actionColors]
                  return (
                    <div key={action} className={`flex items-center gap-2 p-3 rounded-lg border ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs truncate">{actionLabels[action as keyof typeof actionLabels]}</p>
                        <p className="text-lg font-bold">{count}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Activity Heatmap */}
      <Collapsible open={showHeatmap} onOpenChange={setShowHeatmap}>
        <CollapsibleContent>
          <Card className="p-6">
            <ActivityLogHeatmap logs={logs} />
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Activity Timeline */}
      {filteredLogs.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <Sparkles className="h-12 w-12 text-muted-foreground" />
            <h3 className="font-display font-semibold text-lg">No matching activities</h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Try adjusting your filters to see more activity logs.
            </p>
          </div>
        </Card>
      ) : (
        <ScrollArea className="h-[600px]">
          <div className="space-y-6 pr-4">
            {Object.entries(groupedLogs).map(([groupName, groupLogs]) => (
              <div key={groupName} className="space-y-3">
                {groupBy !== 'none' && (
                  <div className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 z-10">
                    <div className="flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <Badge variant="secondary" className="font-display">
                        {groupName} • {groupLogs.length}
                      </Badge>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {groupLogs.map((log, index) => {
                    const Icon = actionIcons[log.action]
                    const colorClass = actionColors[log.action]
                    const isExpanded = expandedLogs.has(log.id)
                    const isSelected = selectedLogIds.has(log.id)
                    const isEditing = editingLogId === log.id
                    const isCommenting = commentingLogId === log.id
                    const hasComments = (log.comments?.length || 0) > 0
                    const hasReactions = (log.reactions?.length || 0) > 0
                    const hasRelatedLogs = (log.relatedLogIds?.length || 0) > 0

                    return (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className={`overflow-hidden transition-all hover:shadow-md ${
                          isSelected ? 'ring-2 ring-primary' : ''
                        } ${log.pinned ? 'border-amber-500/50 bg-amber-500/5' : ''} ${
                          log.bookmarked ? 'border-green-500/50 bg-green-500/5' : ''
                        } ${log.archived ? 'opacity-60' : ''} ${
                          viewMode === 'compact' ? 'p-3' : 'p-4'
                        }`}>
                          <div className="flex gap-3">
                            <div className="flex items-start gap-2">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleLogSelection(log.id)}
                              />
                              <div className={`flex items-center justify-center rounded-lg shrink-0 border ${colorClass} ${
                                viewMode === 'compact' ? 'w-8 h-8' : 'w-10 h-10'
                              }`}>
                                <Icon className={viewMode === 'compact' ? 'h-4 w-4' : 'h-5 w-5'} />
                              </div>
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 space-y-2">
                                  {/* Status Badges */}
                                  <div className="flex flex-wrap gap-1">
                                    {log.pinned && (
                                      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-600/30">
                                        <Pin className="h-3 w-3" />
                                        Pinned
                                      </Badge>
                                    )}
                                    {log.bookmarked && (
                                      <Badge variant="outline" className="gap-1 text-green-600 border-green-600/30">
                                        <BookmarkCheck className="h-3 w-3" />
                                        Bookmarked
                                      </Badge>
                                    )}
                                    {log.archived && (
                                      <Badge variant="outline" className="gap-1 text-gray-600 border-gray-600/30">
                                        <Archive className="h-3 w-3" />
                                        Archived
                                      </Badge>
                                    )}
                                    {log.editedAt && (
                                      <Badge variant="outline" className="gap-1 text-blue-600 border-blue-600/30 text-xs">
                                        <Edit className="h-2.5 w-2.5" />
                                        Edited
                                      </Badge>
                                    )}
                                  </div>

                                  {/* Description */}
                                  {isEditing ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editedDescription}
                                        onChange={(e) => setEditedDescription(e.target.value)}
                                        className="min-h-[60px]"
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={() => saveDescriptionEdit(log.id)}>
                                          <Save className="h-3 w-3 mr-1" />
                                          Save
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={cancelDescriptionEdit}>
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className={`font-medium leading-relaxed ${
                                      viewMode === 'compact' ? 'text-sm' : ''
                                    }`}>
                                      {log.description}
                                    </p>
                                  )}
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex items-center gap-1 shrink-0 flex-wrap">
                                  {onTaskClick && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => {
                                        const tasks = getTasks()
                                        const task = tasks.find(t => t.id === log.taskId)
                                        if (task) onTaskClick(task)
                                      }}
                                      title="View task"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => startEditingDescription(log)}
                                    title="Edit description"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  {log.bookmarked ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleUnbookmarkLog(log.id)}
                                      title="Remove bookmark"
                                    >
                                      <BookmarkCheck className="h-3.5 w-3.5 text-green-600" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleBookmarkLog(log.id)}
                                      title="Bookmark"
                                    >
                                      <Bookmark className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  {log.pinned ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleUnpinLog(log.id)}
                                      title="Unpin"
                                    >
                                      <PinOff className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handlePinLog(log.id)}
                                      title="Pin"
                                    >
                                      <Pin className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => openNotesDialog(log)}
                                    title="Add notes"
                                  >
                                    <StickyNote className={`h-3.5 w-3.5 ${log.customNotes ? 'text-yellow-600' : ''}`} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => openLinkDialog(log.id)}
                                    title="Link to another log"
                                  >
                                    <Link2 className={`h-3.5 w-3.5 ${hasRelatedLogs ? 'text-blue-600' : ''}`} />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleUndo(log.taskId)}
                                    title="Undo this change"
                                  >
                                    <Undo2 className="h-3.5 w-3.5" />
                                  </Button>
                                  {log.archived ? (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleUnarchiveLog(log.id)}
                                      title="Unarchive"
                                    >
                                      <ArchiveRestore className="h-3.5 w-3.5" />
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleArchiveLog(log.id)}
                                      title="Archive"
                                    >
                                      <Archive className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    onClick={() => handleDeleteLog(log.id)}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                  {(log.changes || log.metadata || hasComments || hasReactions || hasRelatedLogs) && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => toggleLogExpansion(log.id)}
                                    >
                                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                  )}
                                </div>
                              </div>
                              
                              {/* Timestamp and User */}
                              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                                <time>
                                  {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                                </time>
                                <span>•</span>
                                <span>{format(new Date(log.timestamp), 'MMM d, h:mm a')}</span>
                                {log.userId && (
                                  <>
                                    <span>•</span>
                                    <span className="font-medium">{log.userId}</span>
                                  </>
                                )}
                              </div>

                              {/* Tags */}
                              {log.tags && log.tags.length > 0 && (
                                <div className="flex gap-1 flex-wrap">
                                  {log.tags.map(tagId => {
                                    const tag = tags.find(t => t.id === tagId)
                                    if (!tag) return null
                                    return (
                                      <Badge 
                                        key={tagId} 
                                        variant="outline" 
                                        className="text-xs"
                                        style={{ 
                                          borderColor: tag.color + '40',
                                          color: tag.color 
                                        }}
                                      >
                                        <span 
                                          className="w-1.5 h-1.5 rounded-full mr-1"
                                          style={{ backgroundColor: tag.color }}
                                        />
                                        {tag.name}
                                      </Badge>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Priority and Status Badges */}
                              {(() => {
                                const tasks = getTasks()
                                const task = tasks.find(t => t.id === log.taskId)
                                if (!task) return null
                                
                                const priorityColors = {
                                  low: 'text-blue-600 border-blue-600/30 bg-blue-500/10',
                                  medium: 'text-yellow-600 border-yellow-600/30 bg-yellow-500/10',
                                  high: 'text-orange-600 border-orange-600/30 bg-orange-500/10',
                                  urgent: 'text-red-600 border-red-600/30 bg-red-500/10'
                                }
                                
                                const statusColors = {
                                  'todo': 'text-gray-600 border-gray-600/30 bg-gray-500/10',
                                  'in-progress': 'text-blue-600 border-blue-600/30 bg-blue-500/10',
                                  'review': 'text-purple-600 border-purple-600/30 bg-purple-500/10',
                                  'completed': 'text-green-600 border-green-600/30 bg-green-500/10',
                                  'cancelled': 'text-red-600 border-red-600/30 bg-red-500/10'
                                }
                                
                                return (
                                  <div className="flex gap-1 flex-wrap">
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${priorityColors[task.priority]}`}
                                    >
                                      Priority: {task.priority}
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${statusColors[task.status]}`}
                                    >
                                      Status: {task.status}
                                    </Badge>
                                  </div>
                                )
                              })()}

                              {/* Reactions */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                                      <Smile className="h-3 w-3" />
                                      React
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-2">
                                    <div className="flex gap-1">
                                      {REACTION_EMOJIS.map(emoji => (
                                        <Button
                                          key={emoji}
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-lg hover:scale-125 transition-transform"
                                          onClick={() => handleReaction(log.id, emoji)}
                                        >
                                          {emoji}
                                        </Button>
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                {hasReactions && (
                                  <div className="flex gap-1 flex-wrap">
                                    {Array.from(new Set(log.reactions?.map(r => r.emoji))).map(emoji => {
                                      const count = log.reactions?.filter(r => r.emoji === emoji).length || 0
                                      const hasUserReacted = log.reactions?.some(r => r.emoji === emoji && r.userId === 'user')
                                      return (
                                        <Button
                                          key={emoji}
                                          variant={hasUserReacted ? "default" : "outline"}
                                          size="sm"
                                          className="h-7 gap-1 text-xs"
                                          onClick={() => handleReaction(log.id, emoji)}
                                        >
                                          {emoji} {count}
                                        </Button>
                                      )
                                    })}
                                  </div>
                                )}

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 gap-1 text-xs"
                                  onClick={() => startCommenting(log.id)}
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  Comment {hasComments && `(${log.comments?.length})`}
                                </Button>
                              </div>

                              {/* Expanded Content */}
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-3"
                                  >
                                    {/* Change Details */}
                                    {log.changes && log.changes.length > 0 && (
                                      <div className="pt-3 border-t space-y-2">
                                        <p className="text-sm font-medium">Changes:</p>
                                        {log.changes.map((change, idx) => (
                                          <div key={idx} className="text-xs bg-muted p-2 rounded">
                                            <span className="font-medium">{change.label}:</span>{' '}
                                            <span className="text-red-600 line-through">{String(change.oldValue)}</span>
                                            {' → '}
                                            <span className="text-green-600">{String(change.newValue)}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Original Description */}
                                    {log.originalDescription && log.editedAt && (
                                      <div className="pt-3 border-t">
                                        <p className="text-sm font-medium mb-1">Original Description:</p>
                                        <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                          {log.originalDescription}
                                        </p>
                                      </div>
                                    )}

                                    {/* Custom Notes */}
                                    {log.customNotes && (
                                      <div className="pt-3 border-t">
                                        <p className="text-sm font-medium mb-1">Notes:</p>
                                        <p className="text-xs bg-yellow-500/10 border border-yellow-500/20 p-2 rounded">
                                          {log.customNotes}
                                        </p>
                                      </div>
                                    )}

                                    {/* Related Logs */}
                                    {hasRelatedLogs && (
                                      <div className="pt-3 border-t">
                                        <p className="text-sm font-medium mb-2">Related Activities:</p>
                                        <div className="space-y-1">
                                          {log.relatedLogIds?.map(relatedId => {
                                            const relatedLog = logs.find(l => l.id === relatedId)
                                            if (!relatedLog) return null
                                            return (
                                              <div key={relatedId} className="flex items-center justify-between gap-2 text-xs bg-muted p-2 rounded">
                                                <span className="flex-1 truncate">{relatedLog.description}</span>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => handleUnlinkLog(log.id, relatedId)}
                                                  className="h-5 w-5 p-0"
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    {/* Metadata */}
                                    {log.metadata && (
                                      <div className="pt-3 border-t">
                                        <p className="text-sm font-medium mb-2">Metadata:</p>
                                        <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                                          {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Comments Section */}
                              <AnimatePresence>
                                {(isCommenting || hasComments) && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="pt-3 border-t space-y-3"
                                  >
                                    {hasComments && (
                                      <div className="space-y-2">
                                        {log.comments?.map(comment => (
                                          <div key={comment.id} className="bg-muted p-3 rounded-lg">
                                            {editingCommentId === comment.id ? (
                                              <div className="space-y-2">
                                                <Textarea
                                                  value={editedCommentText}
                                                  onChange={(e) => setEditedCommentText(e.target.value)}
                                                  className="min-h-[60px]"
                                                />
                                                <div className="flex gap-2">
                                                  <Button size="sm" onClick={() => saveCommentEdit(log.id, comment.id)}>
                                                    Save
                                                  </Button>
                                                  <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>
                                                    Cancel
                                                  </Button>
                                                </div>
                                              </div>
                                            ) : (
                                              <>
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                  <div className="flex items-center gap-2">
                                                    <span className="font-medium text-sm">{comment.author}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                    </span>
                                                    {comment.updatedAt && (
                                                      <Badge variant="outline" className="text-xs">Edited</Badge>
                                                    )}
                                                  </div>
                                                  <div className="flex gap-1">
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => startEditingComment(comment)}
                                                      className="h-6 w-6 p-0"
                                                    >
                                                      <Edit className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => handleDeleteComment(log.id, comment.id)}
                                                      className="h-6 w-6 p-0 text-destructive"
                                                    >
                                                      <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                  </div>
                                                </div>
                                                <p className="text-sm">{comment.content}</p>
                                              </>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {isCommenting && (
                                      <div className="space-y-2">
                                        <Textarea
                                          placeholder="Add a comment..."
                                          value={newComment}
                                          onChange={(e) => setNewComment(e.target.value)}
                                          className="min-h-[80px]"
                                        />
                                        <div className="flex gap-2">
                                          <Button size="sm" onClick={() => saveComment(log.id)}>
                                            <MessageSquare className="h-3 w-3 mr-1" />
                                            Post Comment
                                          </Button>
                                          <Button size="sm" variant="outline" onClick={() => setCommentingLogId(null)}>
                                            Cancel
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Dialogs */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity Log?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this activity log entry.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Custom Notes</DialogTitle>
            <DialogDescription>
              Add personal notes or annotations to this activity log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter your notes here..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNotes}>
              <Save className="h-4 w-4 mr-2" />
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Related Activities</DialogTitle>
            <DialogDescription>
              Connect this activity log to another related activity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Related Activity</Label>
              <Select value={selectedRelatedLogId} onValueChange={setSelectedRelatedLogId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an activity..." />
                </SelectTrigger>
                <SelectContent>
                  {logs
                    .filter(l => l.id !== linkingLogId && !l.relatedLogIds?.includes(linkingLogId || ''))
                    .slice(0, 50)
                    .map(log => (
                      <SelectItem key={log.id} value={log.id}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(log.timestamp), 'MMM d')}
                          </span>
                          <span className="truncate">{log.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveLinkage} disabled={!selectedRelatedLogId}>
              <Link2 className="h-4 w-4 mr-2" />
              Link Activities
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={savePresetDialogOpen} onOpenChange={setSavePresetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
            <DialogDescription>
              Save your current filter settings for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Preset Name</Label>
              <Input
                placeholder="e.g., High Priority Changes This Week"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSavePresetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveCurrentFiltersAsPreset} disabled={!presetName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save Preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={insightsDialogOpen} onOpenChange={setInsightsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity Insights</DialogTitle>
            <DialogDescription>
              Detailed analytics and patterns in your activity logs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2 text-sm">Average Daily Activity</h4>
                <p className="text-3xl font-bold font-display text-primary">{stats.avgDailyActivity}</p>
                <p className="text-xs text-muted-foreground mt-1">activities per day</p>
              </Card>
              <Card className="p-4">
                <h4 className="font-medium mb-2 text-sm">Total Archived</h4>
                <p className="text-3xl font-bold font-display text-gray-600">{stats.archived}</p>
                <p className="text-xs text-muted-foreground mt-1">archived logs</p>
              </Card>
            </div>

            {stats.mostEditedTask && (
              <Card className="p-4">
                <h4 className="font-medium mb-2">Most Edited Task</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{stats.mostEditedTask.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Edited {stats.mostEditedCount} times
                    </p>
                  </div>
                  <Badge variant="secondary">{stats.mostEditedTask.status}</Badge>
                </div>
              </Card>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Activity Distribution</h4>
              <div className="space-y-2">
                {Object.entries(stats.actionCounts)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([action, count]) => {
                    const percentage = ((count as number) / stats.total * 100).toFixed(1)
                    return (
                      <div key={action} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span>{actionLabels[action as keyof typeof actionLabels]}</span>
                          <span className="text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}