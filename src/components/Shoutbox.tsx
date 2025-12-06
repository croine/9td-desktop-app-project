"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { 
  MessageSquare, Send, Trash2, RefreshCw, Loader2, Settings, 
  Smile, Pin, Heart, ThumbsUp, Reply, Edit2, Bookmark,
  Users, Volume2, VolumeX, Palette, Clock, Type,
  ChevronDown, ChevronUp, Search, Filter, Mic, Gift,
  Zap, TrendingUp, Star, Award, Image, Code, BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface Shout {
  id: number
  message: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  reactions?: { [emoji: string]: string[] }
  isPinned?: boolean
  replyToId?: number
  editedAt?: string
}

interface ShoutboxSettings {
  highlightColor: string
  playSound: boolean
  showTimestamps: boolean
  enableColors: boolean
  textColor: string
  autoScroll: boolean
  compactMode: boolean
}

interface OnlineUser {
  id: string
  name: string
  status: 'online' | 'away' | 'busy'
  lastSeen: string
}

const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'],
  'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Symbols': ['⚡', '🔥', '✨', '⭐', '🌟', '💫', '💥', '💢', '💯', '🎯', '🎪', '🎭', '🎨', '🎬', '🎮', '🎲', '🎰', '🏆', '🥇', '🥈', '🥉', '🏅'],
  'Objects': ['💻', '📱', '⌨️', '🖥️', '🖨️', '🖱️', '🕹️', '💾', '💿', '📀', '🎧', '🎤', '📷', '📹', '📺', '📻', '🔔', '🔕', '📢', '📣']
}

const HIGHLIGHT_COLORS = [
  { name: 'Blue', value: 'bg-blue-500/10 border-blue-500/30' },
  { name: 'Purple', value: 'bg-purple-500/10 border-purple-500/30' },
  { name: 'Green', value: 'bg-green-500/10 border-green-500/30' },
  { name: 'Orange', value: 'bg-orange-500/10 border-orange-500/30' },
  { name: 'Pink', value: 'bg-pink-500/10 border-pink-500/30' },
  { name: 'None', value: 'bg-card/50 border-border/30' }
]

const TEXT_COLORS = [
  { name: 'Default', value: 'text-foreground' },
  { name: 'Blue', value: 'text-blue-500' },
  { name: 'Purple', value: 'text-purple-500' },
  { name: 'Green', value: 'text-green-500' },
  { name: 'Orange', value: 'text-orange-500' },
  { name: 'Pink', value: 'text-pink-500' }
]

