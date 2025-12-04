"use client"

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Task, Tag, Category } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Network, 
  AlertTriangle, 
  Target, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  GitBranch,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info
} from 'lucide-react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  ConnectionLineType,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { toast } from 'sonner'

interface TaskDependencyGraphProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  selectedTaskId?: string
  onTaskClick?: (task: Task) => void
  onAddDependency?: (taskId: string, dependsOnId: string, type: 'blocks' | 'blocked-by' | 'relates-to') => void
}

interface DependencyData {
  blockedBy: Array<{
    id: number
    taskId: number
    dependsOnTaskId: number
    dependencyType: string
    dependencyTask: { id: number; title: string; status: string; priority: string }
  }>
  blocks: Array<{
    id: number
    taskId: number
    dependsOnTaskId: number
    dependencyType: string
    dependencyTask: { id: number; title: string; status: string; priority: string }
  }>
  relatesTo: Array<{
    id: number
    taskId: number
    dependsOnTaskId: number
    dependencyType: string
    dependencyTask: { id: number; title: string; status: string; priority: string }
  }>
}

interface DependencyChain {
  rootTask: any
  upstreamDependencies: any[]
  downstreamDependencies: any[]
  allTasksInChain: any[]
  criticalPath: number[]
  maxDepth: number
}

const nodeColor = {
  todo: '#94a3b8',
  'in-progress': '#3b82f6',
  review: '#f59e0b',
  completed: '#22c55e',
  cancelled: '#ef4444'
}

const priorityBorder = {
  low: '#94a3b8',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444'
}

