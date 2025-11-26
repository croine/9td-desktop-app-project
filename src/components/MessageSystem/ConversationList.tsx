"use client"

import { useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Plus, Search, Users, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Conversation {
  id: number
  name: string | null
  isGroup: boolean
  participants: Array<{ id: string; name: string; email: string }>
  lastMessage: {
    content: string
    createdAt: Date
    senderName: string
  } | null
  unreadCount: number
  updatedAt: Date
}

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversationId: number | null
  currentUserId: string
  onSelectConversation: (conversationId: number) => void
  onNewConversation: () => void
  isLoading: boolean
}

export function ConversationList({
  conversations,
  selectedConversationId,
  currentUserId,
  onSelectConversation,
  onNewConversation,
  isLoading
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredConversations = conversations.filter((conv) => {
    const conversationName = conv.name || conv.participants
      .filter(p => p.id !== currentUserId)
      .map(p => p.name)
      .join(', ')
    
    return conversationName.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60))
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60))
        return minutes === 0 ? 'Just now' : `${minutes}m ago`
      }
      return `${hours}h ago`
    } else if (days === 1) {
      return 'Yesterday'
    } else if (days < 7) {
      return `${days}d ago`
    } else {
      return new Date(date).toLocaleDateString()
    }
  }

  const getConversationName = (conv: Conversation) => {
    if (conv.name) return conv.name
    const otherParticipants = conv.participants.filter(p => p.id !== currentUserId)
    return otherParticipants.map(p => p.name).join(', ') || 'Unknown'
  }

  const getConversationInitials = (conv: Conversation) => {
    const name = getConversationName(conv)
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex flex-col h-full border-r bg-card/50">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Messages</h2>
          <Button
            size="sm"
            onClick={onNewConversation}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <MessageCircle className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'No conversations found' : 'No conversations yet'}
                </p>
                {!searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNewConversation}
                    className="mt-2"
                  >
                    Start a conversation
                  </Button>
                )}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-auto py-3 px-3 hover:bg-accent/50 transition-colors",
                      selectedConversationId === conversation.id && "bg-accent"
                    )}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="flex items-start gap-3 w-full">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={cn(
                            "text-xs font-semibold",
                            conversation.isGroup ? "bg-primary/10 text-primary" : "bg-accent text-accent-foreground"
                          )}>
                            {conversation.isGroup ? (
                              <Users className="h-4 w-4" />
                            ) : (
                              getConversationInitials(conversation)
                            )}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unreadCount > 0 && (
                          <Badge
                            variant="default"
                            className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1 text-[10px] font-bold"
                          >
                            {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className={cn(
                            "text-sm font-medium truncate",
                            conversation.unreadCount > 0 && "font-semibold"
                          )}>
                            {getConversationName(conversation)}
                          </p>
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {formatTime(conversation.updatedAt)}
                          </span>
                        </div>
                        
                        {conversation.lastMessage && (
                          <p className={cn(
                            "text-xs truncate",
                            conversation.unreadCount > 0 
                              ? "text-foreground font-medium" 
                              : "text-muted-foreground"
                          )}>
                            {conversation.lastMessage.senderName}: {conversation.lastMessage.content}
                          </p>
                        )}
                      </div>
                    </div>
                  </Button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  )
}
