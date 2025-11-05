"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Command, Search } from 'lucide-react'

interface Shortcut {
  keys: string[]
  description: string
  category: string
}

const shortcuts: Shortcut[] = [
  // Navigation
  { keys: ['1'], description: 'Navigate to Dashboard', category: 'Navigation' },
  { keys: ['2'], description: 'Navigate to Your Tasks', category: 'Navigation' },
  { keys: ['3'], description: 'Navigate to Kanban Board', category: 'Navigation' },
  { keys: ['4'], description: 'Navigate to Calendar', category: 'Navigation' },
  { keys: ['5'], description: 'Navigate to Analytics', category: 'Navigation' },
  { keys: ['6'], description: 'Navigate to Inbox', category: 'Navigation' },
  { keys: ['7'], description: 'Navigate to Templates', category: 'Navigation' },
  { keys: ['8'], description: 'Navigate to Settings', category: 'Navigation' },
  
  // Actions
  { keys: ['Ctrl', 'K'], description: 'Create new task', category: 'Actions' },
  { keys: ['Ctrl', '/'], description: 'Focus search bar', category: 'Actions' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Actions' },
  { keys: ['Esc'], description: 'Close modals / Exit search', category: 'Actions' },
]

interface KeyboardShortcutsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredShortcuts = shortcuts.filter(shortcut => 
    shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    shortcut.keys.some(key => key.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = []
    }
    acc[shortcut.category].push(shortcut)
    return acc
  }, {} as Record<string, Shortcut[]>)

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const formatKey = (key: string) => {
    if (key === 'Ctrl' && isMac) return '⌘'
    if (key === 'Ctrl') return 'Ctrl'
    if (key === 'Alt') return isMac ? '⌥' : 'Alt'
    if (key === 'Shift') return isMac ? '⇧' : 'Shift'
    return key
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Command className="h-6 w-6" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="overflow-y-auto flex-1 space-y-6 pr-2">
          {Object.keys(groupedShortcuts).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No shortcuts found matching "{searchQuery}"
            </div>
          ) : (
            Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h3 className="font-display font-semibold text-lg mb-3 text-primary">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg glass-card hover:bg-accent/50 transition-colors"
                    >
                      <span className="text-sm">{shortcut.description}</span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <div key={keyIndex} className="flex items-center">
                            <Badge
                              variant="secondary"
                              className="font-mono text-xs px-2 py-1 bg-background/50"
                            >
                              {formatKey(key)}
                            </Badge>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="mx-1 text-muted-foreground text-xs">+</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
          Press <Badge variant="secondary" className="mx-1 text-xs">?</Badge> anytime to open this dialog
        </div>
      </DialogContent>
    </Dialog>
  )
}
