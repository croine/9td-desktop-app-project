"use client"

import { useState, useEffect } from 'react'
import { Task } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Eye, 
  EyeOff, 
  Volume2, 
  VolumeX,
  Clock,
  Target,
  Pause,
  Play,
  SkipForward,
  Settings
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface EnhancedFocusModeProps {
  task: Task
  onExit: () => void
  onTaskUpdate?: (updates: Partial<Task>) => void
}

type AmbientSound = 'none' | 'rain' | 'ocean' | 'forest' | 'cafe' | 'white-noise'

export function EnhancedFocusMode({
  task,
  onExit,
  onTaskUpdate
}: EnhancedFocusModeProps) {
  const [zenMode, setZenMode] = useState(false)
  const [hideCompleted, setHideCompleted] = useState(true)
  const [ambientSound, setAmbientSound] = useState<AmbientSound>('none')
  const [volume, setVolume] = useState(50)
  const [sessionTime, setSessionTime] = useState(25 * 60) // 25 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(sessionTime)
  const [isRunning, setIsRunning] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1)
      }, 1000)
    } else if (timeLeft === 0) {
      setIsRunning(false)
      // Play completion sound
      playNotificationSound()
    }

    return () => clearInterval(interval)
  }, [isRunning, timeLeft])

  // Ambient sound simulation
  useEffect(() => {
    if (ambientSound !== 'none') {
      // In a real app, you'd play actual audio files
      console.log(`Playing ${ambientSound} at ${volume}% volume`)
    }

    return () => {
      // Stop all sounds on unmount
      console.log('Stopping ambient sounds')
    }
  }, [ambientSound, volume])

  const playNotificationSound = () => {
    // Play a notification sound
    const audio = new Audio('/notification.mp3')
    audio.play().catch(e => console.log('Audio play failed:', e))
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const resetTimer = () => {
    setTimeLeft(sessionTime)
    setIsRunning(false)
  }

  const ambientSounds: { id: AmbientSound; label: string; icon: string }[] = [
    { id: 'none', label: 'None', icon: '🔇' },
    { id: 'rain', label: 'Rain', icon: '🌧️' },
    { id: 'ocean', label: 'Ocean', icon: '🌊' },
    { id: 'forest', label: 'Forest', icon: '🌲' },
    { id: 'cafe', label: 'Café', icon: '☕' },
    { id: 'white-noise', label: 'White Noise', icon: '📻' }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 ${
        zenMode 
          ? 'bg-background' 
          : 'bg-gradient-to-br from-indigo-50/95 via-purple-50/95 to-pink-50/95 dark:from-indigo-950/95 dark:via-purple-950/95 dark:to-pink-950/95'
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        {!zenMode && (
          <div className="p-6 border-b backdrop-blur-sm">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">Focus Mode</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZenMode(!zenMode)}
                >
                  {zenMode ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExit}
                >
                  Exit
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-2xl w-full space-y-8">
            {/* Task Info */}
            <Card className="glass-card p-8 text-center">
              <h2 className="text-3xl font-bold mb-2">{task.title}</h2>
              {task.description && (
                <p className="text-muted-foreground">{task.description}</p>
              )}
            </Card>

            {/* Timer */}
            <Card className="glass-card p-12 text-center">
              <div className="space-y-6">
                <div className="text-7xl font-bold font-mono">
                  {formatTime(timeLeft)}
                </div>
                
                {/* Progress Ring */}
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      className="text-muted/20"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={2 * Math.PI * 56}
                      strokeDashoffset={
                        2 * Math.PI * 56 * (1 - timeLeft / sessionTime)
                      }
                      className="text-primary transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Clock className="h-8 w-8 text-primary" />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setIsRunning(!isRunning)}
                    className="w-32"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="h-5 w-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Start
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={resetTimer}
                  >
                    <SkipForward className="h-5 w-5 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            {/* Ambient Sound Controls */}
            <Card className="glass-card p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    {ambientSound === 'none' ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    Ambient Sound
                  </h3>
                  <span className="text-sm text-muted-foreground">{volume}%</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  {ambientSounds.map(sound => (
                    <Button
                      key={sound.id}
                      variant={ambientSound === sound.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setAmbientSound(sound.id)}
                      className="w-full"
                    >
                      <span className="mr-2">{sound.icon}</span>
                      {sound.label}
                    </Button>
                  ))}
                </div>

                {ambientSound !== 'none' && (
                  <Slider
                    value={[volume]}
                    onValueChange={([val]) => setVolume(val)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Zen Mode Exit Button */}
        {zenMode && (
          <Button
            variant="ghost"
            size="sm"
            className="fixed top-4 right-4"
            onClick={() => setZenMode(false)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Focus Mode Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Session Duration (minutes)</label>
              <Slider
                value={[sessionTime / 60]}
                onValueChange={([val]) => {
                  setSessionTime(val * 60)
                  setTimeLeft(val * 60)
                }}
                min={5}
                max={90}
                step={5}
              />
              <p className="text-sm text-muted-foreground">
                {sessionTime / 60} minutes
              </p>
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Hide Completed Tasks</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHideCompleted(!hideCompleted)}
              >
                {hideCompleted ? 'Enabled' : 'Disabled'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
