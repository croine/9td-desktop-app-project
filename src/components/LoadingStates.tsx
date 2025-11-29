import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

// Task Card Skeleton
export function TaskCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Card className="glass-card p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </Card>
    </motion.div>
  )
}

// Task List Skeleton
export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Card className="glass-card p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" />
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}

// Calendar View Skeleton
export function CalendarSkeleton() {
  return (
    <Card className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-9 rounded-md" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </Card>
  )
}

// Kanban Board Skeleton
export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-80">
          <Card className="glass-card p-4 space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <Card key={j} className="p-3 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        </div>
      ))}
    </div>
  )
}

// View Transition Loader
export function ViewTransitionLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center min-h-[400px]"
    >
      <div className="relative">
        {/* Outer rotating ring */}
        <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary border-r-primary/50 animate-spin" />
        
        {/* Middle rotating ring (opposite direction) */}
        <div 
          className="absolute inset-2 w-12 h-12 rounded-full border-4 border-transparent border-b-purple-500 border-l-purple-500/50 animate-spin" 
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} 
        />
        
        {/* Inner rotating ring */}
        <div 
          className="absolute inset-4 w-8 h-8 rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500/50 animate-spin" 
          style={{ animationDuration: '1s' }} 
        />
        
        {/* Center pulsing dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-gradient-to-br from-primary via-purple-500 to-blue-500 rounded-full animate-pulse" />
        </div>
      </div>
    </motion.div>
  )
}

// Mini Spinner for inline loading
export function MiniSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-block ${className}`}>
      <div className="w-4 h-4 border-2 border-transparent border-t-current border-r-current rounded-full animate-spin" />
    </div>
  )
}

// Smooth Page Container with fade-in
export function PageContainer({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Content Fade In Wrapper
export function FadeIn({ 
  children, 
  delay = 0,
  className = "" 
}: { 
  children: React.ReactNode
  delay?: number
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// Stagger Children Animation Wrapper
export function StaggerContainer({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
