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
  Shield,
  Fingerprint,
  Chrome,
  Github,
  Command,
  Orbit,
  Cpu,
  Radio,
  UserPlus,
  KeyRound,
} from 'lucide-react'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { authClient, useSession } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useCustomer } from 'autumn-js/react'

// ========================================================================
// ORBITAL NAVIGATION SYSTEM v10.0 - REVOLUTIONARY NEURAL NETWORK DESIGN
// Updated: JAN-2025 - Physics-based, particle effects, 3D transforms
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

interface NavigationNode {
  id: SidebarView
  label: string
  icon: any
  badge?: number
  description: string
  requiresAuth: boolean
  isPro?: boolean
  angle: number // For orbital positioning
  distance: number // Distance from center
  color: string
}

interface OrbitalRing {
  id: string
  label: string
  nodes: NavigationNode[]
  radius: number
  color: string
  icon: any
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

interface Particle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  life: number
  color: string
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
  const { customer, isLoading: isLoadingCustomer } = useCustomer()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  
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
  const [activeRing, setActiveRing] = useState<string | null>(null)
  const [hoveredNode, setHoveredNode] = useState<SidebarView | null>(null)
  const [particles, setParticles] = useState<Particle[]>([])
  const [orbitalMode, setOrbitalMode] = useState<'collapsed' | 'expanded'>('collapsed')
  const [navigationHistory, setNavigationHistory] = useState<SidebarView[]>([])
  
  // Calculate session duration for signed-in users
  const [sessionDuration, setSessionDuration] = useState<string>('')
  
  useEffect(() => {
    if (session?.user) {
      const updateDuration = () => {
        const now = new Date()
        const hours = now.getHours()
        const minutes = now.getMinutes()
        setSessionDuration(`${hours}:${minutes.toString().padStart(2, '0')}`)
      }
      
      updateDuration()
      const interval = setInterval(updateDuration, 60000)
      return () => clearInterval(interval)
    }
  }, [session])

  // Determine user plan status
  const isPro = customer?.products?.some(p => 
    p.id !== 'free' && (p.status === 'active' || p.status === 'trialing')
  )

