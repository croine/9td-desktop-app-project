"use client"

import { useEffect, useRef } from 'react'
import { Task } from '@/types/task'
import { toast } from 'sonner'

export function useBrowserNotifications(tasks: Task[]) {
  const notifiedTasksRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          toast.success('Browser notifications enabled!')
        }
      })
    }
  }, [])

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    const checkDueTasks = () => {
      const now = new Date()
      
      tasks.forEach(task => {
        if (task.status === 'completed' || !task.dueDate) return
        
        const dueDate = new Date(task.dueDate)
        const timeDiff = dueDate.getTime() - now.getTime()
        const hoursUntilDue = timeDiff / (1000 * 60 * 60)
        
        // Notify for tasks due in the next hour
        if (hoursUntilDue > 0 && hoursUntilDue <= 1 && !notifiedTasksRef.current.has(task.id)) {
          new Notification('Task Due Soon! 🔔', {
            body: `"${task.title}" is due in ${Math.round(hoursUntilDue * 60)} minutes`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: task.id,
            requireInteraction: false,
          })
          notifiedTasksRef.current.add(task.id)
        }
        
        // Notify for overdue tasks
        if (hoursUntilDue < 0 && hoursUntilDue > -24 && !notifiedTasksRef.current.has(`${task.id}-overdue`)) {
          new Notification('Task Overdue! ⚠️', {
            body: `"${task.title}" is overdue`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `${task.id}-overdue`,
            requireInteraction: true,
          })
          notifiedTasksRef.current.add(`${task.id}-overdue`)
        }
      })
    }

    // Check immediately
    checkDueTasks()

    // Check every 5 minutes
    const interval = setInterval(checkDueTasks, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [tasks])

  const sendNotification = (title: string, body: string, tag?: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: tag || `notification-${Date.now()}`,
      })
    }
  }

  return { sendNotification }
}
