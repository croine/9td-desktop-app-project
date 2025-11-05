"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Download, 
  Upload, 
  FileJson, 
  FileSpreadsheet, 
  Database,
  CheckCircle2,
  AlertCircle,
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

interface ExportImportProps {
  onExportJSON: () => void
  onExportCSV: () => void
  onImport: (data: any) => boolean
  stats: {
    totalTasks: number
    totalTags: number
    totalCategories: number
    totalTemplates: number
  }
}

export function ExportImport({
  onExportJSON,
  onExportCSV,
  onImport,
  stats
}: ExportImportProps) {
  const [importing, setImporting] = useState(false)

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const success = onImport(data)
      
      if (success) {
        toast.success('Data imported successfully!')
      } else {
        toast.error('Import failed. Please check the file format.')
      }
    } catch (error) {
      toast.error('Invalid file format. Please upload a valid JSON file.')
      console.error('Import error:', error)
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  // Get auto-backup keys from localStorage
  const getAutoBackups = () => {
    if (typeof window === 'undefined') return []
    
    const allKeys = Object.keys(localStorage)
    const backupKeys = allKeys
      .filter(k => k.startsWith('ntd_auto_backup_'))
      .map(k => ({
        key: k,
        timestamp: parseInt(k.replace('ntd_auto_backup_', '')),
        date: new Date(parseInt(k.replace('ntd_auto_backup_', '')))
      }))
      .sort((a, b) => b.timestamp - a.timestamp)
    
    return backupKeys
  }

  const autoBackups = getAutoBackups()

  const restoreBackup = (key: string) => {
    try {
      const data = localStorage.getItem(key)
      if (!data) {
        toast.error('Backup not found')
        return
      }
      
      const parsed = JSON.parse(data)
      const success = onImport(parsed)
      
      if (success) {
        toast.success('Backup restored successfully!')
      } else {
        toast.error('Failed to restore backup')
      }
    } catch (error) {
      toast.error('Invalid backup data')
      console.error('Restore error:', error)
    }
  }

  const downloadBackup = (key: string) => {
    try {
      const data = localStorage.getItem(key)
      if (!data) {
        toast.error('Backup not found')
        return
      }
      
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `9td-backup-${format(new Date(parseInt(key.replace('ntd_auto_backup_', ''))), 'yyyy-MM-dd-HHmm')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      toast.success('Backup downloaded')
    } catch (error) {
      toast.error('Failed to download backup')
      console.error('Download error:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Export & Import</h1>
        <p className="text-muted-foreground">
          Backup your data or import from other sources
        </p>
      </div>

      {/* Current Data Stats */}
      <Card className="glass-card p-6">
        <h3 className="font-semibold mb-4">Current Data</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-display font-bold text-primary">
              {stats.totalTasks}
            </div>
            <div className="text-sm text-muted-foreground">Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-display font-bold text-blue-600">
              {stats.totalTags}
            </div>
            <div className="text-sm text-muted-foreground">Tags</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-display font-bold text-green-600">
              {stats.totalCategories}
            </div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-display font-bold text-purple-600">
              {stats.totalTemplates}
            </div>
            <div className="text-sm text-muted-foreground">Templates</div>
          </div>
        </div>
      </Card>

      {/* Export Section */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Export Data</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="glass-card p-6 hover:shadow-lg transition-all">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <FileJson className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Export as JSON</h3>
                  <p className="text-sm text-muted-foreground">
                    Complete backup with all data
                  </p>
                </div>
              </div>
              <Button onClick={onExportJSON} className="w-full gap-2">
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
            </div>
          </Card>

          <Card className="glass-card p-6 hover:shadow-lg transition-all">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <FileSpreadsheet className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Export as CSV</h3>
                  <p className="text-sm text-muted-foreground">
                    Tasks only, for spreadsheets
                  </p>
                </div>
              </div>
              <Button onClick={onExportCSV} className="w-full gap-2" variant="outline">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Import Section */}
      <div className="space-y-4">
        <h2 className="font-display text-xl font-semibold">Import Data</h2>
        
        <Card className="glass-card p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <Upload className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Import from JSON</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a previously exported JSON file to restore your data
                </p>
                
                <div className="space-y-3">
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-lg hover:border-primary transition-colors">
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          JSON files only
                        </p>
                      </div>
                    </div>
                    <Input
                      id="file-upload"
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="hidden"
                      disabled={importing}
                    />
                  </Label>
                  
                  {importing && (
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4 animate-spin" />
                      Importing...
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-600 mb-1">Warning</p>
                  <p className="text-muted-foreground">
                    Importing will merge with your existing data. Duplicate IDs will be overwritten.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Auto Backups */}
      {autoBackups.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" />
            Automatic Backups
          </h2>
          
          <Card className="glass-card p-6">
            <div className="space-y-3">
              {autoBackups.map(backup => (
                <div
                  key={backup.key}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">
                        {format(backup.date, 'MMMM d, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(backup.date, 'HH:mm:ss')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => restoreBackup(backup.key)}
                      size="sm"
                      variant="outline"
                    >
                      Restore
                    </Button>
                    <Button
                      onClick={() => downloadBackup(backup.key)}
                      size="sm"
                      variant="ghost"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
