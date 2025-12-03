"use client"

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProductivityRing } from './ProductivityRing'
import { AchievementBadges } from './AchievementBadges'
import { StatusIndicator } from './StatusIndicator'
import { AvatarFrame } from './AvatarFrame'

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

interface AvatarWithRingsProps {
  avatarUrl: string | null
  initials: string
  userName: string
  stats?: UserStats
  achievements?: Achievement[]
  status?: UserStatus
  activeFrame?: ActiveFrame | null
  avatarShape?: 'circle' | 'square' | 'rounded'
  avatarColorScheme?: 'solid' | 'gradient' | 'rainbow' | 'fade'
  avatarBorderColor?: string
  size?: 'sm' | 'md' | 'lg'
  showRings?: boolean
  showAchievements?: boolean
  showStatus?: boolean
  showFrame?: boolean
}

export function AvatarWithRings({
  avatarUrl,
  initials,
  userName,
  stats,
  achievements = [],
  status,
  activeFrame,
  avatarShape = 'circle',
  avatarColorScheme = 'gradient',
  avatarBorderColor = '#6366f1',
  size = 'md',
  showRings = true,
  showAchievements = true,
  showStatus = true,
  showFrame = true
}: AvatarWithRingsProps) {
  const sizeMap = {
    sm: { avatar: 'h-8 w-8', container: 48, text: 'text-xs' },
    md: { avatar: 'h-10 w-10', container: 64, text: 'text-sm' },
    lg: { avatar: 'h-12 w-12', container: 80, text: 'text-base' }
  }

  // Validate and sanitize size prop
  const validSize = (size === 'sm' || size === 'md' || size === 'lg') ? size : 'md'
  const sizeConfig = sizeMap[validSize]

  const shapeClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg'
  }

  const dailyProgress = stats ? Math.min((stats.tasksCompletedToday / stats.dailyGoal) * 100, 100) : 0
  const weeklyProgress = stats ? Math.min((stats.tasksCompletedThisWeek / stats.weeklyGoal) * 100, 100) : 0

  const containerSize = sizeConfig.container

  return (
    <div 
      className="relative inline-flex items-center justify-center"
      style={{ width: containerSize, height: containerSize }}
    >
      {/* Productivity Rings - Centered */}
      {showRings && stats && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <ProductivityRing
            dailyProgress={dailyProgress}
            weeklyProgress={weeklyProgress}
            dailyGoal={stats.dailyGoal}
            weeklyGoal={stats.weeklyGoal}
            tasksCompletedToday={stats.tasksCompletedToday}
            tasksCompletedThisWeek={stats.tasksCompletedThisWeek}
            size={validSize}
            showTooltip={true}
          />
        </div>
      )}

      {/* Avatar Container - Perfectly Centered */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ paddingLeft: '4px' }}>
        <div className="relative">
          {/* Frame */}
          {showFrame && activeFrame && (
            <AvatarFrame frameType={activeFrame.frameType} size={validSize} />
          )}

          {/* Avatar with Border Ring */}
          <Avatar
            className={`${sizeConfig.avatar} ${shapeClasses[avatarShape]} relative z-10`}
            style={{
              boxShadow: `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${avatarBorderColor}`
            }}
          >
            {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
            <AvatarFallback className={`bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold ${sizeConfig.text}`}>
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Achievement Badges */}
          {showAchievements && achievements.length > 0 && (
            <AchievementBadges
              achievements={achievements}
              size={validSize === 'sm' ? 'sm' : 'md'}
              maxDisplay={3}
              position="top-right"
            />
          )}

          {/* Status Indicator */}
          {showStatus && status && (
            <StatusIndicator
              status={status.status}
              customMessage={status.customMessage}
              size={validSize === 'sm' ? 'sm' : 'md'}
              position="bottom-right"
              showTooltip={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}