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
  Zap, TrendingUp, Star, Award, Image, Code, BarChart3, X
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
  const [showOnlineUsers, setShowOnlineUsers] = useState(false)
  
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (settings.autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [shouts, settings.autoScroll])

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Shoutbox - Full Width */}
      <Card className="glass-card border-2 border-primary/20 shadow-xl overflow-hidden">
        {/* Professional Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
          <div className="relative px-6 py-5 border-b-2 border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                  <MessageSquare className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl text-foreground mb-1">
                    Shoutbox
                  </h2>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground font-medium">
                      Shoutbox - Community
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Online Users Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                  className={`h-9 gap-2 border-green-500/20 hover:border-green-500/40 ${
                    showOnlineUsers ? 'bg-green-500/10 border-green-500/30' : 'hover:bg-green-500/5'
                  }`}
                >
                  <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="hidden md:inline">Online ({onlineUsers.length})</span>
                </Button>

                {/* Sound Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, playSound: !prev.playSound }))}
                  className={`h-9 w-9 p-0 border-primary/20 hover:border-primary/40 ${
                    settings.playSound ? 'bg-primary/10 border-primary/30' : 'hover:bg-primary/5'
                  }`}
                  title={settings.playSound ? 'Mute notifications' : 'Unmute notifications'}
                >
                  {settings.playSound ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4" />}
                </Button>

                {/* Refresh */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 w-9 p-0 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                </Button>

                {/* Settings Dialog */}
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden md:inline">Settings</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg glass-card">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Settings className="h-5 w-5 text-primary" />
                        </div>
                        <span>Shoutbox Settings</span>
                      </DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="appearance" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 h-11">
                        <TabsTrigger value="appearance" className="gap-2">
                          <Palette className="h-4 w-4" />
                          Appearance
                        </TabsTrigger>
                        <TabsTrigger value="behavior" className="gap-2">
                          <Zap className="h-4 w-4" />
                          Behavior
                        </TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="appearance" className="space-y-5 mt-4">
                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Message Highlight Color</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {HIGHLIGHT_COLORS.map(color => (
                              <Button
                                key={color.name}
                                variant={settings.highlightColor === color.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSettings(prev => ({ ...prev, highlightColor: color.value }))}
                                className="w-full h-9"
                              >
                                {color.name}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-sm font-semibold">Text Color</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {TEXT_COLORS.map(color => (
                              <Button
                                key={color.name}
                                variant={settings.textColor === color.value ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSettings(prev => ({ ...prev, textColor: color.value }))}
                                className="w-full h-9"
                              >
                                {color.name}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                          <div className="flex items-center gap-2">
                            <Type className="h-4 w-4 text-primary" />
                            <Label htmlFor="compact-mode" className="font-medium cursor-pointer">
                              Compact Mode
                            </Label>
                          </div>
                          <Switch
                            id="compact-mode"
                            checked={settings.compactMode}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, compactMode: checked }))}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="behavior" className="space-y-4 mt-4">
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4 text-primary" />
                            <Label htmlFor="play-sound" className="font-medium cursor-pointer">
                              Sound Notifications
                            </Label>
                          </div>
                          <Switch
                            id="play-sound"
                            checked={settings.playSound}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, playSound: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <Label htmlFor="show-timestamps" className="font-medium cursor-pointer">
                              Show Timestamps
                            </Label>
                          </div>
                          <Switch
                            id="show-timestamps"
                            checked={settings.showTimestamps}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, showTimestamps: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                          <div className="flex items-center gap-2">
                            <Palette className="h-4 w-4 text-primary" />
                            <Label htmlFor="enable-colors" className="font-medium cursor-pointer">
                              Enable Text Colors
                            </Label>
                          </div>
                          <Switch
                            id="enable-colors"
                            checked={settings.enableColors}
                            onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableColors: checked }))}
                          />
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="h-4 w-4 text-primary" />
                            <Label htmlFor="auto-scroll" className="font-medium cursor-pointer">
                              Auto-scroll to New Messages
                            </Label>
                          </div>
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
        </div>

        {/* Online Users Section (Collapsible) */}
        <AnimatePresence>
          {showOnlineUsers && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-b-2 border-primary/10"
            >
              <div className="bg-gradient-to-r from-green-500/5 to-transparent px-6 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-display font-bold text-base">Online Now</h3>
                  <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400">
                    {onlineUsers.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-3">
                  {onlineUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-green-500/20 hover:border-green-500/40 transition-all"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8 ring-2 ring-green-500/20">
                          <AvatarFallback className="text-xs font-bold bg-gradient-to-br from-green-500/20 to-green-500/10 text-green-600 dark:text-green-400">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${
                          user.status === 'online' ? 'bg-green-500' :
                          user.status === 'away' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold">{user.name}</span>
                        <span className="text-xs text-muted-foreground capitalize">{user.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area - Professional Design */}
        <div 
          ref={scrollRef}
          className="h-[600px] overflow-y-auto bg-gradient-to-b from-background/50 to-background"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'oklch(0.50 0.20 240) transparent'
          }}
        >
          <div className="p-6 space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredShouts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-20"
                >
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6 ring-8 ring-primary/5">
                    <MessageSquare className="h-12 w-12 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-xl mb-2">No Messages Yet</h3>
                  <p className="text-muted-foreground font-medium">
                    Be the first to start the conversation! 🚀
                  </p>
                </motion.div>
              ) : (
                filteredShouts.map((shout, index) => (
                  <motion.div
                    key={shout.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    className="group relative"
                  >
                    <div className={`${settings.highlightColor} ${
                      settings.compactMode ? 'p-3' : 'p-4'
                    } rounded-xl border-2 hover:border-primary/30 hover:shadow-lg transition-all duration-200`}>
                      <div className="flex gap-4">
                        {/* Avatar */}
                        <Avatar className={`${settings.compactMode ? 'h-10 w-10' : 'h-12 w-12'} shrink-0 ring-4 ring-primary/10 shadow-md`}>
                          <AvatarFallback className="font-bold bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 text-primary text-sm">
                            {getInitials(shout.user.name)}
                          </AvatarFallback>
                        </Avatar>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-bold text-base text-foreground">
                              {shout.user.name}
                            </span>
                            {settings.showTimestamps && (
                              <>
                                <span className="text-xs text-muted-foreground font-medium">
                                  {formatDistanceToNow(new Date(shout.createdAt), { addSuffix: true })}
                                </span>
                                {shout.editedAt && (
                                  <Badge variant="outline" className="text-[10px] h-5 font-medium">
                                    edited
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>

                          {/* Reply indicator */}
                          {shout.replyToId && (
                            <div className="flex items-center gap-1.5 mb-2 text-xs text-muted-foreground font-medium">
                              <Reply className="h-3.5 w-3.5" />
                              <span>Replying to a message</span>
                            </div>
                          )}

                          <p className={`${settings.enableColors ? settings.textColor : 'text-foreground'} ${
                            settings.compactMode ? 'text-sm' : 'text-base'
                          } break-words leading-relaxed font-medium`}>
                            {shout.message}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            onClick={() => setReplyToShout(shout)}
                            title="Reply"
                          >
                            <Reply className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-500/10 hover:text-red-500"
                            onClick={() => handleDeleteShout(shout.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-sm text-muted-foreground italic px-2"
              >
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Input Area - Professional Design */}
        <div className="relative overflow-hidden border-t-2 border-primary/10">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
          <div className="relative p-5">
            {/* Reply indicator */}
            {replyToShout && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-3 p-3 bg-primary/10 rounded-lg border-2 border-primary/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-2 text-sm">
                  <Reply className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground font-medium">
                    Replying to <span className="font-bold text-foreground">{replyToShout.user.name}</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyToShout(null)}
                  className="h-7 w-7 p-0 hover:bg-red-500/10 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </motion.div>
            )}

            <form onSubmit={handleSendShout} className="space-y-3">
              <div className="flex gap-3">
                <Textarea
                  ref={inputRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share your thoughts with the team... (max 500 characters)"
                  className="flex-1 min-h-[52px] max-h-32 text-sm bg-background border-2 border-primary/20 focus:border-primary/40 resize-none font-medium placeholder:text-muted-foreground/50"
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
                        className="h-[52px] w-12 p-0 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                      >
                        <Smile className="h-5 w-5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3 glass-card" align="end">
                      <Tabs defaultValue="Smileys">
                        <TabsList className="w-full justify-start overflow-x-auto h-9">
                          {Object.keys(EMOJI_CATEGORIES).map(category => (
                            <TabsTrigger key={category} value={category} className="text-xs font-medium">
                              {category}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                          <TabsContent key={category} value={category} className="mt-3">
                            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
                              {emojis.map(emoji => (
                                <Button
                                  key={emoji}
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 w-9 p-0 text-lg hover:bg-primary/10 hover:scale-110 transition-transform"
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
                    className="h-[52px] w-12 p-0 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all"
                  >
                    {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {filteredShouts.length} message{filteredShouts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <span className={`text-xs font-semibold ${
                  message.length > 450 ? 'text-orange-500' : 'text-muted-foreground'
                }`}>
                  {message.length}/500
                </span>
              </div>
            </form>
          </div>
        </div>
      </Card>
    </div>
  )
}