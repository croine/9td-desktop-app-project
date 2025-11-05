"use client"

import { useState, useEffect } from 'react'
import { Task, Tag, Category } from '@/types/task'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { 
  Plus, 
  FolderKanban, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

interface Project {
  id: string
  name: string
  description: string
  color: string
  taskIds: string[]
  createdAt: string
}

interface ProjectsProps {
  tasks: Task[]
  tags: Tag[]
  categories: Category[]
  onTaskEdit: (task: Task) => void
  onTaskDelete: (taskId: string) => void
  onTaskStatusChange: (taskId: string, status: Task['status']) => void
  onCreateTask: () => void
}

const PROJECT_COLORS = [
  '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#14b8a6', '#f43f5e'
]

export function Projects({
  tasks,
  tags,
  categories,
  onTaskEdit,
  onTaskDelete,
  onTaskStatusChange,
  onCreateTask,
}: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: PROJECT_COLORS[0],
  })

  useEffect(() => {
    const stored = localStorage.getItem('9td_projects')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setProjects(parsed)
      } catch (error) {
        console.error('Failed to parse projects:', error)
      }
    }
  }, [])

  const saveProjects = (newProjects: Project[]) => {
    setProjects(newProjects)
    localStorage.setItem('9td_projects', JSON.stringify(newProjects))
  }

  const handleCreateProject = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a project name')
      return
    }

    const newProject: Project = {
      id: `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: formData.name,
      description: formData.description,
      color: formData.color,
      taskIds: [],
      createdAt: new Date().toISOString(),
    }

    if (editingProject) {
      const updated = projects.map(p => 
        p.id === editingProject.id 
          ? { ...p, name: formData.name, description: formData.description, color: formData.color }
          : p
      )
      saveProjects(updated)
      toast.success('Project updated successfully')
    } else {
      saveProjects([...projects, newProject])
      toast.success('Project created successfully')
    }

    setCreateDialogOpen(false)
    setEditingProject(null)
    setFormData({ name: '', description: '', color: PROJECT_COLORS[0] })
  }

  const handleDeleteProject = (projectId: string) => {
    saveProjects(projects.filter(p => p.id !== projectId))
    if (selectedProject?.id === projectId) {
      setSelectedProject(null)
    }
    toast.success('Project deleted successfully')
  }

  const handleAddTaskToProject = (projectId: string, taskId: string) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        return { ...p, taskIds: [...new Set([...p.taskIds, taskId])] }
      }
      // Remove from other projects
      return { ...p, taskIds: p.taskIds.filter(id => id !== taskId) }
    })
    saveProjects(updated)
    toast.success('Task added to project')
  }

  const handleRemoveTaskFromProject = (projectId: string, taskId: string) => {
    const updated = projects.map(p => 
      p.id === projectId 
        ? { ...p, taskIds: p.taskIds.filter(id => id !== taskId) }
        : p
    )
    saveProjects(updated)
    toast.success('Task removed from project')
  }

  const getProjectStats = (project: Project) => {
    const projectTasks = tasks.filter(t => project.taskIds.includes(t.id))
    const total = projectTasks.length
    const completed = projectTasks.filter(t => t.status === 'completed').length
    const inProgress = projectTasks.filter(t => t.status === 'in-progress').length
    const todo = projectTasks.filter(t => t.status === 'todo').length
    const progress = total > 0 ? (completed / total) * 100 : 0

    return { total, completed, inProgress, todo, progress }
  }

  const unassignedTasks = tasks.filter(t => 
    !projects.some(p => p.taskIds.includes(t.id))
  )

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'todo':
        return <Circle className="h-4 w-4 text-gray-400" />
      case 'blocked':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-500" />
      default:
        return <Circle className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted-foreground">
            Organize your tasks into projects and workspaces
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" onClick={() => {
              setEditingProject(null)
              setFormData({ name: '', description: '', color: PROJECT_COLORS[0] })
            }}>
              <Plus className="h-5 w-5" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
              <DialogDescription>
                Set up a new project to organize your tasks
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="My Awesome Project"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Project description..."
                  rows={3}
                />
              </div>
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {PROJECT_COLORS.map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.color === color ? 'border-primary' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>
              <Button onClick={handleCreateProject} className="w-full">
                {editingProject ? 'Update Project' : 'Create Project'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project List */}
        <Card className="lg:col-span-1 p-4">
          <h3 className="font-semibold mb-4">All Projects ({projects.length})</h3>
          <ScrollArea className="h-[calc(100vh-300px)]">
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {projects.map(project => {
                  const stats = getProjectStats(project)
                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      layout
                    >
                      <Card
                        className={`p-3 cursor-pointer transition-all ${
                          selectedProject?.id === project.id
                            ? 'border-primary shadow-md'
                            : 'hover:border-border'
                        }`}
                        onClick={() => setSelectedProject(project)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: project.color }}
                            />
                            <span className="font-medium text-sm">{project.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingProject(project)
                                setFormData({
                                  name: project.name,
                                  description: project.description,
                                  color: project.color,
                                })
                                setCreateDialogOpen(true)
                              }}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProject(project.id)
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{stats.completed}/{stats.total} completed</span>
                            <span>{Math.round(stats.progress)}%</span>
                          </div>
                          <Progress value={stats.progress} className="h-1" />
                        </div>
                      </Card>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              
              {projects.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No projects yet. Create one to get started!
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Project Details */}
        <Card className="lg:col-span-2 p-6">
          {selectedProject ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <div>
                    <h2 className="font-display text-2xl font-bold">{selectedProject.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedProject.description}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4">
                {Object.entries(getProjectStats(selectedProject)).map(([key, value]) => {
                  if (key === 'progress') return null
                  return (
                    <Card key={key} className="p-3">
                      <div className="text-2xl font-bold">{value}</div>
                      <div className="text-xs text-muted-foreground capitalize">{key}</div>
                    </Card>
                  )
                })}
              </div>

              {/* Tasks in Project */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold">Project Tasks</h3>
                  <Select
                    onValueChange={(taskId) => handleAddTaskToProject(selectedProject.id, taskId)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Add task..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unassignedTasks.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No unassigned tasks
                        </div>
                      ) : (
                        unassignedTasks.map(task => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <ScrollArea className="h-[calc(100vh-500px)]">
                  <div className="space-y-2">
                    {tasks
                      .filter(t => selectedProject.taskIds.includes(t.id))
                      .map(task => (
                        <Card key={task.id} className="p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getStatusIcon(task.status)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span 
                                    className="font-medium cursor-pointer hover:text-primary"
                                    onClick={() => onTaskEdit(task)}
                                  >
                                    {task.title}
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {task.priority}
                                  </Badge>
                                </div>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {task.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleRemoveTaskFromProject(selectedProject.id, task.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    
                    {selectedProject.taskIds.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        No tasks in this project yet. Add some from the dropdown above!
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No Project Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a project from the list to view its details and tasks
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
