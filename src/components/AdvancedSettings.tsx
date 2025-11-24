"use client"

import { AppSettings } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Code, Zap, Bug, Database, Gauge, FlaskConical } from 'lucide-react'
import { useState } from 'react'

interface AdvancedSettingsProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

export function AdvancedSettings({ settings, onSettingsChange }: AdvancedSettingsProps) {
  const [debugLogs, setDebugLogs] = useState<string[]>([])

  const handleChange = (key: keyof AppSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    onSettingsChange(newSettings)
    toast.success('Advanced settings updated')
    
    if (settings.debugMode) {
      addDebugLog(`Setting changed: ${key} = ${value}`)
    }
  }

  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`])
  }

  const clearCache = () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name))
      })
      toast.success('Cache cleared successfully')
      addDebugLog('Cache cleared')
    }
  }

  const reloadApp = () => {
    sessionStorage.clear()
    window.location.reload()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Advanced Settings</h1>
        <p className="text-muted-foreground">
          Developer options and experimental features
        </p>
      </div>

      <div className="grid gap-6">
        {/* Developer Mode */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Developer Mode</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="debugMode" className="text-base font-medium">
                  Debug Mode
                </Label>
                <p className="text-sm text-muted-foreground">
                  Enable detailed logging and diagnostics
                </p>
              </div>
              <Switch
                id="debugMode"
                checked={settings.debugMode ?? false}
                onCheckedChange={(checked) => {
                  handleChange('debugMode', checked)
                  if (checked) {
                    addDebugLog('Debug mode enabled')
                  }
                }}
              />
            </div>

            {settings.debugMode && debugLogs.length > 0 && (
              <div className="p-4 rounded-lg bg-muted/50 border font-mono text-xs space-y-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Debug Console</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDebugLogs([])}
                  >
                    Clear
                  </Button>
                </div>
                {debugLogs.map((log, i) => (
                  <div key={i} className="text-muted-foreground">{log}</div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="verboseLogging" className="text-base font-medium">
                  Verbose Logging
                </Label>
                <p className="text-sm text-muted-foreground">
                  Log all operations to console
                </p>
              </div>
              <Switch
                id="verboseLogging"
                checked={settings.verboseLogging ?? false}
                onCheckedChange={(checked) => handleChange('verboseLogging', checked)}
              />
            </div>
          </div>
        </Card>

        {/* Performance */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Performance</h2>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="reducedMotion" className="text-base font-medium">
                  Reduced Motion
                </Label>
                <p className="text-sm text-muted-foreground">
                  Minimize animations for better performance
                </p>
              </div>
              <Switch
                id="reducedMotion"
                checked={settings.reducedMotion ?? false}
                onCheckedChange={(checked) => handleChange('reducedMotion', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="lazyLoading" className="text-base font-medium">
                  Lazy Loading
                </Label>
                <p className="text-sm text-muted-foreground">
                  Load content on-demand for faster startup
                </p>
              </div>
              <Switch
                id="lazyLoading"
                checked={settings.lazyLoading ?? true}
                onCheckedChange={(checked) => handleChange('lazyLoading', checked)}
              />
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Cache Management</Label>
              <div className="flex gap-2">
                <Button onClick={clearCache} variant="outline" className="flex-1">
                  <Database className="h-4 w-4 mr-2" />
                  Clear Cache
                </Button>
                <Button onClick={reloadApp} variant="outline" className="flex-1">
                  <Zap className="h-4 w-4 mr-2" />
                  Reload App
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Experimental Features */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Experimental Features</h2>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">
                ⚠️ Use with Caution
              </p>
              <p className="text-xs text-muted-foreground">
                Experimental features may be unstable and could affect app performance
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="betaFeatures" className="text-base font-medium">
                  Beta Features
                </Label>
                <p className="text-sm text-muted-foreground">
                  Access features in development
                </p>
              </div>
              <Switch
                id="betaFeatures"
                checked={settings.betaFeatures ?? false}
                onCheckedChange={(checked) => handleChange('betaFeatures', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="experimentalAI" className="text-base font-medium">
                  AI Suggestions (Coming Soon)
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered task recommendations
                </p>
              </div>
              <Switch
                id="experimentalAI"
                checked={false}
                disabled
              />
            </div>
          </div>
        </Card>

        {/* System Information */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">System Information</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-primary/5 border">
                <div className="text-sm text-muted-foreground mb-1">Browser</div>
                <div className="font-mono text-xs truncate">
                  {navigator.userAgent.split(' ').slice(-1)[0]}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border">
                <div className="text-sm text-muted-foreground mb-1">Platform</div>
                <div className="font-mono text-xs">
                  {navigator.platform}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border">
                <div className="text-sm text-muted-foreground mb-1">Language</div>
                <div className="font-mono text-xs">
                  {navigator.language}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border">
                <div className="text-sm text-muted-foreground mb-1">Online Status</div>
                <div className="font-mono text-xs">
                  {navigator.onLine ? '🟢 Online' : '🔴 Offline'}
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