export function Shoutbox() {
  const [shouts, setShouts] = useState<Shout[]>([])
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingShoutId, setEditingShoutId] = useState<number | null>(null)
  const [replyToShout, setReplyToShout] = useState<Shout | null>(null)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const [bookmarkedShouts, setBookmarkedShouts] = useState<number[]>([])
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Settings with localStorage persistence
  const [settings, setSettings] = useState<ShoutboxSettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shoutbox-settings')
      if (saved) return JSON.parse(saved)
    }
    return {
      highlightColor: 'bg-blue-500/10 border-blue-500/30',
      playSound: true,
      showTimestamps: true,
      enableColors: true,
      textColor: 'text-foreground',
      autoScroll: true,
      compactMode: false
    }
  })

  // Mock online users (in real app, this would come from WebSocket/API)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([
    { id: '1', name: 'You', status: 'online', lastSeen: new Date().toISOString() }
  ])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('shoutbox-settings', JSON.stringify(settings))
  }, [settings])

  // Load bookmarks
  useEffect(() => {
    const saved = localStorage.getItem('shoutbox-bookmarks')
    if (saved) setBookmarkedShouts(JSON.parse(saved))
  }, [])

  // Save bookmarks
  useEffect(() => {
    localStorage.setItem('shoutbox-bookmarks', JSON.stringify(bookmarkedShouts))
  }, [bookmarkedShouts])

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
      const previousLength = shouts.length
      
      setShouts(data)
      
      // Play sound for new messages
      if (settings.playSound && data.length > previousLength && previousLength > 0) {
        playNotificationSound()
      }
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

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchShouts(false)
    }, 5000)

    return () => clearInterval(interval)
  }, [shouts.length, settings.playSound])

  // Auto-scroll to bottom
  useEffect(() => {
    if (settings.autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [shouts, settings.autoScroll])

  // Play notification sound
  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKrk8LJfGwc5k9n1xnMpBSl+zPLaizsKElyx6OyrWBUIR6Hh8bllHAYtgs/z3Ik3CBxqvvDjm04MDlCq5PCyXxoHOpPb9cVyKAUpfszx2Ys8ChoSXbTo7axYFQdHouLyu2kdBi2Cz/Pdijg')
    audio.volume = 0.3
    audio.play().catch(() => {})
  }

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
        body: JSON.stringify({ 
          message: message.trim(),
          replyToId: replyToShout?.id 
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send shout')
      }

      const newShout = await response.json()
      setShouts(prev => [...prev, newShout])
      setMessage('')
      setReplyToShout(null)
      
      inputRef.current?.focus()
      
      toast.success('Shout sent! 💬')
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
    toast.success('Refreshed! ✨')
  }

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
    inputRef.current?.focus()
  }

  const handleReaction = (shoutId: number, emoji: string) => {
    setShouts(prev => prev.map(shout => {
      if (shout.id === shoutId) {
        const reactions = { ...(shout.reactions || {}) }
        const userId = 'current-user' // Would come from session
        
        if (!reactions[emoji]) {
          reactions[emoji] = []
        }
        
        if (reactions[emoji].includes(userId)) {
          reactions[emoji] = reactions[emoji].filter(id => id !== userId)
          if (reactions[emoji].length === 0) {
            delete reactions[emoji]
          }
        } else {
          reactions[emoji].push(userId)
        }
        
        return { ...shout, reactions }
      }
      return shout
    }))
  }

  const handlePinShout = (shoutId: number) => {
    setShouts(prev => prev.map(shout => 
      shout.id === shoutId ? { ...shout, isPinned: !shout.isPinned } : shout
    ))
    toast.success('Shout pinned! 📌')
  }

  const handleBookmark = (shoutId: number) => {
    setBookmarkedShouts(prev => {
      if (prev.includes(shoutId)) {
        toast.success('Bookmark removed')
        return prev.filter(id => id !== shoutId)
      } else {
        toast.success('Bookmarked! 🔖')
        return [...prev, shoutId]
      }
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const filteredShouts = shouts.filter(shout => {
    if (!searchQuery) return true
    return shout.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
           shout.user.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const pinnedShouts = filteredShouts.filter(s => s.isPinned)
  const regularShouts = filteredShouts.filter(s => !s.isPinned)
  const displayShouts = [...pinnedShouts, ...regularShouts]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Main Shoutbox */}
      <div className="lg:col-span-3 space-y-4">
        <div className="glass-card rounded-xl overflow-hidden border-2 border-primary/20 shadow-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 dark:from-blue-800 dark:via-blue-900 dark:to-blue-800 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-white text-lg">Shoutbox</h3>
                  <p className="text-xs text-white/70">Live chat • {displayShouts.length} shouts</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Search */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <Label>Search messages</Label>
                      <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Sound Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, playSound: !prev.playSound }))}
                  className="h-8 px-2 text-white/80 hover:text-white hover:bg-white/10"
                  title={settings.playSound ? 'Mute notifications' : 'Unmute notifications'}
                >
                  {settings.playSound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>

                {/* Refresh */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-8 px-2 text-white/80 hover:text-white hover:bg-white/10"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>

                {/* Settings Dialog */}
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-white/80 hover:text-white hover:bg-white/10"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5 text-primary" />
                        Shoutbox Settings
                      </DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="appearance" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                        <TabsTrigger value="behavior">Behavior</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="appearance" className="space-y-4">
                        <div className="space-y-2">
                          <Label>Message Highlight Color</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {HIGHLIGHT_COLORS.map(color => (
                              <Button
                                key={color.name}
                                variant={settings.highlightColor === color.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSettings(prev => ({ ...prev, highlightColor: color.value }))}
                                className="w-full"
                              >
                                {color.name}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Text Color</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {TEXT_COLORS.map(color => (
                              <Button
                                key={color.name}
                                variant={settings.textColor === color.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSettings(prev => ({ ...prev, textColor: color.value }))}
                                className="w-full"
                              >
                                {color.name}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="compact-mode">Compact Mode</Label>
                          <Switch
                            id="compact-mode"
                            checked={settings.compactMode}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, compactMode: checked }))}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="behavior" className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="play-sound">Sound Notifications</Label>
                          <Switch
                            id="play-sound"
                            checked={settings.playSound}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, playSound: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="show-timestamps">Show Timestamps</Label>
                          <Switch
                            id="show-timestamps"
                            checked={settings.showTimestamps}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showTimestamps: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="enable-colors">Enable Text Colors</Label>
                          <Switch
                            id="enable-colors"
                            checked={settings.enableColors}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableColors: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label htmlFor="auto-scroll">Auto-scroll to New Messages</Label>
                          <Switch
                            id="auto-scroll"
                            checked={settings.autoScroll}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoScroll: checked }))}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div 
            ref={scrollRef}
            className="h-[500px] overflow-y-auto bg-background/30 dark:bg-background/20"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'oklch(0.50 0.20 240) transparent'
            }}
          >
            <div className="p-4 space-y-2">
              <AnimatePresence mode="popLayout">
                {displayShouts.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-10 w-10 text-primary" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                      No shouts yet. Be the first! 🚀
                    </p>
                  </motion.div>
                ) : (
                  displayShouts.map((shout, index) => (
                    <motion.div
                      key={shout.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.02 }}
                      className={`group relative ${settings.highlightColor} ${
                        settings.compactMode ? 'p-2' : 'p-3'
                      } rounded-lg border hover:shadow-md transition-all`}
                    >
                      {/* Pinned indicator */}
                      {shout.isPinned && (
                        <div className="absolute -top-1 -right-1">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Pin className="h-3 w-3 text-primary-foreground" />
                          </div>
                        </div>
                      )}

                      {/* Bookmark indicator */}
                      {bookmarkedShouts.includes(shout.id) && (
                        <div className="absolute -top-1 -left-1">
                          <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
                            <Bookmark className="h-3 w-3 text-white fill-white" />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {/* Avatar */}
                        <Avatar className={`${settings.compactMode ? 'h-8 w-8' : 'h-10 w-10'} shrink-0 border-2 border-primary/30 ring-2 ring-primary/10`}>
                          <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-primary/20 to-primary/30 text-primary">
                            {getInitials(shout.user.name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-sm text-primary">
                              {shout.user.name}
                            </span>
                            {settings.showTimestamps && (
                              <>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(shout.createdAt), { addSuffix: true })}
                                </span>
                                {shout.editedAt && (
                                  <Badge variant="outline" className="text-[10px] h-4">
                                    edited
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>

                          {/* Reply indicator */}
                          {shout.replyToId && (
                            <div className="flex items-center gap-1 mb-1 text-xs text-muted-foreground">
                              <Reply className="h-3 w-3" />
                              <span>Replying to message</span>
                            </div>
                          )}

                          <p className={`${settings.enableColors ? settings.textColor : 'text-foreground'} ${
                            settings.compactMode ? 'text-sm' : 'text-base'
                          } break-words leading-relaxed`}>
                            {shout.message}
                          </p>

                          {/* Reactions */}
                          {shout.reactions && Object.keys(shout.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {Object.entries(shout.reactions).map(([emoji, users]) => (
                                <Button
                                  key={emoji}
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs gap-1"
                                  onClick={() => handleReaction(shout.id, emoji)}
                                >
                                  <span>{emoji}</span>
                                  <span className="text-muted-foreground">{users.length}</span>
                                </Button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Add reaction"
                              >
                                <Smile className="h-3.5 w-3.5" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2">
                              <div className="grid grid-cols-6 gap-1">
                                {['❤️', '👍', '😂', '😮', '😢', '🎉', '🔥', '⭐', '✨', '💯', '👏', '🚀'].map(emoji => (
                                  <Button
                                    key={emoji}
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-lg"
                                    onClick={() => handleReaction(shout.id, emoji)}
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setReplyToShout(shout)}
                            title="Reply"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handlePinShout(shout.id)}
                            title="Pin"
                          >
                            <Pin className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => handleBookmark(shout.id)}
                            title="Bookmark"
                          >
                            <Bookmark className={`h-3.5 w-3.5 ${bookmarkedShouts.includes(shout.id) ? 'fill-current' : ''}`} />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-500"
                            onClick={() => handleDeleteShout(shout.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-muted-foreground italic px-2"
                >
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </motion.div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 border-t-2 border-primary/10">
            {/* Reply indicator */}
            {replyToShout && (
              <div className="mb-2 p-2 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Reply className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">
                    Replying to <span className="font-semibold text-foreground">{replyToShout.user.name}</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyToShout(null)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            <form onSubmit={handleSendShout} className="space-y-2">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message... (max 500 characters)"
                  className="flex-1 min-h-[44px] max-h-32 text-sm bg-background/50 border-primary/20 focus:border-primary resize-none"
                  maxLength={500}
                  disabled={isSending}
                  rows={1}
                />
                
                <div className="flex flex-col gap-2">
                  {/* Emoji Picker */}
                  <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-11 w-11 p-0 border-primary/20"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2">
                      <Tabs defaultValue="Smileys">
                        <TabsList className="w-full justify-start overflow-x-auto">
                          {Object.keys(EMOJI_CATEGORIES).map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs">
                              {category}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                          <TabsContent key={category} value={category}>
                            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                              {emojis.map(emoji => (
                                <Button
                                  key={emoji}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-lg hover:bg-primary/10"
                                  onClick={() => handleEmojiSelect(emoji)}
                                >
                                  {emoji}
                                </Button>
                              ))}
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </PopoverContent>
                  </Popover>

                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSending || !message.trim()}
                    className="h-11 w-11 p-0 bg-primary hover:bg-primary/90"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {displayShouts.length} shout{displayShouts.length !== 1 ? 's' : ''}
                  </span>
                  {bookmarkedShouts.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Bookmark className="h-3 w-3" />
                      {bookmarkedShouts.length} bookmarked
                    </span>
                  )}
                </div>
                <span className={message.length > 450 ? 'text-orange-500 font-semibold' : ''}>
                  {message.length}/500
                </span>
              </div>
            </form>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card p-4 border-2 border-blue-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Zap className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Real-time Updates</h4>
                <p className="text-xs text-muted-foreground">
                  Messages refresh every 5 seconds automatically
                </p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 border-2 border-purple-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Reactions</h4>
                <p className="text-xs text-muted-foreground">
                  React to messages with emojis and express yourself
                </p>
              </div>
            </div>
          </Card>

          <Card className="glass-card p-4 border-2 border-green-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <Star className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-1">Pin & Bookmark</h4>
                <p className="text-xs text-muted-foreground">
                  Save important messages for quick access later
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sidebar - Online Users */}
      <div className="lg:col-span-1">
        <Card className="glass-card border-2 border-primary/20 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-white" />
              <h4 className="font-display font-bold text-white text-sm">
                Online ({onlineUsers.length})
              </h4>
            </div>
          </div>

          <div className="p-3 space-y-2 max-h-[600px] overflow-y-auto">
            {onlineUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-primary/30">
                    <AvatarFallback className="text-xs font-bold bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                    user.status === 'online' ? 'bg-green-500' :
                    user.status === 'away' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.status}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}