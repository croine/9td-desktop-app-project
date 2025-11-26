"use client"

import { useState, useEffect, useCallback } from 'react'
import { UserStatus } from '@/components/avatar/StatusIndicator'

interface UserStatusData {
  status: UserStatus
  customMessage?: string
  autoDetect: boolean
  lastActivity: Date
}

interface UseUserStatusReturn {
  status: UserStatus
  customMessage?: string
  autoDetect: boolean
  loading: boolean
  updateStatus: (status: UserStatus, customMessage?: string) => Promise<void>
  setAutoDetect: (enabled: boolean) => Promise<void>
  refetch: () => Promise<void>
}

const AWAY_THRESHOLD = 5 * 60 * 1000 // 5 minutes
const OFFLINE_THRESHOLD = 15 * 60 * 1000 // 15 minutes

export function useUserStatus(): UseUserStatusReturn {
  const [statusData, setStatusData] = useState<UserStatusData>({
    status: 'active',
    autoDetect: true,
    lastActivity: new Date()
  })
  const [loading, setLoading] = useState(true)
  const [lastApiUpdate, setLastApiUpdate] = useState(Date.now())

  // Fetch current status from API
  const fetchStatus = useCallback(async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/user-status-new', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStatusData({
          status: data.status as UserStatus,
          customMessage: data.customMessage,
          autoDetect: data.autoDetect,
          lastActivity: new Date(data.lastActivity)
        })
      }
    } catch (error) {
      console.error('Failed to fetch user status:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Update activity timestamp
  const updateActivity = useCallback(async () => {
    const token = localStorage.getItem('bearer_token')
    if (!token || !statusData.autoDetect) return

    // Only update API every 60 seconds to avoid spam
    const now = Date.now()
    if (now - lastApiUpdate < 60000) return

    try {
      await fetch('/api/user-status-new/activity', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      setLastApiUpdate(now)
      setStatusData(prev => ({ ...prev, lastActivity: new Date() }))
    } catch (error) {
      console.error('Failed to update activity:', error)
    }
  }, [statusData.autoDetect, lastApiUpdate])

  // Auto-detect status based on activity
  useEffect(() => {
    if (!statusData.autoDetect) return

    const detectStatus = () => {
      const now = Date.now()
      const timeSinceActivity = now - statusData.lastActivity.getTime()

      let newStatus: UserStatus
      if (timeSinceActivity > OFFLINE_THRESHOLD) {
        newStatus = 'offline'
      } else if (timeSinceActivity > AWAY_THRESHOLD) {
        newStatus = 'away'
      } else {
        newStatus = 'active'
      }

      if (newStatus !== statusData.status) {
        setStatusData(prev => ({ ...prev, status: newStatus }))
      }
    }

    // Check every 30 seconds
    const interval = setInterval(detectStatus, 30000)
    detectStatus() // Initial check

    return () => clearInterval(interval)
  }, [statusData.autoDetect, statusData.lastActivity, statusData.status])

  // Track user activity
  useEffect(() => {
    if (!statusData.autoDetect) return

    const handleActivity = () => {
      updateActivity()
    }

    // Listen for user activity events
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [statusData.autoDetect, updateActivity])

  // Initial fetch
  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const updateStatus = useCallback(async (status: UserStatus, customMessage?: string) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const response = await fetch('/api/user-status-new', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          customMessage,
          autoDetect: false // Disable auto-detect when manually set
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStatusData({
          status: data.status,
          customMessage: data.customMessage,
          autoDetect: data.autoDetect,
          lastActivity: new Date(data.lastActivity)
        })
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }, [])

  const setAutoDetect = useCallback(async (enabled: boolean) => {
    const token = localStorage.getItem('bearer_token')
    if (!token) return

    try {
      const response = await fetch('/api/user-status-new', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          autoDetect: enabled
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStatusData({
          status: data.status,
          customMessage: data.customMessage,
          autoDetect: data.autoDetect,
          lastActivity: new Date(data.lastActivity)
        })
      }
    } catch (error) {
      console.error('Failed to update auto-detect:', error)
    }
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    await fetchStatus()
  }, [fetchStatus])

  return {
    status: statusData.status,
    customMessage: statusData.customMessage,
    autoDetect: statusData.autoDetect,
    loading,
    updateStatus,
    setAutoDetect,
    refetch
  }
}
