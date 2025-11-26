"use client"

import { useState, useEffect, useCallback } from 'react'
import { useSession } from '@/lib/auth-client'
import { ConversationList } from './ConversationList'
import { MessageThread } from './MessageThread'
import { MessageInput } from './MessageInput'
import { NewConversationDialog } from './NewConversationDialog'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
}

interface Participant {
  id: string
  name: string
  email: string
}

interface Conversation {
  id: number
  name: string | null
  isGroup: boolean
  participants: Participant[]
  lastMessage: {
    content: string
    createdAt: Date
    senderName: string
  } | null
  unreadCount: number
  createdAt: Date
  updatedAt: Date
}

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

export function MessageSystem() {
  const { data: session } = useSession()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [availableUsers, setAvailableUsers] = useState<User[]>([])
  const [newConversationOpen, setNewConversationOpen] = useState(false)
  
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  const token = typeof window !== 'undefined' ? localStorage.getItem('bearer_token') : null

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!token) return

    try {
      const response = await fetch('/api/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }

      const data = await response.json()
      setConversations(data.conversations || [])
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setIsLoadingConversations(false)
    }
  }, [token])

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (conversationId: number, before?: number) => {
    if (!token) return

    setIsLoadingMessages(true)
    try {
      const url = new URL(`/api/conversations/${conversationId}/messages`, window.location.origin)
      url.searchParams.set('limit', '50')
      if (before) {
        url.searchParams.set('before', before.toString())
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      
      if (before) {
        // Prepend older messages
        setMessages(prev => [...data.messages.reverse(), ...prev])
      } else {
        // Replace with new messages
        setMessages(data.messages.reverse())
      }
      
      setHasMoreMessages(data.hasMore || false)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setIsLoadingMessages(false)
    }
  }, [token])

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationId: number) => {
    if (!token) return

    try {
      await fetch(`/api/conversations/${conversationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      // Update unread count locally
      setConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ))
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }, [token])

  // Send message
  const handleSendMessage = async (content: string) => {
    if (!token || !selectedConversationId) return

    try {
      const response = await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content,
          messageType: 'text'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const newMessage = await response.json()
      
      // Add message to list
      setMessages(prev => [...prev, newMessage])
      
      // Update conversation's last message and move to top
      setConversations(prev => {
        const updated = prev.map(conv => 
          conv.id === selectedConversationId
            ? {
                ...conv,
                lastMessage: {
                  content: newMessage.content,
                  createdAt: newMessage.createdAt,
                  senderName: newMessage.sender.name
                },
                updatedAt: newMessage.createdAt
              }
            : conv
        )
        
        // Sort by updatedAt
        return updated.sort((a, b) => 
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      })
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      throw error
    }
  }

  // Create new conversation
  const handleCreateConversation = async (
    participantIds: string[], 
    name: string | null, 
    isGroup: boolean
  ) => {
    if (!token) return

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          participantIds,
          name,
          isGroup
        })
      })

      if (!response.ok) {
        const error = await response.json()
        
        // Check if conversation already exists
        if (error.code === 'CONVERSATION_EXISTS' && error.existingConversation) {
          // Select existing conversation
          setSelectedConversationId(error.existingConversation.id)
          toast.info('Opening existing conversation')
          return
        }
        
        throw new Error(error.error || 'Failed to create conversation')
      }

      const newConversation = await response.json()
      
      // Add to conversations list
      setConversations(prev => [newConversation, ...prev])
      
      // Select new conversation
      setSelectedConversationId(newConversation.id)
      
      toast.success('Conversation created successfully')
    } catch (error: any) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  // Fetch available users for new conversation
  const fetchAvailableUsers = useCallback(async () => {
    if (!token || isLoadingUsers) return

    setIsLoadingUsers(true)
    try {
      const response = await fetch('/api/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setAvailableUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setIsLoadingUsers(false)
    }
  }, [token, isLoadingUsers])

  // Select conversation
  const handleSelectConversation = useCallback((conversationId: number) => {
    setSelectedConversationId(conversationId)
    fetchMessages(conversationId)
    markAsRead(conversationId)
  }, [fetchMessages, markAsRead])

  // Load more messages
  const handleLoadMore = useCallback(() => {
    if (!selectedConversationId || !hasMoreMessages || isLoadingMessages) return
    
    const oldestMessageId = messages[0]?.id
    if (oldestMessageId) {
      fetchMessages(selectedConversationId, oldestMessageId)
    }
  }, [selectedConversationId, hasMoreMessages, isLoadingMessages, messages, fetchMessages])

  // Initial load
  useEffect(() => {
    if (session?.user && token) {
      fetchConversations()
    }
  }, [session, token, fetchConversations])

  // Poll for new messages every 5 seconds
  useEffect(() => {
    if (!selectedConversationId || !token) return

    const interval = setInterval(() => {
      fetchMessages(selectedConversationId)
      fetchConversations()
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedConversationId, token, fetchMessages, fetchConversations])

  // Fetch users when opening new conversation dialog
  useEffect(() => {
    if (newConversationOpen && availableUsers.length === 0) {
      fetchAvailableUsers()
    }
  }, [newConversationOpen, availableUsers.length, fetchAvailableUsers])

  if (!session?.user) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <Card className="glass-card p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading message system...</p>
        </Card>
      </div>
    )
  }

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null

  return (
    <>
      <Card className="glass-card overflow-hidden h-[calc(100vh-12rem)]">
        <div className="flex h-full">
          {/* Conversation List - Desktop: always visible, Mobile: hidden when conversation selected */}
          <div className={`
            w-full md:w-80 lg:w-96 border-r
            ${selectedConversationId ? 'hidden md:block' : 'block'}
          `}>
            <ConversationList
              conversations={conversations}
              selectedConversationId={selectedConversationId}
              currentUserId={session.user.id}
              onSelectConversation={handleSelectConversation}
              onNewConversation={() => setNewConversationOpen(true)}
              isLoading={isLoadingConversations}
            />
          </div>

          {/* Message Thread - Desktop: always visible, Mobile: shown when conversation selected */}
          <div className={`
            flex-1 flex flex-col
            ${selectedConversationId ? 'block' : 'hidden md:flex'}
          `}>
            <MessageThread
              conversation={selectedConversation}
              messages={messages}
              currentUserId={session.user.id}
              isLoading={isLoadingMessages}
              hasMore={hasMoreMessages}
              onLoadMore={handleLoadMore}
              onBack={() => setSelectedConversationId(null)}
            />
            
            {selectedConversation && (
              <MessageInput
                onSendMessage={handleSendMessage}
                disabled={!selectedConversationId}
                placeholder={`Message ${selectedConversation.isGroup ? selectedConversation.name : selectedConversation.participants.filter(p => p.id !== session.user.id).map(p => p.name).join(', ')}...`}
              />
            )}
          </div>
        </div>
      </Card>

      {/* New Conversation Dialog */}
      <NewConversationDialog
        open={newConversationOpen}
        onOpenChange={setNewConversationOpen}
        availableUsers={availableUsers}
        currentUserId={session.user.id}
        onCreateConversation={handleCreateConversation}
      />
    </>
  )
}
