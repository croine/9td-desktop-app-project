"use client"

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { AvatarWithRings } from '@/components/avatar/AvatarWithRings'
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
} from 'lucide-react'
import { motion } from 'framer-motion'
import { authClient, useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// ========================================================================
// NAVIGATION SIDEBAR v7.0 - WITH ADVANCED AVATAR FEATURES
// Updated: JAN-2025 - Added Productivity Rings, Achievements, Status, Frames
// ========================================================================

export type SidebarView = 
  | 'dashboard' 
  | 'your-tasks' 
  | 'activity-logs'
  | 'owner-panel'
  | 'settings'
  | 'message-system'
  | 'calendar'
  | 'kanban'
  | 'gantt'
  | 'analytics'
  | 'pomodoro'
  | 'time-blocking'
  | 'gamification'
  | 'avatar-customization'

interface NavigationSidebarProps {
  currentView: SidebarView
  onViewChange: (view: SidebarView) => void
  taskCount?: number
  inboxCount?: number
  session: any
  sessionPending: boolean
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

  const fetchAllData = async () => {
    const token = localStorage.getItem("bearer_token")
    if (!token) return

    try {
      // Fetch all data in parallel
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

  // ==========================================
  // EXPANDED NAVIGATION TABS WITH NEW FEATURES
  // ==========================================
  const navigationTabs = [
    { 
      id: 'dashboard' as const, 
      label: 'Dashboard', 
      icon: LayoutDashboard,
      description: 'Overview and statistics of all your tasks',
      requiresAuth: false
    },
    { 
      id: 'your-tasks' as const, 
      label: 'Your Tasks', 
      icon: CheckSquare, 
      badge: taskCount,
      description: 'View and manage all your active tasks',
      requiresAuth: true
    },
    { 
      id: 'calendar' as const, 
      label: 'Calendar', 
      icon: CalendarIcon,
      description: 'Calendar view of your tasks',
      requiresAuth: true
    },
    { 
      id: 'kanban' as const, 
      label: 'Kanban Board', 
      icon: Trello,
      description: 'Drag-and-drop task management',
      requiresAuth: true
    },
    { 
      id: 'gantt' as const, 
      label: 'Gantt Chart', 
      icon: GanttChartSquare,
      description: 'Timeline and dependency visualization',
      requiresAuth: true
    },
    { 
      id: 'pomodoro' as const, 
      label: 'Pomodoro Timer', 
      icon: Timer,
      description: 'Focus timer with work/break intervals',
      requiresAuth: true
    },
    { 
      id: 'time-blocking' as const, 
      label: 'Time Blocking', 
      icon: Clock,
      description: 'Schedule tasks in weekly calendar',
      requiresAuth: true
    },
    { 
      id: 'analytics' as const, 
      label: 'Analytics', 
      icon: BarChart3,
      description: 'Productivity insights and reports',
      requiresAuth: true
    },
    { 
      id: 'gamification' as const, 
      label: 'Achievements', 
      icon: Trophy,
      description: 'Track achievements, XP, and daily streaks',
      requiresAuth: true
    },
    { 
      id: 'avatar-customization' as const, 
      label: 'Avatar Studio', 
      icon: Palette,
      description: 'Customize your avatar with frames and colors',
      requiresAuth: true
    },
    { 
      id: 'activity-logs' as const, 
      label: 'Activity Logs', 
      icon: History,
      description: 'Track all changes and updates to tasks',
      requiresAuth: true
    },
    { 
      id: 'owner-panel' as const, 
      label: 'Owner Panel', 
      icon: TagIcon,
      description: 'Manage tags, categories, and workspace settings',
      requiresAuth: true
    },
    { 
      id: 'message-system' as const, 
      label: 'Messages', 
      icon: MessageSquare,
      description: 'Team communication and collaboration',
      requiresAuth: true
    },
    { 
      id: 'settings' as const, 
      label: 'Settings Hub', 
      icon: Settings,
      description: 'Advanced features and configuration',
      requiresAuth: true
    },
  ]

  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : session?.user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="flex flex-col h-full border-r bg-sidebar/50 backdrop-blur-sm">
      <ScrollArea className="flex-1 py-4">
        <div className="space-y-4 px-3">
          {/* User Section with Advanced Avatar */}
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
                    showRings={true}
                    showAchievements={true}
                    showStatus={true}
                    showFrame={true}
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

          {/* Navigation Section */}
          <div className="space-y-0.5">
            <h3 className="px-2 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Main Navigation
            </h3>
            {navigationTabs.map((tab, index) => {
              const Icon = tab.icon
              const isActive = currentView === tab.id
              const isLocked = tab.requiresAuth && !session?.user

              return (
                <motion.div
                  key={tab.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 6, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-2 h-9 font-medium text-xs transition-all duration-300",
                          isActive && "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary shadow-sm border-l-2 border-primary",
                          isLocked && "opacity-60"
                        )}
                        onClick={() => onViewChange(tab.id)}
                      >
                        <motion.div
                          animate={isActive ? {
                            rotate: [0, 10, -10, 0],
                            scale: [1, 1.1, 1.1, 1]
                          } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                        </motion.div>
                        <span className="flex-1 text-left">{tab.label}</span>
                        {tab.badge !== undefined && tab.badge > 0 && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Badge 
                              variant={isActive ? "default" : "secondary"}
                              className="h-4 min-w-4 px-1 text-[10px] font-semibold"
                            >
                              {tab.badge}
                            </Badge>
                          </motion.div>
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <p className="font-semibold">{tab.label}</p>
                      <p className="text-xs opacity-90">{tab.description}</p>
                      {isLocked && (
                        <p className="text-xs text-yellow-500 mt-1">🔒 Sign in required</p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )
            })}
          </div>

          {/* Help Card */}
          <motion.div 
            className="px-2 py-3 bg-gradient-to-br from-primary/5 to-accent/10 rounded-lg border border-primary/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-foreground">
                💡 Advanced Avatar Features
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Check out your new avatar features:
              </p>
              <ul className="text-[9px] text-muted-foreground space-y-0.5 pl-2">
                <li>• 🎯 Productivity Rings</li>
                <li>• 🏆 Achievement Badges</li>
                <li>• 🟢 Status Indicators</li>
                <li>• 🖼️ Avatar Frames</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/30">
        <div className="text-xs text-muted-foreground text-center space-y-0.5">
          <p className="font-semibold text-[10px]">9TD v7.0 Ultimate</p>
          <p className="text-[9px]">With Advanced Avatars</p>
        </div>
      </div>
    </div>
  )
}