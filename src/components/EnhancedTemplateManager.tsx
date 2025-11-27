"use client"

import { useState } from 'react'
import { Plus, Copy, Edit, Trash2, FileText, CheckSquare, Repeat, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { TaskTemplate, Subtask, RecurrencePattern, RecurrenceFrequency, DayOfWeek } from '@/types/task'
import { toast } from 'sonner'

interface EnhancedTemplateManagerProps {
  templates: TaskTemplate[]
  onAddTemplate: (template: TaskTemplate) => void
  onUpdateTemplate: (id: string, updates: Partial<TaskTemplate>) => void
  onDeleteTemplate: (id: string) => void
  onCreateFromTemplate: (template: TaskTemplate) => void
}

export function EnhancedTemplateManager({
  templates,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onCreateFromTemplate,
}: EnhancedTemplateManagerProps) {
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleCreate = () => {
    setEditingTemplate(null)
    setDialogOpen(true)
  }

  const handleEdit = (template: TaskTemplate) => {
    setEditingTemplate(template)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    onDeleteTemplate(id)
    toast.success('Template deleted')
  }

  const handleUse = (template: TaskTemplate) => {
    onCreateFromTemplate(template)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Task Templates
          </h2>
          <p className="text-muted-foreground mt-1">
            Create reusable templates with checklists and recurring patterns
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">
            No templates yet
          </h3>
          <p className="text-muted-foreground mb-4">
            Create your first template to quickly create similar tasks
          </p>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id} className="glass-card p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="font-display font-semibold mb-1 flex items-center gap-2">
                      {template.icon && <span>{template.icon}</span>}
                      {template.name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {template.defaultValues.priority && (
                    <Badge variant="secondary" className="text-xs">
                      {template.defaultValues.priority}
                    </Badge>
                  )}
                  {template.defaultValues.status && (
                    <Badge variant="outline" className="text-xs">
                      {template.defaultValues.status}
                    </Badge>
                  )}
                  {template.defaultValues.subtasks && template.defaultValues.subtasks.length > 0 && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <CheckSquare className="h-3 w-3" />
                      {template.defaultValues.subtasks.length} subtasks
                    </Badge>
                  )}
                  {template.defaultValues.recurring?.enabled && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Repeat className="h-3 w-3" />
                      Recurring
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    size="sm"
                    onClick={() => handleUse(template)}
                    className="flex-1 gap-2"
                  >
                    <Copy className="h-3 w-3" />
                    Use Template
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(template)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(template.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TemplateEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        template={editingTemplate}
        onSave={(template) => {
          if (editingTemplate) {
            onUpdateTemplate(editingTemplate.id, template)
            toast.success('Template updated')
          } else {
            onAddTemplate({
              ...template,
              id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            })
            toast.success('Template created')
          }
          setDialogOpen(false)
        }}
      />
    </div>
  )
}

interface TemplateEditorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: TaskTemplate | null
  onSave: (template: Omit<TaskTemplate, 'id'>) => void
}

function TemplateEditorDialog({ open, onOpenChange, template, onSave }: TemplateEditorDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'review' | 'completed'>('todo')
  const [subtasks, setSubtasks] = useState<string[]>([])
  const [newSubtask, setNewSubtask] = useState('')
  const [enableRecurring, setEnableRecurring] = useState(false)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('daily')
  const [interval, setInterval] = useState(1)
  const [estimatedTime, setEstimatedTime] = useState<number | undefined>(undefined)

  useState(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description)
      setIcon(template.icon || '')
      setCategory(template.category || '')
      setPriority(template.defaultValues.priority || 'medium')
      setStatus(template.defaultValues.status || 'todo')
      setSubtasks(template.defaultValues.subtasks?.map(s => s.title) || [])
      setEnableRecurring(template.defaultValues.recurring?.enabled || false)
      setFrequency(template.defaultValues.recurring?.pattern.frequency || 'daily')
      setInterval(template.defaultValues.recurring?.pattern.interval || 1)
      setEstimatedTime(template.defaultValues.timeTracking?.estimatedTime)
    }
  })

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()])
      setNewSubtask('')
    }
  }

  const handleRemoveSubtask = (index: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== index))
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('Please enter a template name')
      return
    }

    const subtaskObjects: Subtask[] = subtasks.map((title, index) => ({
      id: `subtask_${Date.now()}_${index}`,
      title,
      completed: false,
      createdAt: new Date().toISOString()
    }))

    const recurrencePattern: RecurrencePattern | undefined = enableRecurring ? {
      frequency,
      interval,
    } : undefined

    onSave({
      name,
      description,
      icon: icon || undefined,
      category: category || undefined,
      defaultValues: {
        priority,
        status,
        subtasks: subtaskObjects,
        recurring: enableRecurring ? {
          enabled: true,
          pattern: recurrencePattern!
        } : undefined,
        timeTracking: estimatedTime ? {
          totalTime: 0,
          entries: [],
          pomodoroSessions: [],
          estimatedTime
        } : undefined
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : 'Create Template'}
          </DialogTitle>
          <DialogDescription>
            Create a reusable template with subtasks and recurring patterns
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Weekly Report"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (emoji)</Label>
              <Input
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📊"
                maxLength={2}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this template is for"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Default Status</Label>
              <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Estimated Time (minutes)</Label>
            <Input
              type="number"
              value={estimatedTime || ''}
              onChange={(e) => setEstimatedTime(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="60"
            />
          </div>

          {/* Subtasks Checklist */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Subtasks Checklist
            </Label>
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add a subtask..."
              />
              <Button type="button" onClick={handleAddSubtask}>
                Add
              </Button>
            </div>
            {subtasks.length > 0 && (
              <div className="space-y-2 mt-3">
                {subtasks.map((subtask, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <CheckSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm">{subtask}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSubtask(index)}
                      className="h-7 w-7"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recurring Pattern */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Switch checked={enableRecurring} onCheckedChange={setEnableRecurring} />
              <Label className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Enable Recurring
              </Label>
            </div>
            
            {enableRecurring && (
              <div className="grid grid-cols-2 gap-4 pl-8">
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={(value: any) => setFrequency(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Interval</Label>
                  <Input
                    type="number"
                    min={1}
                    value={interval}
                    onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                    placeholder="1"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
