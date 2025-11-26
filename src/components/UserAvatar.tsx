"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient, useSession } from '@/lib/auth-client'
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
  EyeOff
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

  // Fetch user preferences when session changes
  useEffect(() => {
    if (session?.user) {
      fetchAllData()
    }
  }, [session])

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

  const handleSignOut = async () => {
    const { error } = await authClient.signOut()
    if (error?.code) {
      toast.error('Failed to sign out')
    } else {
      localStorage.removeItem('bearer_token')
      toast.success('Signed out successfully')
      router.push('/')
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
            showRings={true}
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
                  showRings={true}
                  showAchievements={true}
                  showStatus={true}
                  showFrame={true}
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
  )
}