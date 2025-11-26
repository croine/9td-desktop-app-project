"use client"

import { motion } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export interface Achievement {
  id: number
  achievementId?: number
  name: string
  description: string | null
  icon: string | null
  badgeType: string
  points: number
  tier: string
  unlockedAt?: string | Date
  displayed?: boolean
  notified?: boolean
}

interface AchievementBadgeProps {
  achievement: Achievement
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  onClick?: () => void
  isLocked?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
}

export function AchievementBadge({
  achievement,
  size = 'md',
  showTooltip = true,
  onClick,
  isLocked = false,
  position
}: AchievementBadgeProps) {
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  }

  const tierColors = {
    bronze: 'from-orange-600 to-orange-800',
    silver: 'from-gray-400 to-gray-600',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-400 to-purple-600'
  }

  const tierBorderColors = {
    bronze: 'border-orange-500',
    silver: 'border-gray-400',
    gold: 'border-yellow-400',
    platinum: 'border-purple-400'
  }

  const tierGlow = {
    bronze: 'shadow-orange-500/50',
    silver: 'shadow-gray-400/50',
    gold: 'shadow-yellow-400/50',
    platinum: 'shadow-purple-400/50'
  }

  const positionClasses = {
    'top-left': '-top-1 -left-1',
    'top-right': '-top-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
    'bottom-right': '-bottom-1 -right-1'
  }

  const badge = (
    <motion.div
      className={`
        ${sizes[size]}
        ${position ? `absolute ${positionClasses[position]}` : ''}
        flex items-center justify-center
        rounded-full
        bg-gradient-to-br ${tierColors[achievement.tier as keyof typeof tierColors] || tierColors.bronze}
        border-2 ${tierBorderColors[achievement.tier as keyof typeof tierBorderColors] || tierBorderColors.bronze}
        shadow-lg ${tierGlow[achievement.tier as keyof typeof tierGlow] || tierGlow.bronze}
        ${isLocked ? 'opacity-40 grayscale' : ''}
        ${onClick ? 'cursor-pointer hover:scale-110' : ''}
        transition-all duration-200
        z-10
      `}
      whileHover={onClick ? { scale: 1.1, rotate: [0, -5, 5, -5, 0] } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      onClick={onClick}
    >
      <span className="drop-shadow-md">
        {isLocked ? '🔒' : (achievement.icon || '🏆')}
      </span>
    </motion.div>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{achievement.icon || '🏆'}</span>
            <div>
              <p className="font-semibold text-sm">{achievement.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {achievement.tier} • {achievement.badgeType.replace('_', ' ')}
              </p>
            </div>
          </div>
          {achievement.description && (
            <p className="text-xs">{achievement.description}</p>
          )}
          <div className="flex items-center justify-between text-xs pt-1 border-t border-border">
            <span className="font-semibold">{achievement.points} points</span>
            {achievement.unlockedAt && !isLocked && (
              <span className="text-muted-foreground">
                {new Date(achievement.unlockedAt).toLocaleDateString()}
              </span>
            )}
            {isLocked && (
              <span className="text-muted-foreground">🔒 Locked</span>
            )}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

// Component to display multiple badges in a row
interface AchievementBadgeRowProps {
  achievements: Achievement[]
  maxDisplay?: number
  size?: 'sm' | 'md' | 'lg'
  showTooltip?: boolean
  onBadgeClick?: (achievement: Achievement) => void
}

export function AchievementBadgeRow({
  achievements,
  maxDisplay = 3,
  size = 'sm',
  showTooltip = true,
  onBadgeClick
}: AchievementBadgeRowProps) {
  const displayedAchievements = achievements.slice(0, maxDisplay)
  const remainingCount = Math.max(0, achievements.length - maxDisplay)

  return (
    <div className="flex items-center gap-1">
      {displayedAchievements.map((achievement) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          size={size}
          showTooltip={showTooltip}
          onClick={onBadgeClick ? () => onBadgeClick(achievement) : undefined}
        />
      ))}
      {remainingCount > 0 && (
        <div className={`
          ${size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'md' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}
          flex items-center justify-center
          rounded-full
          bg-muted
          border-2 border-border
          font-semibold
          text-muted-foreground
        `}>
          +{remainingCount}
        </div>
      )}
    </div>
  )
}
