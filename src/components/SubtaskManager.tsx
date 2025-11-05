"use client"

import { useState, useRef } from 'react'
import { Subtask } from '@/types/task'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, GripVertical, Trash2, ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SubtaskManagerProps {
  subtasks: Subtask[]
  onChange: (subtasks: Subtask[]) => void
  maxDepth?: number
  currentDepth?: number
}

export function SubtaskManager({ 
  subtasks, 
  onChange, 
  maxDepth = 2, 
  currentDepth = 0 
}: SubtaskManagerProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const handleAdd = (parentId?: string) => {
    if (!newSubtaskTitle.trim()) return
    
    const newSubtask: Subtask = {
      id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    }
    
    if (parentId) {
      const updated = addNestedSubtask(subtasks, parentId, newSubtask)
      onChange(updated)
    } else {
      onChange([...subtasks, newSubtask])
    }
    
    setNewSubtaskTitle('')
    inputRef.current?.focus()
  }
  
  const addNestedSubtask = (items: Subtask[], parentId: string, newSubtask: Subtask): Subtask[] => {
    return items.map(item => {
      if (item.id === parentId) {
        return {
          ...item,
          subtasks: [...(item.subtasks || []), newSubtask]
        }
      }
      if (item.subtasks) {
        return {
          ...item,
          subtasks: addNestedSubtask(item.subtasks, parentId, newSubtask)
        }
      }
      return item
    })
  }
  
  const handleToggle = (id: string) => {
    const updated = toggleSubtask(subtasks, id)
    onChange(updated)
  }
  
  const toggleSubtask = (items: Subtask[], id: string): Subtask[] => {
    return items.map(item => {
      if (item.id === id) {
        const completed = !item.completed
        return {
          ...item,
          completed,
          // Also toggle all nested subtasks
          subtasks: item.subtasks ? toggleAllNested(item.subtasks, completed) : undefined
        }
      }
      if (item.subtasks) {
        return {
          ...item,
          subtasks: toggleSubtask(item.subtasks, id)
        }
      }
      return item
    })
  }
  
  const toggleAllNested = (items: Subtask[], completed: boolean): Subtask[] => {
    return items.map(item => ({
      ...item,
      completed,
      subtasks: item.subtasks ? toggleAllNested(item.subtasks, completed) : undefined
    }))
  }
  
  const handleDelete = (id: string) => {
    const updated = deleteSubtask(subtasks, id)
    onChange(updated)
  }
  
  const deleteSubtask = (items: Subtask[], id: string): Subtask[] => {
    return items
      .filter(item => item.id !== id)
      .map(item => ({
        ...item,
        subtasks: item.subtasks ? deleteSubtask(item.subtasks, id) : undefined
      }))
  }
  
  const handleStartEdit = (subtask: Subtask) => {
    setEditingId(subtask.id)
    setEditingTitle(subtask.title)
  }
  
  const handleSaveEdit = () => {
    if (editingId && editingTitle.trim()) {
      const updated = updateSubtaskTitle(subtasks, editingId, editingTitle.trim())
      onChange(updated)
    }
    setEditingId(null)
    setEditingTitle('')
  }
  
  const updateSubtaskTitle = (items: Subtask[], id: string, title: string): Subtask[] => {
    return items.map(item => {
      if (item.id === id) {
        return { ...item, title }
      }
      if (item.subtasks) {
        return {
          ...item,
          subtasks: updateSubtaskTitle(item.subtasks, id, title)
        }
      }
      return item
    })
  }
  
  const handleConvertToTask = (subtask: Subtask) => {
    // This would need to be passed from parent component
    console.log('Convert to task:', subtask)
  }
  
  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }
  
  const calculateProgress = (items: Subtask[]): { completed: number; total: number } => {
    let completed = 0
    let total = 0
    
    items.forEach(item => {
      total++
      if (item.completed) completed++
      
      if (item.subtasks && item.subtasks.length > 0) {
        const nested = calculateProgress(item.subtasks)
        completed += nested.completed
        total += nested.total
      }
    })
    
    return { completed, total }
  }
  
  const progress = calculateProgress(subtasks)
  const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0
  
  const renderSubtask = (subtask: Subtask, depth: number = 0) => {
    const isExpanded = expandedIds.has(subtask.id)
    const hasChildren = subtask.subtasks && subtask.subtasks.length > 0
    const canAddChildren = depth < maxDepth
    
    return (
      <div key={subtask.id} className="space-y-1">
        <div
          className={cn(
            'flex items-center gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors group',
            depth > 0 && 'ml-6'
          )}
        >
          {hasChildren && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => toggleExpanded(subtask.id)}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {!hasChildren && depth > 0 && <div className="w-6" />}
          
          <div className="cursor-move opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <Checkbox
            checked={subtask.completed}
            onCheckedChange={() => handleToggle(subtask.id)}
            className="shrink-0"
          />
          
          {editingId === subtask.id ? (
            <Input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit()
                if (e.key === 'Escape') {
                  setEditingId(null)
                  setEditingTitle('')
                }
              }}
              className="h-7 flex-1"
              autoFocus
            />
          ) : (
            <span
              className={cn(
                'flex-1 text-sm',
                subtask.completed && 'line-through text-muted-foreground'
              )}
              onDoubleClick={() => handleStartEdit(subtask)}
            >
              {subtask.title}
            </span>
          )}
          
          {hasChildren && (
            <Badge variant="outline" className="text-xs">
              {calculateProgress(subtask.subtasks!).completed}/{calculateProgress(subtask.subtasks!).total}
            </Badge>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStartEdit(subtask)}>
                Edit
              </DropdownMenuItem>
              {canAddChildren && (
                <DropdownMenuItem onClick={() => {
                  setExpandedIds(new Set([...expandedIds, subtask.id]))
                  setTimeout(() => handleAdd(subtask.id), 0)
                }}>
                  Add Nested Subtask
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleDelete(subtask.id)} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {subtask.subtasks!.map(child => renderSubtask(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Subtasks</span>
          {progress.total > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {progress.completed}/{progress.total} ({Math.round(progressPercent)}%)
              </span>
            </div>
          )}
        </div>
      </div>
      
      {subtasks.length > 0 && (
        <Card className="p-3">
          <div className="space-y-1">
            {subtasks.map(subtask => renderSubtask(subtask, 0))}
          </div>
        </Card>
      )}
      
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd()
          }}
          placeholder="Add a subtask..."
          className="flex-1"
        />
        <Button onClick={() => handleAdd()} disabled={!newSubtaskTitle.trim()}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>
      
      <div className="text-xs text-muted-foreground">
        • Double-click to edit • Drag to reorder • {maxDepth > 1 ? 'Right-click for nested subtasks' : ''}
      </div>
    </div>
  )
}
