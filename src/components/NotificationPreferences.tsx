"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Bell,
  Mail,
  Volume2,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Zap,
  Calendar,
  Settings,
  Info,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface NotificationPreferencesProps {
  preferences: NotificationPreferences
  onChange: (preferences: NotificationPreferences) => void
}

export interface NotificationPreferences {
  // Desktop notifications
  desktopEnabled: boolean
  desktopSound: boolean
  desktopSoundVolume: number
  
  // Email notifications
  emailEnabled: boolean
  emailAddress: string
  emailDigestEnabled: boolean
  emailDigestFrequency: 'daily' | 'weekly' | 'monthly'
  emailDigestTime: string // HH:MM format
  
  // Event notifications
  notifyTaskDue: boolean
  notifyTaskOverdue: boolean
  notifyTaskAssigned: boolean
  notifyMentions: boolean
  notifyComments: boolean
  notifyTaskCompleted: boolean
  notifyDependencyUnblocked: boolean
  
  // Timing preferences
  dueDateReminders: number[] // minutes before due date
  quietHoursEnabled: boolean
  quietHoursStart: string // HH:MM format
  quietHoursEnd: string // HH:MM format
}

export function getDefaultNotificationPreferences(): NotificationPreferences {
  return {
    desktopEnabled: true,
    desktopSound: true,
    desktopSoundVolume: 50,
    emailEnabled: false,
    emailAddress: '',
    emailDigestEnabled: false,
    emailDigestFrequency: 'daily',
    emailDigestTime: '09:00',
    notifyTaskDue: true,
    notifyTaskOverdue: true,
    notifyTaskAssigned: true,
    notifyMentions: true,
    notifyComments: true,
    notifyTaskCompleted: true,
    notifyDependencyUnblocked: true,
    dueDateReminders: [15, 60, 1440], // 15min, 1hr, 1day
    quietHoursEnabled: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
  }
}

