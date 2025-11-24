"use client"

import { AppSettings } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Calendar, Clock, Globe } from 'lucide-react'

interface DateTimeSettingsProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

export function DateTimeSettings({ settings, onSettingsChange }: DateTimeSettingsProps) {
  const handleChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    onSettingsChange(newSettings)
    toast.success('Date & time settings updated')
  }

  const now = new Date()
  const exampleDate = new Date(2024, 11, 25, 14, 30) // December 25, 2024, 2:30 PM

  const formatDateExample = (format: string) => {
    switch (format) {
      case 'MM/DD/YYYY':
        return '12/25/2024'
      case 'DD/MM/YYYY':
        return '25/12/2024'
      case 'YYYY-MM-DD':
        return '2024-12-25'
      default:
        return '12/25/2024'
    }
  }

  const formatTimeExample = (format: string) => {
    switch (format) {
      case '12h':
        return '2:30 PM'
      case '24h':
        return '14:30'
      default:
        return '2:30 PM'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Date & Time Settings</h1>
        <p className="text-muted-foreground">
          Configure date formats, time zones, and calendar preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Date Format */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Date Format</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Date Display Format</Label>
              <Select
                value={settings.dateFormat ?? 'MM/DD/YYYY'}
                onValueChange={(value) => handleChange('dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (12/25/2024)</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (25/12/2024)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (2024-12-25)</SelectItem>
                </SelectContent>
              </Select>
              <div className="p-3 rounded-lg bg-primary/5 border">
                <p className="text-sm font-medium mb-1">Preview</p>
                <p className="text-lg font-mono">
                  {formatDateExample(settings.dateFormat ?? 'MM/DD/YYYY')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Time Format */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Time Format</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Time Display Format</Label>
              <Select
                value={settings.timeFormat ?? '12h'}
                onValueChange={(value) => handleChange('timeFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                  <SelectItem value="24h">24-hour (14:30)</SelectItem>
                </SelectContent>
              </Select>
              <div className="p-3 rounded-lg bg-primary/5 border">
                <p className="text-sm font-medium mb-1">Preview</p>
                <p className="text-lg font-mono">
                  {formatTimeExample(settings.timeFormat ?? '12h')}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Week Start Day */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Calendar Settings</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Week Start Day</Label>
              <Select
                value={settings.weekStartDay ?? 'sunday'}
                onValueChange={(value) => handleChange('weekStartDay', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunday">Sunday</SelectItem>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose which day starts your week in calendar views
              </p>
            </div>
          </div>
        </Card>

        {/* Timezone */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Timezone</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Current Timezone</Label>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-medium mb-1">Detected Timezone</p>
                <p className="text-lg font-mono">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your browser's timezone is automatically detected
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                ℹ️ Timezone Information
              </p>
              <p className="text-xs text-muted-foreground">
                All dates and times are stored in your local timezone. Manual timezone selection will be available in a future update.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
