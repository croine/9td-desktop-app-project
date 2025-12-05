"use client"

import { useState } from 'react'
import { CustomField, CustomFieldType, CustomFieldValue } from '@/types/workspace'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Edit, Trash2, Type, Hash, Calendar, List, CheckSquare, Link, Mail, MoreVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CustomFieldsManagerProps {
  fields: CustomField[]
  onCreate: (field: Omit<CustomField, 'id' | 'createdAt'>) => void
  onUpdate: (fieldId: string, updates: Partial<CustomField>) => void
  onDelete: (fieldId: string) => void
  className?: string
}

const FIELD_TYPE_ICONS = {
  text: Type,
  number: Hash,
  date: Calendar,
  dropdown: List,
  checkbox: CheckSquare,
  url: Link,
  email: Mail,
}

const FIELD_TYPE_LABELS = {
  text: 'Text',
  number: 'Number',
  date: 'Date',
  dropdown: 'Dropdown',
  checkbox: 'Checkbox',
  url: 'URL',
  email: 'Email',
}

export function CustomFieldsManager({
  fields,
  onCreate,
  onUpdate,
  onDelete,
  className
}: CustomFieldsManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingField, setEditingField] = useState<CustomField | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    type: CustomFieldType
    description: string
    required: boolean
    options: string
    defaultValue: string
  }>({
    name: '',
    type: 'text',
    description: '',
    required: false,
    options: '',
    defaultValue: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a field name')
      return
    }

    const fieldData = {
      name: formData.name,
      type: formData.type,
      description: formData.description || undefined,
      required: formData.required,
      options: formData.type === 'dropdown' && formData.options 
        ? formData.options.split('\n').map(o => o.trim()).filter(Boolean)
        : undefined,
      defaultValue: formData.defaultValue || undefined,
    }

    if (editingField) {
      onUpdate(editingField.id, fieldData)
      toast.success('Custom field updated')
    } else {
      onCreate(fieldData)
      toast.success('Custom field created')
    }

    handleClose()
  }

  const handleClose = () => {
    setIsCreateOpen(false)
    setEditingField(null)
    setFormData({
      name: '',
      type: 'text',
      description: '',
      required: false,
      options: '',
      defaultValue: '',
    })
  }

  const handleEdit = (field: CustomField) => {
    setEditingField(field)
    setFormData({
      name: field.name,
      type: field.type,
      description: field.description || '',
      required: field.required || false,
      options: field.options ? field.options.join('\n') : '',
      defaultValue: field.defaultValue || '',
    })
    setIsCreateOpen(true)
  }

  const handleDelete = (field: CustomField) => {
    if (confirm(`Delete custom field "${field.name}"? This will remove the field from all tasks.`)) {
      onDelete(field.id)
      toast.success('Custom field deleted')
    }
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Custom Fields</h3>
          <p className="text-sm text-muted-foreground">
            Add custom metadata to your tasks
          </p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          if (!open) handleClose()
          setIsCreateOpen(open)
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Field
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Edit Custom Field' : 'Create Custom Field'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Field Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Customer Name, Project Budget"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Field Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value as CustomFieldType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => {
                      const Icon = FIELD_TYPE_ICONS[value as CustomFieldType]
                      return (
                        <SelectItem key={value} value={value}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description or help text"
                  rows={2}
                />
              </div>

              {formData.type === 'dropdown' && (
                <div className="space-y-2">
                  <Label htmlFor="options">Dropdown Options *</Label>
                  <Textarea
                    id="options"
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    placeholder="Enter each option on a new line&#10;Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter each option on a new line
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="defaultValue">Default Value</Label>
                {formData.type === 'checkbox' ? (
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="defaultValue"
                      checked={formData.defaultValue === 'true'}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, defaultValue: checked ? 'true' : 'false' })
                      }
                    />
                    <label htmlFor="defaultValue" className="text-sm">
                      Checked by default
                    </label>
                  </div>
                ) : formData.type === 'dropdown' ? (
                  <Select
                    value={formData.defaultValue}
                    onValueChange={(value) => setFormData({ ...formData, defaultValue: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select default option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No default</SelectItem>
                      {formData.options.split('\n').map(o => o.trim()).filter(Boolean).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="defaultValue"
                    type={formData.type === 'number' ? 'number' : formData.type === 'date' ? 'date' : 'text'}
                    value={formData.defaultValue}
                    onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                    placeholder="Optional default value"
                  />
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) => 
                    setFormData({ ...formData, required: checked as boolean })
                  }
                />
                <label htmlFor="required" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Required field
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-1">
                  {editingField ? 'Save Changes' : 'Create Field'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {fields.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {fields.map((field) => {
            const Icon = FIELD_TYPE_ICONS[field.type]
            
            return (
              <Card key={field.id} className="p-4 group relative hover:shadow-md transition-all">
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(field)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(field)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-3 pr-8">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm truncate">{field.name}</h4>
                        {field.required && (
                          <span className="text-red-500 text-xs">*</span>
                        )}
                      </div>
                      {field.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {field.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {FIELD_TYPE_LABELS[field.type]}
                    </Badge>
                    {field.defaultValue && (
                      <Badge variant="outline" className="text-xs">
                        Default: {String(field.defaultValue).substring(0, 20)}
                      </Badge>
                    )}
                  </div>

                  {field.type === 'dropdown' && field.options && (
                    <div className="text-xs text-muted-foreground">
                      {field.options.length} options
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <Type className="h-12 w-12 text-muted-foreground/50" />
            <div className="space-y-2">
              <h4 className="font-semibold">No custom fields yet</h4>
              <p className="text-sm text-muted-foreground">
                Create custom fields to add extra metadata to your tasks
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
