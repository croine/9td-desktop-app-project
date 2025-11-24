"use client"

import { AppSettings, Tag, Category } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { CheckSquare, Target, LayoutGrid } from 'lucide-react'
import { getTags, getCategories } from '@/lib/storage'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface DefaultsSettingsProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

export function DefaultsSettings({ settings, onSettingsChange }: DefaultsSettingsProps) {
  const tags = getTags()
  const categories = getCategories()

  const handleChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    onSettingsChange(newSettings)
    toast.success('Default settings updated')
  }

  const toggleDefaultTag = (tagId: string) => {
    const currentTags = settings.defaultTags || []
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId]
    handleChange('defaultTags', newTags)
  }

  const toggleDefaultCategory = (categoryId: string) => {
    const currentCategories = settings.defaultCategories || []
    const newCategories = currentCategories.includes(categoryId)
      ? currentCategories.filter(id => id !== categoryId)
      : [...currentCategories, categoryId]
    handleChange('defaultCategories', newCategories)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Default Task Settings</h1>
        <p className="text-muted-foreground">
          Set default values for new tasks
        </p>
      </div>

      <div className="grid gap-6">
        {/* Task Properties */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Task Properties</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Default Priority</Label>
              <Select
                value={settings.defaultPriority ?? 'medium'}
                onValueChange={(value) => handleChange('defaultPriority', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                      Low
                    </span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                      Medium
                    </span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-orange-500"></span>
                      High
                    </span>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <span className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                      Urgent
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                New tasks will start with this priority
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Default Status</Label>
              <Select
                value={settings.defaultStatus ?? 'todo'}
                onValueChange={(value) => handleChange('defaultStatus', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                New tasks will start with this status
              </p>
            </div>
          </div>
        </Card>

        {/* Auto-assign Tags */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Auto-assign Tags</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Default Tags</Label>
              {tags.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/50 border text-center">
                  <p className="text-sm text-muted-foreground">
                    No tags available. Create tags in the Owner Panel first.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => {
                    const isSelected = (settings.defaultTags || []).includes(tag.id)
                    return (
                      <Badge
                        key={tag.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer transition-all hover:scale-105"
                        style={{
                          backgroundColor: isSelected ? tag.color : 'transparent',
                          borderColor: tag.color,
                          color: isSelected ? 'white' : tag.color
                        }}
                        onClick={() => toggleDefaultTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    )
                  })}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Selected tags will be automatically added to new tasks
              </p>
            </div>
          </div>
        </Card>

        {/* Auto-assign Categories */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Auto-assign Categories</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Default Categories</Label>
              {categories.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/50 border text-center">
                  <p className="text-sm text-muted-foreground">
                    No categories available. Create categories in the Owner Panel first.
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => {
                    const isSelected = (settings.defaultCategories || []).includes(category.id)
                    return (
                      <Badge
                        key={category.id}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer transition-all hover:scale-105"
                        style={{
                          backgroundColor: isSelected ? category.color : 'transparent',
                          borderColor: category.color,
                          color: isSelected ? 'white' : category.color
                        }}
                        onClick={() => toggleDefaultCategory(category.id)}
                      >
                        {category.name}
                      </Badge>
                    )
                  })}
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                Selected categories will be automatically added to new tasks
              </p>
            </div>
          </div>
        </Card>

        {/* View Preferences */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold mb-1">View Preferences</h2>
              <p className="text-sm text-muted-foreground">
                Set your preferred default view
              </p>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Task List View</Label>
              <Select
                value={settings.defaultView ?? 'grid'}
                onValueChange={(value) => handleChange('defaultView', value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="grid">Grid View</SelectItem>
                  <SelectItem value="list">List View</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose how tasks are displayed by default
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
