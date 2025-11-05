import { Task, TaskPriority, TaskStatus } from '@/types/task'
import { parseISO, addDays, addWeeks, addMonths, setHours, setMinutes, startOfDay, startOfTomorrow, nextMonday, nextFriday } from 'date-fns'

export interface ParsedTaskData {
  title: string
  priority?: TaskPriority
  status?: TaskStatus
  dueDate?: string
  dueTime?: string
  tags: string[]
  categories: string[]
  estimatedTime?: number
}

/**
 * Natural Language Parser for task creation
 * Examples:
 * - "Review report tomorrow 3pm #urgent @work"
 * - "Call John next Monday at 2:30pm"
 * - "Fix bug high priority due friday"
 * - "Meeting with team next week #important @meetings"
 */
export function parseNaturalLanguage(input: string): ParsedTaskData {
  let remainingText = input
  
  // Extract tags (words starting with #)
  const tagMatches = input.match(/#[\w-]+/g) || []
  const tags = tagMatches.map(tag => tag.substring(1).toLowerCase())
  remainingText = remainingText.replace(/#[\w-]+/g, '').trim()
  
  // Extract categories (words starting with @)
  const categoryMatches = input.match(/@[\w-]+/g) || []
  const categories = categoryMatches.map(cat => cat.substring(1).toLowerCase())
  remainingText = remainingText.replace(/@[\w-]+/g, '').trim()
  
  // Extract priority
  let priority: TaskPriority | undefined
  const priorityPatterns = [
    { pattern: /\b(urgent|critical|asap|!{3,})\b/i, value: 'urgent' as TaskPriority },
    { pattern: /\bhigh\s*priority\b/i, value: 'high' as TaskPriority },
    { pattern: /\b(high|important|!!)\b/i, value: 'high' as TaskPriority },
    { pattern: /\bmedium\s*priority\b/i, value: 'medium' as TaskPriority },
    { pattern: /\b(medium|normal|!)\b/i, value: 'medium' as TaskPriority },
    { pattern: /\blow\s*priority\b/i, value: 'low' as TaskPriority },
    { pattern: /\b(low|minor)\b/i, value: 'low' as TaskPriority },
  ]
  
  for (const { pattern, value } of priorityPatterns) {
    if (pattern.test(remainingText)) {
      priority = value
      remainingText = remainingText.replace(pattern, '').trim()
      break
    }
  }
  
  // Extract due date and time
  let dueDate: Date | undefined
  let hasTime = false
  
  // Time patterns (must come before date patterns)
  const timePattern = /\b(at\s+)?(\d{1,2})[:.](\d{2})\s*(am|pm|AM|PM)?\b/
  const timeMatch = remainingText.match(timePattern)
  let hours: number | undefined
  let minutes: number | undefined
  
  if (timeMatch) {
    hours = parseInt(timeMatch[2])
    minutes = parseInt(timeMatch[3])
    const meridiem = timeMatch[4]?.toLowerCase()
    
    if (meridiem === 'pm' && hours < 12) hours += 12
    if (meridiem === 'am' && hours === 12) hours = 0
    
    hasTime = true
    remainingText = remainingText.replace(timeMatch[0], '').trim()
  }
  
  // Date patterns
  const datePatterns = [
    {
      pattern: /\b(today)\b/i,
      handler: () => startOfDay(new Date())
    },
    {
      pattern: /\b(tomorrow|tmr|tmrw)\b/i,
      handler: () => startOfTomorrow()
    },
    {
      pattern: /\bnext\s+(monday|mon)\b/i,
      handler: () => nextMonday(new Date())
    },
    {
      pattern: /\bnext\s+(tuesday|tue|tues)\b/i,
      handler: () => addDays(nextMonday(new Date()), 1)
    },
    {
      pattern: /\bnext\s+(wednesday|wed)\b/i,
      handler: () => addDays(nextMonday(new Date()), 2)
    },
    {
      pattern: /\bnext\s+(thursday|thu|thur|thurs)\b/i,
      handler: () => addDays(nextMonday(new Date()), 3)
    },
    {
      pattern: /\bnext\s+(friday|fri)\b/i,
      handler: () => nextFriday(new Date())
    },
    {
      pattern: /\bnext\s+(saturday|sat)\b/i,
      handler: () => addDays(nextMonday(new Date()), 5)
    },
    {
      pattern: /\bnext\s+(sunday|sun)\b/i,
      handler: () => addDays(nextMonday(new Date()), 6)
    },
    {
      pattern: /\bin\s+(\d+)\s*days?\b/i,
      handler: (match: RegExpMatchArray) => addDays(new Date(), parseInt(match[1]))
    },
    {
      pattern: /\bin\s+(\d+)\s*weeks?\b/i,
      handler: (match: RegExpMatchArray) => addWeeks(new Date(), parseInt(match[1]))
    },
    {
      pattern: /\bin\s+(\d+)\s*months?\b/i,
      handler: (match: RegExpMatchArray) => addMonths(new Date(), parseInt(match[1]))
    },
    {
      pattern: /\bnext\s+week\b/i,
      handler: () => addWeeks(new Date(), 1)
    },
    {
      pattern: /\bnext\s+month\b/i,
      handler: () => addMonths(new Date(), 1)
    },
    {
      pattern: /\bdue\s+(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
      handler: (match: RegExpMatchArray) => {
        const day = match[1].toLowerCase()
        if (day === 'today') return startOfDay(new Date())
        if (day === 'tomorrow') return startOfTomorrow()
        return nextMonday(new Date()) // Simplified, would need proper day mapping
      }
    },
  ]
  
  for (const { pattern, handler } of datePatterns) {
    const match = remainingText.match(pattern)
    if (match) {
      dueDate = handler(match)
      remainingText = remainingText.replace(match[0], '').trim()
      break
    }
  }
  
  // Apply time to date if both exist
  if (dueDate && hasTime && hours !== undefined && minutes !== undefined) {
    dueDate = setMinutes(setHours(dueDate, hours), minutes)
  }
  
  // Extract estimated time
  let estimatedTime: number | undefined
  const timeEstimatePattern = /\b(\d+)\s*(h|hr|hrs|hour|hours|m|min|mins|minute|minutes)\b/i
  const timeEstimateMatch = remainingText.match(timeEstimatePattern)
  
  if (timeEstimateMatch) {
    const value = parseInt(timeEstimateMatch[1])
    const unit = timeEstimateMatch[2].toLowerCase()
    
    if (unit.startsWith('h')) {
      estimatedTime = value * 60 // convert to minutes
    } else {
      estimatedTime = value
    }
    
    remainingText = remainingText.replace(timeEstimateMatch[0], '').trim()
  }
  
  // Clean up the remaining text for title
  const title = remainingText
    .replace(/\s+/g, ' ')
    .replace(/\bdue\b/gi, '')
    .replace(/\bpriority\b/gi, '')
    .trim()
  
  return {
    title: title || 'New Task',
    priority,
    dueDate: dueDate?.toISOString(),
    tags,
    categories,
    estimatedTime,
  }
}

/**
 * Get suggestions for auto-complete
 */
export function getSuggestions(input: string): string[] {
  const suggestions: string[] = []
  const lower = input.toLowerCase()
  
  // Date suggestions
  if (lower.includes('tom') || lower.includes('today') || lower.includes('next')) {
    suggestions.push(
      'tomorrow',
      'next Monday',
      'next week',
      'in 3 days',
      'next Friday'
    )
  }
  
  // Priority suggestions
  if (lower.includes('high') || lower.includes('urgent') || lower.includes('low')) {
    suggestions.push('high priority', 'urgent', 'low priority', 'medium priority')
  }
  
  // Tag suggestions
  if (lower.includes('#')) {
    suggestions.push('#urgent', '#bug', '#feature', '#design', '#review')
  }
  
  // Category suggestions
  if (lower.includes('@')) {
    suggestions.push('@work', '@personal', '@meetings', '@development', '@marketing')
  }
  
  return suggestions
}
