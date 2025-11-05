"use client"

import { useState } from 'react'
import { InboxItem } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Inbox as InboxIcon, Plus, Check, X, Trash2, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { getInboxItems, addInboxItem, deleteInboxItem, markInboxItemProcessed } from '@/lib/storage'

interface InboxProps {
  onRefresh: () => void
}

export function Inbox({ onRefresh }: InboxProps) {
  const [items, setItems] = useState<InboxItem[]>(getInboxItems())
  const [quickCapture, setQuickCapture] = useState('')
  const [noteInput, setNoteInput] = useState('')

  const refreshItems = () => {
    setItems(getInboxItems())
    onRefresh()
  }

  const handleAddItem = (item: InboxItem) => {
    addInboxItem(item)
    refreshItems()
  }

  const handleDeleteItem = (itemId: string) => {
    deleteInboxItem(itemId)
    refreshItems()
  }

  const handleProcessItem = (item: InboxItem) => {
    markInboxItemProcessed(item.id)
    refreshItems()
    toast.success('Item processed! Convert to task in Your Tasks view')
  }

  const handleQuickCapture = () => {
    if (!quickCapture.trim()) return

    const item: InboxItem = {
      id: `inbox_${Date.now()}`,
      title: quickCapture,
      note: noteInput || undefined,
      createdAt: new Date().toISOString(),
      processed: false
    }

    handleAddItem(item)
    setQuickCapture('')
    setNoteInput('')
    toast.success('Item added to inbox')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleQuickCapture()
    }
  }

  const unprocessedItems = items.filter(i => !i.processed)
  const processedItems = items.filter(i => i.processed)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Quick Capture Inbox</h1>
        <p className="text-muted-foreground">
          Rapidly capture ideas and tasks, process them later
        </p>
      </div>

      {/* Quick Capture Form */}
      <Card className="glass-card p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <InboxIcon className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Quick Capture</h3>
            </div>
            <Input
              value={quickCapture}
              onChange={(e) => setQuickCapture(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="What's on your mind? (Cmd/Ctrl + Enter to add)"
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Textarea
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Additional notes (optional)"
              rows={2}
              className="resize-none"
            />
          </div>

          <Button 
            onClick={handleQuickCapture} 
            disabled={!quickCapture.trim()}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add to Inbox
          </Button>
        </div>
      </Card>

      {/* Unprocessed Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            To Process
            <Badge variant="secondary">{unprocessedItems.length}</Badge>
          </h2>
        </div>

        {unprocessedItems.length === 0 ? (
          <Card className="glass-card p-12 text-center">
            <InboxIcon className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-semibold text-lg mb-2">Inbox Zero! 🎉</h3>
            <p className="text-muted-foreground text-sm">
              All items have been processed. Use quick capture to add new items.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {unprocessedItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="glass-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-base">{item.title}</h4>
                            {item.note && (
                              <p className="text-sm text-muted-foreground mt-1">{item.note}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(new Date(item.createdAt), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleProcessItem(item)}
                          className="gap-2"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          Process
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Processed Items */}
      {processedItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              Recently Processed
              <Badge variant="outline">{processedItems.length}</Badge>
            </h2>
          </div>

          <div className="space-y-2">
            {processedItems.slice(0, 5).map((item) => (
              <Card key={item.id} className="glass-card p-3 opacity-60">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.createdAt), 'MMM d, HH:mm')}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <Card className="glass-card p-4 bg-blue-500/5 border-blue-500/20">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <InboxIcon className="h-4 w-4 text-blue-600" />
          Tips for Using Inbox
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Capture thoughts quickly without overthinking details</li>
          <li>Process items daily to keep your inbox clean</li>
          <li>Use Cmd/Ctrl + Enter for faster capture</li>
          <li>Convert items to full tasks when ready</li>
        </ul>
      </Card>
    </div>
  )
}