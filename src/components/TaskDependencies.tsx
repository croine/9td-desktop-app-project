"use client"

import { useState } from 'react'
import { Task, TaskDependency } from '@/types/task'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Link2, X, AlertTriangle, GitBranch, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskDependenciesProps {
  task: Task
  allTasks: Task[]
  onUpdate: (dependencies: TaskDependency[]) => void
}

export function TaskDependencies({ task, allTasks, onUpdate }: TaskDependenciesProps) {
  const [open, setOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [dependencyType, setDependencyType] = useState<'blocks' | 'blocked-by' | 'relates-to'>('blocks')
  
  const dependencies = task.dependencies || []
  const availableTasks = allTasks.filter(t => t.id !== task.id && !dependencies.find(d => d.taskId === t.id))
  
  const handleAdd = () => {
    if (selectedTaskId) {
      const newDependencies = [
        ...dependencies,
        { taskId: selectedTaskId, type: dependencyType }
      ]
      onUpdate(newDependencies)
      setSelectedTaskId('')
      setOpen(false)
    }
  }
  
  const handleRemove = (taskId: string) => {
    onUpdate(dependencies.filter(d => d.taskId !== taskId))
  }
  
  const getTaskById = (id: string) => allTasks.find(t => t.id === id)
  
  const getDependencyIcon = (type: TaskDependency['type']) => {
    switch (type) {
      case 'blocks':
        return <AlertTriangle className="h-3 w-3" />
      case 'blocked-by':
        return <CircleDot className="h-3 w-3" />
      case 'relates-to':
        return <GitBranch className="h-3 w-3" />
    }
  }
  
  const getDependencyColor = (type: TaskDependency['type']) => {
    switch (type) {
      case 'blocks':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'blocked-by':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'relates-to':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    }
  }
  
  const getBlockingTasks = () => {
    return dependencies.filter(d => d.type === 'blocked-by').map(d => getTaskById(d.taskId)).filter(Boolean) as Task[]
  }
  
  const isBlocked = getBlockingTasks().some(t => t.status !== 'completed')
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Dependencies</span>
          {isBlocked && (
            <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              Blocked
            </Badge>
          )}
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              Add Dependency
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Task Dependency</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Relationship Type</label>
                <Select value={dependencyType} onValueChange={(v) => setDependencyType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blocks">This task blocks...</SelectItem>
                    <SelectItem value="blocked-by">This task is blocked by...</SelectItem>
                    <SelectItem value="relates-to">This task relates to...</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Select Task</label>
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTasks.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{t.title}</span>
                          <Badge variant="outline" className="ml-auto">
                            {t.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleAdd} disabled={!selectedTaskId} className="w-full">
                Add Dependency
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {dependencies.length === 0 ? (
        <Card className="p-4 text-center text-sm text-muted-foreground">
          No dependencies yet
        </Card>
      ) : (
        <div className="space-y-2">
          {dependencies.map((dep) => {
            const depTask = getTaskById(dep.taskId)
            if (!depTask) return null
            
            return (
              <Card key={`${dep.taskId}-${dep.type}`} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant="outline" className={getDependencyColor(dep.type)}>
                      {getDependencyIcon(dep.type)}
                      <span className="ml-1 text-xs">{dep.type}</span>
                    </Badge>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{depTask.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className={cn(
                            'text-xs',
                            depTask.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                            depTask.status === 'in-progress' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          )}
                        >
                          {depTask.status}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {depTask.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleRemove(dep.taskId)}
                    className="h-8 w-8 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      
      {isBlocked && (
        <Card className="p-3 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-orange-900 dark:text-orange-300">Task is blocked</div>
              <div className="text-orange-700 dark:text-orange-400 mt-1">
                Complete the following tasks first:
                {getBlockingTasks()
                  .filter(t => t.status !== 'completed')
                  .map(t => (
                    <div key={t.id} className="ml-2 mt-1">• {t.title}</div>
                  ))
                }
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
