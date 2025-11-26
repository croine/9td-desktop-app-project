"use client"

import { useEffect, useRef, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, MoreVertical, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Message {
  id: number
  sender: {
    id: string
    name: string
    email: string
  }
  content: string
  messageType: 'text' | 'system' | 'task_mention'
  metadata: any
  createdAt: Date
}

interface Conversation {
  id: number
  name: string | null
  isGroup: boolean
  participants: Array<{ id: string; name: string; email: string }>
}

interface MessageThreadProps {
  conversation: Conversation | null
  messages: Message[]
  currentUserId: string
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onBack?: () => void
}

export function MessageThread({
  conversation,
  messages,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
  onBack
}: MessageThreadProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  useEffect(() => {
    if (shouldAutoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages, shouldAutoScroll])

  const handleScroll = (e: any) => {
    const element = e.target
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100
    setShouldAutoScroll(isAtBottom)

    // Load more when scrolling to top
    if (element.scrollTop < 100 && hasMore && !isLoading) {
      onLoadMore()
    }
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">No conversation selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a conversation to start messaging
            </p>
          </div>
        </div>
      </div>
    )
  }

  const getConversationName = () => {
    if (conversation.name) return conversation.name
    const otherParticipants = conversation.participants.filter(p => p.id !== currentUserId)
    return otherParticipants.map(p => p.name).join(', ') || 'Unknown'
  }

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const messageDate = new Date(date)
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today'
    }
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    }
    
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {}
    messages.forEach(message => {
      const date = formatDate(message.createdAt)
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="p-4 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onBack}
                className="md:hidden"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            
            <Avatar className="h-10 w-10">
              <AvatarFallback className={cn(
                "text-sm font-semibold",
                conversation.isGroup ? "bg-primary/10 text-primary" : "bg-accent"
              )}>
                {conversation.isGroup ? (
                  <Users className="h-5 w-5" />
                ) : (
                  getConversationName().split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                )}
              </AvatarFallback>
            </Avatar>

            <div>
              <h3 className="font-semibold text-sm">{getConversationName()}</h3>
              <p className="text-xs text-muted-foreground">
                {conversation.participants.length} participant{conversation.participants.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View participants</DropdownMenuItem>
              <DropdownMenuItem>Conversation settings</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Leave conversation</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea 
        ref={scrollAreaRef} 
        className="flex-1"
        onScrollCapture={handleScroll}
      >
        <div className="p-4 space-y-6">
          {isLoading && hasMore && (
            <div className="flex justify-center py-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {Object.entries(messageGroups).map(([date, dateMessages]) => (
              <div key={date} className="space-y-4">
                {/* Date Separator */}
                <div className="flex items-center justify-center">
                  <Badge variant="secondary" className="text-xs">
                    {date}
                  </Badge>
                </div>

                {/* Messages for this date */}
                {dateMessages.map((message, index) => {
                  const isCurrentUser = message.sender.id === currentUserId
                  const isSystemMessage = message.messageType === 'system'
                  const isTaskMention = message.messageType === 'task_mention'

                  if (isSystemMessage) {
                    return (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-center"
                      >
                        <Badge variant="outline" className="text-xs">
                          {message.content}
                        </Badge>
                      </motion.div>
                    )
                  }

                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={cn(
                        "flex gap-3",
                        isCurrentUser ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {/* Avatar (only for other users) */}
                      {!isCurrentUser && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {message.sender.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      {/* Message Content */}
                      <div className={cn(
                        "flex flex-col max-w-[70%]",
                        isCurrentUser ? "items-end" : "items-start"
                      )}>
                        {!isCurrentUser && (
                          <span className="text-xs font-medium text-muted-foreground mb-1 px-1">
                            {message.sender.name}
                          </span>
                        )}
                        
                        <div className={cn(
                          "rounded-2xl px-4 py-2 shadow-sm",
                          isCurrentUser 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted",
                          isTaskMention && "border-2 border-accent"
                        )}>
                          {isTaskMention && message.metadata && (
                            <div className="flex items-center gap-2 mb-1 pb-1 border-b border-current/20">
                              <Badge variant="outline" className="text-[10px] h-4">
                                Task
                              </Badge>
                              <span className="text-xs font-medium">
                                {message.metadata.taskId}
                              </span>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>

                        <span className="text-[10px] text-muted-foreground mt-1 px-1">
                          {formatTime(message.createdAt)}
                        </span>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ))}
          </AnimatePresence>

          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
