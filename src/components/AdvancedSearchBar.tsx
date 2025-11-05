"use client"

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { 
  Search, 
  Filter, 
  X, 
  SlidersHorizontal, 
  Calendar,
  Clock,
  Star,
  Bookmark,
  History,
  TrendingUp,
  ArrowUpDown,
  ChevronDown,
  Sparkles
} from 'lucide-react'
import { Tag, Category, TaskPriority, TaskStatus } from '@/types/task'
import { motion, AnimatePresence } from 'framer-motion'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'
import { toast } from 'sonner'

export interface AdvancedSearchFilters {
  query: string
  priority?: TaskPriority
  status?: TaskStatus
  tags: string[]
  categories: string[]
  dateRange?: 'today' | 'week' | 'month' | 'overdue' | 'custom'
  sortBy?: 'dueDate' | 'priority' | 'created' | 'title'
  sortOrder?: 'asc' | 'desc'
  assignees?: string[]
}

interface SavedSearch {
  id: string
  name: string
  filters: AdvancedSearchFilters
}

interface AdvancedSearchBarProps {
  filters: AdvancedSearchFilters
  onFiltersChange: (filters: AdvancedSearchFilters) => void
  tags: Tag[]
  categories: Category[]
  onSearch?: () => void
}

export function AdvancedSearchBar({ 
  filters, 
  onFiltersChange, 
  tags, 
  categories,
  onSearch 
}: AdvancedSearchBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [searchNameInput, setSearchNameInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Load saved data from localStorage
  useEffect(() => {
    const history = localStorage.getItem('searchHistory')
    const saved = localStorage.getItem('savedSearches')
    if (history) setSearchHistory(JSON.parse(history))
    if (saved) setSavedSearches(JSON.parse(saved))
  }, [])

  // Save search history
  const addToHistory = (query: string) => {
    if (!query.trim()) return
    const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5)
    setSearchHistory(newHistory)
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  }

  // Handle search execution
  const handleSearch = () => {
    addToHistory(filters.query)
    setShowSuggestions(false)
    setShowHistory(false)
    onSearch?.()
  }

  // Handle Enter key
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
      setShowHistory(false)
    }
  }

  // Calculate active filter count
  const activeFilterCount = 
    (filters.priority ? 1 : 0) +
    (filters.status ? 1 : 0) +
    (filters.dateRange ? 1 : 0) +
    (filters.sortBy ? 1 : 0) +
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

  // Quick filter presets
  const quickFilters = [
    { label: 'Overdue', icon: Clock, filter: () => onFiltersChange({ ...filters, dateRange: 'overdue' }) },
    { label: 'High Priority', icon: Star, filter: () => onFiltersChange({ ...filters, priority: 'high' }) },
    { label: 'In Progress', icon: TrendingUp, filter: () => onFiltersChange({ ...filters, status: 'in-progress' }) },
  ]

  // Auto-suggestions based on tags and categories
  const getSuggestions = () => {
    const query = filters.query.toLowerCase()
    if (!query) return []
    
    const tagSuggestions = tags
      .filter(t => t.name.toLowerCase().includes(query))
      .map(t => ({ type: 'tag', label: `#${t.name}`, value: t.id, color: t.color }))
    
    const categorySuggestions = categories
      .filter(c => c.name.toLowerCase().includes(query))
      .map(c => ({ type: 'category', label: c.name, value: c.id, color: c.color, icon: c.icon }))
    
    return [...tagSuggestions, ...categorySuggestions].slice(0, 5)
  }

  const suggestions = getSuggestions()

  // Save current search
  const saveCurrentSearch = () => {
    if (!searchNameInput.trim()) {
      toast.error('Please enter a name for this search')
      return
    }
    
    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchNameInput.trim(),
      filters: { ...filters }
    }
    
    const updated = [...savedSearches, newSearch]
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
    
    // Close dialog and reset
    setSaveDialogOpen(false)
    setSearchNameInput('')
    toast.success(`Search "${searchNameInput}" saved successfully`)
  }

  const loadSavedSearch = (search: SavedSearch) => {
    onFiltersChange(search.filters)
  }

  const deleteSavedSearch = (id: string) => {
    const updated = savedSearches.filter(s => s.id !== id)
    setSavedSearches(updated)
    localStorage.setItem('savedSearches', JSON.stringify(updated))
  }

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Main Search Bar - Compact with Integrated Filter Button */}
      <div className="relative">
        {/* Search Input with Filter Button Inside */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute left-3 top-1/2 -translate-y-1/2 cursor-pointer z-10"
            onClick={handleSearch}
          >
            <Search className="h-4 w-4 text-primary animate-pulse" />
          </motion.div>
          
          <Input
            ref={inputRef}
            value={filters.query}
            onChange={(e) => {
              onFiltersChange({ ...filters, query: e.target.value })
              setShowSuggestions(e.target.length > 0)
            }}
            onFocus={() => {
              if (filters.query.length > 0) setShowSuggestions(true)
              else if (searchHistory.length > 0) setShowHistory(true)
            }}
            onBlur={() => {
              setTimeout(() => {
                setShowSuggestions(false)
                setShowHistory(false)
              }, 200)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search tasks..."
            className="pl-11 pr-28 h-9 text-sm bg-background/50 backdrop-blur-sm"
          />

          {/* Integrated Filter Buttons on Right Side */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            {/* Advanced Filters Button */}
            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="h-6 px-2 relative gap-1 text-xs">
                  <SlidersHorizontal className="h-3 w-3" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge 
                      className="ml-0.5 h-3.5 w-3.5 p-0 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px]"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[700px] p-0" align="end">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-semibold text-lg">Advanced Filters</h3>
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

                  {/* Two Column Grid Layout */}
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {/* Sort Options */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4" />
                          Sort By
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={filters.sortBy || "dueDate"}
                            onValueChange={(value) => 
                              onFiltersChange({ 
                                ...filters, 
                                sortBy: value as any
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dueDate">Due Date</SelectItem>
                              <SelectItem value="priority">Priority</SelectItem>
                              <SelectItem value="created">Created</SelectItem>
                              <SelectItem value="title">Title</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select
                            value={filters.sortOrder || "asc"}
                            onValueChange={(value) => 
                              onFiltersChange({ 
                                ...filters, 
                                sortOrder: value as any
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">Ascending</SelectItem>
                              <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Date Range */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Date Range
                        </label>
                        <Select
                          value={filters.dateRange || "all"}
                          onValueChange={(value) => 
                            onFiltersChange({ 
                              ...filters, 
                              dateRange: value === "all" ? undefined : value as any 
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="week">This Week</SelectItem>
                            <SelectItem value="month">This Month</SelectItem>
                            <SelectItem value="overdue">Overdue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Priority Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Priority
                        </label>
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
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      {/* Categories */}
                      {categories.length > 0 && (
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
                      )}

                      {/* Tags */}
                      {tags.length > 0 && (
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
                      )}
                    </div>
                  </div>

                  {/* Save Search - Full Width at Bottom */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setSaveDialogOpen(true)}
                      className="w-full gap-2"
                    >
                      <Bookmark className="h-4 w-4" />
                      Save This Search
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Saved Searches Button */}
            {savedSearches.length > 0 && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="h-6 px-2 text-xs">
                    <Bookmark className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-3">
                    <h3 className="font-display font-semibold">Saved Searches</h3>
                    {savedSearches.map(search => (
                      <div
                        key={search.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <button
                          onClick={() => loadSavedSearch(search)}
                          className="flex-1 text-left"
                        >
                          <p className="font-medium text-sm">{search.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {search.filters.query || 'No query'}
                          </p>
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedSearch(search.id)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* Auto-suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 w-full bg-popover border rounded-lg shadow-lg z-50 overflow-hidden"
              >
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Sparkles className="h-3 w-3" />
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      className="w-full px-3 py-2 text-left rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                      onClick={() => {
                        if (suggestion.type === 'tag') {
                          toggleTag(suggestion.value)
                        } else {
                          toggleCategory(suggestion.value)
                        }
                        setShowSuggestions(false)
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: suggestion.color }}
                      />
                      <span className="text-sm">{suggestion.label}</span>
                      <Badge variant="outline" className="ml-auto text-xs">
                        {suggestion.type}
                      </Badge>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search History Dropdown */}
          <AnimatePresence>
            {showHistory && searchHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full mt-2 w-full bg-popover border rounded-lg shadow-lg z-50 overflow-hidden"
              >
                <div className="p-2 space-y-1">
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <History className="h-3 w-3" />
                    Recent Searches
                  </div>
                  {searchHistory.map((query, i) => (
                    <button
                      key={i}
                      className="w-full px-3 py-2 text-left rounded-md hover:bg-accent transition-colors flex items-center gap-2 text-sm"
                      onClick={() => {
                        onFiltersChange({ ...filters, query })
                        setShowHistory(false)
                      }}
                    >
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {query}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
            <DialogDescription>
              Give this search a name so you can quickly access it later.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                placeholder="e.g., High Priority Tasks"
                value={searchNameInput}
                onChange={(e) => setSearchNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    saveCurrentSearch()
                  }
                }}
                autoFocus
              />
            </div>
            {/* Show current filters summary */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Current Filters:</Label>
              <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-muted/50">
                {filters.query && (
                  <Badge variant="secondary">Query: {filters.query}</Badge>
                )}
                {filters.priority && (
                  <Badge variant="secondary">Priority: {filters.priority}</Badge>
                )}
                {filters.status && (
                  <Badge variant="secondary">Status: {filters.status}</Badge>
                )}
                {filters.dateRange && (
                  <Badge variant="secondary">Date: {filters.dateRange}</Badge>
                )}
                {filters.tags.length > 0 && (
                  <Badge variant="secondary">{filters.tags.length} Tags</Badge>
                )}
                {filters.categories.length > 0 && (
                  <Badge variant="secondary">{filters.categories.length} Categories</Badge>
                )}
                {!filters.query && !filters.priority && !filters.status && !filters.dateRange && 
                 filters.tags.length === 0 && filters.categories.length === 0 && (
                  <span className="text-sm text-muted-foreground">No filters applied</span>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setSaveDialogOpen(false)
              setSearchNameInput('')
            }}>
              Cancel
            </Button>
            <Button onClick={saveCurrentSearch}>
              <Bookmark className="h-4 w-4 mr-2" />
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}