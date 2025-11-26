"use client"

import { useEffect, useState } from 'react'
import { AchievementBadge, Achievement } from './AchievementBadge'
import { motion, AnimatePresence } from 'framer-motion'

interface AchievementBadgeOverlayProps {
  children: React.ReactNode
  maxBadges?: number
  size?: 'sm' | 'md' | 'lg'
}

export function AchievementBadgeOverlay({
  children,
  maxBadges = 3,
  size = 'sm'
}: AchievementBadgeOverlayProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [newUnlock, setNewUnlock] = useState<Achievement | null>(null)

  useEffect(() => {
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user-achievements-new?displayed=true', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAchievements(data.slice(0, maxBadges))
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error)
    } finally {
      setLoading(false)
    }
  }

  const positions: Array<'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'> = [
    'top-right',
    'top-left',
    'bottom-right'
  ]

  if (loading || achievements.length === 0) {
    return <div className="relative inline-block">{children}</div>
  }

  return (
    <div className="relative inline-block">
      {children}
      
      {/* Display badges */}
      {achievements.map((achievement, index) => (
        <AchievementBadge
          key={achievement.id}
          achievement={achievement}
          size={size}
          position={positions[index % positions.length]}
          showTooltip={true}
        />
      ))}

      {/* Celebration animation for new unlocks */}
      <AnimatePresence>
        {newUnlock && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="text-6xl"
              animate={{
                rotate: [0, 10, -10, 10, 0],
                scale: [1, 1.2, 1, 1.2, 1]
              }}
              transition={{
                duration: 1,
                repeat: 2
              }}
            >
              {newUnlock.icon || '🏆'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
