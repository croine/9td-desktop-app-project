"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient, useSession } from '@/lib/auth-client'
import { useCustomer } from 'autumn-js/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AvatarWithRings } from '@/components/avatar/AvatarWithRings'
import { StatusPicker } from '@/components/avatar/StatusPicker'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { 
  User, 
  Settings, 
  LogOut, 
  Shield,
  UserCircle,
  Bell,
  Edit2,
  Check,
  X,
  Eye,
  EyeOff,
  Crown,
  CreditCard,
  Star,
  Users,
  Sparkles,
  Zap,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'

interface UserAvatarProps {
  session: any
  onOpenSettings?: () => void
  onOpenAccountSettings?: () => void
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

export function UserAvatar({ session, onOpenSettings, onOpenAccountSettings }: UserAvatarProps) {
  const router = useRouter()
  const { refetch: refetchSession } = useSession()
  const { customer, isLoading: isLoadingCustomer, refetch: refetchCustomer } = useCustomer()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [customTitle, setCustomTitle] = useState('Account Secured')
  const [tempTitle, setTempTitle] = useState('')
  const [showEmail, setShowEmail] = useState(false)
  const [blurEmail, setBlurEmail] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showPrivacySettings, setShowPrivacySettings] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [avatarShape, setAvatarShape] = useState<'circle' | 'square' | 'rounded'>('circle')
  const [avatarColorScheme, setAvatarColorScheme] = useState<'solid' | 'gradient' | 'rainbow' | 'fade'>('gradient')
  const [avatarBorderColor, setAvatarBorderColor] = useState('#6366f1')
  const [stats, setStats] = useState<UserStats | null>(null)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [status, setStatus] = useState<UserStatus | null>(null)
  const [activeFrame, setActiveFrame] = useState<ActiveFrame | null>(null)

  // Get current plan
  const currentPlan = customer?.products?.at(-1)
  const planName = currentPlan?.name || 'Free'
  const isPaidPlan = planName !== 'Free'

  // Enhanced Plan Badge Configuration with modern, eye-catching designs
  const getPlanBadgeConfig = () => {
    switch (planName.toLowerCase()) {
      case 'pro':
        return {
          gradient: 'bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600',
          glowColor: 'shadow-violet-500/50 hover:shadow-violet-500/80',
          ringColor: 'ring-violet-400/30',
          textGradient: 'bg-gradient-to-r from-violet-100 to-fuchsia-100 bg-clip-text text-transparent',
          icon: Sparkles,
          iconColor: 'text-violet-200',
          shimmer: 'from-transparent via-white/40 to-transparent',
          badge: '✨',
          hoverScale: 'hover:scale-105',
          animation: 'animate-pulse-smooth'
        }
      case 'team':
        return {
          gradient: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500',
          glowColor: 'shadow-amber-500/50 hover:shadow-amber-500/80',
          ringColor: 'ring-amber-400/30',
          textGradient: 'bg-gradient-to-r from-amber-50 to-yellow-50 bg-clip-text text-transparent',
          icon: Crown,
          iconColor: 'text-amber-100',
          shimmer: 'from-transparent via-white/50 to-transparent',
          badge: '👑',
          hoverScale: 'hover:scale-105',
          animation: 'animate-pulse-smooth'
        }
      default: // Free
        return {
          gradient: 'bg-gradient-to-r from-slate-500 via-slate-600 to-slate-500',
          glowColor: 'shadow-slate-500/20 hover:shadow-slate-500/40',
          ringColor: 'ring-slate-400/20',
          textGradient: 'text-slate-100',
          icon: Star,
          iconColor: 'text-slate-300',
          shimmer: 'from-transparent via-white/20 to-transparent',
          badge: '⭐',
          hoverScale: 'hover:scale-105',
          animation: ''
        }
    }
  }

  const badgeConfig = getPlanBadgeConfig()
  const BadgeIcon = badgeConfig.icon

  // Fetch user preferences when session changes
  useEffect(() => {
    if (session?.user) {
      fetchAllData()
    }
  }, [session])

  // Listen for avatar update events for immediate sync
  useEffect(() => {
    const handleAvatarUpdate = () => {
      console.log('Avatar updated event received in UserAvatar, refetching...')
      fetchAllData()
    }

    // Listen for custom avatar update event
    window.addEventListener('avatarUpdated', handleAvatarUpdate)

    // Also refetch when window gains focus (user returns from avatar customization)
    window.addEventListener('focus', fetchAllData)

    return () => {
      window.removeEventListener('avatarUpdated', handleAvatarUpdate)
      window.removeEventListener('focus', fetchAllData)
    }
  }, [session?.user])

  // Poll for updates every 5 seconds to stay in sync
  useEffect(() => {
    if (session?.user) {
      const interval = setInterval(() => {
        fetchAllData()
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [session])

  const fetchAllData = async () => {
    const token = localStorage.getItem("bearer_token")
    if (!token) {
      setIsLoading(false)
      return
    }

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
        setCustomTitle(data.customTitle || 'Account Secured')
        setShowEmail(data.showEmail || false)
        setBlurEmail(data.blurEmail || false)
        setAvatarUrl(data.avatarUrl || null)
        setAvatarShape(data.avatarShape || 'circle')
        setAvatarColorScheme(data.avatarColorScheme || 'gradient')
        setAvatarBorderColor(data.avatarBorderColor || '#6366f1')
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
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      const token = localStorage.getItem("bearer_token");
      if (!token) {
        toast.error('Authentication required');
        return;
      }

      const response = await fetch('/api/user-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        toast.success('Preferences updated')
        await fetchAllData()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to update preferences')
      }
    } catch (error) {
      console.error('Failed to update preferences:', error)
      toast.error('Failed to update preferences')
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
        toast.success('Status updated')
      }
    } catch (error) {
      console.error('Failed to update status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleSignOut = async () => {
    const { error } = await authClient.signOut()
    if (error?.code) {
      toast.error('Failed to sign out')
    } else {
      localStorage.removeItem('bearer_token')
      await refetchSession() // Refetch session to update UI
      await refetchCustomer() // Clear customer data
      toast.success('You have signed out successfully')
      // Small delay before redirect to ensure state updates
      setTimeout(() => {
        router.push('/')
      }, 500)
    }
  }

  const handleAccountSettings = () => {
    setIsOpen(false)
    if (onOpenAccountSettings) {
      onOpenAccountSettings()
    } else if (onOpenSettings) {
      onOpenSettings()
    } else {
      router.push('/settings')
    }
  }

  const handleSaveTitle = async () => {
    if (tempTitle.trim().length === 0) {
      toast.error('Title cannot be empty')
      return
    }
    if (tempTitle.trim().length > 100) {
      toast.error('Title must be 100 characters or less')
      return
    }
    
    await updatePreferences({ customTitle: tempTitle.trim() })
    setIsEditingTitle(false)
  }

  const handleCancelEdit = () => {
    setTempTitle(customTitle)
    setIsEditingTitle(false)
  }

  const handleStartEdit = () => {
    setTempTitle(customTitle)
    setIsEditingTitle(true)
  }

  const handleViewPricing = () => {
    setIsOpen(false)
    router.push('/pricing')
  }

  const handleManageBilling = async () => {
    setIsOpen(false)
    const token = localStorage.getItem("bearer_token")
    try {
      const res = await fetch("/api/billing-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          returnUrl: window.location.href
        })
      })
      
      const data = await res.json()
      if (data?.url) {
        const isInIframe = window.self !== window.top
        if (isInIframe) {
          window.parent?.postMessage({ type: "OPEN_EXTERNAL_URL", data: { url: data.url } }, "*")
        } else {
          window.open(data.url, "_blank", "noopener,noreferrer")
        }
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error)
      toast.error('Failed to open billing portal')
    }
  }

  // Early return AFTER all hooks
  if (!session?.user) {
    return null
  }

  const user = session.user
  const userName = user.name || 'User'
  const initials = user.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="flex items-center gap-3">
      {/* Revolutionary Modern Plan Badge */}
      <button
        onClick={handleViewPricing}
        className={`
          group relative h-7 px-2.5 rounded-full
          ${badgeConfig.gradient}
          ${badgeConfig.glowColor}
          ring-1 ${badgeConfig.ringColor}
          shadow-md backdrop-blur-sm
          transition-all duration-500 ease-out
          ${badgeConfig.hoverScale}
          hover:-translate-y-0.5
          ${badgeConfig.animation}
          overflow-hidden
          flex items-center gap-1.5
        `}
      >
        {/* Animated shimmer overlay */}
        <div 
          className={`
            absolute inset-0 -translate-x-full 
            bg-gradient-to-r ${badgeConfig.shimmer}
            ${isPaidPlan ? 'group-hover:animate-[shimmer_1.5s_ease-in-out_infinite]' : ''}
          `}
        />
        
        {/* Subtle particles for premium plans */}
        {isPaidPlan && (
          <>
            <div 
              className="absolute top-1 left-2 w-0.5 h-0.5 bg-white/70 rounded-full animate-ping" 
              style={{ animationDuration: '2s', animationDelay: '0s' }} 
            />
            <div 
              className="absolute top-1.5 right-3 w-0.5 h-0.5 bg-white/70 rounded-full animate-ping" 
              style={{ animationDuration: '2s', animationDelay: '0.7s' }} 
            />
            <div 
              className="absolute bottom-1 left-4 w-0.5 h-0.5 bg-white/70 rounded-full animate-ping" 
              style={{ animationDuration: '2s', animationDelay: '1.4s' }} 
            />
          </>
        )}
        
        {/* Content container */}
        <div className="relative z-10 flex items-center gap-1.5">
          {/* Animated Icon */}
          <BadgeIcon 
            className={`
              h-3 w-3 ${badgeConfig.iconColor}
              transition-all duration-300
              ${isPaidPlan ? 'group-hover:rotate-12 group-hover:scale-110' : 'group-hover:scale-110'}
              drop-shadow-sm
            `}
          />
          
          {/* Plan Name with gradient text */}
          <span 
            className={`
              ${badgeConfig.textGradient}
              font-semibold text-[10px] tracking-wide
              drop-shadow-sm
            `}
          >
            {planName}
          </span>
          
          {/* Optional: Emoji badge for extra flair */}
          <span className="text-[10px] opacity-90 group-hover:scale-125 transition-transform duration-300">
            {badgeConfig.badge}
          </span>
        </div>
        
        {/* Hover glow effect */}
        <div 
          className="
            absolute inset-0 rounded-full
            bg-gradient-to-r from-white/0 via-white/10 to-white/0
            opacity-0 group-hover:opacity-100
            transition-opacity duration-500
          "
        />
      </button>

      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-12 w-12 p-0 rounded-full"
          >
            <AvatarWithRings
              avatarUrl={avatarUrl}
              initials={initials}
              userName={userName}
              stats={stats || undefined}
              achievements={achievements}
              status={status || undefined}
              activeFrame={activeFrame}
              avatarShape={avatarShape}
              avatarColorScheme={avatarColorScheme}
              avatarBorderColor={avatarBorderColor}
              size="sm"
              showRings={false}
              showAchievements={false}
              showStatus={true}
              showFrame={false}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-80 glass-card backdrop-blur-xl bg-background/95 dark:bg-background/98 border-2" 
          align="end" 
          sideOffset={8}
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-3 p-2">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  <AvatarWithRings
                    avatarUrl={avatarUrl}
                    initials={initials}
                    userName={userName}
                    stats={stats || undefined}
                    achievements={achievements}
                    status={status || undefined}
                    activeFrame={activeFrame}
                    avatarShape={avatarShape}
                    avatarColorScheme={avatarColorScheme}
                    avatarBorderColor={avatarBorderColor}
                    size="md"
                    showRings={false}
                    showAchievements={false}
                    showStatus={true}
                    showFrame={false}
                  />
                </div>
                <div className="flex flex-col space-y-1 flex-1 min-w-0">
                  <p className="font-display font-semibold text-base leading-none">
                    {userName}
                  </p>
                  
                  {/* Customizable Title */}
                  {!isEditingTitle ? (
                    <div className="flex items-center gap-1.5 group">
                      <Shield className="h-3 w-3 text-primary shrink-0" />
                      <p className="text-xs text-muted-foreground flex-1 truncate">
                        {customTitle}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={handleStartEdit}
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        placeholder="Enter custom title"
                        className="h-7 text-xs"
                        maxLength={100}
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-green-600"
                        onClick={handleSaveTitle}
                      >
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-600"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}

                  {/* Email Display with Privacy Controls */}
                  {showEmail && (
                    <p className={`text-xs text-muted-foreground truncate ${blurEmail ? 'blur-sm select-none' : ''}`}>
                      {user.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Picker - NEW */}
              <div className="pt-2 border-t border-border/50">
                <StatusPicker
                  currentStatus={status?.status || 'active'}
                  customMessage={status?.customMessage}
                  onStatusChange={handleStatusChange}
                />
              </div>

              {/* Privacy Settings Toggle */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs h-7"
                onClick={() => setShowPrivacySettings(!showPrivacySettings)}
              >
                {showPrivacySettings ? <EyeOff className="h-3 w-3 mr-2" /> : <Eye className="h-3 w-3 mr-2" />}
                {showPrivacySettings ? 'Hide' : 'Show'} Privacy Settings
              </Button>

              {/* Privacy Settings */}
              {showPrivacySettings && (
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-email" className="text-xs cursor-pointer">
                      Show Email
                    </Label>
                    <Switch
                      id="show-email"
                      checked={showEmail}
                      onCheckedChange={async (checked) => {
                        setShowEmail(checked)
                        await updatePreferences({ showEmail: checked })
                      }}
                    />
                  </div>
                  
                  {showEmail && (
                    <div className="flex items-center justify-between">
                      <Label htmlFor="blur-email" className="text-xs cursor-pointer">
                        Blur Email
                      </Label>
                      <Switch
                        id="blur-email"
                        checked={blurEmail}
                        onCheckedChange={async (checked) => {
                          setBlurEmail(checked)
                          await updatePreferences({ blurEmail: checked })
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </DropdownMenuLabel>
          
          {/* Plan Info Section */}
          <DropdownMenuSeparator />
          <div className="px-2 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-muted-foreground">Current Plan</span>
              <div className="flex items-center gap-1.5">
                {isPaidPlan && <Crown className="h-3.5 w-3.5 text-yellow-500" />}
                <span className={`text-sm font-semibold ${isPaidPlan ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground'}`}>
                  {planName}
                </span>
              </div>
            </div>
            {currentPlan?.current_period_end && (
              <p className="text-xs text-muted-foreground">
                Renews {new Date(currentPlan.current_period_end).toLocaleDateString()}
              </p>
            )}
            <div className="flex gap-2 mt-3">
              {isPaidPlan ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={handleManageBilling}
                >
                  <CreditCard className="h-3 w-3 mr-1.5" />
                  Manage Billing
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={handleViewPricing}
                >
                  <Crown className="h-3 w-3 mr-1.5" />
                  Upgrade Plan
                </Button>
              )}
            </div>
          </div>
          
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              onClick={handleAccountSettings}
              className="cursor-pointer py-2.5"
            >
              <UserCircle className="mr-3 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setIsOpen(false)
                if (onOpenSettings) {
                  onOpenSettings()
                }
              }}
              className="cursor-pointer py-2.5"
            >
              <Settings className="mr-3 h-4 w-4" />
              <span>Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setIsOpen(false)
                toast.info('Notification settings coming soon')
              }}
              className="cursor-pointer py-2.5"
            >
              <Bell className="mr-3 h-4 w-4" />
              <span>Notifications</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleSignOut}
            className="cursor-pointer text-destructive focus:text-destructive py-2.5"
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span>Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}