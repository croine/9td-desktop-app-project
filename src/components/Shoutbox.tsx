"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { MessageSquare, Send, Trash2, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'

interface Shout {
  id: number
  message: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

export function Shoutbox() {
  const [shouts, setShouts] = useState<Shout[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch shouts
  const fetchShouts = async (showLoader = true) => {
    if (showLoader) setIsLoading(true)
    
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      toast.error('Please sign in to view shoutbox')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/shoutbox', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch shouts')
      }

      const data = await response.json()
      setShouts(data)
    } catch (error) {
      console.error('Failed to fetch shouts:', error)
      toast.error('Failed to load shoutbox')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchShouts()
  }, [])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchShouts(false)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // Scroll to bottom when new shouts arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [shouts])

  const handleSendShout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      toast.error('Message cannot be empty')
      return
    }

    if (message.length > 500) {
      toast.error('Message is too long (max 500 characters)')
      return
    }

    const token = localStorage.getItem('bearer_token')
    if (!token) {
      toast.error('Please sign in to send shouts')
      return
    }

    setIsSending(true)

    try {
      const response = await fetch('/api/shoutbox', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message.trim() })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send shout')
      }

      const newShout = await response.json()
      setShouts(prev => [...prev, newShout])
      setMessage('')
      
      // Focus input
      inputRef.current?.focus()
      
      toast.success('Shout sent!')
    } catch (error) {
      console.error('Failed to send shout:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send shout')
    } finally {
      setIsSending(false)
    }
  }

  const handleDeleteShout = async (shoutId: number) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      toast.error('Please sign in to delete shouts')
      return
    }

    try {
      const response = await fetch(`/api/shoutbox/${shoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete shout')
      }

      setShouts(prev => prev.filter(s => s.id !== shoutId))
      toast.success('Shout deleted')
    } catch (error) {
      console.error('Failed to delete shout:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete shout')
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchShouts(false)
    setIsRefreshing(false)
    toast.success('Shoutbox refreshed')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getCurrentUserId = () => {
    // This would ideally come from session, but we can extract from shouts
    const token = localStorage.getItem('bearer_token')
    if (!token) return null
    
    // Find a shout from current user to get their ID
    const userShout = shouts.find(s => s.user)
    return userShout?.user.id || null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header inspired by MyBB DVZ Shoutbox */}
      <div className="glass-card rounded-lg overflow-hidden border-2 border-primary/20">
        {/* Shoutbox Header */}
        <div className="bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 dark:from-gray-900 dark:via-black dark:to-gray-900 px-4 py-2.5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <h3 className="font-display font-semibold text-sm text-white">Shoutbox</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="h-7 px-2 text-white/70 hover:text-white hover:bg-white/10"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Shouts List */}
        <div 
          ref={scrollRef}
          className="h-[400px] overflow-y-auto bg-background/50 dark:bg-background/30"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--primary) transparent'
          }}
        >
          <div className="p-3 space-y-2">
            <AnimatePresence mode="popLayout">
              {shouts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-muted-foreground text-sm"
                >
                  No shouts yet. Be the first to say something!
                </motion.div>
              ) : (
                shouts.map((shout, index) => (
                  <motion.div
                    key={shout.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.02 }}
                    className="group relative bg-card/50 hover:bg-card/80 rounded-md p-2 border border-border/30 transition-colors"
                  >
                    <div className="flex gap-2">
                      {/* Avatar */}
                      <Avatar className="h-8 w-8 shrink-0 border border-primary/20">
                        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                          {getInitials(shout.user.name)}
                        </AvatarFallback>
                      </Avatar>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-semibold text-xs text-primary">
                            {shout.user.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(shout.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/90 break-words leading-relaxed">
                          {shout.message}
                        </p>
                      </div>

                      {/* Actions (visible on hover, like DVZ Shoutbox) */}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteShout(shout.id)}
                          className="h-6 w-6 p-0 hover:bg-red-500/10 hover:text-red-500"
                          title="Delete"
                        >
                          <span className="text-xs font-bold">X</span>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-3 border-t border-border/50">
          <form onSubmit={handleSendShout} className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message... (max 500 characters)"
              className="flex-1 h-9 text-sm bg-background border-border/50 focus:border-primary"
              maxLength={500}
              disabled={isSending}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isSending || !message.trim()}
              className="h-9 px-4 gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-xs">Sending...</span>
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  <span className="text-xs">Send</span>
                </>
              )}
            </Button>
          </form>
          <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
            <span>{shouts.length} shout{shouts.length !== 1 ? 's' : ''}</span>
            <span>{message.length}/500</span>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="glass-card p-4 border-2 border-primary/10">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1">
            <h4 className="font-semibold text-sm">About Shoutbox</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A live chat feed inspired by MyBB DVZ Shoutbox. Share quick updates, 
              thoughts, or chat with your team in real-time. Messages auto-refresh 
              every 10 seconds. You can only delete your own shouts.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}