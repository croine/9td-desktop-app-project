"use client"

import { useState, useEffect } from 'react'

const loadingTips = [
  "💡 Pro tip: Press Ctrl+K to quickly create a task",
  "⚡ Use keyboard shortcuts to navigate faster",
  "🎯 Set priorities to focus on what matters most",
  "📊 Check Analytics to track your productivity",
  "🔔 Enable notifications to never miss a deadline",
  "🎨 Customize your workspace in Settings",
  "⏱️ Use Pomodoro Timer for focused work sessions",
  "📅 Drag tasks in Calendar view to reschedule",
  "🏷️ Use tags to organize related tasks",
  "✨ Try Kanban board for visual task management",
]

export default function Loading() {
  const [progress, setProgress] = useState(0)
  const [tip, setTip] = useState(loadingTips[0])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Random tip
    setTip(loadingTips[Math.floor(Math.random() * loadingTips.length)])
    
    // Smooth progress animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        return prev + Math.random() * 15
      })
    }, 150)
    
    return () => clearInterval(interval)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Animated Background - GPU optimized */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl"
          style={{
            animation: 'breathe 4s ease-in-out infinite',
            willChange: 'transform, opacity'
          }}
        />
        <div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl"
          style={{
            animation: 'breathe 4s ease-in-out infinite 2s',
            willChange: 'transform, opacity'
          }}
        />
      </div>

      {/* Main Loading Content */}
      <div className="relative z-10 text-center space-y-8 max-w-md px-4">
        {/* Enhanced Spinner with particle effects */}
        <div className="relative w-32 h-32 mx-auto">
          {/* Outer ring */}
          <div 
            className="absolute inset-0 rounded-full border-[6px] border-transparent border-t-primary border-r-primary/60"
            style={{
              animation: 'spin-smooth 0.8s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              willChange: 'transform'
            }}
          />
          
          {/* Inner ring */}
          <div 
            className="absolute inset-3 rounded-full border-[5px] border-transparent border-b-purple-500 border-l-purple-500/60"
            style={{
              animation: 'spin-smooth 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite reverse',
              willChange: 'transform'
            }}
          />
          
          {/* Glowing core */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-10 h-10 bg-gradient-to-br from-primary via-purple-500 to-blue-500 rounded-full shadow-lg shadow-primary/50"
              style={{
                animation: 'pulse-smooth 2s ease-in-out infinite',
                willChange: 'transform'
              }}
            />
          </div>

          {/* Orbiting particles */}
          {[0, 120, 240].map((rotation, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                animation: `spin-smooth ${2 + i * 0.3}s linear infinite`,
                transform: `rotate(${rotation}deg)`
              }}
            >
              <div 
                className="absolute top-0 left-1/2 w-3 h-3 rounded-full -translate-x-1/2"
                style={{
                  background: i === 0 ? 'var(--primary)' : i === 1 ? 'rgb(168, 85, 247)' : 'rgb(59, 130, 246)',
                  boxShadow: `0 0 10px ${i === 0 ? 'var(--primary)' : i === 1 ? 'rgb(168, 85, 247)' : 'rgb(59, 130, 246)'}`
                }}
              />
            </div>
          ))}
        </div>

        {/* Loading Text with gradient */}
        <div className="space-y-3">
          <h2 
            className="font-display text-3xl font-bold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent"
            style={{
              animation: 'pulse-text 2s ease-in-out infinite',
              willChange: 'opacity'
            }}
          >
            Loading 9TD Dashboard
          </h2>
          <p 
            className="text-sm text-muted-foreground font-medium"
            style={{
              animation: 'pulse-text 2s ease-in-out infinite 0.3s',
              willChange: 'opacity'
            }}
          >
            Preparing your workspace
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-primary via-purple-500 to-blue-500 rounded-full transition-all duration-300 ease-out"
              style={{ 
                width: `${Math.min(progress, 100)}%`,
                boxShadow: '0 0 10px var(--primary)'
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            {Math.round(progress)}%
          </p>
        </div>

        {/* Loading Tip */}
        <div className="glass-card p-4 rounded-lg border border-border/50">
          <p className="text-sm text-foreground/80 leading-relaxed">
            {tip}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {[0, 0.15, 0.3].map((delay, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: i === 0 ? 'var(--primary)' : i === 1 ? 'rgb(168, 85, 247)' : 'rgb(59, 130, 246)',
                animation: 'bounce-smooth 1.4s ease-in-out infinite',
                animationDelay: `${delay}s`,
                willChange: 'transform',
                boxShadow: `0 0 8px ${i === 0 ? 'var(--primary)' : i === 1 ? 'rgb(168, 85, 247)' : 'rgb(59, 130, 246)'}`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}