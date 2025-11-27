"use client"

import { AppSettings } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Bell, Volume2, Moon, Clock, Mail, AtSign, Filter, Zap } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useState } from 'react'

interface NotificationsSettingsProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

export function NotificationsSettings({ settings, onSettingsChange }: NotificationsSettingsProps) {
  const [emailDigestEnabled, setEmailDigestEnabled] = useState(settings.emailDigestEnabled ?? false)
  const [emailDigestFrequency, setEmailDigestFrequency] = useState(settings.emailDigestFrequency ?? 'daily')
  const [emailDigestTime, setEmailDigestTime] = useState(settings.emailDigestTime ?? '08:00')
  
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

  const handleEmailDigestSave = () => {
    handleChange('emailDigestEnabled', emailDigestEnabled)
    handleChange('emailDigestFrequency', emailDigestFrequency)
    handleChange('emailDigestTime', emailDigestTime)
    toast.success('Email digest settings saved')
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

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifyOnDependencyUnblocked" className="text-base font-medium">
                  Dependency Unblocked
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notify when blocked tasks become available
                </p>
              </div>
              <Switch
                id="notifyOnDependencyUnblocked"
                checked={settings.notifyOnDependencyUnblocked ?? true}
                onCheckedChange={(checked) => handleChange('notifyOnDependencyUnblocked', checked)}
                disabled={!settings.notifications}
              />
            </div>
          </div>
        </Card>

        {/* @Mentions & Comments */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <AtSign className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">@Mentions & Comments</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifyOnMention" className="text-base font-medium">
                  @Mention Alerts
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone mentions you in comments
                </p>
              </div>
              <Switch
                id="notifyOnMention"
                checked={settings.notifyOnMention ?? true}
                onCheckedChange={(checked) => handleChange('notifyOnMention', checked)}
                disabled={!settings.notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifyOnComment" className="text-base font-medium">
                  New Comments
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notify on new comments on tasks you're involved with
                </p>
              </div>
              <Switch
                id="notifyOnComment"
                checked={settings.notifyOnComment ?? true}
                onCheckedChange={(checked) => handleChange('notifyOnComment', checked)}
                disabled={!settings.notifications}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifyOnMessageReply" className="text-base font-medium">
                  Message Replies
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notify when someone replies to your messages
                </p>
              </div>
              <Switch
                id="notifyOnMessageReply"
                checked={settings.notifyOnMessageReply ?? true}
                onCheckedChange={(checked) => handleChange('notifyOnMessageReply', checked)}
                disabled={!settings.notifications}
              />
            </div>
          </div>
        </Card>

        {/* Email Digests */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Email Digests</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="emailDigest" className="text-base font-medium">
                  Enable Email Digests
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive periodic email summaries of your tasks
                </p>
              </div>
              <Switch
                id="emailDigest"
                checked={emailDigestEnabled}
                onCheckedChange={setEmailDigestEnabled}
              />
            </div>

            {emailDigestEnabled && (
              <div className="space-y-4 pl-4 border-l-2 border-primary/30">
                <div className="space-y-3">
                  <Label className="text-base font-medium">Digest Frequency</Label>
                  <Select value={emailDigestFrequency} onValueChange={setEmailDigestFrequency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly (Monday)</SelectItem>
                      <SelectItem value="monthly">Monthly (1st of month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Send Time</Label>
                  <Input
                    type="time"
                    value={emailDigestTime}
                    onChange={(e) => setEmailDigestTime(e.target.value)}
                    className="max-w-[200px]"
                  />
                  <p className="text-sm text-muted-foreground">
                    Digest will be sent at this time in your local timezone
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Include in Digest</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="digest-overdue" defaultChecked />
                      <label htmlFor="digest-overdue" className="text-sm cursor-pointer">
                        Overdue tasks
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="digest-upcoming" defaultChecked />
                      <label htmlFor="digest-upcoming" className="text-sm cursor-pointer">
                        Upcoming due dates
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="digest-completed" defaultChecked />
                      <label htmlFor="digest-completed" className="text-sm cursor-pointer">
                        Recently completed tasks
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="digest-stats" defaultChecked />
                      <label htmlFor="digest-stats" className="text-sm cursor-pointer">
                        Productivity statistics
                      </label>
                    </div>
                  </div>
                </div>

                <Button onClick={handleEmailDigestSave} className="w-full">
                  <Mail className="h-4 w-4 mr-2" />
                  Save Email Digest Settings
                </Button>
              </div>
            )}
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

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notificationSound" className="text-base font-medium">
                  Notification Sounds
                </Label>
                <p className="text-sm text-muted-foreground">
                  Play sound for all notifications
                </p>
              </div>
              <Switch
                id="notificationSound"
                checked={settings.notificationSound ?? true}
                onCheckedChange={(checked) => handleChange('notificationSound', checked)}
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

        {/* Notification Filters */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Notification Filters</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifyUrgentOnly" className="text-base font-medium">
                  Urgent Only Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Only show high-priority notifications
                </p>
              </div>
              <Switch
                id="notifyUrgentOnly"
                checked={settings.notifyUrgentOnly ?? false}
                onCheckedChange={(checked) => handleChange('notifyUrgentOnly', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="groupNotifications" className="text-base font-medium">
                  Group Similar Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Combine multiple notifications of the same type
                </p>
              </div>
              <Switch
                id="groupNotifications"
                checked={settings.groupNotifications ?? true}
                onCheckedChange={(checked) => handleChange('groupNotifications', checked)}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Notification Categories</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Choose which types of notifications you want to receive
              </p>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="cat-tasks" defaultChecked />
                  <label htmlFor="cat-tasks" className="text-sm cursor-pointer">
                    Task Updates (Due dates, completions, assignments)
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="cat-mentions" defaultChecked />
                  <label htmlFor="cat-mentions" className="text-sm cursor-pointer">
                    Mentions & Comments
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="cat-dependencies" defaultChecked />
                  <label htmlFor="cat-dependencies" className="text-sm cursor-pointer">
                    Dependencies & Blockers
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="cat-automation" defaultChecked />
                  <label htmlFor="cat-automation" className="text-sm cursor-pointer">
                    Automation Rules
                  </label>
                </div>
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
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                    🔕 Do Not Disturb is active. All notifications are paused.
                  </p>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-medium">Schedule</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Start Time</Label>
                      <Input type="time" defaultValue="22:00" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">End Time</Label>
                      <Input type="time" defaultValue="08:00" className="mt-1" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Auto-enable Do Not Disturb during these hours
                  </p>
                </div>
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

            <div className="space-y-3">
              <Label className="text-base font-medium">Multiple Reminders</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox id="remind-1day" defaultChecked />
                  <label htmlFor="remind-1day" className="text-sm cursor-pointer">
                    1 day before
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="remind-1hour" defaultChecked />
                  <label htmlFor="remind-1hour" className="text-sm cursor-pointer">
                    1 hour before
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="remind-15min" />
                  <label htmlFor="remind-15min" className="text-sm cursor-pointer">
                    15 minutes before
                  </label>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Receive multiple reminders at different intervals
              </p>
            </div>
          </div>
        </Card>

        {/* Smart Notifications */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Smart Notifications</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="smartNotifications" className="text-base font-medium">
                  Enable Smart Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  AI-powered notification timing based on your work patterns
                </p>
              </div>
              <Switch
                id="smartNotifications"
                checked={settings.smartNotifications ?? false}
                onCheckedChange={(checked) => handleChange('smartNotifications', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="batchNotifications" className="text-base font-medium">
                  Batch Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Group non-urgent notifications and send at optimal times
                </p>
              </div>
              <Switch
                id="batchNotifications"
                checked={settings.batchNotifications ?? false}
                onCheckedChange={(checked) => handleChange('batchNotifications', checked)}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}