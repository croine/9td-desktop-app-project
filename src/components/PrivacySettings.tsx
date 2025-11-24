"use client"

import { AppSettings } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Shield, Lock, Eye, EyeOff, Trash2, Database } from 'lucide-react'
import { useState } from 'react'

interface PrivacySettingsProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

export function PrivacySettings({ settings, onSettingsChange }: PrivacySettingsProps) {
  const [showConfirmClear, setShowConfirmClear] = useState(false)

  const handleChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    onSettingsChange(newSettings)
    toast.success('Privacy settings updated')
  }

  const calculateStorageSize = () => {
    let total = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length
      }
    }
    return (total / 1024).toFixed(2) // Convert to KB
  }

  const handleClearAllData = () => {
    if (showConfirmClear) {
      localStorage.clear()
      toast.success('All data cleared successfully')
      setTimeout(() => window.location.reload(), 1000)
    } else {
      setShowConfirmClear(true)
      setTimeout(() => setShowConfirmClear(false), 5000)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Privacy & Security</h1>
        <p className="text-muted-foreground">
          Manage your data privacy and security settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Privacy Controls */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Privacy Controls</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="privacyMode" className="text-base font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Privacy Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Hide sensitive task information in preview
                </p>
              </div>
              <Switch
                id="privacyMode"
                checked={settings.privacyMode ?? false}
                onCheckedChange={(checked) => handleChange('privacyMode', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="analytics" className="text-base font-medium">
                  Analytics
                </Label>
                <p className="text-sm text-muted-foreground">
                  Allow anonymous usage analytics
                </p>
              </div>
              <Switch
                id="analytics"
                checked={settings.allowAnalytics ?? true}
                onCheckedChange={(checked) => handleChange('allowAnalytics', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Data Storage */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Data Storage</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border">
                <p className="text-sm text-muted-foreground mb-1">Storage Used</p>
                <p className="text-2xl font-bold">{calculateStorageSize()} KB</p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border">
                <p className="text-sm text-muted-foreground mb-1">Storage Type</p>
                <p className="text-2xl font-bold">Local</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                🔒 Your Data is Stored Locally
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• All data is stored in your browser's local storage</li>
                <li>• No data is sent to external servers</li>
                <li>• Clear your browser data to remove all information</li>
                <li>• Export regularly to prevent data loss</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Auto-lock Settings */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Auto-lock</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="autoLock" className="text-base font-medium">
                  Enable Auto-lock
                </Label>
                <p className="text-sm text-muted-foreground">
                  Lock app when inactive (coming soon)
                </p>
              </div>
              <Switch
                id="autoLock"
                checked={settings.autoLock ?? false}
                onCheckedChange={(checked) => handleChange('autoLock', checked)}
                disabled
              />
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                🚧 Feature in Development
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Auto-lock and password protection will be available in a future update
              </p>
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="glass-card p-6 border-destructive/20">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              <h2 className="font-display text-xl font-semibold text-destructive">
                Danger Zone
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm font-medium text-destructive mb-2">
                  ⚠️ Clear All Data
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  This will permanently delete all tasks, tags, categories, templates, and settings. This action cannot be undone.
                </p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleClearAllData}
                >
                  {showConfirmClear ? '⚠️ Click Again to Confirm' : '🗑️ Clear All Data'}
                </Button>
                {showConfirmClear && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Click again within 5 seconds to confirm
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
