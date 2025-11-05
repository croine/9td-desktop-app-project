"use client"

import { Task, Tag, Category } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Clock, Trash2, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface EisenhowerMatrixProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  onTaskClick?: (task: Task) => void
  onTaskMove?: (taskId: string, importance: Task['importance'], urgency: Task['urgency']) => void
}

export function EisenhowerMatrix({
  tasks,
  tags,
  categories,
  onTaskClick,
  onTaskMove
}: EisenhowerMatrixProps) {
  // Classify tasks into quadrants
  const getQuadrant = (task: Task) => {
    const importance = task.importance || 'not-important'
    const urgency = task.urgency || 'not-urgent'
    
    if (importance === 'important' && urgency === 'urgent') return 'q1'
    if (importance === 'important' && urgency === 'not-urgent') return 'q2'
    if (importance === 'not-important' && urgency === 'urgent') return 'q3'
    return 'q4'
  }

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
  
  const quadrants = {
    q1: activeTasks.filter(t => getQuadrant(t) === 'q1'),
    q2: activeTasks.filter(t => getQuadrant(t) === 'q2'),
    q3: activeTasks.filter(t => getQuadrant(t) === 'q3'),
    q4: activeTasks.filter(t => getQuadrant(t) === 'q4')
  }

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', task.id)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, importance: Task['importance'], urgency: Task['urgency']) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId && onTaskMove) {
      onTaskMove(taskId, importance, urgency)
    }
  }

  const TaskCard = ({ task }: { task: Task }) => {
    const taskTags = tags.filter(tag => (task.tags || []).includes(tag.id))
    
    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onClick={() => onTaskClick?.(task)}
        className={cn(
          "p-3 rounded-lg border-2 bg-card cursor-move hover:shadow-md transition-all group",
          "hover:border-primary"
        )}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm leading-tight flex-1 line-clamp-2">
              {task.title}
            </h4>
            <Badge variant="outline" className="text-xs shrink-0">
              {task.priority}
            </Badge>
          </div>
          
          {task.dueDate && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{format(new Date(task.dueDate), 'MMM d')}</span>
            </div>
          )}
          
          {taskTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {taskTags.slice(0, 2).map(tag => (
                <span
                  key={tag.id}
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color
                  }}
                >
                  #{tag.name}
                </span>
              ))}
              {taskTags.length > 2 && (
                <span className="text-xs text-muted-foreground">+{taskTags.length - 2}</span>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  const QuadrantCard = ({
    title,
    subtitle,
    icon: Icon,
    color,
    tasks: quadrantTasks,
    importance,
    urgency
  }: {
    title: string
    subtitle: string
    icon: any
    color: string
    tasks: Task[]
    importance: Task['importance']
    urgency: Task['urgency']
  }) => (
    <Card
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, importance, urgency)}
      className={cn(
        "glass-card p-4 min-h-[400px] transition-all",
        "hover:shadow-lg"
      )}
    >
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-lg", color)}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <h3 className="font-display font-bold text-lg">{title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
          <Badge variant="secondary">{quadrantTasks.length}</Badge>
        </div>

        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {quadrantTasks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No tasks in this quadrant</p>
              <p className="text-xs mt-1">Drag tasks here to categorize</p>
            </div>
          ) : (
            quadrantTasks.map(task => <TaskCard key={task.id} task={task} />)
          )}
        </div>
      </div>
    </Card>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Eisenhower Matrix</h1>
        <p className="text-muted-foreground">
          Prioritize tasks by importance and urgency
        </p>
      </div>

      {/* Info Card */}
      <Card className="glass-card p-4 bg-blue-500/5 border-blue-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">How to Use the Matrix</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>Q1 (Do First):</strong> Urgent and important - handle immediately</li>
              <li><strong>Q2 (Schedule):</strong> Important but not urgent - plan and schedule</li>
              <li><strong>Q3 (Delegate):</strong> Urgent but not important - delegate if possible</li>
              <li><strong>Q4 (Eliminate):</strong> Neither urgent nor important - consider removing</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Matrix Grid */}
      <div className="space-y-2">
        <div className="text-center font-semibold text-sm text-muted-foreground mb-4">
          ← Less Urgent | More Urgent →
        </div>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Quadrant 1: Important & Urgent */}
          <QuadrantCard
            title="Do First"
            subtitle="Important & Urgent"
            icon={AlertCircle}
            color="bg-red-500"
            tasks={quadrants.q1}
            importance="important"
            urgency="urgent"
          />

          {/* Quadrant 2: Important & Not Urgent */}
          <QuadrantCard
            title="Schedule"
            subtitle="Important & Not Urgent"
            icon={Clock}
            color="bg-green-500"
            tasks={quadrants.q2}
            importance="important"
            urgency="not-urgent"
          />

          {/* Quadrant 3: Not Important & Urgent */}
          <QuadrantCard
            title="Delegate"
            subtitle="Not Important & Urgent"
            icon={CheckCircle2}
            color="bg-yellow-500"
            tasks={quadrants.q3}
            importance="not-important"
            urgency="urgent"
          />

          {/* Quadrant 4: Not Important & Not Urgent */}
          <QuadrantCard
            title="Eliminate"
            subtitle="Not Important & Not Urgent"
            icon={Trash2}
            color="bg-gray-500"
            tasks={quadrants.q4}
            importance="not-important"
            urgency="not-urgent"
          />
        </div>

        <div className="text-center font-semibold text-sm text-muted-foreground mt-4 rotate-90 origin-center absolute right-0 top-1/2">
          ← Less Important | More Important →
        </div>
      </div>
    </div>
  )
}