export function NotificationPreferences({ preferences, onChange }: NotificationPreferencesProps) {
  const [testingNotification, setTestingNotification] = useState(false)

  const handleTestDesktopNotification = async () => {
    setTestingNotification(true)
    
    try {
      if (!('Notification' in window)) {
        toast.error('Browser notifications not supported')
        return
      }

      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        new Notification('9TD Test Notification 🔔', {
          body: 'Desktop notifications are working perfectly!',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        })
        toast.success('Test notification sent!')
      } else {
        toast.error('Notification permission denied')
      }
    } catch (error) {
      toast.error('Failed to send test notification')
    } finally {
      setTimeout(() => setTestingNotification(false), 2000)
    }
  }

  const handleTestSound = () => {
    if (preferences.desktopSound) {
      const audio = new Audio('/notification.mp3')
      audio.volume = preferences.desktopSoundVolume / 100
      audio.play().catch(() => {
        toast.info('Sound playback requires user interaction first')
      })
      toast.success('Notification sound played')
    } else {
      toast.info('Notification sounds are disabled')
    }
  }

  const addDueDateReminder = (minutes: number) => {
    if (preferences.dueDateReminders.includes(minutes)) {
      onChange({
        ...preferences,
        dueDateReminders: preferences.dueDateReminders.filter(m => m !== minutes)
      })
    } else {
      onChange({
        ...preferences,
        dueDateReminders: [...preferences.dueDateReminders, minutes].sort((a, b) => a - b)
      })
    }
  }

  const formatReminderTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`
    return `${Math.floor(minutes / 1440)}d`
  }

  return (
    <div className="space-y-6">
      {/* Desktop Notifications */}
      <Card className="glass-card p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Desktop Notifications</h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Desktop Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Show browser notifications for important events
              </p>
            </div>
            <Switch
              checked={preferences.desktopEnabled}
              onCheckedChange={(checked) => onChange({ ...preferences, desktopEnabled: checked })}
            />
          </div>

          {preferences.desktopEnabled && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notification Sounds</Label>
                  <p className="text-xs text-muted-foreground">
                    Play sound with notifications
                  </p>
                </div>
                <Switch
                  checked={preferences.desktopSound}
                  onCheckedChange={(checked) => onChange({ ...preferences, desktopSound: checked })}
                />
              </div>

              {preferences.desktopSound && (
                <div className="space-y-2">
                  <Label>Volume: {preferences.desktopSoundVolume}%</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={preferences.desktopSoundVolume}
                      onChange={(e) => onChange({ ...preferences, desktopSoundVolume: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleTestSound}
                      className="gap-2"
                    >
                      <Volume2 className="h-4 w-4" />
                      Test
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleTestDesktopNotification}
                disabled={testingNotification}
              >
                <Bell className="h-4 w-4" />
                {testingNotification ? 'Sending...' : 'Send Test Notification'}
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Email Notifications */}
      <Card className="glass-card p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Email Notifications</h3>
            <Badge variant="outline" className="ml-auto text-xs">
              Coming Soon
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={preferences.emailEnabled}
              onCheckedChange={(checked) => onChange({ ...preferences, emailEnabled: checked })}
              disabled
            />
          </div>

          {preferences.emailEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={preferences.emailAddress}
                  onChange={(e) => onChange({ ...preferences, emailAddress: e.target.value })}
                  disabled
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Email Digest</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive summary of tasks and activity
                  </p>
                </div>
                <Switch
                  checked={preferences.emailDigestEnabled}
                  onCheckedChange={(checked) => onChange({ ...preferences, emailDigestEnabled: checked })}
                  disabled
                />
              </div>

              {preferences.emailDigestEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Frequency</Label>
                    <Select
                      value={preferences.emailDigestFrequency}
                      onValueChange={(value: any) => onChange({ ...preferences, emailDigestFrequency: value })}
                      disabled
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input
                      type="time"
                      value={preferences.emailDigestTime}
                      onChange={(e) => onChange({ ...preferences, emailDigestTime: e.target.value })}
                      disabled
                    />
                  </div>
                </div>
              )}
            </>
          )}

          <Card className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <div className="flex gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-400">
                Email notifications require a backend email service. This feature will be available in a future update.
              </p>
            </div>
          </Card>
        </div>
      </Card>

      {/* Event Notifications */}
      <Card className="glass-card p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Event Notifications</h3>
          </div>

          <div className="space-y-3">
            {[
              { key: 'notifyTaskDue', icon: Clock, label: 'Task Due Soon', desc: 'Get notified before tasks are due' },
              { key: 'notifyTaskOverdue', icon: AlertCircle, label: 'Task Overdue', desc: 'Alert when tasks pass their due date' },
              { key: 'notifyTaskAssigned', icon: Calendar, label: 'Task Assigned', desc: 'Notify when a task is assigned to you' },
              { key: 'notifyMentions', icon: MessageSquare, label: '@Mentions', desc: 'Alert when someone mentions you' },
              { key: 'notifyComments', icon: MessageSquare, label: 'New Comments', desc: 'Notify about new comments on your tasks' },
              { key: 'notifyTaskCompleted', icon: CheckCircle2, label: 'Task Completed', desc: 'Celebrate when tasks are completed' },
              { key: 'notifyDependencyUnblocked', icon: Zap, label: 'Dependencies Unblocked', desc: 'Alert when blocking tasks are completed' },
            ].map(({ key, icon: Icon, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-0.5">
                    <Label className="cursor-pointer">{label}</Label>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
                <Switch
                  checked={preferences[key as keyof NotificationPreferences] as boolean}
                  onCheckedChange={(checked) => onChange({ ...preferences, [key]: checked })}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Due Date Reminders */}
      <Card className="glass-card p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Due Date Reminders</h3>
          </div>

          <div className="space-y-2">
            <Label>Remind me before due date</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { minutes: 5, label: '5m' },
                { minutes: 15, label: '15m' },
                { minutes: 30, label: '30m' },
                { minutes: 60, label: '1h' },
                { minutes: 120, label: '2h' },
                { minutes: 240, label: '4h' },
                { minutes: 480, label: '8h' },
                { minutes: 1440, label: '1d' },
                { minutes: 2880, label: '2d' },
                { minutes: 10080, label: '1w' },
              ].map(({ minutes, label }) => {
                const isSelected = preferences.dueDateReminders.includes(minutes)
                return (
                  <Button
                    key={minutes}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => addDueDateReminder(minutes)}
                    className="h-8"
                  >
                    {label}
                  </Button>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              Selected: {preferences.dueDateReminders.map(formatReminderTime).join(', ') || 'None'}
            </p>
          </div>
        </div>
      </Card>

      {/* Quiet Hours */}
      <Card className="glass-card p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-primary" />
            <h3 className="font-display text-lg font-semibold">Quiet Hours</h3>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Quiet Hours</Label>
              <p className="text-xs text-muted-foreground">
                Mute notifications during specific hours
              </p>
            </div>
            <Switch
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) => onChange({ ...preferences, quietHoursEnabled: checked })}
            />
          </div>

          {preferences.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Input
                  id="quiet-start"
                  type="time"
                  value={preferences.quietHoursStart}
                  onChange={(e) => onChange({ ...preferences, quietHoursStart: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <Input
                  id="quiet-end"
                  type="time"
                  value={preferences.quietHoursEnd}
                  onChange={(e) => onChange({ ...preferences, quietHoursEnd: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Notification Summary */}
      <Card className="glass-card p-6 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h4 className="font-semibold">Notification Summary</h4>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Desktop Notifications</div>
              <div className="font-semibold">
                {preferences.desktopEnabled ? '✓ Enabled' : '✗ Disabled'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Email Notifications</div>
              <div className="font-semibold">
                {preferences.emailEnabled ? '✓ Enabled' : '✗ Disabled'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Active Events</div>
              <div className="font-semibold">
                {[
                  preferences.notifyTaskDue,
                  preferences.notifyTaskOverdue,
                  preferences.notifyTaskAssigned,
                  preferences.notifyMentions,
                  preferences.notifyComments,
                  preferences.notifyTaskCompleted,
                  preferences.notifyDependencyUnblocked,
                ].filter(Boolean).length} / 7
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Reminders Set</div>
              <div className="font-semibold">
                {preferences.dueDateReminders.length} time{preferences.dueDateReminders.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
