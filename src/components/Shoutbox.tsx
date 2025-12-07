"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { 
  MessageSquare, Send, Trash2, RefreshCw, Loader2, Settings, 
  Smile, Pin, Heart, ThumbsUp, Reply, Edit2, Bookmark,
  Users, Volume2, VolumeX, Palette, Clock, Type,
  ChevronDown, ChevronUp, Search, Filter, Mic, Gift,
  Zap, TrendingUp, Star, Award, Image as ImageIcon, Code, BarChart3, X,
  Paperclip, FileText, Download, AtSign, Bold, Italic, 
  Strikethrough, MessageCircle, CheckCheck, Play, Pause, Link2,
  ExternalLink, PinOff, Circle, Megaphone, Shield, Crown, Mail,
  BookmarkCheck, Inbox, Eye
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
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
import { useSession } from '@/lib/auth-client'
import ReactMarkdown from 'react-markdown'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Reaction {
  emoji: string
  count: number
  users: Array<{ id: string; name: string }>
  hasReacted: boolean
}

interface Attachment {
  url: string
  type: string | null
  name: string | null
}

interface GifData {
  url: string
  title: string | null
  provider: string | null
}

interface VoiceMessage {
  url: string
  duration: number | null
  waveform: string | null
}

interface LinkPreview {
  url: string
  title: string | null
  description: string | null
  imageUrl: string | null
  siteName: string | null
}

interface ReplyToShout {
  id: number
  message: string
  user: {
    id: string
    name: string
  }
  createdAt: string
}

interface PinnedInfo {
  pinnedBy: string
  pinnedAt: string
  order: number
}

interface Shout {
  id: number
  message: string
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
  replyTo?: ReplyToShout | null
  editedAt?: string
  attachment?: Attachment | null
  gif?: GifData | null
  voiceMessage?: VoiceMessage | null
  linkPreviews?: LinkPreview[]
  pinned?: PinnedInfo | null
  reactions: Reaction[]
  mentions: string[]
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
  status: 'online' | 'away' | 'busy' | 'dnd'
  lastSeen: string
}

interface UserAvatarData {
  avatarUrl?: string | null
  selectedAvatarId?: string | null
  customAvatarUrl?: string | null
}

interface UserRole {
  role: 'member' | 'moderator' | 'admin'
  badgeColor: string | null
  assignedAt: string | null
  assignedBy: {
    id: string
    name: string
    email: string
  } | null
}

interface Permissions {
  role: string
  permissions: string[]
}

interface DMConversation {
  id: number
  name: string | null
  isGroup: boolean
  participants: Array<{ id: string; name: string; email: string }>
  lastMessage: {
    content: string
    createdAt: string
    senderName: string
  } | null
  unreadCount: number
  createdAt: string
  updatedAt: string
}

