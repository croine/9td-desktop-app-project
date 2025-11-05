"use client"

import { useState, useEffect, useRef } from 'react'
import { Task, TimeEntry, PomodoroSession } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Play, Pause, Square, Clock, Timer, Coffee, SkipForward } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface TimeTrackerProps {
  task: Task
  onUpdate: (updates: Partial<Task>) => void
  pomodoroSettings: {
    workDuration: number
    breakDuration: number
    longBreakDuration: number
    sessionsUntilLongBreak: number
  }
}

export function TimeTracker({ task, onUpdate, pomodoroSettings }: TimeTrackerProps) {
  const [isTracking, setIsTracking] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [noteDialogOpen, setNoteDialogOpen] = useState(false)
  const [entryNote, setEntryNote] = useState('')
  
  // Pomodoro state
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const [pomodoroSeconds, setPomodoroSeconds] = useState(pomodoroSettings.workDuration * 60)
  const [pomodoroType, setPomodoroType] = useState<'work' | 'break'>('work')
  const [completedPomodoros, setCompletedPomodoros] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout>()
  const pomodoroIntervalRef = useRef<NodeJS.Timeout>()

  // Manual time tracking
  const startTracking = () => {
    const entry: TimeEntry = {
      id: `entry_${Date.now()}`,
      startTime: new Date().toISOString(),
      duration: 0,
      note: ''
    }
    setCurrentEntry(entry)
    setIsTracking(true)
    setElapsedSeconds(0)
  }

  const stopTracking = () => {
    if (!currentEntry) return
    
    const completedEntry: TimeEntry = {
      ...currentEntry,
      endTime: new Date().toISOString(),
      duration: elapsedSeconds
    }
    
    setCurrentEntry(null)
    setIsTracking(false)
    setElapsedSeconds(0)
    setNoteDialogOpen(true)
    setEntryNote('')
    
    // Save temporarily - will be finalized when note is added
    saveTimeEntry(completedEntry)
  }

  const saveTimeEntry = (entry: TimeEntry) => {
    const timeTracking = task.timeTracking || {
      totalTime: 0,
      entries: [],
      pomodoroSessions: [],
      estimatedTime: 0
    }
    
    const updatedTimeTracking = {
      ...timeTracking,
      totalTime: timeTracking.totalTime + entry.duration,
      entries: [...timeTracking.entries, entry]
    }
    
    onUpdate({ timeTracking: updatedTimeTracking })
    toast.success(`Tracked ${formatDuration(entry.duration)}`)
  }

  // Pomodoro timer
  const startPomodoro = () => {
    setPomodoroActive(true)
    setPomodoroType('work')
    setPomodoroSeconds(pomodoroSettings.workDuration * 60)
  }

  const pausePomodoro = () => {
    setPomodoroActive(false)
  }

  const skipPomodoro = () => {
    completeCurrentPomodoro()
  }

  const completeCurrentPomodoro = () => {
    const session: PomodoroSession = {
      id: `pomodoro_${Date.now()}`,
      startTime: new Date(Date.now() - (pomodoroType === 'work' ? pomodoroSettings.workDuration * 60 - pomodoroSeconds : pomodoroSettings.breakDuration * 60 - pomodoroSeconds) * 1000).toISOString(),
      endTime: new Date().toISOString(),
      type: pomodoroType,
      completed: true
    }
    
    const timeTracking = task.timeTracking || {
      totalTime: 0,
      entries: [],
      pomodoroSessions: [],
      estimatedTime: 0
    }
    
    const updatedTimeTracking = {
      ...timeTracking,
      pomodoroSessions: [...timeTracking.pomodoroSessions, session]
    }
    
    if (pomodoroType === 'work') {
      // Add work time to total
      const workDuration = pomodoroSettings.workDuration * 60
      updatedTimeTracking.totalTime = timeTracking.totalTime + workDuration
      
      const newCompletedCount = completedPomodoros + 1
      setCompletedPomodoros(newCompletedCount)
      
      // Determine next session type
      if (newCompletedCount % pomodoroSettings.sessionsUntilLongBreak === 0) {
        setPomodoroType('break')
        setPomodoroSeconds(pomodoroSettings.longBreakDuration * 60)
        toast.success('🎉 Work session complete! Time for a long break.')
      } else {
        setPomodoroType('break')
        setPomodoroSeconds(pomodoroSettings.breakDuration * 60)
        toast.success('✅ Work session complete! Time for a short break.')
      }
    } else {
      setPomodoroType('work')
      setPomodoroSeconds(pomodoroSettings.workDuration * 60)
      toast.success('☕ Break complete! Ready for the next work session.')
    }
    
    onUpdate({ timeTracking: updatedTimeTracking })
  }

  const resetPomodoro = () => {
    setPomodoroActive(false)
    setPomodoroType('work')
    setPomodoroSeconds(pomodoroSettings.workDuration * 60)
    setCompletedPomodoros(0)
  }

  // Timer effects
  useEffect(() => {
    if (isTracking) {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isTracking])

  useEffect(() => {
    if (pomodoroActive && pomodoroSeconds > 0) {
      pomodoroIntervalRef.current = setInterval(() => {
        setPomodoroSeconds(prev => {
          if (prev <= 1) {
            completeCurrentPomodoro()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current)
    }
    
    return () => {
      if (pomodoroIntervalRef.current) clearInterval(pomodoroIntervalRef.current)
    }
  }, [pomodoroActive, pomodoroSeconds])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const totalTime = task.timeTracking?.totalTime || 0
  const entries = task.timeTracking?.entries || []
  const pomodoroSessions = task.timeTracking?.pomodoroSessions || []
  const estimatedTime = task.timeTracking?.estimatedTime || 0

  return (
    <>
      <Card className="p-4 md:p-6">
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="manual" className="gap-2">
              <Clock className="h-4 w-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger value="pomodoro" className="gap-2">
              <Timer className="h-4 w-4" />
              Pomodoro
            </TabsTrigger>
          </TabsList>

          {/* Manual Time Tracking */}
          <TabsContent value="manual" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="text-6xl font-display font-bold text-primary">
                {formatTime(isTracking ? elapsedSeconds : 0)}
              </div>
              
              <div className="flex justify-center gap-2">
                {!isTracking ? (
                  <Button onClick={startTracking} size="lg" className="gap-2">
                    <Play className="h-5 w-5" />
                    Start Tracking
                  </Button>
                ) : (
                  <Button onClick={stopTracking} size="lg" variant="destructive" className="gap-2">
                    <Square className="h-5 w-5" />
                    Stop
                  </Button>
                )}
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">Total Time Tracked</h4>
                <Badge variant="secondary" className="text-base">
                  {formatDuration(totalTime)}
                </Badge>
              </div>
              
              {estimatedTime > 0 && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Estimated</span>
                  <span>{estimatedTime} minutes</span>
                </div>
              )}
              
              {entries.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="font-semibold text-sm">Recent Entries</h4>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {entries.slice(-5).reverse().map(entry => (
                      <div key={entry.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(entry.startTime), 'MMM d, HH:mm')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {entry.note && <span className="text-muted-foreground max-w-[100px] truncate">{entry.note}</span>}
                          <Badge variant="outline" className="text-xs">
                            {formatDuration(entry.duration)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Pomodoro Timer */}
          <TabsContent value="pomodoro" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                {pomodoroType === 'work' ? (
                  <Badge className="gap-1">
                    <Timer className="h-3 w-3" />
                    Work Session
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <Coffee className="h-3 w-3" />
                    Break Time
                  </Badge>
                )}
              </div>
              
              <div className="text-6xl font-display font-bold text-primary">
                {formatTime(pomodoroSeconds)}
              </div>
              
              <div className="flex justify-center gap-2">
                {!pomodoroActive ? (
                  <Button onClick={startPomodoro} size="lg" className="gap-2">
                    <Play className="h-5 w-5" />
                    Start Pomodoro
                  </Button>
                ) : (
                  <>
                    <Button onClick={pausePomodoro} size="lg" variant="outline" className="gap-2">
                      <Pause className="h-5 w-5" />
                      Pause
                    </Button>
                    <Button onClick={skipPomodoro} size="lg" variant="outline" className="gap-2">
                      <SkipForward className="h-5 w-5" />
                      Skip
                    </Button>
                  </>
                )}
                {(pomodoroActive || completedPomodoros > 0) && (
                  <Button onClick={resetPomodoro} size="lg" variant="destructive">
                    <Square className="h-5 w-5" />
                  </Button>
                )}
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-muted-foreground">Completed:</span>
                <Badge variant="outline">{completedPomodoros} / {pomodoroSettings.sessionsUntilLongBreak}</Badge>
              </div>
            </div>

            {pomodoroSessions.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-sm mb-3">Session History</h4>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {pomodoroSessions.slice(-5).reverse().map(session => (
                    <div key={session.id} className="flex items-center justify-between text-xs p-2 rounded bg-muted/50">
                      <div className="flex items-center gap-2">
                        {session.type === 'work' ? (
                          <Timer className="h-3 w-3" />
                        ) : (
                          <Coffee className="h-3 w-3" />
                        )}
                        <span>{format(new Date(session.startTime), 'MMM d, HH:mm')}</span>
                      </div>
                      <Badge variant={session.type === 'work' ? 'default' : 'secondary'} className="text-xs">
                        {session.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {/* Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note (Optional)</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">What did you work on?</Label>
              <Input
                id="note"
                value={entryNote}
                onChange={(e) => setEntryNote(e.target.value)}
                placeholder="e.g., Implemented login feature..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
              Skip
            </Button>
            <Button onClick={() => {
              if (currentEntry && entryNote) {
                // Update the last entry with note
                const timeTracking = task.timeTracking!
                const lastEntry = timeTracking.entries[timeTracking.entries.length - 1]
                if (lastEntry) {
                  lastEntry.note = entryNote
                  onUpdate({ timeTracking })
                }
              }
              setNoteDialogOpen(false)
            }}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
