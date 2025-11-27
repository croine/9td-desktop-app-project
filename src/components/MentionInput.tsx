"use client"

import { useState, useRef, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AtSign, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MentionInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  availableUsers?: string[]
  className?: string
  rows?: number
}

export function MentionInput({
  value,
  onChange,
  placeholder = 'Type @ to mention someone...',
  availableUsers = ['You', 'Team', 'Admin', 'Support'],
  className,
  rows = 3,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionQuery, setSuggestionQuery] = useState('')
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const mentions = extractMentions(value)
  const filteredUsers = availableUsers.filter(user =>
    user.toLowerCase().includes(suggestionQuery.toLowerCase())
  )

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    onChange(newValue)
    setCursorPosition(cursorPos)

    // Check if we should show mention suggestions
    const textBeforeCursor = newValue.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      // Only show suggestions if there's no space after @
      if (!textAfterAt.includes(' ')) {
        setSuggestionQuery(textAfterAt)
        setShowSuggestions(true)
        return
      }
    }
    
    setShowSuggestions(false)
  }

  const insertMention = (user: string) => {
    const textBeforeCursor = value.slice(0, cursorPosition)
    const textAfterCursor = value.slice(cursorPosition)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const beforeAt = value.slice(0, lastAtIndex)
      const newValue = `${beforeAt}@${user} ${textAfterCursor}`
      onChange(newValue)
      setShowSuggestions(false)
      
      // Focus back on textarea
      setTimeout(() => {
        if (textareaRef.current) {
          const newCursorPos = lastAtIndex + user.length + 2
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }
  }

  const removeMention = (mention: string) => {
    const newValue = value.replace(new RegExp(`@${mention}\\b`, 'g'), mention)
    onChange(newValue)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
      e.preventDefault()
      // Simple implementation: just select first suggestion on Enter
      if (e.key === 'Enter' && filteredUsers.length > 0) {
        insertMention(filteredUsers[0])
      }
    }
    
    if (e.key === 'Escape' && showSuggestions) {
      setShowSuggestions(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={cn('resize-none', className)}
        />

        {/* Mention Suggestions Dropdown */}
        {showSuggestions && filteredUsers.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-w-[300px] rounded-lg border bg-popover shadow-lg">
            <div className="p-2 space-y-1">
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <AtSign className="h-3 w-3" />
                Mention user
              </div>
              {filteredUsers.map((user) => (
                <button
                  key={user}
                  type="button"
                  onClick={() => insertMention(user)}
                  className="w-full px-3 py-2 text-sm text-left rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">
                      {user.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium">{user}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mention Pills */}
      {mentions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {mentions.map((mention, idx) => (
            <Badge
              key={idx}
              variant="secondary"
              className="gap-1 pr-1"
            >
              <AtSign className="h-3 w-3" />
              {mention}
              <button
                type="button"
                onClick={() => removeMention(mention)}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Type <kbd className="px-1.5 py-0.5 rounded bg-muted border text-[10px] font-mono">@</kbd> to mention someone
      </p>
    </div>
  )
}

function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g
  const mentions: string[] = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    if (!mentions.includes(match[1])) {
      mentions.push(match[1])
    }
  }

  return mentions
}

export { extractMentions }
