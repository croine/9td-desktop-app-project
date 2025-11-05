"use client"

import { useState, useMemo } from 'react'
import { Task, Tag, Category } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, Edit, Trash2, Tag as TagIcon, Folder, 
  TrendingUp, BarChart3, Download, Upload, 
  Merge, Copy, Eye, EyeOff, Search, Filter,
  RefreshCw, AlertTriangle, CheckCircle2, Zap,
  Target, Package, Clock, Activity, Palette,
  Settings2, FileJson, FileText, Sparkles,
  ArrowUpDown, Calendar
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'

interface OwnerPanelProps {
  tags: Tag[]
  categories: Category[]
  tasks?: Task[]
  onAddTag: (tag: Tag) => void
  onUpdateTag: (tagId: string, updates: Partial<Tag>) => void
  onDeleteTag: (tagId: string) => void
  onAddCategory: (category: Category) => void
  onUpdateCategory: (categoryId: string, updates: Partial<Category>) => void
  onDeleteCategory: (categoryId: string) => void
}

const colorPresets = [
  '#ef4444', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6',
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
]

const iconPresets = ['💻', '🎨', '📢', '💰', '🛟', '🔬', '📊', '🚀', '💡', '🎯', '📱', '🌟', '🔧', '📝', '⚡', '🎪']

const colorSchemes = {
  vibrant: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'],
  pastel: ['#fca5a5', '#fcd34d', '#86efac', '#93c5fd', '#c4b5fd', '#f9a8d4'],
  professional: ['#1e40af', '#047857', '#b45309', '#6b21a8', '#be123c', '#0e7490'],
  monochrome: ['#171717', '#404040', '#737373', '#a3a3a3', '#d4d4d4', '#f5f5f5'],
}

const tagTemplates = [
  {
    name: 'Development Team',
    tags: [
      { name: 'Frontend', color: '#3b82f6', icon: '💻' },
      { name: 'Backend', color: '#10b981', icon: '🔧' },
      { name: 'Bug', color: '#ef4444', icon: '🐛' },
      { name: 'Feature', color: '#8b5cf6', icon: '✨' },
      { name: 'Review', color: '#f59e0b', icon: '👀' },
    ]
  },
  {
    name: 'Marketing Campaign',
    tags: [
      { name: 'Social Media', color: '#ec4899', icon: '📱' },
      { name: 'Content', color: '#06b6d4', icon: '📝' },
      { name: 'SEO', color: '#22c55e', icon: '🎯' },
      { name: 'Email', color: '#8b5cf6', icon: '📧' },
      { name: 'Analytics', color: '#f59e0b', icon: '📊' },
    ]
  },
  {
    name: 'Personal Productivity',
    tags: [
      { name: 'Health', color: '#22c55e', icon: '💪' },
      { name: 'Learning', color: '#3b82f6', icon: '📚' },
      { name: 'Finance', color: '#10b981', icon: '💰' },
      { name: 'Home', color: '#f59e0b', icon: '🏠' },
      { name: 'Family', color: '#ec4899', icon: '👨‍👩‍👧' },
    ]
  },
]

const categoryTemplates = [
  {
    name: 'Project Management',
    categories: [
      { name: 'Planning', color: '#3b82f6', icon: '📋' },
      { name: 'Design', color: '#ec4899', icon: '🎨' },
      { name: 'Development', color: '#10b981', icon: '💻' },
      { name: 'Testing', color: '#f59e0b', icon: '🧪' },
      { name: 'Deployment', color: '#8b5cf6', icon: '🚀' },
    ]
  },
  {
    name: 'Business Operations',
    categories: [
      { name: 'Sales', color: '#22c55e', icon: '💰' },
      { name: 'Support', color: '#06b6d4', icon: '🛟' },
      { name: 'HR', color: '#ec4899', icon: '👥' },
      { name: 'Finance', color: '#f59e0b', icon: '📊' },
      { name: 'Operations', color: '#8b5cf6', icon: '⚙️' },
    ]
  },
]

