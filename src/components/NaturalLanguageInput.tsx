"use client"

import { useState, useRef, useEffect } from 'react'
import { parseNaturalLanguage, getSuggestions, ParsedTaskData } from '@/lib/naturalLanguageParser'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Calendar, Tag, FolderOpen, Clock, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NaturalLanguageInputProps {
  onParse: (data: ParsedTaskData) => void
  placeholder?: string
  className?: string
}

export function NaturalLanguageInput({ onParse, placeholder, className }: NaturalLanguageInputProps) {
  const [input, setInput] = useState('')
  const [parsed, setParsed] = useState<ParsedTaskData | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    if (input.length > 3) {
      const result = parseNaturalLanguage(input)
      setParsed(result)
      setShowPreview(true)
    } else {
      setShowPreview(false)
    }
  }, [input])
  
  const handleSubmit = () => {
    if (parsed && input.trim()) {
      onParse(parsed)
      setInput('')
      setParsed(null)
      setShowPreview(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }
  
  const priorityColors = {
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }
  
  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/60" />
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Try: 'Review report tomorrow 3pm #urgent @work'"}
          className="pl-11 pr-24 h-12 text-base"
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!input.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          Create
        </Button>
      </div>
      
      {showPreview && parsed && (
        <Card className="mt-2 p-4 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <div className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Smart Preview
              </div>
              <div className="font-semibold">{parsed.title}</div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {parsed.priority && (
                <Badge variant="outline" className={priorityColors[parsed.priority]}>
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {parsed.priority.charAt(0).toUpperCase() + parsed.priority.slice(1)}
                </Badge>
              )}
              
              {parsed.dueDate && (
                <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(parsed.dueDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    hour: parsed.dueDate.includes('T') ? 'numeric' : undefined,
                    minute: parsed.dueDate.includes('T') ? '2-digit' : undefined,
                  })}
                </Badge>
              )}
              
              {parsed.estimatedTime && (
                <Badge variant="outline" className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400">
                  <Clock className="h-3 w-3 mr-1" />
                  {parsed.estimatedTime >= 60 
                    ? `${Math.floor(parsed.estimatedTime / 60)}h ${parsed.estimatedTime % 60}m`
                    : `${parsed.estimatedTime}m`
                  }
                </Badge>
              )}
              
              {parsed.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
              
              {parsed.categories.map((cat, i) => (
                <Badge key={i} variant="outline" className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                  <FolderOpen className="h-3 w-3 mr-1" />
                  {cat}
                </Badge>
              ))}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to create or keep typing to refine
            </div>
          </div>
        </Card>
      )}
      
      <div className="mt-2 text-xs text-muted-foreground">
        <span className="font-medium">Examples:</span> "Fix bug tomorrow #urgent" • "Meeting next Monday 2pm @work" • "Review in 3 days"
      </div>
    </div>
  )
}
