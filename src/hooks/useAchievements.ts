"use client"

import { useState, useEffect, useCallback } from 'react'
import { Achievement } from '@/components/avatar/AchievementBadge'
import { toast } from 'sonner'

interface UseAchievementsReturn {
  achievements: Achievement[]
  unlockedAchievements: Achievement[]
  allAchievements: Achievement[]
  loading: boolean
  error: string | null
  checkAchievements: () => Promise<void>
  toggleDisplay: (achievementId: number, displayed: boolean) => Promise<void>
  refetch: () => Promise<void>
}

export function useAchievements(): UseAchievementsReturn {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [unlockedAchievements, setUnlockedAchievements] = useState<Achievement[]>([])
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllAchievements = useCallback(async () => {
    try {
      const response = await fetch('/api/achievements-new')
      if (response.ok) {
        const data = await response.json()
        setAllAchievements(data)
      }
    } catch (err) {
      console.error('Failed to fetch all achievements:', err)
    }
  }, [])

  const fetchUserAchievements = useCallback(async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user-achievements-new', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUnlockedAchievements(data)
        setAchievements(data.filter((a: Achievement) => a.displayed))
      } else if (response.status === 401) {
        setError('Authentication required')
      }
    } catch (err) {
      setError('Failed to fetch achievements')
      console.error('Failed to fetch user achievements:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchAllAchievements(), fetchUserAchievements()])
    setLoading(false)
  }, [fetchAllAchievements, fetchUserAchievements])

  useEffect(() => {
    refetch()
  }, [refetch])

  const checkAchievements = useCallback(async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const response = await fetch('/api/achievements-new/check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.newlyUnlocked && data.newlyUnlocked.length > 0) {
          // Show celebration for each new achievement
          data.newlyUnlocked.forEach((achievement: Achievement) => {
            toast.success(
              `🎉 Achievement Unlocked: ${achievement.name}`,
              {
                description: achievement.description || `You earned ${achievement.points} points!`,
                duration: 5000
              }
            )
          })
          
          // Refetch to update the list
          await refetch()
        }
      }
    } catch (err) {
      console.error('Failed to check achievements:', err)
    }
  }, [refetch])

  const toggleDisplay = useCallback(async (achievementId: number, displayed: boolean) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const response = await fetch(`/api/achievements-new/${achievementId}/display`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ displayed })
      })

      if (response.ok) {
        await refetch()
        toast.success(displayed ? 'Achievement now shown on avatar' : 'Achievement hidden from avatar')
      }
    } catch (err) {
      console.error('Failed to toggle achievement display:', err)
      toast.error('Failed to update achievement display')
    }
  }, [refetch])

  return {
    achievements,
    unlockedAchievements,
    allAchievements,
    loading,
    error,
    checkAchievements,
    toggleDisplay,
    refetch
  }
}