interface MessageBookmark {
  id: number
  note: string | null
  bookmarkedAt: string
  shout: {
    id: number
    message: string
    createdAt: string
    user: {
      id: string
      name: string
      email: string
    }
  }
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🎉', '🚀']

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

const PRESENCE_MODES = [
  { value: 'online', label: 'Online', color: 'bg-green-500', icon: Circle },
  { value: 'away', label: 'Away', color: 'bg-yellow-500', icon: Clock },
  { value: 'busy', label: 'Busy', color: 'bg-red-500', icon: Circle },
  { value: 'dnd', label: 'Do Not Disturb', color: 'bg-gray-500', icon: VolumeX },
]

export function Shoutbox() {
  const { data: session } = useSession()
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
  const [userAvatars, setUserAvatars] = useState<Record<string, UserAvatarData>>({})
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set())
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionCursorPos, setMentionCursorPos] = useState(0)
  const [unreadMentions, setUnreadMentions] = useState(0)
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const [showFormatting, setShowFormatting] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [gifSearchQuery, setGifSearchQuery] = useState('')
  const [gifResults, setGifResults] = useState<any[]>([])
  const [loadingGifs, setLoadingGifs] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [playingVoiceId, setPlayingVoiceId] = useState<number | null>(null)
  const [showPinnedMessages, setShowPinnedMessages] = useState(true)
  const [pinnedMessages, setPinnedMessages] = useState<Shout[]>([])
  const [userPresence, setUserPresence] = useState<'online' | 'away' | 'busy' | 'dnd'>('online')
  const [customStatus, setCustomStatus] = useState('')
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

  // Mock online users
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([
    { id: session?.user?.id || '1', name: session?.user?.name || 'You', status: 'online', lastSeen: new Date().toISOString() }
  ])

  // Save settings to localStorage
  useEffect(() => {
    localStorage.setItem('shoutbox-settings', JSON.stringify(settings))
  }, [settings])

  // Fetch mentions count
  const fetchUnreadMentions = async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const response = await fetch('/api/shoutbox/mentions?limit=1', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadMentions(data.unreadCount)
      }
    } catch (error) {
      console.error('Failed to fetch mentions:', error)
    }
  }

  useEffect(() => {
    fetchUnreadMentions()
    const interval = setInterval(fetchUnreadMentions, 30000) // Every 30s
    return () => clearInterval(interval)
  }, [])

  // Fetch pinned messages
  const fetchPinnedMessages = async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const response = await fetch('/api/shoutbox/pinned', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setPinnedMessages(data)
      }
    } catch (error) {
      console.error('Failed to fetch pinned messages:', error)
    }
  }

  useEffect(() => {
    fetchPinnedMessages()
  }, [])

  // Handle mention input
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const cursorPos = e.target.selectionStart || 0
    
    setMessage(value)
    setMentionCursorPos(cursorPos)

    // Check for @ mention trigger
    const textBeforeCursor = value.slice(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
      if (!textAfterAt.includes(' ')) {
        setMentionQuery(textAfterAt)
        setShowMentionSuggestions(true)
        return
      }
    }
    
    setShowMentionSuggestions(false)
  }

  // Insert mention
  const insertMention = (userName: string) => {
    const textBeforeCursor = message.slice(0, mentionCursorPos)
    const textAfterCursor = message.slice(mentionCursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')
    
    if (lastAtIndex !== -1) {
      const beforeAt = message.slice(0, lastAtIndex)
      const newValue = `${beforeAt}@${userName} ${textAfterCursor}`
      setMessage(newValue)
      setShowMentionSuggestions(false)
      
      setTimeout(() => {
        if (inputRef.current) {
          const newCursorPos = lastAtIndex + userName.length + 2
          inputRef.current.focus()
          inputRef.current.setSelectionRange(newCursorPos, newCursorPos)
        }
      }, 0)
    }
  }

  // Extract mentions from message
  const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g
    const mentions: string[] = []
    let match
    
    while ((match = mentionRegex.exec(text)) !== null) {
      const userName = match[1]
      // Find user ID by name (you'll need to maintain a users list)
      // For now, we'll just collect unique usernames
      if (!mentions.includes(userName)) {
        mentions.push(userName)
      }
    }
    
    return mentions
  }

  // Toggle reaction
  const handleReaction = async (shoutId: number, emoji: string) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const response = await fetch(`/api/shoutbox/${shoutId}/reactions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emoji })
      })

      if (response.ok) {
        await fetchShouts(false)
        const result = await response.json()
        if (result.action === 'added') {
          toast.success(`Reacted with ${emoji}`)
        }
      }
    } catch (error) {
      console.error('Failed to react:', error)
      toast.error('Failed to add reaction')
    }
  }

  // Handle file upload
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setAttachmentFile(file)
      toast.success(`File selected: ${file.name}`)
    }
  }

  // Upload attachment (mock - implement with your file storage)
  const uploadAttachment = async (file: File): Promise<{ url: string; type: string; name: string } | null> => {
    // TODO: Implement actual file upload to your storage service
    // For now, return mock data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          url: URL.createObjectURL(file),
          type: file.type,
          name: file.name
        })
      }, 1000)
    })
  }

  // Insert formatting
  const insertFormatting = (format: 'bold' | 'italic' | 'code' | 'strike') => {
    if (!inputRef.current) return
    
    const start = inputRef.current.selectionStart
    const end = inputRef.current.selectionEnd
    const selectedText = message.slice(start, end)
    
    let formattedText = ''
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`
        break
      case 'italic':
        formattedText = `*${selectedText}*`
        break
      case 'code':
        formattedText = `\`${selectedText}\``
        break
      case 'strike':
        formattedText = `~~${selectedText}~~`
        break
    }
    
    const newMessage = message.slice(0, start) + formattedText + message.slice(end)
    setMessage(newMessage)
    
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
        inputRef.current.setSelectionRange(start + formattedText.length, start + formattedText.length)
      }
    }, 0)
  }

  // Fetch user avatar with comprehensive data
  const fetchUserAvatar = async (userId: string, force = false) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      console.log('❌ No bearer token found, cannot fetch avatar')
      return
    }

    // Skip if already cached and not forcing refresh
    if (!force && userAvatars[userId]?.avatarUrl) {
      console.log(`✅ Using cached avatar for user ${userId}:`, userAvatars[userId]?.avatarUrl)
      return
    }

    try {
      console.log(`🔍 Fetching avatar for user ${userId}, force=${force}`)
      const response = await fetch(`/api/user/avatar-customization?userId=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: force ? 'no-store' : 'default'
      })

      if (response.ok) {
        const data = await response.json()
        
        console.log(`📦 Avatar API response for user ${userId}:`, {
          customAvatarUrl: data.customAvatarUrl,
          avatarUrl: data.avatarUrl,
          selectedAvatarId: data.selectedAvatarId
        })
        
        // Store comprehensive avatar data with proper priority
        // Priority: customAvatarUrl (uploaded) > avatarUrl (gallery selected)
        const avatarUrl = data.customAvatarUrl || data.avatarUrl || null
        
        setUserAvatars(prev => ({
          ...prev,
          [userId]: {
            avatarUrl: avatarUrl,
            selectedAvatarId: data.selectedAvatarId,
            customAvatarUrl: data.customAvatarUrl
          }
        }))
        
        console.log(`✅ Avatar URL set for user ${userId}:`, avatarUrl)
      } else {
        console.warn(`⚠️ Failed to fetch avatar for user ${userId}:`, response.status)
        // Don't set empty data - allow retries
      }
    } catch (error) {
      console.error(`❌ Error fetching avatar for user ${userId}:`, error)
    }
  }

  // Fetch avatars for all users in a batch
  const fetchAllUserAvatars = async (userIds: string[], force = false) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    // Filter out already cached avatars unless forcing refresh
    const idsToFetch = force 
      ? userIds 
      : userIds.filter(id => !userAvatars[id]?.avatarUrl)

    console.log(`📋 Fetching avatars for ${idsToFetch.length} users:`, idsToFetch)
    
    // Fetch avatars in parallel
    await Promise.all(
      idsToFetch.map(userId => fetchUserAvatar(userId, force))
    )
    
    console.log('✅ Batch avatar fetch complete')
  }

  // Refetch current user's avatar (force refresh)
  const refetchCurrentUserAvatar = async () => {
    if (session?.user?.id) {
      console.log('🔄 FORCE REFRESH: Fetching current user avatar...', session.user.id)
      await fetchUserAvatar(session.user.id, true)
      
      // Force a re-render by updating shouts state
      setShouts(prev => [...prev])
      
      // Also update online users list
      setOnlineUsers(prev => prev.map(u => 
        u.id === session.user.id 
          ? { ...u, name: session.user.name || u.name }
          : u
      ))
      
      console.log('✅ Current user avatar refresh complete')
    }
  }

  // Listen for avatar update events
  useEffect(() => {
    const handleAvatarUpdate = async (event: Event) => {
      console.log('🎨 AVATAR UPDATED EVENT DETECTED in Shoutbox')
      const customEvent = event as CustomEvent
      console.log('Event details:', customEvent.detail)
      
      await refetchCurrentUserAvatar()
    }

    // Listen for custom avatar update event
    window.addEventListener('avatarUpdated', handleAvatarUpdate)

    // Also refetch when window gains focus
    window.addEventListener('focus', refetchCurrentUserAvatar)

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate)
      window.removeEventListener('focus', refetchCurrentUserAvatar)
    }
  }, [session?.user?.id])

  // Force refetch current user's avatar on mount and when session changes
  useEffect(() => {
    if (session?.user?.id) {
      console.log('🚀 INITIAL LOAD: Fetching current user avatar:', session.user.id)
      refetchCurrentUserAvatar()
    }
  }, [session?.user?.id])

  // Log avatar state whenever it changes
  useEffect(() => {
    console.log('📸 Current avatar state:', userAvatars)
  }, [userAvatars])

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
      
      console.log('📨 Fetched shouts:', data.length)
      
      // Fetch avatars for all unique users
      const uniqueUserIds = [...new Set(data.map((shout: Shout) => shout.user.id))]
      
      console.log('👥 Unique users in shouts:', uniqueUserIds)
      
      // Force refresh for current user, normal fetch for others
      await fetchAllUserAvatars(
        uniqueUserIds.filter(id => id !== session?.user?.id),
        false
      )
      
      // Always force refresh current user's avatar
      if (session?.user?.id) {
        await fetchUserAvatar(session.user.id, true)
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

  // Auto-scroll to bottom
  useEffect(() => {
    if (settings.autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [shouts, settings.autoScroll])

  // GIF Search (Giphy API)
  const searchGifs = async (query: string) => {
    if (!query.trim()) return
    
    setLoadingGifs(true)
    try {
      // Using Giphy public beta key for demo - replace with your own key
      const GIPHY_API_KEY = 'YOUR_GIPHY_API_KEY' // Replace with actual key
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&rating=g`
      )
      
      if (response.ok) {
        const data = await response.json()
        setGifResults(data.data || [])
      } else {
        // Fallback: Use mock GIFs for demo
        setGifResults([
          { id: '1', images: { fixed_height: { url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif' } }, title: 'Excited' },
          { id: '2', images: { fixed_height: { url: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif' } }, title: 'Thumbs Up' },
        ])
      }
    } catch (error) {
      console.error('GIF search failed:', error)
      toast.error('Failed to search GIFs')
    } finally {
      setLoadingGifs(false)
    }
  }

  // Handle GIF selection
  const handleGifSelect = async (gif: any) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      toast.error('Please sign in to send GIFs')
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
          message: message || `Sent a GIF: ${gif.title}`,
          gifUrl: gif.images.fixed_height.url,
          gifTitle: gif.title,
          gifProvider: 'giphy',
          replyToId: replyToShout?.id
        })
      })

      if (response.ok) {
        const newShout = await response.json()
        setShouts(prev => [...prev, newShout])
        setMessage('')
        setReplyToShout(null)
        setShowGifPicker(false)
        setGifSearchQuery('')
        toast.success('GIF sent! 🎬')
      }
    } catch (error) {
      console.error('Failed to send GIF:', error)
      toast.error('Failed to send GIF')
    } finally {
      setIsSending(false)
    }
  }

  // Voice Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: Blob[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

      toast.success('Recording started 🎤')
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast.error('Microphone access denied')
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      toast.info('Recording stopped')
    }
  }

  const sendVoiceMessage = async () => {
    if (!audioBlob) return

    const token = localStorage.getItem('bearer_token')
    if (!token) {
      toast.error('Please sign in to send voice messages')
      return
    }

    setIsSending(true)
    try {
      // In production, upload to storage service (S3, Cloudinary, etc.)
      const voiceUrl = URL.createObjectURL(audioBlob)
      
      // Generate simple waveform data
      const waveform = Array.from({ length: 50 }, () => Math.random()).toString()

      const response = await fetch('/api/shoutbox', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: message || 'Sent a voice message',
          voiceMessageUrl: voiceUrl,
          voiceMessageDuration: recordingTime,
          voiceMessageWaveform: waveform,
          replyToId: replyToShout?.id
        })
      })

      if (response.ok) {
        const newShout = await response.json()
        setShouts(prev => [...prev, newShout])
        setMessage('')
        setReplyToShout(null)
        setAudioBlob(null)
        setRecordingTime(0)
        toast.success('Voice message sent! 🎤')
      }
    } catch (error) {
      console.error('Failed to send voice message:', error)
      toast.error('Failed to send voice message')
    } finally {
      setIsSending(false)
    }
  }

  // Play/Pause voice message
  const toggleVoicePlayback = (shout: Shout) => {
    if (!shout.voiceMessage?.url) return

    if (playingVoiceId === shout.id) {
      audioRef.current?.pause()
      setPlayingVoiceId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      const audio = new Audio(shout.voiceMessage.url)
      audioRef.current = audio
      audio.play()
      setPlayingVoiceId(shout.id)
      audio.onended = () => setPlayingVoiceId(null)
    }
  }

  // Auto-detect and fetch link previews
  const detectAndFetchLinkPreviews = async (text: string): Promise<LinkPreview[]> => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = text.match(urlRegex)
    
    if (!urls || urls.length === 0) return []

    const token = localStorage.getItem('bearer_token')
    if (!token) return []

    const previews: LinkPreview[] = []

    for (const url of urls.slice(0, 3)) { // Limit to 3 links
      try {
        const response = await fetch(`/api/shoutbox/link-preview?url=${encodeURIComponent(url)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (response.ok) {
          const preview = await response.json()
          previews.push(preview)
        }
      } catch (error) {
        console.error('Failed to fetch link preview:', error)
      }
    }

    return previews
  }

  // Pin/Unpin message
  const handlePinToggle = async (shoutId: number) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const response = await fetch(`/api/shoutbox/${shoutId}/pin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const result = await response.json()
        await fetchShouts(false)
        await fetchPinnedMessages()
        toast.success(result.pinned ? 'Message pinned! 📌' : 'Message unpinned')
      }
    } catch (error) {
      console.error('Failed to toggle pin:', error)
      toast.error('Failed to update pin status')
    }
  }

  // Enhanced send with link preview detection
  const handleSendShout = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim() && !attachmentFile && !audioBlob) {
      toast.error('Message, attachment, or voice required')
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
      // Detect link previews
      const linkPreviews = await detectAndFetchLinkPreviews(message)

      let attachmentData = null
      
      // Upload attachment if exists
      if (attachmentFile) {
        setUploadingAttachment(true)
        attachmentData = await uploadAttachment(attachmentFile)
        setUploadingAttachment(false)
      }

      // Extract mentions (note: you'll need user IDs, not just names)
      const mentionedNames = extractMentions(message)

      const response = await fetch('/api/shoutbox', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: message.trim(),
          replyToId: replyToShout?.id,
          mentions: [], // TODO: Convert names to user IDs
          linkPreviewUrls: linkPreviews,
          ...(attachmentData && {
            attachmentUrl: attachmentData.url,
            attachmentType: attachmentData.type,
            attachmentName: attachmentData.name
          })
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send shout')
      }

      const newShout = await response.json()
      
      if (session?.user?.id) {
        await fetchUserAvatar(session.user.id, true)
      }
      
      setShouts(prev => [...prev, newShout])
      setMessage('')
      setReplyToShout(null)
      setAttachmentFile(null)
      
      inputRef.current?.focus()
      
      toast.success('Shout sent! 💬')
      fetchUnreadMentions()
    } catch (error) {
      console.error('Failed to send shout:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send shout')
    } finally {
      setIsSending(false)
      setUploadingAttachment(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendShout(e as any)
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

  // Get avatar URL with fallback logic and cache busting for current user
  const getAvatarUrl = (userId: string): string | undefined => {
    const avatarData = userAvatars[userId]
    const url = avatarData?.customAvatarUrl || avatarData?.avatarUrl || undefined
    
    console.log(`🖼️ Getting avatar for user ${userId}:`, url)
    console.log(`   - customAvatarUrl:`, avatarData?.customAvatarUrl)
    console.log(`   - avatarUrl:`, avatarData?.avatarUrl)
    console.log(`   - selectedAvatarId:`, avatarData?.selectedAvatarId)
    
    // Add cache busting for current user to force reload
    if (url && userId === session?.user?.id) {
      const timestamp = Date.now()
      const separator = url.includes('?') ? '&' : '?'
      const finalUrl = `${url}${separator}t=${timestamp}`
      console.log(`🔄 Cache-busted avatar URL:`, finalUrl)
      return finalUrl
    }
    
    return url
  }

  // Render message with markdown
  const renderMessage = (text: string) => {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
            code: ({ inline, children }) => (
              inline ? (
                <code className="px-1 py-0.5 bg-muted rounded text-xs font-mono">
                  {children}
                </code>
              ) : (
                <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto mt-2">
                  <code>{children}</code>
                </pre>
              )
            ),
            strong: ({ children }) => <strong className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="italic">{children}</em>,
            del: ({ children }) => <del className="line-through">{children}</del>,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    )
  }

  // Toggle thread expansion
  const toggleThread = (shoutId: number) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(shoutId)) {
        newSet.delete(shoutId)
      } else {
        newSet.add(shoutId)
      }
      return newSet
    })
  }

  // Get thread replies
  const getThreadReplies = (shoutId: number) => {
    return shouts.filter(s => s.replyTo?.id === shoutId)
  }

  // Render waveform visualization
  const renderWaveform = (waveform: string | null, isPlaying: boolean) => {
    if (!waveform) return null
    
    const values = waveform.split(',').map(v => parseFloat(v) || 0.5)
    
    return (
      <div className="flex items-center gap-0.5 h-8">
        {values.slice(0, 40).map((value, i) => (
          <div
            key={i}
            className={`w-1 rounded-full transition-all ${
              isPlaying ? 'bg-primary animate-pulse' : 'bg-muted-foreground'
            }`}
            style={{ height: `${value * 100}%` }}
          />
        ))}
      </div>
    )
  }

  // Fetch user role and permissions
  const fetchUserRole = async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const [roleRes, permissionsRes] = await Promise.all([
        fetch('/api/user-roles', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/user-roles/permissions', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (roleRes.ok) {
        const roleData = await roleRes.json()
        setUserRole(roleData)
      }

      if (permissionsRes.ok) {
        const permData = await permissionsRes.json()
        setPermissions(permData.permissions || [])
      }
    } catch (error) {
      console.error('Failed to fetch role/permissions:', error)
    }
  }

  // Fetch DM conversations
  const fetchDMConversations = async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    setLoadingDMs(true)
    try {
      const response = await fetch('/api/conversations', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setDmConversations(data.conversations || [])
      }
    } catch (error) {
      console.error('Failed to fetch DM conversations:', error)
    } finally {
      setLoadingDMs(false)
    }
  }

  // Fetch bookmarks
  const fetchBookmarks = async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    setLoadingBookmarks(true)
    try {
      const response = await fetch('/api/message-bookmarks', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setBookmarks(data)
      }
    } catch (error) {
      console.error('Failed to fetch bookmarks:', error)
    } finally {
      setLoadingBookmarks(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchUserRole()
      fetchDMConversations()
      fetchBookmarks()
    }
  }, [session])

  // Send announcement
  const handleSendAnnouncement = async () => {
    if (!announcementMessage.trim()) {
      toast.error('Announcement message is required')
      return
    }

    const token = localStorage.getItem('bearer_token')
    if (!token) return

    setIsSendingAnnouncement(true)
    try {
      const response = await fetch('/api/shoutbox/announcement', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: announcementMessage.trim(),
          priority: announcementPriority
        })
      })

      if (response.ok) {
        const newAnnouncement = await response.json()
        setShouts(prev => [...prev, newAnnouncement])
        setAnnouncementMessage('')
        setAnnouncementPriority('medium')
        setShowAnnouncementDialog(false)
        toast.success('📣 Announcement sent successfully!')
        await fetchShouts(false)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send announcement')
      }
    } catch (error) {
      console.error('Failed to send announcement:', error)
      toast.error('Failed to send announcement')
    } finally {
      setIsSendingAnnouncement(false)
    }
  }

  // Create DM conversation
  const handleCreateDM = async (participantId: string) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          participantIds: [participantId],
          isGroup: false
        })
      })

      if (response.ok) {
        const conversation = await response.json()
        toast.success('DM conversation created! 💬')
        await fetchDMConversations()
        // TODO: Navigate to DM view
      } else {
        const error = await response.json()
        if (error.code === 'CONVERSATION_EXISTS') {
          toast.info('Conversation already exists')
        } else {
          toast.error(error.error || 'Failed to create conversation')
        }
      }
    } catch (error) {
      console.error('Failed to create DM:', error)
      toast.error('Failed to create conversation')
    }
  }

  // Bookmark message
  const handleBookmarkMessage = async (shoutId: number, note?: string) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const response = await fetch('/api/message-bookmarks', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          shoutId,
          note: note || null
        })
      })

      if (response.ok) {
        toast.success('Message bookmarked! 🔖')
        await fetchBookmarks()
        setBookmarkingShoutId(null)
        setBookmarkNote('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to bookmark message')
      }
    } catch (error) {
      console.error('Failed to bookmark:', error)
      toast.error('Failed to bookmark message')
    }
  }

  // Remove bookmark
  const handleRemoveBookmark = async (bookmarkId: number) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const response = await fetch(`/api/message-bookmarks/${bookmarkId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        toast.success('Bookmark removed')
        await fetchBookmarks()
      }
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
      toast.error('Failed to remove bookmark')
    }
  }

  // Get role badge config
  const getRoleBadgeConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          icon: Crown,
          color: 'bg-gradient-to-r from-amber-500 to-orange-500',
          textColor: 'text-white',
          ringColor: 'ring-amber-500/30'
        }
      case 'moderator':
        return {
          icon: Shield,
          color: 'bg-gradient-to-r from-blue-500 to-indigo-500',
          textColor: 'text-white',
          ringColor: 'ring-blue-500/30'
        }
      default:
        return {
          icon: Star,
          color: 'bg-gradient-to-r from-slate-500 to-slate-600',
          textColor: 'text-white',
          ringColor: 'ring-slate-500/20'
        }
    }
  }

  // New state for team collaboration features
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [permissions, setPermissions] = useState<string[]>([])
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false)
  const [announcementMessage, setAnnouncementMessage] = useState('')
  const [announcementPriority, setAnnouncementPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [isSendingAnnouncement, setIsSendingAnnouncement] = useState(false)
  const [showDMDialog, setShowDMDialog] = useState(false)
  const [dmConversations, setDmConversations] = useState<DMConversation[]>([])
  const [loadingDMs, setLoadingDMs] = useState(false)
  const [bookmarks, setBookmarks] = useState<MessageBookmark[]>([])
  const [showBookmarksDialog, setShowBookmarksDialog] = useState(false)
  const [loadingBookmarks, setLoadingBookmarks] = useState(false)
  const [bookmarkNote, setBookmarkNote] = useState('')
  const [bookmarkingShoutId, setBookmarkingShoutId] = useState<number | null>(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const availableUsers = Array.from(new Set(shouts.map(s => s.user.name)))
  const filteredUsers = availableUsers.filter(name =>
    name.toLowerCase().includes(mentionQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Pinned Messages Section */}
      {pinnedMessages.length > 0 && (
        <Card className="glass-card border-2 border-amber-500/30 bg-amber-500/5">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Pin className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-display font-bold text-base">Pinned Messages</h3>
                <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30">
                  {pinnedMessages.length}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                className="h-6 w-6 p-0"
              >
                {showPinnedMessages ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>

            <AnimatePresence>
              {showPinnedMessages && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  {pinnedMessages.map(shout => (
                    <div key={shout.id} className="p-3 rounded-lg border bg-card/50">
                      <div className="flex gap-2">
                        <Avatar className="h-6 w-6 shrink-0">
                          <AvatarImage src={getAvatarUrl(shout.user.id) || ''} />
                          <AvatarFallback className="text-[9px]">
                            {getInitials(shout.user.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-semibold text-xs">{shout.user.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(shout.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-xs break-words">{shout.message}</p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePinToggle(shout.id)}
                          className="h-6 w-6 p-0"
                          title="Unpin"
                        >
                          <PinOff className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      )}

      {/* Main Shoutbox */}
      <Card className="glass-card border-2 border-primary/20 shadow-xl overflow-hidden flex flex-col h-[calc(100vh-180px)]">
        {/* Header */}
        <div className="relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
          <div className="relative px-6 py-5 border-b-2 border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-lg ring-4 ring-primary/10">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl text-foreground mb-1">
                    Shoutbox
                  </h2>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground font-medium">
                      Community Chat
                    </span>
                    {unreadMentions > 0 && (
                      <Badge variant="destructive" className="animate-pulse">
                        {unreadMentions} new mention{unreadMentions > 1 ? 's' : ''}
                      </Badge>
                    )}
                    {/* Role Badge */}
                    {userRole && userRole.role !== 'member' && (
                      <Badge 
                        className={`${getRoleBadgeConfig(userRole.role).color} ${getRoleBadgeConfig(userRole.role).textColor} ring-2 ${getRoleBadgeConfig(userRole.role).ringColor} flex items-center gap-1`}
                      >
                        {(() => {
                          const Icon = getRoleBadgeConfig(userRole.role).icon
                          return <Icon className="h-3 w-3" />
                        })()}
                        {userRole.role}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Bookmarks Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowBookmarksDialog(true)
                    fetchBookmarks()
                  }}
                  className="h-8 gap-2 border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5"
                >
                  <Bookmark className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="hidden md:inline text-xs">Bookmarks</span>
                  {bookmarks.length > 0 && (
                    <Badge variant="outline" className="ml-1 h-5">
                      {bookmarks.length}
                    </Badge>
                  )}
                </Button>

                {/* DM Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDMDialog(true)
                    fetchDMConversations()
                  }}
                  className="h-8 gap-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                >
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  <span className="hidden md:inline text-xs">DMs</span>
                  {dmConversations.reduce((sum, conv) => sum + conv.unreadCount, 0) > 0 && (
                    <Badge variant="destructive" className="ml-1 h-5 animate-pulse">
                      {dmConversations.reduce((sum, conv) => sum + conv.unreadCount, 0)}
                    </Badge>
                  )}
                </Button>

                {/* Announcement Button (Moderator/Admin only) */}
                {permissions.includes('send_announcements') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnnouncementDialog(true)}
                    className="h-8 gap-2 border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5"
                  >
                    <Megaphone className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                    <span className="hidden md:inline text-xs">Announce</span>
                  </Button>
                )}

                {/* Online Users Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOnlineUsers(!showOnlineUsers)}
                  className={`h-8 gap-2 border-green-500/20 hover:border-green-500/40 ${
                    showOnlineUsers ? 'bg-green-500/10 border-green-500/30' : 'hover:bg-green-500/5'
                  }`}
                >
                  <Users className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  <span className="hidden md:inline text-xs">Online ({onlineUsers.length})</span>
                </Button>

                {/* Sound Toggle */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({ ...prev, playSound: !prev.playSound }))}
                  className={`h-8 w-8 p-0 border-primary/20 hover:border-primary/40 ${
                    settings.playSound ? 'bg-primary/10 border-primary/30' : 'hover:bg-primary/5'
                  }`}
                  title={settings.playSound ? 'Mute notifications' : 'Unmute notifications'}
                >
                  {settings.playSound ? <Volume2 className="h-3.5 w-3.5 text-primary" /> : <VolumeX className="h-3.5 w-3.5" />}
                </Button>

                {/* Refresh */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-8 w-8 p-0 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
                </Button>

                {/* Settings Dialog */}
                <Dialog open={showSettings} onOpenChange={setShowSettings}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span className="hidden md:inline text-xs">Settings</span>
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
                  {onlineUsers.map(user => {
                    const avatarUrl = getAvatarUrl(user.id)
                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card/50 border border-green-500/20 hover:border-green-500/40 transition-all"
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8 ring-2 ring-green-500/20">
                            <AvatarImage 
                              src={avatarUrl || ''} 
                              alt={user.name}
                              className="object-cover w-full h-full"
                              onError={(e) => {
                                console.error(`❌ Failed to load avatar image for user ${user.id}:`, avatarUrl)
                                e.currentTarget.style.display = 'none'
                              }}
                              onLoad={() => {
                                console.log(`✅ Successfully loaded avatar image for user ${user.id}:`, avatarUrl)
                              }}
                            />
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
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area - Flexible Height with Independent Scroll */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto bg-gradient-to-b from-background/50 to-background"
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
                filteredShouts.filter(s => !s.replyTo).map((shout, index) => {
                  const avatarUrl = getAvatarUrl(shout.user.id)
                  const threadReplies = getThreadReplies(shout.id)
                  const isThreadExpanded = expandedThreads.has(shout.id)
                  const hasMention = shout.mentions.includes(session?.user?.id || '')
                  const isBookmarked = bookmarks.some(b => b.shout.id === shout.id)
                  
                  return (
                    <motion.div
                      key={shout.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.03 }}
                      className="group relative"
                    >
                      <div className={`${
                        (shout as any).isAnnouncement ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/10 border-orange-500/40 ring-2 ring-orange-500/20' : 
                        hasMention ? 'bg-blue-500/10 border-blue-500/30' : settings.highlightColor
                      } ${
                        shout.pinned ? 'ring-2 ring-amber-500/50' : ''
                      } ${
                        settings.compactMode ? 'p-2' : 'p-2.5'
                      } rounded-lg border hover:border-primary/30 hover:shadow-md transition-all duration-200`}>
                        <div className="flex gap-2.5">
                          {/* Avatar */}
                          <Avatar className={`${settings.compactMode ? 'h-7 w-7' : 'h-8 w-8'} shrink-0 ring-1 ring-primary/10`}>
                            <AvatarImage 
                              src={avatarUrl || ''} 
                              alt={shout.user.name}
                              className="object-cover w-full h-full"
                            />
                            <AvatarFallback className="font-semibold bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 text-primary text-[10px]">
                              {getInitials(shout.user.name)}
                            </AvatarFallback>
                          </Avatar>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className="font-semibold text-xs text-foreground">
                                {shout.user.name}
                              </span>

                              {/* Role Badge */}
                              {userRole && shout.user.id === session?.user?.id && userRole.role !== 'member' && (
                                <Badge 
                                  className={`${getRoleBadgeConfig(userRole.role).color} ${getRoleBadgeConfig(userRole.role).textColor} h-4 text-[9px] px-1.5 flex items-center gap-0.5`}
                                >
                                  {(() => {
                                    const Icon = getRoleBadgeConfig(userRole.role).icon
                                    return <Icon className="h-2.5 w-2.5" />
                                  })()}
                                  {userRole.role}
                                </Badge>
                              )}

                              {/* Announcement Badge */}
                              {(shout as any).isAnnouncement && (
                                <Badge variant="outline" className={`text-[9px] h-4 px-1.5 font-bold flex items-center gap-0.5 ${
                                  (shout as any).announcementPriority === 'high' ? 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400' :
                                  (shout as any).announcementPriority === 'medium' ? 'bg-orange-500/10 border-orange-500/30 text-orange-600 dark:text-orange-400' :
                                  'bg-yellow-500/10 border-yellow-500/30 text-yellow-600 dark:text-yellow-400'
                                }`}>
                                  <Megaphone className="h-2.5 w-2.5" />
                                  ANNOUNCEMENT
                                </Badge>
                              )}

                              {settings.showTimestamps && (
                                <>
                                  <span className="text-[10px] text-muted-foreground font-medium">
                                    {formatDistanceToNow(new Date(shout.createdAt), { addSuffix: true })}
                                  </span>
                                  {shout.editedAt && (
                                    <Badge variant="outline" className="text-[9px] h-4 font-medium px-1">
                                      edited
                                    </Badge>
                                  )}
                                </>
                              )}
                              {hasMention && (
                                <Badge variant="outline" className="text-[9px] h-4 font-medium px-1 bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400">
                                  <AtSign className="h-2.5 w-2.5 mr-0.5" />
                                  mentioned you
                                </Badge>
                              )}
                              {isBookmarked && (
                                <Badge variant="outline" className="text-[9px] h-4 font-medium px-1 bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400">
                                  <BookmarkCheck className="h-2.5 w-2.5 mr-0.5" />
                                  bookmarked
                                </Badge>
                              )}
                            </div>

                            {/* Message with markdown */}
                            <div className={`${settings.enableColors ? settings.textColor : 'text-foreground'} ${
                              settings.compactMode ? 'text-[11px]' : 'text-xs'
                            } ${(shout as any).isAnnouncement ? 'font-bold' : 'font-medium'} break-words leading-relaxed`}>
                              {renderMessage(shout.message)}
                            </div>

                            {/* GIF Display */}
                            {shout.gif && (
                              <div className="mt-2">
                                <img 
                                  src={shout.gif.url} 
                                  alt={shout.gif.title || 'GIF'}
                                  className="max-w-xs rounded-lg cursor-pointer hover:opacity-90"
                                  onClick={() => window.open(shout.gif!.url, '_blank')}
                                />
                                {shout.gif.title && (
                                  <p className="text-[10px] text-muted-foreground mt-1">{shout.gif.title}</p>
                                )}
                              </div>
                            )}

                            {/* Voice Message Player */}
                            {shout.voiceMessage && (
                              <div className="mt-2 p-3 rounded-lg border bg-muted/30 flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-full bg-primary/10 hover:bg-primary/20"
                                  onClick={() => toggleVoicePlayback(shout)}
                                >
                                  {playingVoiceId === shout.id ? (
                                    <Pause className="h-4 w-4" />
                                  ) : (
                                    <Play className="h-4 w-4" />
                                  )}
                                </Button>
                                
                                <div className="flex-1">
                                  {renderWaveform(shout.voiceMessage.waveform, playingVoiceId === shout.id)}
                                </div>
                                
                                {shout.voiceMessage.duration && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {Math.floor(shout.voiceMessage.duration / 60)}:{(shout.voiceMessage.duration % 60).toString().padStart(2, '0')}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Link Previews */}
                            {shout.linkPreviews && shout.linkPreviews.length > 0 && (
                              <div className="mt-2 space-y-2">
                                {shout.linkPreviews.map((preview, idx) => (
                                  <a
                                    key={idx}
                                    href={preview.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors group/link"
                                  >
                                    <div className="flex gap-3">
                                      {preview.imageUrl && (
                                        <img 
                                          src={preview.imageUrl} 
                                          alt="" 
                                          className="w-20 h-20 object-cover rounded"
                                        />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        {preview.siteName && (
                                          <p className="text-[10px] text-muted-foreground font-medium mb-1">
                                            {preview.siteName}
                                          </p>
                                        )}
                                        {preview.title && (
                                          <p className="text-xs font-bold mb-1 line-clamp-2 group-hover/link:text-primary">
                                            {preview.title}
                                          </p>
                                        )}
                                        {preview.description && (
                                          <p className="text-[10px] text-muted-foreground line-clamp-2">
                                            {preview.description}
                                          </p>
                                        )}
                                        <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                                          <Link2 className="h-3 w-3" />
                                          {new URL(preview.url).hostname}
                                        </div>
                                      </div>
                                    </div>
                                  </a>
                                ))}
                              </div>
                            )}

                            {/* Attachment */}
                            {shout.attachment && (
                              <div className="mt-2 p-2 rounded-lg border bg-muted/50 flex items-center gap-2">
                                {shout.attachment.type?.startsWith('image/') ? (
                                  <div className="relative group/img">
                                    <img 
                                      src={shout.attachment.url} 
                                      alt={shout.attachment.name || 'Attachment'}
                                      className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(shout.attachment!.url, '_blank')}
                                    />
                                  </div>
                                ) : (
                                  <>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{shout.attachment.name}</p>
                                      <p className="text-[10px] text-muted-foreground">{shout.attachment.type}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                      onClick={() => window.open(shout.attachment!.url, '_blank')}
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}

                            {/* Reactions */}
                            {shout.reactions.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {shout.reactions.map(reaction => (
                                  <Popover key={reaction.emoji}>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className={`h-6 px-2 gap-1 hover:scale-110 transition-transform ${
                                          reaction.hasReacted ? 'bg-primary/10 border-primary/30' : ''
                                        }`}
                                        onClick={() => handleReaction(shout.id, reaction.emoji)}
                                      >
                                        <span className="text-sm">{reaction.emoji}</span>
                                        <span className="text-[10px] font-bold">{reaction.count}</span>
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-2" align="start">
                                      <div className="space-y-1">
                                        {reaction.users.map(user => (
                                          <div key={user.id} className="text-xs font-medium">
                                            {user.name}
                                          </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                ))}
                              </div>
                            )}

                            {/* Quick reactions */}
                            <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {QUICK_REACTIONS.map(emoji => (
                                <Button
                                  key={emoji}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:scale-125 transition-transform"
                                  onClick={() => handleReaction(shout.id, emoji)}
                                  title={`React with ${emoji}`}
                                >
                                  <span className="text-sm">{emoji}</span>
                                </Button>
                              ))}
                            </div>

                            {/* Thread indicator */}
                            {threadReplies.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 gap-1 mt-2 text-xs text-primary hover:text-primary"
                                onClick={() => toggleThread(shout.id)}
                              >
                                <MessageCircle className="h-3 w-3" />
                                {threadReplies.length} {threadReplies.length === 1 ? 'reply' : 'replies'}
                                {isThreadExpanded ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </Button>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary"
                              onClick={() => setReplyToShout(shout)}
                              title="Reply"
                            >
                              <Reply className="h-3 w-3" />
                            </Button>

                            {/* Bookmark Button */}
                            {!isBookmarked ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-amber-500/10 hover:text-amber-600"
                                    title="Bookmark"
                                  >
                                    <Bookmark className="h-3 w-3" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80">
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-sm">Bookmark Message</h4>
                                    <Textarea
                                      placeholder="Add a note (optional)..."
                                      value={bookmarkNote}
                                      onChange={(e) => setBookmarkNote(e.target.value)}
                                      className="resize-none h-20"
                                      maxLength={500}
                                    />
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => handleBookmarkMessage(shout.id, bookmarkNote)}
                                        className="flex-1"
                                      >
                                        <Bookmark className="h-3 w-3 mr-1" />
                                        Save Bookmark
                                      </Button>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-amber-500/10 hover:text-amber-600"
                                title="Bookmarked"
                                disabled
                              >
                                <BookmarkCheck className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              </Button>
                            )}

                            {/* DM Button */}
                            {shout.user.id !== session?.user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-primary/10 hover:text-primary"
                                onClick={() => handleCreateDM(shout.user.id)}
                                title="Send DM"
                              >
                                <Mail className="h-3 w-3" />
                              </Button>
                            )}

                            {shout.user.id === session?.user?.id && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 hover:bg-amber-500/10 hover:text-amber-600"
                                onClick={() => handlePinToggle(shout.id)}
                                title={shout.pinned ? 'Unpin' : 'Pin'}
                              >
                                {shout.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 hover:bg-red-500/10 hover:text-red-500"
                              onClick={() => handleDeleteShout(shout.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Thread replies */}
                      <AnimatePresence>
                        {isThreadExpanded && threadReplies.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="ml-12 mt-2 space-y-2 border-l-2 border-primary/20 pl-4"
                          >
                            {threadReplies.map(reply => {
                              const replyAvatarUrl = getAvatarUrl(reply.user.id)
                              return (
                                <div key={reply.id} className="group/reply">
                                  <div className="p-2 rounded-lg border bg-card/50 hover:border-primary/30 transition-all">
                                    <div className="flex gap-2">
                                      <Avatar className="h-6 w-6 shrink-0">
                                        <AvatarImage src={replyAvatarUrl || ''} alt={reply.user.name} />
                                        <AvatarFallback className="text-[9px]">
                                          {getInitials(reply.user.name)}
                                        </AvatarFallback>
                                      </Avatar>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                          <span className="font-semibold text-[10px]">{reply.user.name}</span>
                                          <span className="text-[9px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                                          </span>
                                        </div>
                                        <div className="text-[11px] break-words">
                                          {renderMessage(reply.message)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })
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

        {/* Input Area - Sticky at Bottom */}
        <div className="relative overflow-hidden border-t-2 border-primary/10 shrink-0 mt-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
          <div className="relative px-4 py-3">
            {/* Reply indicator */}
            {replyToShout && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <Reply className="h-3 w-3 text-primary" />
                  <span className="text-muted-foreground font-medium">
                    Replying to <span className="font-bold text-foreground">{replyToShout.user.name}</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReplyToShout(null)}
                  className="h-5 w-5 p-0 hover:bg-red-500/10 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            )}

            {/* Attachment preview */}
            {attachmentFile && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 px-3 py-2 bg-muted/50 rounded-md border flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Paperclip className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">{attachmentFile.name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    ({(attachmentFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAttachmentFile(null)}
                  className="h-5 w-5 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            )}

            {/* Voice Recording Preview */}
            {audioBlob && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-2 px-3 py-2 bg-primary/10 rounded-md border border-primary/20 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <Mic className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium">Voice message recorded ({recordingTime}s)</span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={sendVoiceMessage}
                    className="h-6 text-xs"
                    disabled={isSending}
                  >
                    Send
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAudioBlob(null)}
                    className="h-5 w-5 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSendShout}>
              {/* Formatting toolbar */}
              <div className="flex items-center gap-1 mb-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => insertFormatting('bold')}
                  title="Bold"
                >
                  <Bold className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => insertFormatting('italic')}
                  title="Italic"
                >
                  <Italic className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => insertFormatting('strike')}
                  title="Strikethrough"
                >
                  <Strikethrough className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => insertFormatting('code')}
                  title="Code"
                >
                  <Code className="h-3 w-3" />
                </Button>
                
                <div className="h-4 w-px bg-border mx-1" />
                
                {/* GIF Picker */}
                <Dialog open={showGifPicker} onOpenChange={setShowGifPicker}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      title="Add GIF"
                    >
                      <Gift className="h-3 w-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl glass-card max-h-[600px]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Gift className="h-5 w-5 text-primary" />
                        Choose a GIF
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Search GIFs..."
                          value={gifSearchQuery}
                          onChange={(e) => setGifSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && searchGifs(gifSearchQuery)}
                          className="flex-1"
                        />
                        <Button onClick={() => searchGifs(gifSearchQuery)} disabled={loadingGifs}>
                          {loadingGifs ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        </Button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                        {gifResults.map((gif) => (
                          <button
                            key={gif.id}
                            type="button"
                            onClick={() => handleGifSelect(gif)}
                            className="relative aspect-square rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all"
                          >
                            <img 
                              src={gif.images.fixed_height.url} 
                              alt={gif.title}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Voice Recording Button */}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 ${isRecording ? 'text-red-500 animate-pulse' : ''}`}
                  onClick={isRecording ? stopRecording : startRecording}
                  title={isRecording ? 'Stop recording' : 'Record voice message'}
                >
                  <Mic className="h-3 w-3" />
                </Button>

                {isRecording && (
                  <span className="text-xs text-red-500 font-mono animate-pulse">
                    {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                  </span>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach file"
                >
                  <Paperclip className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex items-end gap-2 relative">
                {/* Textarea with mention support */}
                <div className="flex-1 relative">
                  <Textarea
                    ref={inputRef}
                    value={message}
                    onChange={handleMessageChange}
                    onKeyDown={handleKeyDown as any}
                    placeholder="Type a message... (@mention, **bold**, *italic*)"
                    className="resize-none h-20 text-sm bg-background border-2 border-primary/20 focus:border-primary/40 font-medium placeholder:text-muted-foreground/50"
                    maxLength={500}
                    disabled={isSending || uploadingAttachment}
                  />
                  
                  {/* Mention suggestions */}
                  {showMentionSuggestions && filteredUsers.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-full max-w-[300px] rounded-lg border bg-popover shadow-lg z-10">
                      <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                        <div className="px-2 py-1 text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          <AtSign className="h-3 w-3" />
                          Mention user
                        </div>
                        {filteredUsers.map(userName => (
                          <button
                            key={userName}
                            type="button"
                            onClick={() => insertMention(userName)}
                            className="w-full px-3 py-2 text-sm text-left rounded-md hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-primary">
                                {userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="font-medium">{userName}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Emoji Picker Button */}
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-10 w-10 p-0 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 shrink-0"
                    >
                      <Smile className="h-4 w-4" />
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

                {/* Send Button */}
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSending || uploadingAttachment || (!message.trim() && !attachmentFile && !audioBlob)}
                  className="h-10 w-10 p-0 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all shrink-0"
                >
                  {isSending || uploadingAttachment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Info Bar */}
              <div className="flex items-center justify-between mt-2 px-1">
                <span className="text-[10px] text-muted-foreground font-medium">
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-bold">Enter</kbd> to send • 
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-bold mx-1">@</kbd> mention • 
                  <kbd className="px-1 py-0.5 bg-muted rounded text-[9px] font-bold">**bold**</kbd>
                </span>
                <span className={`text-[10px] font-semibold ${
                  message.length > 450 ? 'text-orange-500' : 'text-muted-foreground'
                }`}>
                  {message.length}/500
                </span>
              </div>
            </form>
          </div>
        </div>
      </Card>

      {/* Announcement Dialog */}
      <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
        <DialogContent className="sm:max-w-lg glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <Megaphone className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <span>Send Announcement</span>
            </DialogTitle>
            <DialogDescription>
              Broadcast an important message to all users in the shoutbox
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="announcement-message">Message</Label>
              <Textarea
                id="announcement-message"
                placeholder="Type your announcement..."
                value={announcementMessage}
                onChange={(e) => setAnnouncementMessage(e.target.value)}
                className="resize-none h-32"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {announcementMessage.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-priority">Priority</Label>
              <Select value={announcementPriority} onValueChange={(value: any) => setAnnouncementPriority(value)}>
                <SelectTrigger id="announcement-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low Priority</SelectItem>
                  <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                  <SelectItem value="high">🔴 High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSendAnnouncement}
                disabled={isSendingAnnouncement || !announcementMessage.trim()}
                className="flex-1"
              >
                {isSendingAnnouncement ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Megaphone className="h-4 w-4 mr-2" />
                    Send Announcement
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowAnnouncementDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DM Conversations Dialog */}
      <Dialog open={showDMDialog} onOpenChange={setShowDMDialog}>
        <DialogContent className="sm:max-w-2xl glass-card max-h-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <span>Direct Messages</span>
            </DialogTitle>
            <DialogDescription>
              Private conversations with other users
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {loadingDMs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : dmConversations.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-lg mb-2">No Conversations Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Click the mail icon on any message to start a private conversation
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {dmConversations.map(conv => {
                    const otherParticipant = conv.participants.find(p => p.id !== session?.user?.id)
                    return (
                      <Card key={conv.id} className="p-4 hover:border-primary/30 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarFallback>
                                {getInitials(otherParticipant?.name || 'User')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm truncate">
                                  {otherParticipant?.name || 'Unknown User'}
                                </h4>
                                {conv.unreadCount > 0 && (
                                  <Badge variant="destructive" className="h-5 text-[10px]">
                                    {conv.unreadCount}
                                  </Badge>
                                )}
                              </div>
                              {conv.lastMessage && (
                                <p className="text-xs text-muted-foreground truncate">
                                  <span className="font-medium">{conv.lastMessage.senderName}:</span> {conv.lastMessage.content}
                                </p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 text-xs">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bookmarks Dialog */}
      <Dialog open={showBookmarksDialog} onOpenChange={setShowBookmarksDialog}>
        <DialogContent className="sm:max-w-2xl glass-card max-h-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Bookmark className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span>Bookmarked Messages</span>
            </DialogTitle>
            <DialogDescription>
              Your saved messages for quick reference
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {loadingBookmarks ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : bookmarks.length === 0 ? (
              <div className="text-center py-12">
                <Bookmark className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="font-semibold text-lg mb-2">No Bookmarks Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Click the bookmark icon on any message to save it for later
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {bookmarks.map(bookmark => (
                    <Card key={bookmark.id} className="p-4 border-l-4 border-l-amber-500">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-sm">{bookmark.shout.user.name}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(bookmark.shout.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-xs break-words">{bookmark.shout.message}</p>
                            {bookmark.note && (
                              <div className="mt-2 p-2 bg-muted/50 rounded text-xs italic">
                                <span className="font-semibold">Note:</span> {bookmark.note}
                              </div>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-2">
                              Bookmarked {formatDistanceToNow(new Date(bookmark.bookmarkedAt), { addSuffix: true })}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveBookmark(bookmark.id)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            title="Remove bookmark"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}