export function TaskDependencyGraph({
  tasks,
  tags,
  categories,
  selectedTaskId,
  onTaskClick,
  onAddDependency
}: TaskDependencyGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [dependencyData, setDependencyData] = useState<Map<string, DependencyData>>(new Map())
  const [criticalPath, setCriticalPath] = useState<number[]>([])
  const [circularDeps, setCircularDeps] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [viewMode, setViewMode] = useState<'all' | 'selected'>('all')
  const [showCriticalPath, setShowCriticalPath] = useState(true)
  const [layoutType, setLayoutType] = useState<'hierarchical' | 'force'>('hierarchical')

  // Fetch dependencies for a task
  const fetchDependencies = useCallback(async (taskId: string) => {
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) return null

      const response = await fetch(`/api/tasks/${taskId}/dependencies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch dependencies:', error)
      return null
    }
  }, [])

  // Fetch dependency chain for critical path
  const fetchDependencyChain = useCallback(async (taskId: string): Promise<DependencyChain | null> => {
    try {
      const token = localStorage.getItem('bearer_token')
      if (!token) return null

      const response = await fetch(`/api/tasks/${taskId}/dependency-chain`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Failed to fetch dependency chain:', error)
      return null
    }
  }, [])

  // Detect circular dependencies
  const detectCircularDependencies = useCallback((deps: Map<string, DependencyData>): Set<string> => {
    const circular = new Set<string>()
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (taskId: string): boolean => {
      visited.add(taskId)
      recursionStack.add(taskId)

      const taskDeps = deps.get(taskId)
      if (taskDeps) {
        const allBlockers = [...taskDeps.blockedBy, ...taskDeps.blocks]
        for (const dep of allBlockers) {
          const depId = String(dep.dependencyTask.id)
          
          if (!visited.has(depId)) {
            if (dfs(depId)) {
              circular.add(taskId)
              circular.add(depId)
              return true
            }
          } else if (recursionStack.has(depId)) {
            circular.add(taskId)
            circular.add(depId)
            return true
          }
        }
      }

      recursionStack.delete(taskId)
      return false
    }

    for (const taskId of deps.keys()) {
      if (!visited.has(taskId)) {
        dfs(taskId)
      }
    }

    return circular
  }, [])

  // Build graph from tasks
  const buildGraph = useCallback(async () => {
    setLoading(true)
    
    try {
      const depsMap = new Map<string, DependencyData>()
      
      // Fetch dependencies for all tasks with dependencies
      await Promise.all(
        tasks.map(async (task) => {
          if (task.dependencies && task.dependencies.length > 0) {
            const deps = await fetchDependencies(task.id)
            if (deps) {
              depsMap.set(task.id, deps)
            }
          }
        })
      )

      setDependencyData(depsMap)

      // Detect circular dependencies
      const circular = detectCircularDependencies(depsMap)
      setCircularDeps(circular)

      // Fetch critical path if a task is selected
      if (selectedTaskId) {
        const chain = await fetchDependencyChain(selectedTaskId)
        if (chain) {
          setCriticalPath(chain.criticalPath)
        }
      }

      // Build nodes and edges
      const newNodes: Node[] = []
      const newEdges: Edge[] = []
      const taskMap = new Map(tasks.map(t => [t.id, t]))

      if (viewMode === 'selected' && selectedTaskId) {
        // Only show selected task and its direct dependencies
        const selectedTask = taskMap.get(selectedTaskId)
        if (selectedTask) {
          const selectedDeps = depsMap.get(selectedTaskId)
          const relatedTaskIds = new Set<string>([selectedTaskId])

          if (selectedDeps) {
            selectedDeps.blockedBy.forEach(d => relatedTaskIds.add(String(d.dependencyTask.id)))
            selectedDeps.blocks.forEach(d => relatedTaskIds.add(String(d.dependencyTask.id)))
            selectedDeps.relatesTo.forEach(d => relatedTaskIds.add(String(d.dependencyTask.id)))
          }

          // Create nodes for related tasks
          Array.from(relatedTaskIds).forEach((taskId, index) => {
            const task = taskMap.get(taskId)
            if (!task) return

            const isSelected = taskId === selectedTaskId
            const isCircular = circular.has(taskId)
            const isOnCriticalPath = criticalPath.includes(Number(taskId))

            newNodes.push({
              id: taskId,
              type: 'default',
              position: { x: index * 250, y: isSelected ? 200 : (index < Array.from(relatedTaskIds).indexOf(selectedTaskId) ? 0 : 400) },
              data: {
                label: (
                  <div className="p-3 min-w-[180px]">
                    <div className="font-semibold text-sm mb-1 line-clamp-2">{task.title}</div>
                    <div className="flex items-center gap-1 flex-wrap mt-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {task.status.replace('-', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs capitalize">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                )
              },
              style: {
                background: isSelected ? '#dbeafe' : 'white',
                border: `2px solid ${isCircular ? '#ef4444' : isOnCriticalPath && showCriticalPath ? '#f59e0b' : priorityBorder[task.priority]}`,
                borderRadius: '12px',
                padding: 0,
                boxShadow: isSelected ? '0 8px 16px rgba(0,0,0,0.15)' : '0 4px 8px rgba(0,0,0,0.1)',
              },
              sourcePosition: Position.Right,
              targetPosition: Position.Left,
            })
          })

          // Create edges
          if (selectedDeps) {
            selectedDeps.blockedBy.forEach(dep => {
              const depId = String(dep.dependencyTask.id)
              if (relatedTaskIds.has(depId)) {
                newEdges.push({
                  id: `${depId}-${selectedTaskId}-blocks`,
                  source: depId,
                  target: selectedTaskId,
                  type: ConnectionLineType.SmoothStep,
                  animated: true,
                  style: { stroke: '#ef4444', strokeWidth: 2 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
                  label: 'blocks'
                })
              }
            })

            selectedDeps.blocks.forEach(dep => {
              const depId = String(dep.dependencyTask.id)
              if (relatedTaskIds.has(depId)) {
                newEdges.push({
                  id: `${selectedTaskId}-${depId}-blocks`,
                  source: selectedTaskId,
                  target: depId,
                  type: ConnectionLineType.SmoothStep,
                  animated: true,
                  style: { stroke: '#ef4444', strokeWidth: 2 },
                  markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' },
                  label: 'blocks'
                })
              }
            })

            selectedDeps.relatesTo.forEach(dep => {
              const depId = String(dep.dependencyTask.id)
              if (relatedTaskIds.has(depId)) {
                newEdges.push({
                  id: `${selectedTaskId}-${depId}-relates`,
                  source: selectedTaskId,
                  target: depId,
                  type: ConnectionLineType.SmoothStep,
                  style: { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5,5' },
                  markerEnd: { type: MarkerType.Arrow, color: '#94a3b8' },
                  label: 'relates to'
                })
              }
            })
          }
        }
      } else {
        // Show all tasks with dependencies
        const tasksWithDeps = tasks.filter(t => 
          depsMap.has(t.id) || Array.from(depsMap.values()).some(deps => 
            deps.blockedBy.some(d => d.dependencyTask.id === Number(t.id)) ||
            deps.blocks.some(d => d.dependencyTask.id === Number(t.id)) ||
            deps.relatesTo.some(d => d.dependencyTask.id === Number(t.id))
          )
        )

        // Hierarchical layout
        const levels = new Map<string, number>()
        const processedTasks = new Set<string>()

        const calculateLevel = (taskId: string, currentLevel: number = 0): number => {
          if (levels.has(taskId)) {
            return Math.max(levels.get(taskId)!, currentLevel)
          }

          levels.set(taskId, currentLevel)
          processedTasks.add(taskId)

          const deps = depsMap.get(taskId)
          if (deps) {
            deps.blockedBy.forEach(d => {
              const depId = String(d.dependencyTask.id)
              if (!processedTasks.has(depId)) {
                calculateLevel(depId, currentLevel - 1)
              }
            })

            deps.blocks.forEach(d => {
              const depId = String(d.dependencyTask.id)
              if (!processedTasks.has(depId)) {
                calculateLevel(depId, currentLevel + 1)
              }
            })
          }

          return currentLevel
        }

        tasksWithDeps.forEach(task => {
          if (!processedTasks.has(task.id)) {
            calculateLevel(task.id)
          }
        })

        // Group by level
        const levelGroups = new Map<number, string[]>()
        tasksWithDeps.forEach(task => {
          const level = levels.get(task.id) || 0
          if (!levelGroups.has(level)) {
            levelGroups.set(level, [])
          }
          levelGroups.get(level)!.push(task.id)
        })

        // Create nodes
        tasksWithDeps.forEach(task => {
          const level = levels.get(task.id) || 0
          const levelTasks = levelGroups.get(level) || []
          const indexInLevel = levelTasks.indexOf(task.id)
          
          const isCircular = circular.has(task.id)
          const isOnCriticalPath = criticalPath.includes(Number(task.id))
          const isSelected = task.id === selectedTaskId

          newNodes.push({
            id: task.id,
            type: 'default',
            position: {
              x: level * 300 + 100,
              y: indexInLevel * 150 + 50
            },
            data: {
              label: (
                <div className="p-3 min-w-[180px]">
                  <div className="font-semibold text-sm mb-1 line-clamp-2">{task.title}</div>
                  <div className="flex items-center gap-1 flex-wrap mt-2">
                    <Badge variant="outline" className="text-xs capitalize">
                      {task.status.replace('-', ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">
                      {task.priority}
                    </Badge>
                  </div>
                </div>
              )
            },
            style: {
              background: isSelected ? '#dbeafe' : 'white',
              border: `2px solid ${isCircular ? '#ef4444' : isOnCriticalPath && showCriticalPath ? '#f59e0b' : priorityBorder[task.priority]}`,
              borderRadius: '12px',
              padding: 0,
              boxShadow: isSelected ? '0 8px 16px rgba(0,0,0,0.15)' : '0 4px 8px rgba(0,0,0,0.1)',
            },
            sourcePosition: Position.Right,
            targetPosition: Position.Left,
          })
        })

        // Create edges for all dependencies
        depsMap.forEach((deps, taskId) => {
          deps.blockedBy.forEach(dep => {
            const depId = String(dep.dependencyTask.id)
            const isOnCritical = showCriticalPath && 
              criticalPath.includes(Number(depId)) && 
              criticalPath.includes(Number(taskId))

            newEdges.push({
              id: `${depId}-${taskId}-blocks`,
              source: depId,
              target: taskId,
              type: ConnectionLineType.SmoothStep,
              animated: isOnCritical,
              style: { 
                stroke: isOnCritical ? '#f59e0b' : '#ef4444', 
                strokeWidth: isOnCritical ? 3 : 2 
              },
              markerEnd: { 
                type: MarkerType.ArrowClosed, 
                color: isOnCritical ? '#f59e0b' : '#ef4444' 
              },
              label: isOnCritical ? '🔥 critical' : 'blocks'
            })
          })

          deps.blocks.forEach(dep => {
            const depId = String(dep.dependencyTask.id)
            const isOnCritical = showCriticalPath && 
              criticalPath.includes(Number(taskId)) && 
              criticalPath.includes(Number(depId))

            newEdges.push({
              id: `${taskId}-${depId}-blocks`,
              source: taskId,
              target: depId,
              type: ConnectionLineType.SmoothStep,
              animated: isOnCritical,
              style: { 
                stroke: isOnCritical ? '#f59e0b' : '#ef4444', 
                strokeWidth: isOnCritical ? 3 : 2 
              },
              markerEnd: { 
                type: MarkerType.ArrowClosed, 
                color: isOnCritical ? '#f59e0b' : '#ef4444' 
              },
              label: isOnCritical ? '🔥 critical' : 'blocks'
            })
          })

          deps.relatesTo.forEach(dep => {
            const depId = String(dep.dependencyTask.id)
            newEdges.push({
              id: `${taskId}-${depId}-relates`,
              source: taskId,
              target: depId,
              type: ConnectionLineType.SmoothStep,
              style: { stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '5,5' },
              markerEnd: { type: MarkerType.Arrow, color: '#94a3b8' },
              label: 'relates to'
            })
          })
        })
      }

      setNodes(newNodes)
      setEdges(newEdges)
    } catch (error) {
      console.error('Failed to build graph:', error)
      toast.error('Failed to build dependency graph')
    } finally {
      setLoading(false)
    }
  }, [tasks, selectedTaskId, viewMode, criticalPath, showCriticalPath, fetchDependencies, fetchDependencyChain, detectCircularDependencies])

  useEffect(() => {
    buildGraph()
  }, [buildGraph])

  const stats = useMemo(() => {
    let totalDeps = 0
    let blockingCount = 0
    let blockedCount = 0
    let relatesCount = 0

    dependencyData.forEach(deps => {
      blockingCount += deps.blocks.length
      blockedCount += deps.blockedBy.length
      relatesCount += deps.relatesTo.length
    })

    totalDeps = blockingCount + blockedCount + relatesCount

    return {
      totalDeps,
      blockingCount,
      blockedCount,
      relatesCount,
      circularCount: circularDeps.size,
      criticalPathLength: criticalPath.length
    }
  }, [dependencyData, circularDeps, criticalPath])

  if (loading) {
    return (
      <Card className="glass-card p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground">Building dependency graph...</span>
        </div>
      </Card>
    )
  }

  if (nodes.length === 0) {
    return (
      <Card className="glass-card p-12">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Network className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold mb-2">
              No Dependencies Yet
            </h3>
            <p className="text-muted-foreground max-w-md">
              Create task dependencies to visualize relationships and identify critical paths in your workflow.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card className="glass-card p-3">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-primary" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{stats.totalDeps}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Blocking</p>
              <p className="text-lg font-bold">{stats.blockingCount}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Blocked</p>
              <p className="text-lg font-bold">{stats.blockedCount}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-3">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-slate-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Related</p>
              <p className="text-lg font-bold">{stats.relatesCount}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Circular</p>
              <p className="text-lg font-bold text-red-600">{stats.circularCount}</p>
            </div>
          </div>
        </Card>

        <Card className="glass-card p-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-orange-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Critical</p>
              <p className="text-lg font-bold text-orange-600">{stats.criticalPathLength}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Circular Dependency Warning */}
      {circularDeps.size > 0 && (
        <Card className="glass-card border-red-500 bg-red-50 dark:bg-red-950/20 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                Circular Dependencies Detected
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                {circularDeps.size} task{circularDeps.size > 1 ? 's' : ''} involved in circular dependencies. 
                This can prevent tasks from being completed. Review and remove circular links.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Graph */}
      <Card className="glass-card p-0 overflow-hidden" style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => {
            const task = tasks.find(t => t.id === node.id)
            if (task && onTaskClick) {
              onTaskClick(task)
            }
          }}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <Panel position="top-right" className="space-y-2">
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('all')}
              >
                All Tasks
              </Button>
              <Button
                variant={viewMode === 'selected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('selected')}
                disabled={!selectedTaskId}
              >
                Selected Only
              </Button>
            </div>
            <Button
              variant={showCriticalPath ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowCriticalPath(!showCriticalPath)}
              className="w-full"
            >
              <Target className="h-4 w-4 mr-2" />
              Critical Path
            </Button>
          </Panel>
        </ReactFlow>
      </Card>

      {/* Legend */}
      <Card className="glass-card p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Legend
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
            <span>Blocking Dependency</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: '#94a3b8' }}></div>
            <span>Related Tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>Critical Path</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: '#ef4444' }}></div>
            <span>Circular Dependency</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