export function OwnerPanel({
  tags,
  categories,
  tasks = [],
  onAddTag,
  onUpdateTag,
  onDeleteTag,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}: OwnerPanelProps) {
  const [tagDialogOpen, setTagDialogOpen] = useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<Tag | null>(null)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false)
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false)
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false)
  const [insightsDialogOpen, setInsightsDialogOpen] = useState(false)
  const [usageDialogOpen, setUsageDialogOpen] = useState(false)
  const [selectedItemForUsage, setSelectedItemForUsage] = useState<{ type: 'tag' | 'category', id: string } | null>(null)

  const [tagForm, setTagForm] = useState({ name: '', color: '#3b82f6', description: '' })
  const [categoryForm, setCategoryForm] = useState({ name: '', color: '#3b82f6', icon: '📁', description: '' })

  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'used' | 'unused'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'date'>('name')

  // Calculate tag usage statistics
  const tagUsageStats = useMemo(() => {
    return tags.map(tag => {
      const usageCount = tasks.filter(task => 
        task.tags?.includes(tag.id)
      ).length
      const completedCount = tasks.filter(task => 
        task.tags?.includes(tag.id) && task.status === 'completed'
      ).length
      
      return {
        ...tag,
        usageCount,
        completedCount,
        completionRate: usageCount > 0 ? (completedCount / usageCount) * 100 : 0
      }
    })
  }, [tags, tasks])

  // Calculate category usage statistics
  const categoryUsageStats = useMemo(() => {
    return categories.map(category => {
      const usageCount = tasks.filter(task => 
        task.categories?.includes(category.id)
      ).length
      const completedCount = tasks.filter(task => 
        task.categories?.includes(category.id) && task.status === 'completed'
      ).length
      
      return {
        ...category,
        usageCount,
        completedCount,
        completionRate: usageCount > 0 ? (completedCount / usageCount) * 100 : 0
      }
    })
  }, [categories, tasks])

  // Filter and sort tags
  const filteredTags = useMemo(() => {
    let filtered = [...tagUsageStats]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(tag => 
        tag.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Usage filter
    if (filterType === 'used') {
      filtered = filtered.filter(tag => tag.usageCount > 0)
    } else if (filterType === 'unused') {
      filtered = filtered.filter(tag => tag.usageCount === 0)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'usage':
          return b.usageCount - a.usageCount
        case 'date':
          return b.id.localeCompare(a.id)
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }, [tagUsageStats, searchQuery, filterType, sortBy])

  // Filter and sort categories
  const filteredCategories = useMemo(() => {
    let filtered = [...categoryUsageStats]

    if (searchQuery) {
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (filterType === 'used') {
      filtered = filtered.filter(cat => cat.usageCount > 0)
    } else if (filterType === 'unused') {
      filtered = filtered.filter(cat => cat.usageCount === 0)
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'usage':
          return b.usageCount - a.usageCount
        case 'date':
          return b.id.localeCompare(a.id)
        default:
          return a.name.localeCompare(b.name)
      }
    })

    return filtered
  }, [categoryUsageStats, searchQuery, filterType, sortBy])

  const handleSaveTag = () => {
    if (!tagForm.name.trim()) return

    if (editingTag) {
      onUpdateTag(editingTag.id, tagForm)
      toast.success('Tag updated successfully')
    } else {
      onAddTag({
        id: `tag_${Date.now()}`,
        ...tagForm,
      })
      toast.success('Tag created successfully')
    }

    setTagDialogOpen(false)
    setEditingTag(null)
    setTagForm({ name: '', color: '#3b82f6', description: '' })
  }

  const handleSaveCategory = () => {
    if (!categoryForm.name.trim()) return

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, categoryForm)
      toast.success('Category updated successfully')
    } else {
      onAddCategory({
        id: `cat_${Date.now()}`,
        ...categoryForm,
      })
      toast.success('Category created successfully')
    }

    setCategoryDialogOpen(false)
    setEditingCategory(null)
    setCategoryForm({ name: '', color: '#3b82f6', icon: '📁', description: '' })
  }

  const handleEditTag = (tag: Tag) => {
    setEditingTag(tag)
    setTagForm({ name: tag.name, color: tag.color, description: (tag as any).description || '' })
    setTagDialogOpen(true)
  }

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category)
    setCategoryForm({ 
      name: category.name, 
      color: category.color, 
      icon: category.icon || '📁',
      description: (category as any).description || ''
    })
    setCategoryDialogOpen(true)
  }

  const handleDeleteTag = (tagId: string) => {
    const tag = tags.find(t => t.id === tagId)
    const usageCount = tasks.filter(task => task.tags?.includes(tagId)).length
    
    if (usageCount > 0) {
      if (!confirm(`This tag is used in ${usageCount} task(s). Are you sure you want to delete it?`)) {
        return
      }
    }
    
    onDeleteTag(tagId)
    toast.success('Tag deleted successfully')
  }

  const handleDeleteCategory = (categoryId: string) => {
    const usageCount = tasks.filter(task => task.categories?.includes(categoryId)).length
    
    if (usageCount > 0) {
      if (!confirm(`This category is used in ${usageCount} task(s). Are you sure you want to delete it?`)) {
        return
      }
    }
    
    onDeleteCategory(categoryId)
    toast.success('Category deleted successfully')
  }

  const handleBulkColorChange = (color: string) => {
    selectedTags.forEach(tagId => {
      onUpdateTag(tagId, { color })
    })
    toast.success(`Updated ${selectedTags.length} tags`)
    setSelectedTags([])
    setBulkDialogOpen(false)
  }

  const handleBulkCategoryColorChange = (color: string) => {
    selectedCategories.forEach(catId => {
      onUpdateCategory(catId, { color })
    })
    toast.success(`Updated ${selectedCategories.length} categories`)
    setSelectedCategories([])
    setBulkDialogOpen(false)
  }

  const handleBulkDelete = () => {
    if (!confirm(`Are you sure you want to delete ${selectedTags.length + selectedCategories.length} items?`)) {
      return
    }

    selectedTags.forEach(onDeleteTag)
    selectedCategories.forEach(onDeleteCategory)
    
    toast.success('Bulk deletion completed')
    setSelectedTags([])
    setSelectedCategories([])
  }

  const handleExportJSON = () => {
    const data = {
      tags,
      categories,
      exportDate: new Date().toISOString(),
      version: '1.0'
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `9td-tags-categories-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Configuration exported successfully')
  }

  const handleExportCSV = () => {
    const headers = ['Type', 'Name', 'Color', 'Icon', 'Usage Count']
    const rows = [
      ...tags.map(tag => {
        const usage = tagUsageStats.find(t => t.id === tag.id)?.usageCount || 0
        return ['Tag', tag.name, tag.color, '', usage.toString()]
      }),
      ...categories.map(cat => {
        const usage = categoryUsageStats.find(c => c.id === cat.id)?.usageCount || 0
        return ['Category', cat.name, cat.color, cat.icon || '', usage.toString()]
      })
    ]
    
    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `9td-tags-categories-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Data exported to CSV')
  }

  const handleApplyTemplate = (template: typeof tagTemplates[0] | typeof categoryTemplates[0], type: 'tags' | 'categories') => {
    if (type === 'tags') {
      (template as typeof tagTemplates[0]).tags.forEach(tag => {
        onAddTag({
          id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: tag.name,
          color: tag.color,
        })
      })
      toast.success(`Applied template: ${template.name}`)
    } else {
      (template as typeof categoryTemplates[0]).categories.forEach(cat => {
        onAddCategory({
          id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: cat.name,
          color: cat.color,
          icon: cat.icon,
        })
      })
      toast.success(`Applied template: ${template.name}`)
    }
    setTemplateDialogOpen(false)
  }

  const handleApplyColorScheme = (colors: string[]) => {
    const allTags = [...tags]
    allTags.forEach((tag, index) => {
      onUpdateTag(tag.id, { color: colors[index % colors.length] })
    })
    toast.success('Color scheme applied to all tags')
  }

  const handleDuplicateTag = (tag: Tag) => {
    onAddTag({
      id: `tag_${Date.now()}`,
      name: `${tag.name} (Copy)`,
      color: tag.color,
    })
    toast.success('Tag duplicated')
  }

  const handleDuplicateCategory = (category: Category) => {
    onAddCategory({
      id: `cat_${Date.now()}`,
      name: `${category.name} (Copy)`,
      color: category.color,
      icon: category.icon,
    })
    toast.success('Category duplicated')
  }

  const totalStorage = JSON.stringify({ tags, categories }).length
  const unusedTags = tagUsageStats.filter(t => t.usageCount === 0).length
  const unusedCategories = categoryUsageStats.filter(c => c.usageCount === 0).length
  const mostUsedTag = tagUsageStats.sort((a, b) => b.usageCount - a.usageCount)[0]
  const mostUsedCategory = categoryUsageStats.sort((a, b) => b.usageCount - a.usageCount)[0]

  return (
    <div className="space-y-6">
      <Tabs defaultValue="tags" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tags" className="gap-2">
            <TagIcon className="h-4 w-4" />
            Tags
          </TabsTrigger>
          <TabsTrigger value="categories" className="gap-2">
            <Folder className="h-4 w-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="tools" className="gap-2">
            <Settings2 className="h-4 w-4" />
            Tools
          </TabsTrigger>
        </TabsList>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">All Tags ({filteredTags.length})</h2>
              <p className="text-sm text-muted-foreground">Manage and organize your task tags</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setTemplateDialogOpen(true)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Templates
              </Button>
              <Button
                onClick={() => {
                  setEditingTag(null)
                  setTagForm({ name: '', color: '#3b82f6', description: '' })
                  setTagDialogOpen(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Tag
              </Button>
            </div>
          </div>

          {/* Filters and Actions */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tags</SelectItem>
                  <SelectItem value="used">Used Only</SelectItem>
                  <SelectItem value="unused">Unused Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">By Name</SelectItem>
                  <SelectItem value="usage">By Usage</SelectItem>
                  <SelectItem value="date">By Date</SelectItem>
                </SelectContent>
              </Select>
              {selectedTags.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setBulkDialogOpen(true)}
                  className="gap-2"
                >
                  <Settings2 className="h-4 w-4" />
                  Bulk Actions ({selectedTags.length})
                </Button>
              )}
            </div>
          </Card>

          {/* Tags Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTags.map((tag, index) => (
              <motion.div
                key={tag.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="p-4 hover:shadow-lg transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <Checkbox
                          checked={selectedTags.includes(tag.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTags([...selectedTags, tag.id])
                            } else {
                              setSelectedTags(selectedTags.filter(id => id !== tag.id))
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div
                            className="flex items-center gap-2 px-3 py-2 rounded-md font-medium"
                            style={{
                              backgroundColor: `${tag.color}30`,
                              color: tag.color,
                            }}
                          >
                            <TagIcon className="h-4 w-4" />
                            <span>#{tag.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Target className="h-3 w-3" />
                          <span>{tag.usageCount} tasks</span>
                        </div>
                        {tag.usageCount > 0 && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{Math.round(tag.completionRate)}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItemForUsage({ type: 'tag', id: tag.id })
                          setUsageDialogOpen(true)
                        }}
                        className="h-8 w-8"
                        title="View usage"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateTag(tag)}
                        className="h-8 w-8"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditTag(tag)}
                        className="h-8 w-8"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredTags.length === 0 && (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <TagIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-lg font-semibold">No tags found</h3>
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? 'Try a different search term' : 'Create your first tag to get started'}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4 mt-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold">All Categories ({filteredCategories.length})</h2>
              <p className="text-sm text-muted-foreground">Organize tasks into categories</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setTemplateDialogOpen(true)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Templates
              </Button>
              <Button
                onClick={() => {
                  setEditingCategory(null)
                  setCategoryForm({ name: '', color: '#3b82f6', icon: '📁', description: '' })
                  setCategoryDialogOpen(true)
                }}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Category
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="used">Used Only</SelectItem>
                  <SelectItem value="unused">Unused Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">By Name</SelectItem>
                  <SelectItem value="usage">By Usage</SelectItem>
                  <SelectItem value="date">By Date</SelectItem>
                </SelectContent>
              </Select>
              {selectedCategories.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setBulkDialogOpen(true)}
                  className="gap-2"
                >
                  <Settings2 className="h-4 w-4" />
                  Bulk Actions ({selectedCategories.length})
                </Button>
              )}
            </div>
          </Card>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card className="p-4 hover:shadow-lg transition-all">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1">
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCategories([...selectedCategories, category.id])
                            } else {
                              setSelectedCategories(selectedCategories.filter(id => id !== category.id))
                            }
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div
                            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium border-2"
                            style={{
                              backgroundColor: `${category.color}15`,
                              borderColor: `${category.color}30`,
                              color: category.color,
                            }}
                          >
                            <span className="text-xl">{category.icon}</span>
                            <span>{category.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Package className="h-3 w-3" />
                          <span>{category.usageCount} tasks</span>
                        </div>
                        {category.usageCount > 0 && (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>{Math.round(category.completionRate)}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedItemForUsage({ type: 'category', id: category.id })
                          setUsageDialogOpen(true)
                        }}
                        className="h-8 w-8"
                        title="View usage"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDuplicateCategory(category)}
                        className="h-8 w-8"
                        title="Duplicate"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCategory(category)}
                        className="h-8 w-8"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <Folder className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-display text-lg font-semibold">No categories found</h3>
                  <p className="text-muted-foreground text-sm">
                    {searchQuery ? 'Try a different search term' : 'Create your first category to get started'}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-display text-xl font-semibold">Analytics & Insights</h2>
              <p className="text-sm text-muted-foreground">Comprehensive statistics and performance metrics</p>
            </div>
            <Button
              variant="outline"
              onClick={() => setInsightsDialogOpen(true)}
              className="gap-2"
            >
              <Activity className="h-4 w-4" />
              Detailed Insights
            </Button>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">Total Tags</p>
                  <TagIcon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-display font-bold">{tags.length}</p>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="text-xs">
                    {unusedTags} unused
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">Total Categories</p>
                  <Folder className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-display font-bold">{categories.length}</p>
                <div className="flex items-center gap-2 text-xs">
                  <Badge variant="secondary" className="text-xs">
                    {unusedCategories} unused
                  </Badge>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">Storage Used</p>
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-display font-bold">
                  {(totalStorage / 1024).toFixed(1)}
                  <span className="text-lg text-muted-foreground ml-1">KB</span>
                </p>
              </div>
            </Card>

            <Card className="p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-medium">System Health</p>
                  <Zap className="h-4 w-4 text-green-600" />
                </div>
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-sm">
                  Excellent
                </Badge>
              </div>
            </Card>
          </div>

          {/* Most Used */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Most Used Tag
              </h3>
              {mostUsedTag && mostUsedTag.usageCount > 0 ? (
                <div className="space-y-4">
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-lg"
                    style={{
                      backgroundColor: `${mostUsedTag.color}30`,
                      color: mostUsedTag.color,
                    }}
                  >
                    <TagIcon className="h-5 w-5" />
                    <span>#{mostUsedTag.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usage</span>
                      <span className="font-semibold">{mostUsedTag.usageCount} tasks</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-semibold text-green-600">
                        {Math.round(mostUsedTag.completionRate)}%
                      </span>
                    </div>
                    <Progress value={mostUsedTag.completionRate} className="h-2" />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No tag usage data available</p>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Most Used Category
              </h3>
              {mostUsedCategory && mostUsedCategory.usageCount > 0 ? (
                <div className="space-y-4">
                  <div
                    className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-lg border-2"
                    style={{
                      backgroundColor: `${mostUsedCategory.color}15`,
                      borderColor: `${mostUsedCategory.color}30`,
                      color: mostUsedCategory.color,
                    }}
                  >
                    <span className="text-2xl">{mostUsedCategory.icon}</span>
                    <span>{mostUsedCategory.name}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Usage</span>
                      <span className="font-semibold">{mostUsedCategory.usageCount} tasks</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completion Rate</span>
                      <span className="font-semibold text-green-600">
                        {Math.round(mostUsedCategory.completionRate)}%
                      </span>
                    </div>
                    <Progress value={mostUsedCategory.completionRate} className="h-2" />
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No category usage data available</p>
              )}
            </Card>
          </div>

          {/* Top Tags by Usage */}
          <Card className="p-6">
            <h3 className="font-display text-lg font-semibold mb-4">Top 5 Tags by Usage</h3>
            <div className="space-y-3">
              {tagUsageStats
                .sort((a, b) => b.usageCount - a.usageCount)
                .slice(0, 5)
                .map((tag, index) => (
                  <div key={tag.id} className="flex items-center gap-3">
                    <span className="text-2xl font-display font-bold text-muted-foreground w-8">
                      #{index + 1}
                    </span>
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-md font-medium flex-1"
                      style={{
                        backgroundColor: `${tag.color}30`,
                        color: tag.color,
                      }}
                    >
                      <TagIcon className="h-4 w-4" />
                      <span>#{tag.name}</span>
                    </div>
                    <div className="text-sm font-semibold text-muted-foreground">
                      {tag.usageCount} tasks
                    </div>
                    <Progress value={(tag.usageCount / tasks.length) * 100} className="w-24 h-2" />
                  </div>
                ))}
            </div>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-6 mt-6">
          <div>
            <h2 className="font-display text-xl font-semibold">Management Tools</h2>
            <p className="text-sm text-muted-foreground">Advanced utilities for managing your workspace</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Tools */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Download className="h-5 w-5 text-primary" />
                Export Configuration
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Export your tags and categories to backup or share
              </p>
              <div className="flex gap-2">
                <Button onClick={handleExportJSON} className="gap-2 flex-1">
                  <FileJson className="h-4 w-4" />
                  Export JSON
                </Button>
                <Button onClick={handleExportCSV} variant="outline" className="gap-2 flex-1">
                  <FileText className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </Card>

            {/* Color Schemes */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                Color Schemes
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Apply beautiful color schemes to all your tags
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(colorSchemes).map(([name, colors]) => (
                  <Button
                    key={name}
                    variant="outline"
                    onClick={() => handleApplyColorScheme(colors)}
                    className="h-auto flex-col gap-2 p-3"
                  >
                    <div className="flex gap-1">
                      {colors.slice(0, 4).map(color => (
                        <div
                          key={color}
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className="text-xs capitalize">{name}</span>
                  </Button>
                ))}
              </div>
            </Card>

            {/* Cleanup */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Cleanup Utilities
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Remove unused tags and categories to keep things organized
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Unused Tags</p>
                    <p className="text-xs text-muted-foreground">{unusedTags} items</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={unusedTags === 0}
                    onClick={() => {
                      if (confirm(`Remove ${unusedTags} unused tags?`)) {
                        tagUsageStats
                          .filter(t => t.usageCount === 0)
                          .forEach(t => onDeleteTag(t.id))
                        toast.success(`Removed ${unusedTags} unused tags`)
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Unused Categories</p>
                    <p className="text-xs text-muted-foreground">{unusedCategories} items</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={unusedCategories === 0}
                    onClick={() => {
                      if (confirm(`Remove ${unusedCategories} unused categories?`)) {
                        categoryUsageStats
                          .filter(c => c.usageCount === 0)
                          .forEach(c => onDeleteCategory(c.id))
                        toast.success(`Removed ${unusedCategories} unused categories`)
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card className="p-6">
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Quick Statistics
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Items</span>
                  <span className="font-semibold">{tags.length + categories.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Tags</span>
                  <span className="font-semibold text-green-600">{tags.length - unusedTags}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Categories</span>
                  <span className="font-semibold text-green-600">{categories.length - unusedCategories}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Tasks Tagged</span>
                  <span className="font-semibold">{tasks.length}</span>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tag Dialog */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </DialogTitle>
            <DialogDescription>
              {editingTag ? 'Update tag properties' : 'Add a new tag to organize your tasks'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Tag Name *</Label>
              <Input
                id="tag-name"
                value={tagForm.name}
                onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                placeholder="e.g., Development, Bug, Feature..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-description">Description (Optional)</Label>
              <Textarea
                id="tag-description"
                value={tagForm.description}
                onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                placeholder="Brief description of this tag..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Color Presets</Label>
              <div className="grid grid-cols-8 gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setTagForm({ ...tagForm, color })}
                    className="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: tagForm.color === color ? '#000' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag-color-custom">Custom Color</Label>
              <div className="flex gap-2">
                <Input
                  id="tag-color-custom"
                  type="color"
                  value={tagForm.color}
                  onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={tagForm.color}
                  onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium"
                style={{
                  backgroundColor: `${tagForm.color}30`,
                  color: tagForm.color,
                }}
              >
                <TagIcon className="h-5 w-5" />
                <span>#{tagForm.name || 'Tag Name'}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTag} disabled={!tagForm.name.trim()}>
              {editingTag ? 'Update Tag' : 'Create Tag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {editingCategory ? 'Edit Category' : 'Create New Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory ? 'Update category properties' : 'Add a new category to organize your tasks'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                placeholder="e.g., Planning, Design, Testing..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Description (Optional)</Label>
              <Textarea
                id="category-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="Brief description of this category..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Icon Presets</Label>
              <div className="grid grid-cols-8 gap-2">
                {iconPresets.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setCategoryForm({ ...categoryForm, icon })}
                    className="w-10 h-10 rounded-lg border-2 flex items-center justify-center text-xl transition-all hover:scale-110"
                    style={{
                      borderColor: categoryForm.icon === icon ? '#000' : '#e5e7eb',
                    }}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color Presets</Label>
              <div className="grid grid-cols-8 gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setCategoryForm({ ...categoryForm, color })}
                    className="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor: categoryForm.color === color ? '#000' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-color-custom">Custom Color</Label>
              <div className="flex gap-2">
                <Input
                  id="category-color-custom"
                  type="color"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Preview</Label>
              <div
                className="flex items-center gap-2 px-4 py-3 rounded-lg font-medium border-2"
                style={{
                  backgroundColor: `${categoryForm.color}15`,
                  borderColor: `${categoryForm.color}30`,
                  color: categoryForm.color,
                }}
              >
                <span className="text-2xl">{categoryForm.icon}</span>
                <span>{categoryForm.name || 'Category Name'}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCategory} disabled={!categoryForm.name.trim()}>
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Bulk Actions</DialogTitle>
            <DialogDescription>
              Apply changes to {selectedTags.length + selectedCategories.length} selected items
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Change Color</Label>
              <div className="grid grid-cols-8 gap-2">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => {
                      if (selectedTags.length > 0) {
                        handleBulkColorChange(color)
                      } else {
                        handleBulkCategoryColorChange(color)
                      }
                    }}
                    className="w-10 h-10 rounded-lg border-2 transition-all hover:scale-110"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              className="w-full gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected Items
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Tag & Category Templates
            </DialogTitle>
            <DialogDescription>
              Quick-start templates for common project types
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="tag-templates">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="tag-templates">Tag Templates</TabsTrigger>
              <TabsTrigger value="category-templates">Category Templates</TabsTrigger>
            </TabsList>

            <TabsContent value="tag-templates" className="space-y-4 mt-4">
              {tagTemplates.map((template) => (
                <Card key={template.name} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-display font-semibold">{template.name}</h4>
                        <p className="text-xs text-muted-foreground">{template.tags.length} tags</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplyTemplate(template, 'tags')}
                        className="gap-2"
                      >
                        <Plus className="h-3 w-3" />
                        Apply
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                          style={{
                            backgroundColor: `${tag.color}30`,
                            color: tag.color,
                          }}
                        >
                          <TagIcon className="h-3 w-3" />
                          {tag.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="category-templates" className="space-y-4 mt-4">
              {categoryTemplates.map((template) => (
                <Card key={template.name} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-display font-semibold">{template.name}</h4>
                        <p className="text-xs text-muted-foreground">{template.categories.length} categories</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleApplyTemplate(template, 'categories')}
                        className="gap-2"
                      >
                        <Plus className="h-3 w-3" />
                        Apply
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {template.categories.map((cat, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            borderColor: `${cat.color}30`,
                            color: cat.color,
                          }}
                        >
                          <span>{cat.icon}</span>
                          {cat.name}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Usage Dialog */}
      <Dialog open={usageDialogOpen} onOpenChange={setUsageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Task Usage Details</DialogTitle>
            <DialogDescription>
              Tasks using this {selectedItemForUsage?.type}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {selectedItemForUsage && (() => {
              const item = selectedItemForUsage.type === 'tag' 
                ? tags.find(t => t.id === selectedItemForUsage.id)
                : categories.find(c => c.id === selectedItemForUsage.id)
              
              const relatedTasks = tasks.filter(task => 
                selectedItemForUsage.type === 'tag'
                  ? task.tags?.includes(selectedItemForUsage.id)
                  : task.categories?.includes(selectedItemForUsage.id)
              )

              return (
                <>
                  {relatedTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <EyeOff className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No tasks using this {selectedItemForUsage.type}</p>
                    </div>
                  ) : (
                    relatedTasks.map((task) => (
                      <Card key={task.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium">{task.title}</h4>
                            <Badge variant={
                              task.status === 'completed' ? 'default' :
                              task.status === 'in-progress' ? 'secondary' : 'outline'
                            }>
                              {task.status}
                            </Badge>
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Created {new Date(task.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}