"use client"

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { AvatarWithRings } from '@/components/avatar/AvatarWithRings'
import { StatusPicker } from '@/components/avatar/StatusPicker'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Settings,
  History,
  Tag as TagIcon,
  MessageSquare,
  LogIn,
  LogOut,
  Loader2,
  Timer,
  Clock,
  Calendar as CalendarIcon,
  BarChart3,
  Trello,
  GanttChartSquare,
  Trophy,
  Palette,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Target,
  Brain,
  Zap,
  Users,
  Workflow,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { authClient, useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ========================================================================
// NAVIGATION SIDEBAR v9.0 - REVOLUTIONARY GROUPED DESIGN WITH SMART MINIMAP
// Updated: JAN-2025 - Multi-level categories, innovative scrollbar
// ========================================================================

export type SidebarView = 
  | 'dashboard'
  | 'your-tasks'
  | 'calendar'
  | 'kanban'
  | 'gantt'
  | 'dependencies'
  | 'daily-planning'
  | 'focus-mode'
  | 'pomodoro'
  | 'time-blocking'
  | 'analytics'
  | 'gamification'
  | 'avatar-customization'
  | 'activity-logs'
  | 'owner-panel'
  | 'message-system'
  | 'settings'

interface NavigationSidebarProps {
  currentView: SidebarView
  onViewChange: (view: SidebarView) => void
  taskCount?: number
  inboxCount?: number
  session: any
  sessionPending: boolean
}

interface NavigationItem {
  id: SidebarView
  label: string
  icon: any
  badge?: number
  description: string
  requiresAuth: boolean
  isPro?: boolean
}

interface NavigationCategory {
  id: string
  label: string
  icon: any
  color: string
  items: NavigationItem[]
  defaultExpanded?: boolean
}

interface UserPreferences {
  customTitle: string
  showEmail: boolean
  blurEmail: boolean
  avatarUrl: string | null
  avatarShape: 'circle' | 'square' | 'rounded'
  avatarColorScheme: 'solid' | 'gradient' | 'rainbow' | 'fade'
  avatarBorderColor: string
}

interface UserStats {
  tasksCompletedToday: number
  tasksCompletedThisWeek: number
  dailyGoal: number
  weeklyGoal: number
}

interface Achievement {
  id: number
  achievementType: string
  unlockedAt: string
  isDisplayed: boolean
}

interface UserStatus {
  status: 'active' | 'away' | 'busy' | 'offline'
  customMessage?: string | null
}

interface ActiveFrame {
  frameType: string
  isActive: boolean
}

export function NavigationSidebar({ 
  currentView, 
  onViewChange, 
  taskCount = 0,
  session,
  sessionPending
}: NavigationSidebarProps) {
  const router = useRouter()
  const { refetch: refetchSession } = useSession()
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  
  const [preferences, setPreferences] = useState<UserPreferences>({
    customTitle: 'Account Secured',
    showEmail: false,
    blurEmail: false,
    avatarUrl: null,
    avatarShape: 'circle',
    avatarColorScheme: 'gradient',
    avatarBorderColor: '#6366f1'
  })
  const [userName, setUserName] = useState('')
  const [stats, setStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [status, setStatus] = useState<UserStatus | null>(null)
  const [activeFrame, setActiveFrame] = useState<ActiveFrame | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['core', 'productivity']))
  const [scrollProgress, setScrollProgress] = useState(0)
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // ==========================================
  // GROUPED NAVIGATION CATEGORIES
  // ==========================================
  const navigationCategories: NavigationCategory[] = [
    {
      id: 'core',
      label: 'Core Hub',
      icon: LayoutDashboard,
      color: '#3b82f6',
      defaultExpanded: true,
      items: [
        { 
          id: 'dashboard', 
          label: 'Dashboard', 
          icon: LayoutDashboard,
          description: 'Overview and statistics',
          requiresAuth: false
        },
        { 
          id: 'your-tasks', 
          label: 'Your Tasks', 
          icon: CheckSquare, 
          badge: taskCount,
          description: 'Manage active tasks',
          requiresAuth: true
        },
      ]
    },
    {
      id: 'productivity',
      label: 'Productivity Suite',
      icon: Target,
      color: '#8b5cf6',
      defaultExpanded: true,
      items: [
        { 
          id: 'daily-planning', 
          label: 'Daily Planning', 
          icon: Clock,
          description: 'Plan your day',
          requiresAuth: true
        },
        { 
          id: 'focus-mode', 
          label: 'Focus Mode', 
          icon: Brain,
          description: 'Deep work environment',
          requiresAuth: true,
          isPro: true
        },
        { 
          id: 'pomodoro', 
          label: 'Pomodoro Timer', 
          icon: Timer,
          description: 'Focus timer intervals',
          requiresAuth: true,
          isPro: true
        },
        { 
          id: 'time-blocking', 
          label: 'Time Blocking', 
          icon: Clock,
          description: 'Weekly schedule',
          requiresAuth: true,
          isPro: true
        },
      ]
    },
    {
      id: 'views',
      label: 'Advanced Views',
      icon: Trello,
      color: '#ec4899',
      items: [
        { 
          id: 'calendar', 
          label: 'Calendar', 
          icon: CalendarIcon,
          description: 'Calendar view',
          requiresAuth: true
        },
        { 
          id: 'kanban', 
          label: 'Kanban Board', 
          icon: Trello,
          description: 'Drag-and-drop tasks',
          requiresAuth: true,
          isPro: true
        },
        { 
          id: 'gantt', 
          label: 'Gantt Chart', 
          icon: GanttChartSquare,
          description: 'Timeline visualization',
          requiresAuth: true,
          isPro: true
        },
        { 
          id: 'dependencies', 
          label: 'Dependencies', 
          icon: Workflow,
          description: 'Task relationships',
          requiresAuth: true
        },
      ]
    },
    {
      id: 'analytics',
      label: 'Analytics & Insights',
      icon: BarChart3,
      color: '#f59e0b',
      items: [
        { 
          id: 'analytics', 
          label: 'Analytics', 
          icon: BarChart3,
          description: 'Productivity insights',
          requiresAuth: true
        },
        { 
          id: 'activity-logs', 
          label: 'Activity Logs', 
          icon: History,
          description: 'Track all changes',
          requiresAuth: true
        },
      ]
    },
    {
      id: 'gamification',
      label: 'Achievements & Profile',
      icon: Trophy,
      color: '#10b981',
      items: [
        { 
          id: 'gamification', 
          label: 'Achievements', 
          icon: Trophy,
          description: 'Track XP and streaks',
          requiresAuth: true
        },
        { 
          id: 'avatar-customization', 
          label: 'Avatar Studio', 
          icon: Palette,
          description: 'Customize avatar',
          requiresAuth: true
        },
      ]
    },
    {
      id: 'collaboration',
      label: 'Team & Communication',
      icon: Users,
      color: '#06b6d4',
      items: [
        { 
          id: 'message-system', 
          label: 'Messages', 
          icon: MessageSquare,
          description: 'Team collaboration',
          requiresAuth: true,
          isPro: true
        },
      ]
    },
    {
      id: 'management',
      label: 'Management & Settings',
      icon: Settings,
      color: '#64748b',
      items: [
        { 
          id: 'owner-panel', 
          label: 'Owner Panel', 
          icon: TagIcon,
          description: 'Manage workspace',
          requiresAuth: true
        },
        { 
          id: 'settings', 
          label: 'Settings Hub', 
          icon: Settings,
          description: 'Advanced configuration',
          requiresAuth: true
        },
      ]
    },
  ]

  // Initialize expanded categories from defaults
  useEffect(() => {
    const defaults = new Set(
      navigationCategories
        .filter(cat => cat.defaultExpanded)
        .map(cat => cat.id)
    )
    setExpandedCategories(defaults)
  }, [])

  // Fetch all user data when session is available
  useEffect(() => {
    if (session?.user) {
      setUserName(session.user.name)
      fetchAllData()
    }
  }, [session])

  // Poll for updates every 5 seconds when on settings page
  useEffect(() => {
    if (session?.user && currentView === 'settings') {
      const interval = setInterval(() => {
        fetchAllData()
        refetchSession()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [session, currentView, refetchSession])

  // Track scroll progress for minimap
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current && contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
        const progress = scrollTop / (scrollHeight - clientHeight)
        setScrollProgress(progress)
      }
    }

    const scrollElement = scrollRef.current
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll)
      return () => scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const fetchAllData = async () => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const [prefsRes, statsRes, achievementsRes, statusRes, framesRes] = await Promise.all([
        fetch('/api/user-preferences', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/user-stats', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/achievements', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/user-status', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/avatar-frames', { headers: { 'Authorization': `Bearer ${token}` } })
      ])

      if (prefsRes.ok) {
        const data = await prefsRes.json()
        setPreferences({
          customTitle: data.customTitle || 'Account Secured',
          showEmail: data.showEmail || false,
          blurEmail: data.blurEmail || false,
          avatarUrl: data.avatarUrl || null,
          avatarShape: data.avatarShape || 'circle',
          avatarColorScheme: data.avatarColorScheme || 'gradient',
          avatarBorderColor: data.avatarBorderColor || '#6366f1'
        })
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      if (achievementsRes.ok) {
        const data = await achievementsRes.json()
        setAchievements(data)
      }

      if (statusRes.ok) {
        const data = await statusRes.json()
        setStatus(data)
      }

      if (framesRes.ok) {
        const data = await framesRes.json()
        const active = data.find((f: any) => f.isActive)
        setActiveFrame(active || null)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const handleSignOut = async () => {
    const token = localStorage.getItem("bearer_token")
    const { error } = await authClient.signOut({
      fetchOptions: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
    
    if (error?.code) {
      toast.error('Failed to sign out')
    } else {
      localStorage.removeItem("bearer_token")
      toast.success('Signed out successfully')
      router.push('/')
    }
  }

  const handleStatusChange = async (newStatus: 'active' | 'away' | 'busy' | 'offline', message?: string) => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      const response = await fetch('/api/user-status', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          customMessage: message || null
        })
      })

      if (response.ok) {
        setStatus({ status: newStatus, customMessage: message || null })
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`)
    if (element && scrollRef.current) {
      const offsetTop = element.offsetTop - 80
      scrollRef.current.scrollTo({ top: offsetTop, behavior: 'smooth' })
    }
  }

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : session?.user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="flex flex-col h-full border-r bg-sidebar/50 backdrop-blur-sm relative">
      {/* Smart Minimap Scrollbar */}
      <SmartMinimapScrollbar
        categories={navigationCategories}
        expandedCategories={expandedCategories}
        currentView={currentView}
        scrollProgress={scrollProgress}
        hoveredCategory={hoveredCategory}
        onCategoryClick={scrollToCategory}
        onCategoryHover={setHoveredCategory}
      />

      {/* Scrollable Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div ref={contentRef} className="py-4 px-3 space-y-4">
          {/* User Section */}
          <div className="px-2 py-3 bg-gradient-to-br from-primary/5 to-accent/10 rounded-lg border border-primary/20">
            {sessionPending ? (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : session?.user ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AvatarWithRings
                    avatarUrl={preferences.avatarUrl}
                    initials={initials}
                    userName={userName}
                    stats={stats || undefined}
                    achievements={achievements}
                    status={status || undefined}
                    activeFrame={activeFrame}
                    avatarShape={preferences.avatarShape}
                    avatarColorScheme={preferences.avatarColorScheme}
                    avatarBorderColor={preferences.avatarBorderColor}
                    size="sm"
                    showRings={false}
                    showAchievements={false}
                    showStatus={true}
                    showFrame={false}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{userName}</p>
                    {preferences.showEmail && (
                      <p className={`text-[10px] text-muted-foreground truncate ${preferences.blurEmail ? 'blur-sm select-none' : ''}`}>
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="pt-1.5 border-t border-border/50">
                  <StatusPicker
                    currentStatus={status?.status || 'active'}
                    customMessage={status?.customMessage}
                    onStatusChange={handleStatusChange}
                    compact
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs gap-2"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3 w-3" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground text-center">
                  Sign in to access all features
                </p>
                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full h-7 text-xs gap-2"
                    onClick={() => router.push('/login')}
                  >
                    <LogIn className="h-3 w-3" />
                    Sign In
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => router.push('/register')}
                  >
                    Create Account
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Grouped Navigation Categories */}
          {navigationCategories.map((category, categoryIndex) => {
            const isExpanded = expandedCategories.has(category.id)
            const CategoryIcon = category.icon
            const hasActiveItem = category.items.some(item => item.id === currentView)

            return (
              <motion.div
                key={category.id}
                id={`category-${category.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.05 }}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {/* Category Header */}
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-between h-8 font-semibold text-xs mb-1 group transition-all",
                    hasActiveItem && "bg-primary/5"
                  )}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={isExpanded ? { rotate: 0 } : { rotate: -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="h-3 w-3" />
                    </motion.div>
                    <CategoryIcon 
                      className="h-3.5 w-3.5" 
                      style={{ color: category.color }}
                    />
                    <span>{category.label}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className="h-4 px-1.5 text-[9px]"
                  >
                    {category.items.length}
                  </Badge>
                </Button>

                {/* Category Items */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-0.5 pl-2 mb-2 overflow-hidden"
                    >
                      {category.items.map((item, itemIndex) => {
                        const Icon = item.icon
                        const isActive = currentView === item.id
                        const isLocked = item.requiresAuth && !session?.user

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: itemIndex * 0.03 }}
                            whileHover={{ x: 4, scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={isActive ? "secondary" : "ghost"}
                                  className={cn(
                                    "w-full justify-start gap-2 h-8 font-medium text-xs transition-all",
                                    isActive && "bg-primary/10 text-primary hover:bg-primary/15 shadow-sm",
                                    isLocked && "opacity-60"
                                  )}
                                  onClick={() => onViewChange(item.id)}
                                  style={isActive ? {
                                    borderLeft: `2px solid ${category.color}`
                                  } : undefined}
                                >
                                  <Icon className="h-3.5 w-3.5 shrink-0" />
                                  <span className="flex-1 text-left truncate">{item.label}</span>
                                  {item.isPro && (
                                    <Sparkles className="h-3 w-3 text-yellow-500" />
                                  )}
                                  {item.badge !== undefined && item.badge > 0 && (
                                    <Badge 
                                      variant={isActive ? "default" : "secondary"}
                                      className="h-4 min-w-4 px-1 text-[10px]"
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs">
                                <p className="font-semibold">{item.label}</p>
                                <p className="text-xs opacity-90">{item.description}</p>
                                {isLocked && (
                                  <p className="text-xs text-yellow-500 mt-1">🔒 Sign in required</p>
                                )}
                                {item.isPro && (
                                  <p className="text-xs text-yellow-500 mt-1">✨ Pro Feature</p>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </motion.div>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}

          {/* Help Card */}
          <motion.div 
            className="px-2 py-3 bg-gradient-to-br from-primary/5 to-accent/10 rounded-lg border border-primary/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                <p className="text-[10px] font-semibold text-foreground">
                  Revolutionary Sidebar
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Features:
              </p>
              <ul className="text-[9px] text-muted-foreground space-y-0.5 pl-2">
                <li>• 📊 Smart Minimap Navigation</li>
                <li>• 🎯 Magnetic Section Snapping</li>
                <li>• 🌈 Color-coded Categories</li>
                <li>• ⚡ Collapsible Groups</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground text-center space-y-0.5">
          <p className="font-semibold text-[10px]">9TD v9.0 Revolutionary</p>
          <p className="text-[9px]">Smart Minimap Sidebar</p>
        </div>
      </div>
    </div>
  )
}

// ========================================================================
// SMART MINIMAP SCROLLBAR - REVOLUTIONARY NAVIGATION COMPONENT
// ========================================================================
interface SmartMinimapScrollbarProps {
  categories: NavigationCategory[]
  expandedCategories: Set<string>
  currentView: SidebarView
  scrollProgress: number
  hoveredCategory: string | null
  onCategoryClick: (categoryId: string) => void
  onCategoryHover: (categoryId: string | null) => void
}

function SmartMinimapScrollbar({
  categories,
  expandedCategories,
  currentView,
  scrollProgress,
  hoveredCategory,
  onCategoryClick,
  onCategoryHover,
}: SmartMinimapScrollbarProps) {
  return (
    <div className="absolute right-0 top-0 bottom-0 w-2 z-50 group">
      {/* Background Track */}
      <div className="absolute inset-y-0 right-0 w-1 bg-border/20 rounded-full" />
      
      {/* Color-coded Sections */}
      <div className="absolute inset-y-0 right-0 w-1 flex flex-col">
        {categories.map((category, index) => {
          const hasActiveItem = category.items.some(item => item.id === currentView)
          const isHovered = hoveredCategory === category.id
          const heightPercent = 100 / categories.length
          
          return (
            <Tooltip key={category.id}>
              <TooltipTrigger asChild>
                <motion.button
                  className="relative"
                  style={{
                    height: `${heightPercent}%`,
                  }}
                  whileHover={{ scale: 1.5, x: -2 }}
                  onClick={() => onCategoryClick(category.id)}
                  onMouseEnter={() => onCategoryHover(category.id)}
                  onMouseLeave={() => onCategoryHover(null)}
                >
                  {/* Section Color */}
                  <div 
                    className={cn(
                      "absolute inset-0 right-0 w-1 transition-all",
                      hasActiveItem && "w-2 shadow-lg",
                      isHovered && "w-3"
                    )}
                    style={{
                      backgroundColor: category.color,
                      opacity: hasActiveItem ? 0.9 : isHovered ? 0.6 : 0.3,
                    }}
                  />
                  
                  {/* Active Indicator */}
                  {hasActiveItem && (
                    <motion.div
                      className="absolute inset-0 right-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div 
                        className="absolute inset-0 right-0 w-2 animate-pulse-smooth"
                        style={{
                          backgroundColor: category.color,
                          boxShadow: `0 0 8px ${category.color}`,
                        }}
                      />
                    </motion.div>
                  )}
                  
                  {/* Hover Glow */}
                  {isHovered && (
                    <motion.div
                      className="absolute inset-0 right-0 w-3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      style={{
                        backgroundColor: category.color,
                        filter: 'blur(4px)',
                      }}
                    />
                  )}
                </motion.button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="font-semibold">{category.label}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
      
      {/* Scroll Progress Thumb */}
      <motion.div
        className="absolute right-0 w-2 h-12 bg-primary rounded-full shadow-lg pointer-events-none"
        style={{
          top: `${scrollProgress * (100 - 12)}%`,
          boxShadow: '0 0 12px var(--primary)',
        }}
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Minimap Labels (on hover) */}
      <AnimatePresence>
        {hoveredCategory && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          >
            <div className="glass-card px-3 py-2 rounded-lg shadow-xl border">
              <div className="flex items-center gap-2">
                {categories.find(c => c.id === hoveredCategory)?.icon && (
                  <div>
                    {(() => {
                      const Icon = categories.find(c => c.id === hoveredCategory)!.icon
                      return <Icon className="h-4 w-4" style={{ 
                        color: categories.find(c => c.id === hoveredCategory)!.color 
                      }} />
                    })()}
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold">
                    {categories.find(c => c.id === hoveredCategory)?.label}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {categories.find(c => c.id === hoveredCategory)?.items.length} items
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}