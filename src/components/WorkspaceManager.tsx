"use client"

import { useState } from 'react'
import { Workspace, WorkspaceStats } from '@/types/workspace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, FolderOpen, Edit, Trash2, Star, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface WorkspaceManagerProps {
  workspaces: Workspace[]
  currentWorkspaceId: string | null
  stats: { [workspaceId: string]: WorkspaceStats }
  onSelect: (workspaceId: string) => void
  onCreate: (workspace: Omit<Workspace, 'id' | 'createdAt'>) => void
  onUpdate: (workspaceId: string, updates: Partial<Workspace>) => void
  onDelete: (workspaceId: string) => void
  className?: string
}

const WORKSPACE_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // green
  '#06b6d4', // cyan
  '#f43f5e', // rose
  '#6366f1', // indigo
]

const WORKSPACE_ICONS = [
  '📁', '💼', '🎯', '⚡', '🚀', '💡', '🎨', '📊', 
  '🔧', '🏠', '💰', '🎓', '🏆', '🌟', '🔥', '⭐'
]

export function WorkspaceManager({
  workspaces,
  currentWorkspaceId,
  stats,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  className
}: WorkspaceManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: WORKSPACE_COLORS[0],
    icon: WORKSPACE_ICONS[0],
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a workspace name')
      return
    }

    if (editingWorkspace) {
      onUpdate(editingWorkspace.id, formData)
      toast.success('Workspace updated')
    } else {
      onCreate(formData)
      toast.success('Workspace created')
    }

    setIsCreateOpen(false)
    setEditingWorkspace(null)
    setFormData({
      name: '',
      description: '',
      color: WORKSPACE_COLORS[0],
      icon: WORKSPACE_ICONS[0],
    })
  }

  const handleEdit = (workspace: Workspace) => {
    setEditingWorkspace(workspace)
    setFormData({
      name: workspace.name,
      description: workspace.description || '',
      color: workspace.color,
      icon: workspace.icon || WORKSPACE_ICONS[0],
    })
    setIsCreateOpen(true)
  }

  const handleDelete = (workspace: Workspace) => {
    if (workspace.isDefault) {
      toast.error('Cannot delete default workspace')
      return
    }

    if (confirm(`Delete workspace "${workspace.name}"? All tasks will be moved to the default workspace.`)) {
      onDelete(workspace.id)
      toast.success('Workspace deleted')
    }
  }

  const getWorkspaceStats = (workspaceId: string): WorkspaceStats => {
    return stats[workspaceId] || {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasksCount: 0,
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Workspaces</h3>
          <p className="text-sm text-muted-foreground">
            Organize tasks into separate projects
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) {
            setEditingWorkspace(null)
            setFormData({
              name: '',
              description: '',
              color: WORKSPACE_COLORS[0],
              icon: WORKSPACE_ICONS[0],
            })
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingWorkspace ? 'Edit Workspace' : 'Create New Workspace'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Workspace Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Personal Projects"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description for this workspace"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-8 gap-2">
                  {WORKSPACE_ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={cn(
                        "aspect-square rounded-md border-2 hover:border-primary transition-colors flex items-center justify-center text-2xl",
                        formData.icon === icon ? 'border-primary bg-primary/10' : 'border-border'
                      )}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                <div className="grid grid-cols-8 gap-2">
                  {WORKSPACE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={cn(
                        "aspect-square rounded-md border-2 hover:scale-110 transition-transform",
                        formData.color === color ? 'border-foreground' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  {editingWorkspace ? 'Save Changes' : 'Create Workspace'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => {
          const workspaceStats = getWorkspaceStats(workspace.id)
          const isActive = currentWorkspaceId === workspace.id
          
          return (
            <Card
              key={workspace.id}
              className={cn(
                "p-4 cursor-pointer transition-all hover:shadow-md group relative",
                isActive && "ring-2 shadow-lg"
              )}
              style={{
                borderColor: isActive ? workspace.color : undefined,
                ringColor: isActive ? workspace.color : undefined,
              }}
              onClick={() => onSelect(workspace.id)}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      handleEdit(workspace)
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {!workspace.isDefault && (
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(workspace)
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div
                    className="text-3xl flex-shrink-0"
                  >
                    {workspace.icon || '📁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold truncate">{workspace.name}</h4>
                      {workspace.isDefault && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    {workspace.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {workspace.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="gap-1">
                    <span className="font-semibold">{workspaceStats.totalTasks}</span>
                    tasks
                  </Badge>
                  {workspaceStats.completedTasks > 0 && (
                    <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <span className="font-semibold">{workspaceStats.completedTasks}</span>
                      done
                    </Badge>
                  )}
                  {workspaceStats.overdueTasksCount > 0 && (
                    <Badge variant="secondary" className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      <span className="font-semibold">{workspaceStats.overdueTasksCount}</span>
                      overdue
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {workspaces.length === 0 && (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
            <div className="space-y-2">
              <h4 className="font-semibold">No workspaces yet</h4>
              <p className="text-sm text-muted-foreground">
                Create your first workspace to organize your tasks
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
