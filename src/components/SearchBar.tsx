"use client"

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X } from 'lucide-react'
import { Tag, Category, TaskPriority, TaskStatus } from '@/types/task'
import { motion, AnimatePresence } from 'framer-motion'

export interface SearchFilters {
  query: string
  priority?: TaskPriority
  status?: TaskStatus
  tags: string[]
  categories: string[]
}

interface SearchBarProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  tags: Tag[]
  categories: Category[]
}

export function SearchBar({ filters, onFiltersChange, tags, categories }: SearchBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  
  const activeFilterCount = 
    (filters.priority ? 1 : 0) +
    (filters.status ? 1 : 0) +
    filters.tags.length +
    filters.categories.length

  const handleClearFilters = () => {
    onFiltersChange({
      query: filters.query,
      tags: [],
      categories: [],
    })
  }

  const toggleTag = (tagId: string) => {
    const newTags = filters.tags.includes(tagId)
      ? filters.tags.filter(id => id !== tagId)
      : [...filters.tags, tagId]
    onFiltersChange({ ...filters, tags: newTags })
  }

  const toggleCategory = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter(id => id !== categoryId)
      : [...filters.categories, categoryId]
    onFiltersChange({ ...filters, categories: newCategories })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={filters.query}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
            placeholder="Search tasks by title, description..."
            className="pl-10 h-11 text-base"
          />
        </div>

        {/* Filter Button */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-11 px-4 relative">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge 
                  className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground"
                >
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-6" align="end">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-lg">Filters</h3>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-8 text-muted-foreground"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select
                  value={filters.priority || "all"}
                  onValueChange={(value) => 
                    onFiltersChange({ 
                      ...filters, 
                      priority: value === "all" ? undefined : value as TaskPriority 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => 
                    onFiltersChange({ 
                      ...filters, 
                      status: value === "all" ? undefined : value as TaskStatus 
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all ${
                        filters.categories.includes(category.id)
                          ? 'border-current shadow-sm'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: `${category.color}${filters.categories.includes(category.id) ? '25' : '15'}`,
                        color: category.color,
                      }}
                    >
                      {category.icon && <span>{category.icon}</span>}
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        filters.tags.includes(tag.id)
                          ? 'shadow-sm ring-2 ring-offset-2'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: `${tag.color}30`,
                        color: tag.color,
                      }}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Active Filters Display */}
      <AnimatePresence>
        {activeFilterCount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            {filters.priority && (
              <Badge variant="secondary" className="gap-2 py-1.5 px-3">
                Priority: {filters.priority}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onFiltersChange({ ...filters, priority: undefined })}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="gap-2 py-1.5 px-3">
                Status: {filters.status}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onFiltersChange({ ...filters, status: undefined })}
                />
              </Badge>
            )}
            {filters.categories.map(catId => {
              const category = categories.find(c => c.id === catId)
              return category ? (
                <Badge
                  key={catId}
                  className="gap-2 py-1.5 px-3 border"
                  style={{
                    backgroundColor: `${category.color}25`,
                    color: category.color,
                    borderColor: `${category.color}50`,
                  }}
                >
                  {category.icon} {category.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleCategory(catId)}
                  />
                </Badge>
              ) : null
            })}
            {filters.tags.map(tagId => {
              const tag = tags.find(t => t.id === tagId)
              return tag ? (
                <Badge
                  key={tagId}
                  className="gap-2 py-1.5 px-3"
                  style={{
                    backgroundColor: `${tag.color}30`,
                    color: tag.color,
                  }}
                >
                  #{tag.name}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => toggleTag(tagId)}
                  />
                </Badge>
              ) : null
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
