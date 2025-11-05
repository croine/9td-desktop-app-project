"use client"

import { useEffect, useRef } from 'react'
import { Task } from '@/types/task'
import { toast } from 'sonner'

export function useNotifications(tasks: Task[]) {
  const notifiedTasks = useRef<Set<string>>(new Set())
  const permissionGranted = useRef(false)

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        permissionGranted.current = permission === 'granted'
        if (permission === 'granted') {
          toast.success('Browser notifications enabled')
        }
      })
    } else if ('Notification' in window && Notification.permission === 'granted') {
      permissionGranted.current = true
    }
  }, [])

  useEffect(() => {
    if (!('Notification' in window)) return

    const checkTaskDeadlines = () => {
      const now = new Date()
      
      tasks.forEach(task => {
        if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') return
        
        const dueDate = new Date(task.dueDate)
        const timeDiff = dueDate.getTime() - now.getTime()
        const hoursDiff = timeDiff / (1000 * 60 * 60)
        
        // Notify if due within 1 hour and not already notified
        if (hoursDiff > 0 && hoursDiff <= 1 && !notifiedTasks.current.has(task.id)) {
          notifiedTasks.current.add(task.id)
          
          // Toast notification
          toast.warning(`Task due soon: ${task.title}`, {
            description: `Due in ${Math.round(hoursDiff * 60)} minutes`,
            duration: 5000,
          })
          
          // Browser notification
          if (Notification.permission === 'granted') {
            new Notification('9TD Task Reminder', {
              body: `"${task.title}" is due in ${Math.round(hoursDiff * 60)} minutes`,
              icon: '/favicon.ico',
              tag: task.id,
              requireInteraction: false,
            })
          }
        }
        
        // Notify if overdue and not already notified
        if (hoursDiff < 0 && Math.abs(hoursDiff) < 24 && !notifiedTasks.current.has(`${task.id}-overdue`)) {
          notifiedTasks.current.add(`${task.id}-overdue`)
          
          toast.error(`Task overdue: ${task.title}`, {
            description: `Was due ${Math.abs(Math.round(hoursDiff))} hours ago`,
            duration: 5000,
          })
          
          if (Notification.permission === 'granted') {
            new Notification('9TD Task Overdue', {
              body: `"${task.title}" is overdue!`,
              icon: '/favicon.ico',
              tag: `${task.id}-overdue`,
              requireInteraction: false,
            })
          }
        }
      })
    }

    // Check immediately and then every 5 minutes
    checkTaskDeadlines()
    const interval = setInterval(checkTaskDeadlines, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [tasks])
}