  // ==========================================
  // ORBITAL RINGS CONFIGURATION
  // ==========================================
  const orbitalRings: OrbitalRing[] = [
    {
      id: 'core',
      label: 'Core',
      radius: 80,
      color: '#3b82f6',
      icon: Cpu,
      nodes: [
        { 
          id: 'dashboard', 
          label: 'Dashboard', 
          icon: LayoutDashboard,
          description: 'Overview and statistics',
          requiresAuth: false,
          angle: 0,
          distance: 80,
          color: '#3b82f6'
        },
        { 
          id: 'your-tasks', 
          label: 'Tasks', 
          icon: CheckSquare, 
          badge: taskCount,
          description: 'Manage active tasks',
          requiresAuth: true,
          angle: 120,
          distance: 80,
          color: '#3b82f6'
        },
        { 
          id: 'settings', 
          label: 'Settings', 
          icon: Settings,
          description: 'Configure workspace',
          requiresAuth: true,
          angle: 240,
          distance: 80,
          color: '#3b82f6'
        },
      ]
    },
    {
      id: 'productivity',
      label: 'Productivity',
      radius: 140,
      color: '#8b5cf6',
      icon: Target,
      nodes: [
        { 
          id: 'daily-planning', 
          label: 'Daily', 
          icon: Clock,
          description: 'Plan your day',
          requiresAuth: true,
          angle: 30,
          distance: 140,
          color: '#8b5cf6'
        },
        { 
          id: 'focus-mode', 
          label: 'Focus', 
          icon: Brain,
          description: 'Deep work mode',
          requiresAuth: true,
          isPro: true,
          angle: 90,
          distance: 140,
          color: '#8b5cf6'
        },
        { 
          id: 'pomodoro', 
          label: 'Pomodoro', 
          icon: Timer,
          description: 'Focus timer',
          requiresAuth: true,
          isPro: true,
          angle: 150,
          distance: 140,
          color: '#8b5cf6'
        },
        { 
          id: 'time-blocking', 
          label: 'Time Block', 
          icon: Clock,
          description: 'Weekly schedule',
          requiresAuth: true,
          isPro: true,
          angle: 210,
          distance: 140,
          color: '#8b5cf6'
        },
      ]
    },
    {
      id: 'views',
      label: 'Views',
      radius: 200,
      color: '#ec4899',
      icon: Trello,
      nodes: [
        { 
          id: 'calendar', 
          label: 'Calendar', 
          icon: CalendarIcon,
          description: 'Calendar view',
          requiresAuth: true,
          angle: 0,
          distance: 200,
          color: '#ec4899'
        },
        { 
          id: 'kanban', 
          label: 'Kanban', 
          icon: Trello,
          description: 'Drag-drop board',
          requiresAuth: true,
          isPro: true,
          angle: 60,
          distance: 200,
          color: '#ec4899'
        },
        { 
          id: 'gantt', 
          label: 'Gantt', 
          icon: GanttChartSquare,
          description: 'Timeline view',
          requiresAuth: true,
          isPro: true,
          angle: 120,
          distance: 200,
          color: '#ec4899'
        },
        { 
          id: 'dependencies', 
          label: 'Dependencies', 
          icon: Workflow,
          description: 'Task relations',
          requiresAuth: true,
          angle: 180,
          distance: 200,
          color: '#ec4899'
        },
      ]
    },
    {
      id: 'insights',
      label: 'Insights',
      radius: 260,
      color: '#f59e0b',
      icon: BarChart3,
      nodes: [
        { 
          id: 'analytics', 
          label: 'Analytics', 
          icon: BarChart3,
          description: 'Insights',
          requiresAuth: true,
          angle: 45,
          distance: 260,
          color: '#f59e0b'
        },
        { 
          id: 'activity-logs', 
          label: 'Activity', 
          icon: History,
          description: 'Track changes',
          requiresAuth: true,
          angle: 135,
          distance: 260,
          color: '#f59e0b'
        },
        { 
          id: 'gamification', 
          label: 'Achievements', 
          icon: Trophy,
          description: 'XP & levels',
          requiresAuth: true,
          angle: 225,
          distance: 260,
          color: '#f59e0b'
        },
        { 
          id: 'avatar-customization', 
          label: 'Avatar', 
          icon: Palette,
          description: 'Customize',
          requiresAuth: true,
          angle: 315,
          distance: 260,
          color: '#f59e0b'
        },
      ]
    },
    {
      id: 'advanced',
      label: 'Advanced',
      radius: 320,
      color: '#10b981',
      icon: Zap,
      nodes: [
        { 
          id: 'owner-panel', 
          label: 'Owner', 
          icon: TagIcon,
          description: 'Workspace mgmt',
          requiresAuth: true,
          angle: 90,
          distance: 320,
          color: '#10b981'
        },
        { 
          id: 'message-system', 
          label: 'Messages', 
          icon: MessageSquare,
          description: 'Team chat',
          requiresAuth: true,
          isPro: true,
          angle: 270,
          distance: 320,
          color: '#10b981'
        },
      ]
    },
  ]

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        mouseX.set(e.clientX - rect.left)
        mouseY.set(e.clientY - rect.top)
      }
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Particle system animation
  useEffect(() => {
    if (orbitalMode === 'expanded') {
      const interval = setInterval(() => {
        setParticles(prev => {
          // Add new particles
          const newParticles = [...prev]
          
          if (newParticles.length < 50 && Math.random() > 0.7) {
            newParticles.push({
              id: Date.now() + Math.random(),
              x: 128,
              y: 200,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              life: 1,
              color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)]
            })
          }
          
          // Update and filter particles
          return newParticles
            .map(p => ({
              ...p,
              x: p.x + p.vx,
              y: p.y + p.vy,
              life: p.life - 0.02
            }))
            .filter(p => p.life > 0)
        })
      }, 50)
      
      return () => clearInterval(interval)
    }
  }, [orbitalMode])

  // Draw particles on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0')
        ctx.fill()
      })
      
      requestAnimationFrame(draw)
    }
    
    draw()
  }, [particles])

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

  const handleNodeClick = (nodeId: SidebarView) => {
    // Add to navigation history
    setNavigationHistory(prev => [...prev, nodeId].slice(-5))
    
    // Trigger view change
    onViewChange(nodeId)
    
    // Create particle burst effect
    const burstParticles: Particle[] = []
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20
      burstParticles.push({
        id: Date.now() + i,
        x: 128,
        y: 200,
        vx: Math.cos(angle) * 3,
        vy: Math.sin(angle) * 3,
        life: 1,
        color: orbitalRings.find(r => r.nodes.some(n => n.id === nodeId))?.color || '#3b82f6'
      })
    }
    setParticles(prev => [...prev, ...burstParticles])
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
    <div 
      ref={containerRef}
      className="flex flex-col h-full border-r relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%)',
      }}
    >
      {/* Canvas for particle effects */}
      <canvas
        ref={canvasRef}
        width={256}
        height={800}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Neural Network Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill="#3b82f6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* User Command Center */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="px-3 py-4 relative z-20"
      >
        <div className="glass-card p-3 rounded-xl border-2 border-primary/20 shadow-xl relative overflow-hidden">
          {/* Holographic shine effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear'
            }}
          />

          {sessionPending ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : session?.user ? (
            <div className="space-y-3 relative z-10">
              {/* Command Center Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{
                      rotate: 360,
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                      scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
                    }}
                  >
                    <Orbit className="h-4 w-4 text-primary" />
                  </motion.div>
                  <span className="text-xs font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                    COMMAND CENTER
                  </span>
                </div>
                <Badge 
                  variant="outline" 
                  className="h-5 px-2 text-[9px] border-emerald-500/50 bg-emerald-500/10 text-emerald-600"
                >
                  <Radio className="h-2 w-2 mr-1 animate-pulse" />
                  ONLINE
                </Badge>
              </div>

              {/* Avatar with 3D transform */}
              <motion.div
                className="flex items-center gap-3"
                whileHover={{ scale: 1.02 }}
              >
                <motion.div
                  animate={{
                    rotateY: [0, 360],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
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
                    showAchievements={false}
                    showStatus={true}
                    showFrame={false}
                  />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{userName}</p>
                  {preferences.showEmail && (
                    <p className={`text-[9px] text-muted-foreground truncate ${preferences.blurEmail ? 'blur-sm' : ''}`}>
                      {session.user.email}
                    </p>
                  )}
                  <div className="flex items-center gap-1 mt-0.5">
                    <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] text-emerald-600 font-semibold">
                      {sessionDuration}
                    </span>
                  </div>
                </div>
                {isPro && (
                  <motion.div
                    animate={{
                      rotate: [0, 5, 0, -5, 0],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </motion.div>
                )}
              </motion.div>

              {/* Quick Status */}
              <StatusPicker
                currentStatus={status?.status || 'active'}
                customMessage={status?.customMessage}
                onStatusChange={handleStatusChange}
                compact
              />

              {/* Sign Out */}
              <Button
                variant="outline"
                size="sm"
                className="w-full h-7 text-[10px] gap-1.5 border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50"
                onClick={handleSignOut}
              >
                <LogOut className="h-3 w-3" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5 relative z-10">
              <div className="flex items-center justify-center gap-2 pb-2">
                <Shield className="h-4 w-4 text-primary animate-pulse" />
                <span className="text-xs font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  GUEST MODE
                </span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="h-6 px-2 text-[9px] gap-1 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/95 hover:to-primary/85"
                  onClick={() => router.push('/login')}
                >
                  <LogIn className="h-2.5 w-2.5" />
                  Sign In
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[9px] gap-1"
                  onClick={() => router.push('/register')}
                >
                  <Sparkles className="h-2.5 w-2.5 text-primary" />
                  Register
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 px-2 text-[9px] gap-1"
                  onClick={() => router.push('/pricing')}
                >
                  <Fingerprint className="h-2.5 w-2.5 text-primary" />
                  Get License Key
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Orbital Navigation Toggle */}
      <div className="px-3 py-2 relative z-20">
        <Button
          variant={orbitalMode === 'expanded' ? 'default' : 'outline'}
          size="sm"
          className="w-full h-8 text-xs gap-2 font-semibold"
          onClick={() => setOrbitalMode(mode => mode === 'collapsed' ? 'expanded' : 'collapsed')}
        >
          <motion.div
            animate={{
              rotate: orbitalMode === 'expanded' ? 360 : 0
            }}
            transition={{ duration: 0.5 }}
          >
            <Orbit className="h-4 w-4" />
          </motion.div>
          {orbitalMode === 'expanded' ? 'Collapse Orbit' : 'Expand Orbit'}
        </Button>
      </div>

      {/* Main Navigation Area */}
      <div className="flex-1 relative z-20 overflow-hidden">
        <AnimatePresence mode="wait">
          {orbitalMode === 'expanded' ? (
            <OrbitalNavigationView
              key="orbital"
              rings={orbitalRings}
              currentView={currentView}
              hoveredNode={hoveredNode}
              onNodeClick={handleNodeClick}
              onNodeHover={setHoveredNode}
              session={session}
            />
          ) : (
            <CompactListView
              key="list"
              rings={orbitalRings}
              currentView={currentView}
              onNodeClick={handleNodeClick}
              session={session}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Navigation History Trail */}
      {navigationHistory.length > 0 && (
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="px-3 py-2 border-t border-border/50 relative z-20"
        >
          <div className="text-[9px] text-muted-foreground mb-1 flex items-center gap-1">
            <History className="h-2.5 w-2.5" />
            Recent
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {navigationHistory.slice(-5).map((viewId, index) => {
              const node = orbitalRings.flatMap(r => r.nodes).find(n => n.id === viewId)
              if (!node) return null
              const Icon = node.icon
              return (
                <motion.button
                  key={`${viewId}-${index}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center border"
                  style={{
                    backgroundColor: node.color + '20',
                    borderColor: node.color + '50',
                  }}
                  onClick={() => onViewChange(viewId)}
                >
                  <Icon className="h-3 w-3" style={{ color: node.color }} />
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="p-3 border-t relative z-20"
      >
        <div className="text-xs text-center space-y-0.5">
          <div className="flex items-center justify-center gap-1">
            <motion.div
              animate={{
                rotate: 360
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear'
              }}
            >
              <Cpu className="h-3 w-3 text-primary" />
            </motion.div>
            <span className="font-bold bg-gradient-to-r from-primary via-purple-600 to-pink-600 bg-clip-text text-transparent">
              9TD v10.0 ORBITAL
            </span>
          </div>
          <p className="text-[9px] text-muted-foreground">Neural Navigation System</p>
        </div>
      </motion.div>
    </div>
  )
}

// ========================================================================
// ORBITAL NAVIGATION VIEW - 3D ROTATING RINGS
// ========================================================================
interface OrbitalNavigationViewProps {
  rings: OrbitalRing[]
  currentView: SidebarView
  hoveredNode: SidebarView | null
  onNodeClick: (nodeId: SidebarView) => void
  onNodeHover: (nodeId: SidebarView | null) => void
  session: any
}

function OrbitalNavigationView({
  rings,
  currentView,
  hoveredNode,
  onNodeClick,
  onNodeHover,
  session
}: OrbitalNavigationViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="relative w-full h-full flex items-center justify-center"
    >
      {/* Central Hub */}
      <motion.div
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
        animate={{
          scale: [1, 1.1, 1],
          rotate: 360
        }}
        transition={{
          scale: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' }
        }}
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary via-purple-600 to-pink-600 flex items-center justify-center shadow-2xl relative overflow-hidden">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            animate={{
              x: ['-100%', '200%']
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
          <Cpu className="h-6 w-6 text-white relative z-10" />
        </div>
      </motion.div>

      {/* Orbital Rings with Nodes */}
      {rings.map((ring, ringIndex) => {
        const RingIcon = ring.icon
        return (
          <motion.div
            key={ring.id}
            className="absolute"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            animate={{
              rotate: 360
            }}
            transition={{
              duration: 30 + ringIndex * 10,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            {/* Ring circle */}
            <div
              className="absolute rounded-full border border-dashed opacity-20"
              style={{
                width: ring.radius * 2,
                height: ring.radius * 2,
                left: -ring.radius,
                top: -ring.radius,
                borderColor: ring.color,
              }}
            />

            {/* Nodes on the ring */}
            {ring.nodes.map((node, nodeIndex) => {
              const Icon = node.icon
              const isActive = currentView === node.id
              const isHovered = hoveredNode === node.id
              const isLocked = node.requiresAuth && !session?.user
              
              const x = Math.cos((node.angle * Math.PI) / 180) * ring.radius
              const y = Math.sin((node.angle * Math.PI) / 180) * ring.radius

              return (
                <Tooltip key={node.id}>
                  <TooltipTrigger asChild>
                    <motion.button
                      className="absolute"
                      style={{
                        left: x - 16,
                        top: y - 16,
                      }}
                      animate={{
                        scale: isActive ? 1.3 : isHovered ? 1.2 : 1,
                        rotate: isActive ? 360 : 0,
                      }}
                      whileHover={{ scale: 1.4 }}
                      whileTap={{ scale: 0.9 }}
                      transition={{
                        rotate: { duration: 0.5 }
                      }}
                      onClick={() => onNodeClick(node.id)}
                      onMouseEnter={() => onNodeHover(node.id)}
                      onMouseLeave={() => onNodeHover(null)}
                      disabled={isLocked}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all relative overflow-hidden",
                          isActive && "shadow-2xl ring-2 ring-offset-2",
                          isLocked && "opacity-50 cursor-not-allowed"
                        )}
                        style={{
                          backgroundColor: isActive ? ring.color : ring.color + '30',
                          borderColor: ring.color,
                          boxShadow: isActive ? `0 0 20px ${ring.color}` : 'none',
                        }}
                      >
                        {/* Holographic effect */}
                        {isActive && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            animate={{
                              x: ['-100%', '200%']
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: 'linear'
                            }}
                          />
                        )}
                        
                        <Icon 
                          className={cn(
                            "h-5 w-5 relative z-10",
                            isActive ? "text-white" : ""
                          )} 
                          style={{ color: isActive ? 'white' : ring.color }}
                        />
                        
                        {node.isPro && (
                          <Sparkles className="absolute top-0 right-0 h-3 w-3 text-yellow-500" />
                        )}
                        
                        {node.badge !== undefined && node.badge > 0 && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[8px] flex items-center justify-center font-bold">
                            {node.badge}
                          </div>
                        )}
                      </div>
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-semibold text-xs">{node.label}</p>
                      <p className="text-[10px] text-muted-foreground">{node.description}</p>
                      {isLocked && (
                        <p className="text-[10px] text-yellow-500">🔒 Sign in required</p>
                      )}
                      {node.isPro && (
                        <p className="text-[10px] text-yellow-500">✨ Pro Feature</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ========================================================================
// COMPACT LIST VIEW - TRADITIONAL FALLBACK
// ========================================================================
interface CompactListViewProps {
  rings: OrbitalRing[]
  currentView: SidebarView
  onNodeClick: (nodeId: SidebarView) => void
  session: any
}

function CompactListView({
  rings,
  currentView,
  onNodeClick,
  session
}: CompactListViewProps) {
  const [expandedRings, setExpandedRings] = useState<Set<string>>(new Set(['core']))

  const toggleRing = (ringId: string) => {
    setExpandedRings(prev => {
      const next = new Set(prev)
      if (next.has(ringId)) {
        next.delete(ringId)
      } else {
        next.add(ringId)
      }
      return next
    })
  }

  return (
    <ScrollArea className="h-full px-3">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="space-y-2 py-2"
      >
        {rings.map((ring, ringIndex) => {
          const RingIcon = ring.icon
          const isExpanded = expandedRings.has(ring.id)
          const hasActiveNode = ring.nodes.some(n => n.id === currentView)

          return (
            <motion.div
              key={ring.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: ringIndex * 0.05 }}
            >
              {/* Ring Header */}
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "w-full justify-between h-7 text-xs font-semibold mb-1",
                  hasActiveNode && "bg-primary/5"
                )}
                onClick={() => toggleRing(ring.id)}
              >
                <div className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: isExpanded ? 0 : -90 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-3 w-3" />
                  </motion.div>
                  <RingIcon className="h-3.5 w-3.5" style={{ color: ring.color }} />
                  <span>{ring.label}</span>
                </div>
                <Badge 
                  variant="secondary" 
                  className="h-4 px-1.5 text-[9px]"
                  style={{ backgroundColor: ring.color + '20', color: ring.color }}
                >
                  {ring.nodes.length}
                </Badge>
              </Button>

              {/* Ring Nodes */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-0.5 pl-2 mb-2 overflow-hidden"
                  >
                    {ring.nodes.map((node, nodeIndex) => {
                      const Icon = node.icon
                      const isActive = currentView === node.id
                      const isLocked = node.requiresAuth && !session?.user

                      return (
                        <motion.div
                          key={node.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: nodeIndex * 0.03 }}
                          whileHover={{ x: 4 }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={isActive ? "secondary" : "ghost"}
                                size="sm"
                                className={cn(
                                  "w-full justify-start gap-2 h-7 text-xs",
                                  isActive && "bg-primary/10 text-primary shadow-sm",
                                  isLocked && "opacity-50"
                                )}
                                onClick={() => onNodeClick(node.id)}
                                style={isActive ? {
                                  borderLeft: `2px solid ${ring.color}`
                                } : undefined}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                <span className="flex-1 text-left truncate">{node.label}</span>
                                {node.isPro && <Sparkles className="h-3 w-3 text-yellow-500" />}
                                {node.badge !== undefined && node.badge > 0 && (
                                  <Badge 
                                    variant={isActive ? "default" : "secondary"}
                                    className="h-4 px-1 text-[9px]"
                                  >
                                    {node.badge}
                                  </Badge>
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p className="font-semibold text-xs">{node.label}</p>
                              <p className="text-[10px]">{node.description}</p>
                              {isLocked && <p className="text-[10px] text-yellow-500">🔒 Sign in required</p>}
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
      </motion.div>
    </ScrollArea>
  )
}