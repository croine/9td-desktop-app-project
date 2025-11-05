"use client"

import { useState } from 'react'
import { Subtask, Task, TaskPriority } from '@/types/task'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit2, 
  Check, 
  X, 
  ArrowUpCircle,
  IndentIncrease,
  IndentDecrease
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface EnhancedSubtaskManagerProps {
  subtasks: Subtask[]
  onChange: (subtasks: Subtask[]) => void
  onConvertToTask?: (subtask: Subtask) => void
}

interface SortableSubtaskItemProps {
  subtask: Subtask
  onToggle: (id: string) => void
  onEdit: (id: string, title: string) => void
  onDelete: (id: string) => void
  onConvert?: () => void
  level?: number
}

function SortableSubtaskItem({ 
  subtask, 
  onToggle, 
  onEdit, 
  onDelete,
  onConvert,
  level = 0
}: SortableSubtaskItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(subtask.title)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleSave = () => {
    if (editValue.trim()) {
      onEdit(subtask.id, editValue.trim())
      setIsEditing(false)
    }
  }

  const handleCancel = () => {
    setEditValue(subtask.title)
    setIsEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{...style, marginLeft: `${level * 24}px`}}
      className={cn(
        "group flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all",
        subtask.completed 
          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" 
          : "bg-card border-border hover:shadow-md"
      )}
    >
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing touch-none shrink-0"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0"
        onClick={() => onToggle(subtask.id)}
      >
        {subtask.completed ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>

      {isEditing ? (
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-7 text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-600"
            onClick={handleSave}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onClick={handleCancel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <>
          <span className={cn(
            "flex-1 text-sm font-medium",
            subtask.completed && "line-through text-muted-foreground"
          )}>
            {subtask.title}
          </span>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => setIsEditing(true)}
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            
            {onConvert && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                  >
                    <ArrowUpCircle className="h-3.5 w-3.5 text-primary" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onConvert}>
                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                    Convert to Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-destructive hover:text-destructive"
              onClick={() => onDelete(subtask.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export function EnhancedSubtaskManager({ 
  subtasks, 
  onChange, 
  onConvertToTask 
}: EnhancedSubtaskManagerProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = subtasks.findIndex((item) => item.id === active.id)
      const newIndex = subtasks.findIndex((item) => item.id === over.id)

      onChange(arrayMove(subtasks, oldIndex, newIndex))
    }
  }

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return

    const newSubtask: Subtask = {
      id: `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: newSubtaskTitle.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    }

    onChange([...subtasks, newSubtask])
    setNewSubtaskTitle('')
  }

  const toggleSubtask = (subtaskId: string) => {
    onChange(
      subtasks.map((st) =>
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    )
  }

  const editSubtask = (subtaskId: string, newTitle: string) => {
    onChange(
      subtasks.map((st) =>
        st.id === subtaskId ? { ...st, title: newTitle } : st
      )
    )
  }

  const deleteSubtask = (subtaskId: string) => {
    onChange(subtasks.filter((st) => st.id !== subtaskId))
  }

  const convertSubtaskToTask = (subtask: Subtask) => {
    if (onConvertToTask) {
      onConvertToTask(subtask)
      deleteSubtask(subtask.id)
    }
  }

  const completedCount = subtasks.filter((st) => st.completed).length
  const totalCount = subtasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="space-y-3">
      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="p-3 rounded-lg bg-muted/50 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Subtask Progress</span>
            <span className="text-muted-foreground">
              {completedCount} of {totalCount} completed ({Math.round(progress)}%)
            </span>
          </div>
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Add New Subtask */}
      <div className="flex gap-2">
        <Input
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          placeholder="Add a new subtask... (press Enter)"
          className="h-9 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addSubtask()
            }
          }}
        />
        <Button
          type="button"
          onClick={addSubtask}
          disabled={!newSubtaskTitle.trim()}
          className="h-9 px-4 gap-1.5 text-sm shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {/* Subtasks List with Drag & Drop */}
      <div className="space-y-2">
        {subtasks.length > 0 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={subtasks.map((st) => st.id)}
              strategy={verticalListSortingStrategy}
            >
              {subtasks.map((subtask) => (
                <SortableSubtaskItem
                  key={subtask.id}
                  subtask={subtask}
                  onToggle={toggleSubtask}
                  onEdit={editSubtask}
                  onDelete={deleteSubtask}
                  onConvert={
                    onConvertToTask ? () => convertSubtaskToTask(subtask) : undefined
                  }
                />
              ))}
            </SortableContext>
          </DndContext>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">No subtasks yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add subtasks to break down your task
            </p>
          </div>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <GripVertical className="h-3 w-3" />
          <span>Drag to reorder • Click to edit • Convert to full task</span>
        </div>
      )}
    </div>
  )
}
