"use client"

import { useState, useEffect } from 'react'

const TRIAL_DURATION_MS = 30 * 60 * 1000 // 30 minutes
const STORAGE_KEY = 'guest-trial-data'

interface GuestTrialData {
  startTime: number
  tasksCreated: number
  maxTasks: number
}

export const useGuestTrial = () => {
  const [trialData, setTrialData] = useState<GuestTrialData | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)

  useEffect(() => {
    // Initialize or load trial data
    const storedData = sessionStorage.getItem(STORAGE_KEY)
    
    if (storedData) {
      const data: GuestTrialData = JSON.parse(storedData)
      setTrialData(data)
      
      const elapsed = Date.now() - data.startTime
      const remaining = Math.max(0, TRIAL_DURATION_MS - elapsed)
      
      if (remaining === 0) {
        setIsExpired(true)
      }
      setTimeRemaining(remaining)
    } else {
      // Start new trial
      const newData: GuestTrialData = {
        startTime: Date.now(),
        tasksCreated: 0,
        maxTasks: 5
      }
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(newData))
      setTrialData(newData)
      setTimeRemaining(TRIAL_DURATION_MS)
    }
  }, [])

  // Update countdown every second
  useEffect(() => {
    if (!trialData || isExpired) return

    const interval = setInterval(() => {
      const elapsed = Date.now() - trialData.startTime
      const remaining = Math.max(0, TRIAL_DURATION_MS - elapsed)
      
      setTimeRemaining(remaining)
      
      if (remaining === 0) {
        setIsExpired(true)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [trialData, isExpired])

  const incrementTaskCount = () => {
    if (!trialData) return false
    
    const newCount = trialData.tasksCreated + 1
    const updatedData = { ...trialData, tasksCreated: newCount }
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData))
    setTrialData(updatedData)
    
    return true
  }

  const canCreateTask = () => {
    if (!trialData) return false
    return trialData.tasksCreated < trialData.maxTasks && !isExpired
  }

  const getTasksRemaining = () => {
    if (!trialData) return 0
    return Math.max(0, trialData.maxTasks - trialData.tasksCreated)
  }

  const formatTimeRemaining = () => {
    const minutes = Math.floor(timeRemaining / 60000)
    const seconds = Math.floor((timeRemaining % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getPercentageRemaining = () => {
    return (timeRemaining / TRIAL_DURATION_MS) * 100
  }

  return {
    trialData,
    timeRemaining,
    isExpired,
    canCreateTask,
    incrementTaskCount,
    getTasksRemaining,
    formatTimeRemaining,
    getPercentageRemaining
  }
}
