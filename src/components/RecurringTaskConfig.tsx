"use client"

import { useState } from 'react'
import { RecurringTask, RecurrenceFrequency, DayOfWeek } from '@/types/task'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Calendar, Repeat } from 'lucide-react'

interface RecurringTaskConfigProps {
  recurring?: RecurringTask
  onChange: (recurring: RecurringTask) => void
}

const daysOfWeek: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const dayLabels: Record<DayOfWeek, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
}

export function RecurringTaskConfig({ recurring, onChange }: RecurringTaskConfigProps) {
  const [enabled, setEnabled] = useState(recurring?.enabled ?? false)
  const [frequency, setFrequency] = useState<RecurrenceFrequency>(recurring?.pattern.frequency ?? 'daily')
  const [interval, setInterval] = useState(recurring?.pattern.interval ?? 1)
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(recurring?.pattern.daysOfWeek ?? [])
  const [dayOfMonth, setDayOfMonth] = useState(recurring?.pattern.dayOfMonth ?? 1)
  const [endDate, setEndDate] = useState(recurring?.pattern.endDate ?? '')
  const [endAfterOccurrences, setEndAfterOccurrences] = useState(recurring?.pattern.endAfterOccurrences ?? undefined)
  const [endType, setEndType] = useState<'never' | 'date' | 'occurrences'>(
    recurring?.pattern.endDate ? 'date' : recurring?.pattern.endAfterOccurrences ? 'occurrences' : 'never'
  )

  const handleUpdate = (updates: Partial<RecurringTask>) => {
    const updated: RecurringTask = {
      enabled,
      pattern: {
        frequency,
        interval,
        daysOfWeek: frequency === 'weekly' ? selectedDays : undefined,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
        endDate: endType === 'date' ? endDate : undefined,
        endAfterOccurrences: endType === 'occurrences' ? endAfterOccurrences : undefined,
      },
      ...updates,
    }
    onChange(updated)
  }

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked)
    handleUpdate({ enabled: checked })
  }

  const handleFrequencyChange = (value: RecurrenceFrequency) => {
    setFrequency(value)
    handleUpdate({ pattern: { ...recurring?.pattern, frequency: value, interval } })
  }

  const handleIntervalChange = (value: string) => {
    const num = parseInt(value) || 1
    setInterval(num)
    handleUpdate({ pattern: { ...recurring?.pattern, frequency, interval: num } })
  }

  const toggleDay = (day: DayOfWeek) => {
    const updated = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day]
    setSelectedDays(updated)
    handleUpdate({ pattern: { ...recurring?.pattern, frequency, interval, daysOfWeek: updated } })
  }

  const handleDayOfMonthChange = (value: string) => {
    const num = Math.min(31, Math.max(1, parseInt(value) || 1))
    setDayOfMonth(num)
    handleUpdate({ pattern: { ...recurring?.pattern, frequency, interval, dayOfMonth: num } })
  }

  const handleEndTypeChange = (value: 'never' | 'date' | 'occurrences') => {
    setEndType(value)
    if (value === 'never') {
      handleUpdate({ pattern: { ...recurring?.pattern, frequency, interval, endDate: undefined, endAfterOccurrences: undefined } })
    }
  }

  const handleEndDateChange = (value: string) => {
    setEndDate(value)
    handleUpdate({ pattern: { ...recurring?.pattern, frequency, interval, endDate: value } })
  }

  const handleEndAfterOccurrencesChange = (value: string) => {
    const num = parseInt(value) || undefined
    setEndAfterOccurrences(num)
    handleUpdate({ pattern: { ...recurring?.pattern, frequency, interval, endAfterOccurrences: num } })
  }

  const getFrequencyLabel = () => {
    const labels = {
      daily: `Every ${interval} day${interval > 1 ? 's' : ''}`,
      weekly: `Every ${interval} week${interval > 1 ? 's' : ''}`,
      monthly: `Every ${interval} month${interval > 1 ? 's' : ''}`,
      yearly: `Every ${interval} year${interval > 1 ? 's' : ''}`,
      custom: 'Custom pattern'
    }
    return labels[frequency]
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="recurring-enabled" className="text-base font-semibold">
            Recurring Task
          </Label>
        </div>
        <Switch
          id="recurring-enabled"
          checked={enabled}
          onCheckedChange={handleEnabledChange}
        />
      </div>

      {enabled && (
        <div className="space-y-4 pl-6 border-l-2 border-primary/20">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Frequency</Label>
              <Select value={frequency} onValueChange={handleFrequencyChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Repeat every</Label>
              <Input
                type="number"
                min="1"
                value={interval}
                onChange={(e) => handleIntervalChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
            {getFrequencyLabel()}
          </div>

          {frequency === 'weekly' && (
            <div>
              <Label className="text-xs text-muted-foreground mb-2 block">Repeat on</Label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map((day) => (
                  <Badge
                    key={day}
                    variant={selectedDays.includes(day) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/80 transition-colors px-3 py-1"
                    onClick={() => toggleDay(day)}
                  >
                    {dayLabels[day]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {frequency === 'monthly' && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Day of month</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => handleDayOfMonthChange(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground block">Ends</Label>
            <Select value={endType} onValueChange={handleEndTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="date">On date</SelectItem>
                <SelectItem value="occurrences">After occurrences</SelectItem>
              </SelectContent>
            </Select>

            {endType === 'date' && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  className="flex-1"
                />
              </div>
            )}

            {endType === 'occurrences' && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">After</span>
                <Input
                  type="number"
                  min="1"
                  value={endAfterOccurrences || ''}
                  onChange={(e) => handleEndAfterOccurrencesChange(e.target.value)}
                  placeholder="10"
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">occurrences</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
