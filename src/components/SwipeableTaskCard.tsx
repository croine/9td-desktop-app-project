"use client"

import { useState, useRef, useEffect } from 'react'
import { Task, Tag, Category } from '@/types/task'
import { TaskCard } from '@/components/TaskCard'
import { Check, Archive, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SwipeableTaskCardProps {
  task: Task
  tags: Tag[]
  categories: Category[]
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => void
  onStatusChange: (taskId: string, status: Task['status']) => void
  onArchive?: (taskId: string) => void
  compact?: boolean
}

export function SwipeableTaskCard({ 
  task, 
  tags, 
  categories, 
  onEdit, 
  onDelete, 
  onStatusChange,
  onArchive,
  compact 
}: SwipeableTaskCardProps) {
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [startX, setStartX] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)
  
  const SWIPE_THRESHOLD = 100
  const MAX_SWIPE = 150
  
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      setStartX(e.touches[0].clientX)
      setIsSwiping(true)
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isSwiping) return
      
      const currentX = e.touches[0].clientX
      const diff = currentX - startX
      
      // Limit swipe distance
      const limitedDiff = Math.max(-MAX_SWIPE, Math.min(MAX_SWIPE, diff))
      setSwipeX(limitedDiff)
    }
    
    const handleTouchEnd = () => {
      setIsSwiping(false)
      
      // Swipe right - complete
      if (swipeX > SWIPE_THRESHOLD) {
        if (task.status !== 'completed') {
          onStatusChange(task.id, 'completed')
        }
        setSwipeX(0)
      }
      // Swipe left - archive
      else if (swipeX < -SWIPE_THRESHOLD) {
        if (onArchive) {
          onArchive(task.id)
        }
        setSwipeX(0)
      }
      // Reset if not threshold
      else {
        setSwipeX(0)
      }
    }
    
    const card = cardRef.current
    if (card) {
      card.addEventListener('touchstart', handleTouchStart)
      card.addEventListener('touchmove', handleTouchMove)
      card.addEventListener('touchend', handleTouchEnd)
      
      return () => {
        card.removeEventListener('touchstart', handleTouchStart)
        card.removeEventListener('touchmove', handleTouchMove)
        card.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isSwiping, startX, swipeX, task.id, task.status, onStatusChange, onArchive])
  
  const swipeProgress = Math.abs(swipeX) / SWIPE_THRESHOLD
  const showAction = swipeProgress > 0.3
  
  return (
    <div className="relative overflow-hidden touch-pan-y" ref={cardRef}>
      {/* Left action (archive) */}
      <div 
        className={cn(
          "absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 transition-opacity",
          swipeX < 0 ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: `${Math.abs(swipeX)}px`,
          backgroundColor: showAction ? 'rgb(239 68 68)' : 'rgb(248 113 113)',
        }}
      >
        {showAction && (
          <div className="text-white flex items-center gap-2">
            <Archive className="h-5 w-5" />
            <span className="font-medium">Archive</span>
          </div>
        )}
      </div>
      
      {/* Right action (complete) */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 flex items-center justify-start pl-4 transition-opacity",
          swipeX > 0 ? "opacity-100" : "opacity-0"
        )}
        style={{
          width: `${Math.abs(swipeX)}px`,
          backgroundColor: showAction ? 'rgb(34 197 94)' : 'rgb(74 222 128)',
        }}
      >
        {showAction && (
          <div className="text-white flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span className="font-medium">Complete</span>
          </div>
        )}
      </div>
      
      {/* Card */}
      <div
        className={cn(
          "relative transition-transform",
          isSwiping ? "duration-0" : "duration-300"
        )}
        style={{
          transform: `translateX(${swipeX}px)`,
        }}
      >
        <TaskCard
          task={task}
          tags={tags}
          categories={categories}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onArchive={onArchive}
          compact={compact}
        />
      </div>
      
      {/* Visual feedback overlay */}
      {isSwiping && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: swipeX > 0 
              ? `linear-gradient(to right, rgba(34,197,94,${swipeProgress * 0.2}), transparent)`
              : `linear-gradient(to left, rgba(239,68,68,${swipeProgress * 0.2}), transparent)`
          }}
        />
      )}
    </div>
  )
}
