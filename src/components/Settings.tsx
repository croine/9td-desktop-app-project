"use client"

import { AppSettings } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { 
  Download,
  Upload,
  FileJson,
  FileText,
} from 'lucide-react'
import { useRef } from 'react'

interface SettingsProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
  onExportJSON?: () => void
  onExportCSV?: () => void
  onImport?: (data: any) => boolean
  stats?: {
    totalTasks: number
    totalTags: number
    totalCategories: number
    totalTemplates: number
  }
}

export function Settings({ 
  settings, 
  onSettingsChange,
  onExportJSON,
  onExportCSV,
  onImport,
  stats
}: SettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    onSettingsChange(newSettings)
    toast.success('Settings updated successfully')
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (onImport && onImport(data)) {
        toast.success('Data imported successfully')
      } else {
        toast.error('Failed to import data')
      }
    } catch (error) {
      toast.error('Invalid file format')
      console.error('Import error:', error)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">General Settings</h1>
        <p className="text-muted-foreground">
          Manage app data, notifications, and system preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Notifications */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold mb-1">Notifications</h2>
              <p className="text-sm text-muted-foreground">
                Manage how you receive updates
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="notifications" className="text-base font-medium">
                  Enable Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive updates about task changes
                </p>
              </div>
              <Switch
                id="notifications"
                checked={settings.notifications}
                onCheckedChange={(checked) => handleChange('notifications', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Export & Import */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold mb-1 flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export & Import
              </h2>
              <p className="text-sm text-muted-foreground">
                Backup and restore your data
              </p>
            </div>

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-primary/5 border">
                  <div className="text-2xl font-bold">{stats.totalTasks}</div>
                  <div className="text-xs text-muted-foreground">Tasks</div>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border">
                  <div className="text-2xl font-bold">{stats.totalTags}</div>
                  <div className="text-xs text-muted-foreground">Tags</div>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border">
                  <div className="text-2xl font-bold">{stats.totalCategories}</div>
                  <div className="text-xs text-muted-foreground">Categories</div>
                </div>
                <div className="p-3 rounded-lg bg-primary/5 border">
                  <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                  <div className="text-xs text-muted-foreground">Templates</div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">Export Data</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={onExportJSON}>
                    <FileJson className="h-4 w-4" />
                    Export as JSON
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={onExportCSV}>
                    <FileText className="h-4 w-4" />
                    Export Tasks as CSV
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Import Data</Label>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                <Button variant="outline" className="w-full justify-start gap-2" onClick={handleImportClick}>
                  <Upload className="h-4 w-4" />
                  Import from JSON
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">💡 Backup Tips</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• JSON exports include all your data (tasks, tags, categories, templates)</li>
                  <li>• CSV exports only include tasks for spreadsheet compatibility</li>
                  <li>• Regular backups help protect against data loss</li>
                  <li>• Imported data will merge with existing data</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div>
              <h2 className="font-display text-xl font-semibold mb-1">Data Management</h2>
              <p className="text-sm text-muted-foreground">Manage your app data and storage</p>
            </div>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm('Are you sure? This will delete all tasks, tags, categories, and logs.')) {
                    localStorage.clear()
                    toast.success('All data cleared')
                    setTimeout(() => window.location.reload(), 1000)
                  }
                }}
              >
                🗑️ Clear All Data
              </Button>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="glass-card p-6">
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-semibold mb-1">About</h2>
              <p className="text-sm text-muted-foreground">Information about this application</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version</span>
                <span className="font-medium">2.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">App Name</span>
                <span className="font-medium">9TD Task Dashboard</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Edition</span>
                <span className="font-medium">Professional</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Storage</span>
                <span className="font-medium">Local Browser Storage</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}