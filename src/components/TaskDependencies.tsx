"use client"

import { useState } from 'react'
import { Task, TaskDependency } from '@/types/task'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Link2, 
  X, 
  AlertTriangle, 
  GitBranch, 
  CircleDot, 
  Plus,
  Search,
  LockKeyhole,
  UnlockKeyhole,
  Link,
  Workflow,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface TaskDependenciesProps {
  task?: Task
  allTasks: Task[]
  onUpdate: (dependencies: TaskDependency[]) => void
  dependencies?: TaskDependency[]
  mode?: 'create' | 'edit'
  currentTaskId?: string
}

const dependencyTypeConfig = {
  'blocks': {
    icon: LockKeyhole,
    label: 'Blocks',
    description: 'This task blocks another task',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
  },
  'blocked-by': {
    icon: UnlockKeyhole,
    label: 'Blocked By',
    description: 'This task is blocked by another task',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
  },
  'relates-to': {
    icon: Link,
    label: 'Relates To',
    description: 'This task is related to another task',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
  },
}

export function TaskDependencies({ 
  task, 
  allTasks, 
  onUpdate,
  dependencies: propDependencies,
  mode = 'edit',
  currentTaskId
}: TaskDependenciesProps) {
  const [open, setOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [dependencyType, setDependencyType] = useState<'blocks' | 'blocked-by' | 'relates-to'>('blocks')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Use prop dependencies if provided (create mode), otherwise use task dependencies (edit mode)
  const dependencies = propDependencies ?? (task?.dependencies || [])
  const taskId = currentTaskId ?? task?.id
  
  // Filter out current task and already added dependencies
  const availableTasks = allTasks.filter(t => {
    if (taskId && t.id === taskId) return false
    const existingDep = dependencies.find(d => d.taskId === t.id)
    if (existingDep) return false
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return t.title.toLowerCase().includes(query) || 
             (t.description && t.description.toLowerCase().includes(query))
    }
    
    return true
  })
  
  const handleAdd = () => {
    if (!selectedTaskId) {
      toast.error('Please select a task')
      return
    }

    const selectedTask = allTasks.find(t => t.id === selectedTaskId)
    if (!selectedTask) {
      toast.error('Task not found')
      return
    }

    // Check for circular dependencies in edit mode
    if (mode === 'edit' && taskId) {
      const wouldCreateCircular = checkCircularDependency(
        taskId,
        selectedTaskId,
        dependencyType,
        dependencies
      )
      
      if (wouldCreateCircular) {
        toast.error('Cannot add dependency: would create circular dependency')
        return
      }
    }

    const newDependencies = [
      ...dependencies,
      { taskId: selectedTaskId, type: dependencyType }
    ]
    
    onUpdate(newDependencies)
    setSelectedTaskId('')
    setSearchQuery('')
    setOpen(false)
    toast.success(`Dependency added: ${dependencyTypeConfig[dependencyType].label}`)
  }
  
  const handleRemove = (taskId: string) => {
    onUpdate(dependencies.filter(d => d.taskId !== taskId))
    toast.success('Dependency removed')
  }

  const checkCircularDependency = (
    fromTaskId: string,
    toTaskId: string,
    type: string,
    existingDeps: TaskDependency[]
  ): boolean => {
    // Only check for circular dependencies on blocking relationships
    if (type === 'relates-to') return false

    // Build dependency graph
    const graph = new Map<string, string[]>()
    
    // Add existing dependencies
    existingDeps.forEach(dep => {
      if (dep.type !== 'relates-to') {
        if (!graph.has(fromTaskId)) graph.set(fromTaskId, [])
        graph.get(fromTaskId)!.push(dep.taskId)
      }
    })

    // Add new dependency
    if (!graph.has(fromTaskId)) graph.set(fromTaskId, [])
    graph.get(fromTaskId)!.push(toTaskId)

    // Check if adding this creates a cycle
    const visited = new Set<string>()
    const recStack = new Set<string>()

    const hasCycle = (node: string): boolean => {
      if (!visited.has(node)) {
        visited.add(node)
        recStack.add(node)

        const neighbors = graph.get(node) || []
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && hasCycle(neighbor)) {
            return true
          } else if (recStack.has(neighbor)) {
            return true
          }
        }
      }

      recStack.delete(node)
      return false
    }

    return hasCycle(fromTaskId)
  }
  
  const getTaskById = (id: string) => allTasks.find(t => t.id === id)
  
  const getDependencyIcon = (type: TaskDependency['type']) => {
    const config = dependencyTypeConfig[type]
    return config ? config.icon : GitBranch
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

  const groupedDependencies = {
    blocks: dependencies.filter(d => d.type === 'blocks'),
    'blocked-by': dependencies.filter(d => d.type === 'blocked-by'),
    'relates-to': dependencies.filter(d => d.type === 'relates-to'),
  }
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Workflow className="h-4 w-4 text-primary" />
          <Label className="text-sm font-semibold">Task Dependencies</Label>
          {dependencies.length > 0 && (
            <Badge variant="secondary" className="text-xs h-5">
              {dependencies.length}
            </Badge>
          )}
          {isBlocked && (
            <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs h-5">
              Blocked
            </Badge>
          )}
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Add Task Dependency
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Dependency Type</Label>
                <Select value={dependencyType} onValueChange={(v) => setDependencyType(v as any)}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dependencyTypeConfig).map(([key, config]) => {
                      const Icon = config.icon
                      return (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{config.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {config.description}
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold">Search Tasks</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Select Task</Label>
                <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Choose a task..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {availableTasks.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        {searchQuery ? 'No tasks found matching your search' : 'No available tasks'}
                      </div>
                    ) : (
                      availableTasks.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <div className="flex items-center gap-2 py-1">
                            <Badge variant="outline" className="text-xs shrink-0">
                              {t.priority}
                            </Badge>
                            <span className="truncate max-w-[300px]">{t.title}</span>
                            <Badge 
                              variant="outline" 
                              className={cn(
                                'text-xs ml-auto shrink-0',
                                t.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              )}
                            >
                              {t.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleAdd} disabled={!selectedTaskId} className="w-full h-10">
                <Plus className="h-4 w-4 mr-2" />
                Add Dependency
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {dependencies.length === 0 ? (
        <Card className="p-6 text-center border-dashed">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Link2 className="h-8 w-8 opacity-50" />
            <div className="text-sm font-medium">No dependencies yet</div>
            <div className="text-xs">Add dependencies to manage task relationships</div>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {Object.entries(groupedDependencies).map(([type, deps]) => {
            if (deps.length === 0) return null
            
            const config = dependencyTypeConfig[type as keyof typeof dependencyTypeConfig]
            const Icon = config.icon

            return (
              <div key={type} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5", config.color)} />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {config.label}
                  </span>
                  <Badge variant="secondary" className="text-xs h-5">
                    {deps.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <AnimatePresence>
                    {deps.map((dep) => {
                      const depTask = getTaskById(dep.taskId)
                      if (!depTask) return null
                      
                      return (
                        <motion.div
                          key={`${dep.taskId}-${dep.type}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className={cn(
                            "p-3 flex items-center justify-between gap-3 hover:shadow-md transition-all",
                            config.bgColor,
                            "border",
                            config.borderColor
                          )}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <Icon className={cn("h-4 w-4 shrink-0", config.color)} />
                              <div className="flex-1 min-w-0 space-y-1.5">
                                <div className="font-medium text-sm truncate">{depTask.title}</div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      'text-xs h-5',
                                      depTask.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                                      depTask.status === 'in-progress' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    )}
                                  >
                                    {depTask.status}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs h-5">
                                    {depTask.priority}
                                  </Badge>
                                </div>
                                {depTask.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {depTask.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemove(dep.taskId)}
                              className="h-7 w-7 shrink-0"
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </Card>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              </div>
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

      {/* Dependency Help */}
      {dependencies.length === 0 && !open && (
        <Card className="p-3 bg-primary/5 border-primary/20">
          <div className="flex gap-3">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs space-y-1.5 text-muted-foreground">
              <div className="font-semibold text-foreground">About Task Dependencies</div>
              <ul className="space-y-1 list-disc list-inside">
                <li><strong>Blocks:</strong> This task must be completed before another can start</li>
                <li><strong>Blocked By:</strong> This task cannot start until another is completed</li>
                <li><strong>Relates To:</strong> This task is related but not dependent</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}