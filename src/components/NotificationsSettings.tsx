"use client"

import { AppSettings } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Bell, Volume2, Moon, Clock } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface NotificationsSettingsProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

export function NotificationsSettings({ settings, onSettingsChange }: NotificationsSettingsProps) {
  const handleChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    onSettingsChange(newSettings)
    toast.success('Notification settings updated')
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        toast.success('Browser notifications enabled')
        handleChange('notifications', true)
      } else {
        toast.error('Notification permission denied')
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Notification Settings</h1>
        <p className="text-muted-foreground">
          Configure how and when you receive notifications
        </p>
      </div>

      <div className="grid gap-6">
        {/* Browser Notifications */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Browser Notifications</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifications" className="text-base font-medium">
                  Enable Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive browser notifications for important updates
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications ?? false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestNotificationPermission()
                  } else {
                    handleChange('notifications', false)
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifyOnDueDate" className="text-base font-medium">
                  Due Date Reminders
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when tasks are due
                </p>
              </div>
              <Switch
                id="notifyOnDueDate"
                checked={settings.notifyOnDueDate ?? true}
                onCheckedChange={(checked) => handleChange('notifyOnDueDate', checked)}
                disabled={!settings.notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifyOnTaskCreated" className="text-base font-medium">
                  Task Created
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notify when new tasks are created
                </p>
              </div>
              <Switch
                id="notifyOnTaskCreated"
                checked={settings.notifyOnTaskCreated ?? false}
                onCheckedChange={(checked) => handleChange('notifyOnTaskCreated', checked)}
                disabled={!settings.notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifyOnTaskCompleted" className="text-base font-medium">
                  Task Completed
                </Label>
                <p className="text-sm text-muted-foreground">
                  Celebrate when tasks are completed
                </p>
              </div>
              <Switch
                id="notifyOnTaskCompleted"
                checked={settings.notifyOnTaskCompleted ?? true}
                onCheckedChange={(checked) => handleChange('notifyOnTaskCompleted', checked)}
                disabled={!settings.notifications}
              />
            </div>
          </div>
        </Card>

        {/* Sound Settings */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Sound Settings</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="focusModeSound" className="text-base font-medium">
                  Focus Mode Sound
                </Label>
                <p className="text-sm text-muted-foreground">
                  Play sound when Pomodoro timer completes
                </p>
              </div>
              <Switch
                id="focusModeSound"
                checked={settings.focusModeSound ?? true}
                onCheckedChange={(checked) => handleChange('focusModeSound', checked)}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Notification Volume</Label>
              <div className="flex items-center gap-4">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[settings.notificationVolume ?? 70]}
                  onValueChange={(value) => handleChange('notificationVolume', value[0])}
                  max={100}
                  step={10}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12 text-right">
                  {settings.notificationVolume ?? 70}%
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Do Not Disturb */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Moon className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Do Not Disturb</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="doNotDisturb" className="text-base font-medium">
                  Enable Do Not Disturb
                </Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable all notifications
                </p>
              </div>
              <Switch
                id="doNotDisturb"
                checked={settings.doNotDisturb ?? false}
                onCheckedChange={(checked) => handleChange('doNotDisturb', checked)}
              />
            </div>

            {settings.doNotDisturb && (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  🔕 Do Not Disturb is active. All notifications are paused.
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Reminder Timing */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Reminder Timing</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Due Date Reminder Time</Label>
              <Select
                value={settings.reminderTimeBefore ?? '1hour'}
                onValueChange={(value) => handleChange('reminderTimeBefore', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15min">15 minutes before</SelectItem>
                  <SelectItem value="30min">30 minutes before</SelectItem>
                  <SelectItem value="1hour">1 hour before</SelectItem>
                  <SelectItem value="2hours">2 hours before</SelectItem>
                  <SelectItem value="1day">1 day before</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Get notified before tasks are due
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
