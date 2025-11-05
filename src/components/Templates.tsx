"use client"

import { useState } from 'react'
import { TaskTemplate, Task } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FileText, Plus, Trash2, Copy, Edit, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

interface TemplatesProps {
  templates: TaskTemplate[]
  onAddTemplate: (template: TaskTemplate) => void
  onUpdateTemplate: (templateId: string, updates: Partial<TaskTemplate>) => void
  onDeleteTemplate: (templateId: string) => void
  onCreateFromTemplate: (template: TaskTemplate) => void
}

export function Templates({
  templates,
  onAddTemplate,
  onUpdateTemplate,
  onDeleteTemplate,
  onCreateFromTemplate
}: TemplatesProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<TaskTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📋',
    category: ''
  })

  const handleCreate = () => {
    if (!formData.name.trim()) {
      toast.error('Template name is required')
      return
    }

    const newTemplate: TaskTemplate = {
      id: `template_${Date.now()}`,
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      category: formData.category,
      defaultValues: {
        priority: 'medium',
        status: 'todo',
        subtasks: []
      }
    }

    onAddTemplate(newTemplate)
    setCreateDialogOpen(false)
    resetForm()
    toast.success('Template created')
  }

  const handleUpdate = () => {
    if (!editingTemplate || !formData.name.trim()) return

    onUpdateTemplate(editingTemplate.id, {
      name: formData.name,
      description: formData.description,
      icon: formData.icon,
      category: formData.category
    })

    setEditingTemplate(null)
    resetForm()
    toast.success('Template updated')
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '📋',
      category: ''
    })
  }

  const openEditDialog = (template: TaskTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description,
      icon: template.icon || '📋',
      category: template.category || ''
    })
  }

  const handleUseTemplate = (template: TaskTemplate) => {
    onCreateFromTemplate(template)
    toast.success(`Created task from "${template.name}" template`)
  }

  const handleDuplicate = (template: TaskTemplate) => {
    const duplicated: TaskTemplate = {
      ...template,
      id: `template_${Date.now()}`,
      name: `${template.name} (Copy)`
    }
    onAddTemplate(duplicated)
    toast.success('Template duplicated')
  }

  const categoryGroups = templates.reduce((acc, template) => {
    const cat = template.category || 'Uncategorized'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(template)
    return acc
  }, {} as Record<string, TaskTemplate[]>)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Task Templates</h1>
          <p className="text-muted-foreground">
            Create reusable templates for recurring task types
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Templates Grid */}
      {Object.keys(categoryGroups).length === 0 ? (
        <Card className="glass-card p-12 text-center">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="font-semibold text-lg mb-2">No Templates Yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Create your first template to speed up task creation
          </p>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Template
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(categoryGroups).map(([category, categoryTemplates]) => (
            <div key={category} className="space-y-3">
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {category}
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryTemplates.map(template => (
                  <Card key={template.id} className="glass-card p-6 hover:shadow-lg transition-all group">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{template.icon}</div>
                          <div>
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                            {template.defaultValues.subtasks && template.defaultValues.subtasks.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {template.defaultValues.subtasks.length} subtasks included
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          onClick={() => handleUseTemplate(template)}
                          size="sm"
                          className="flex-1 gap-2"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Use Template
                        </Button>
                        <Button
                          onClick={() => openEditDialog(template)}
                          size="sm"
                          variant="outline"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => handleDuplicate(template)}
                          size="sm"
                          variant="outline"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          onClick={() => {
                            onDeleteTemplate(template.id)
                            toast.success('Template deleted')
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={createDialogOpen || !!editingTemplate} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false)
          setEditingTemplate(null)
          resetForm()
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Weekly Review"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="📋"
                maxLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Meetings, Development"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of when to use this template"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCreateDialogOpen(false)
                setEditingTemplate(null)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={editingTemplate ? handleUpdate : handleCreate}>
              {editingTemplate ? 'Update' : 'Create'} Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
