"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Save, 
  Trash2, 
  Star,
  Filter,
  Plus,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import { AdvancedSearchFilters } from '@/components/AdvancedSearchBar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface SavedFilter {
  id: string
  name: string
  filters: AdvancedSearchFilters
  isFavorite: boolean
  createdAt: string
}

interface SavedFiltersProps {
  currentFilters: AdvancedSearchFilters
  onFilterApply: (filters: AdvancedSearchFilters) => void
}

export function SavedFilters({ currentFilters, onFilterApply }: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState('')

  // Load saved filters
  useEffect(() => {
    const saved = localStorage.getItem('saved_filters')
    if (saved) {
      setSavedFilters(JSON.parse(saved))
    }
  }, [])

  // Save filters to localStorage
  const saveToStorage = (filters: SavedFilter[]) => {
    localStorage.setItem('saved_filters', JSON.stringify(filters))
    setSavedFilters(filters)
  }

  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error('Please enter a filter name')
      return
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filters: currentFilters,
      isFavorite: false,
      createdAt: new Date().toISOString()
    }

    saveToStorage([...savedFilters, newFilter])
    toast.success(`Filter "${filterName}" saved`)
    setShowSaveDialog(false)
    setFilterName('')
  }

  const handleDeleteFilter = (id: string) => {
    const filter = savedFilters.find(f => f.id === id)
    saveToStorage(savedFilters.filter(f => f.id !== id))
    toast.success(`Filter "${filter?.name}" deleted`)
  }

  const handleToggleFavorite = (id: string) => {
    saveToStorage(
      savedFilters.map(f =>
        f.id === id ? { ...f, isFavorite: !f.isFavorite } : f
      )
    )
  }

  const handleApplyFilter = (filter: SavedFilter) => {
    onFilterApply(filter.filters)
    toast.success(`Filter "${filter.name}" applied`)
  }

  const getFilterDescription = (filters: AdvancedSearchFilters): string => {
    const parts: string[] = []
    
    if (filters.query) parts.push(`Search: "${filters.query}"`)
    if (filters.priority) parts.push(`Priority: ${filters.priority}`)
    if (filters.status) parts.push(`Status: ${filters.status}`)
    if (filters.tags?.length) parts.push(`${filters.tags.length} tags`)
    if (filters.categories?.length) parts.push(`${filters.categories.length} categories`)
    if (filters.dateRange) parts.push(`Date: ${filters.dateRange}`)
    
    return parts.join(' • ') || 'No filters'
  }

  const favoriteFilters = savedFilters.filter(f => f.isFavorite)
  const regularFilters = savedFilters.filter(f => !f.isFavorite)

  return (
    <div className="space-y-4">
      {/* Save Current Filter Button */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="font-semibold mb-1">Current Filters</h3>
            <p className="text-sm text-muted-foreground">
              {getFilterDescription(currentFilters)}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSaveDialog(true)}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </Card>

      {/* Favorite Filters */}
      {favoriteFilters.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            Favorite Filters
          </h3>
          {favoriteFilters.map(filter => (
            <Card
              key={filter.id}
              className="p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleApplyFilter(filter)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium mb-1 flex items-center gap-2">
                    {filter.name}
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {getFilterDescription(filter.filters)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(filter.id)
                    }}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFilter(filter.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Regular Filters */}
      {regularFilters.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Saved Filters
          </h3>
          {regularFilters.map(filter => (
            <Card
              key={filter.id}
              className="p-4 cursor-pointer hover:shadow-md transition-all"
              onClick={() => handleApplyFilter(filter)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium mb-1">{filter.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {getFilterDescription(filter.filters)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(filter.id)
                    }}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteFilter(filter.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {savedFilters.length === 0 && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground space-y-3">
            <Filter className="h-12 w-12 mx-auto opacity-50" />
            <h3 className="font-semibold">No saved filters yet</h3>
            <p className="text-sm">
              Apply some filters and save them for quick access
            </p>
          </div>
        </Card>
      )}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Give this filter a name to save it for later use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Filter name (e.g., High Priority Tasks)"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveFilter()
                }
              }}
            />
            <div className="text-sm text-muted-foreground">
              Current filters: {getFilterDescription(currentFilters)}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSaveDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveFilter}>
              <Check className="h-4 w-4 mr-2" />
              Save Filter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
