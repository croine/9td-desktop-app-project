"use client"

import { AppSettings } from '@/types/task'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Plug, Webhook, Calendar, Cloud, Link2, Zap } from 'lucide-react'
import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'

interface IntegrationsSettingsProps {
  settings: AppSettings
  onSettingsChange: (settings: AppSettings) => void
}

export function IntegrationsSettings({ settings, onSettingsChange }: IntegrationsSettingsProps) {
  const [webhookUrl, setWebhookUrl] = useState(settings.webhookUrl || '')

  const handleSaveWebhook = () => {
    const newSettings = { ...settings, webhookUrl }
    onSettingsChange(newSettings)
    toast.success('Webhook URL saved')
  }

  const testWebhook = async () => {
    if (!webhookUrl) {
      toast.error('Please enter a webhook URL first')
      return
    }

    try {
      toast.info('Testing webhook...')
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test',
          message: 'This is a test webhook from 9TD Task Dashboard',
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        toast.success('Webhook test successful!')
      } else {
        toast.error(`Webhook test failed: ${response.status}`)
      }
    } catch (error) {
      toast.error('Webhook test failed: Network error')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Integrations</h1>
        <p className="text-muted-foreground">
          Connect 9TD with external services and apps
        </p>
      </div>

      <div className="grid gap-6">
        {/* Webhooks */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Webhook className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Webhooks</h2>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-medium">Webhook URL</Label>
              <Input
                placeholder="https://your-webhook-url.com/endpoint"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Receive real-time notifications when tasks are created, updated, or completed
              </p>
              <div className="flex gap-2">
                <Button onClick={handleSaveWebhook} className="flex-1">
                  Save Webhook
                </Button>
                <Button onClick={testWebhook} variant="outline">
                  Test
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                📡 Webhook Events
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Task created</li>
                <li>• Task updated</li>
                <li>• Task completed</li>
                <li>• Task deleted</li>
                <li>• Due date approaching</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Third-party Services */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Plug className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">Third-party Services</h2>
            </div>

            <div className="grid gap-4">
              {/* Google Calendar */}
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Google Calendar</h3>
                      <p className="text-sm text-muted-foreground">
                        Sync tasks with your calendar
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>

              {/* Cloud Storage */}
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <Cloud className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Cloud Storage</h3>
                      <p className="text-sm text-muted-foreground">
                        Backup to Google Drive or Dropbox
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>

              {/* Zapier */}
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Zapier</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect with 5000+ apps
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Coming Soon
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* API Access */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Link2 className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-semibold">API Access</h2>
            </div>

            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mb-2">
                🚧 API in Development
              </p>
              <p className="text-xs text-muted-foreground">
                REST API for programmatic access to your tasks and data will be available in a future update. This will enable custom integrations and automation workflows.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
