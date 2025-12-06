"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Key, 
  Copy, 
  Trash2, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Sparkles,
  Shield,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'

interface LicenseKey {
  id: number
  key: string
  email: string
  status: 'pending' | 'active' | 'expired' | 'revoked'
  expiresAt: string
  activatedAt: string | null
  createdAt: string
}

export function LicenseKeyManager() {
  const [keys, setKeys] = useState<LicenseKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [newKeyEmail, setNewKeyEmail] = useState('')
  const [showGenerateForm, setShowGenerateForm] = useState(false)

  useEffect(() => {
    fetchKeys()
  }, [])

  const fetchKeys = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch('/api/license-keys/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch license keys')
      }

      const data = await response.json()
      setKeys(data.keys || [])
    } catch (error) {
      console.error('Error fetching keys:', error)
      toast.error('Failed to load license keys')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)

    try {
      const response = await fetch('/api/license-keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newKeyEmail.trim(), sendEmail: true })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to generate license key')
        setIsGenerating(false)
        return
      }

      toast.success('License key generated!', {
        description: `Key: ${data.key}`
      })
      
      setNewKeyEmail('')
      setShowGenerateForm(false)
      fetchKeys()
    } catch (error) {
      console.error('Error generating key:', error)
      toast.error('Failed to generate license key')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRevokeKey = async (keyId: number) => {
    try {
      const token = localStorage.getItem('bearer_token')
      const response = await fetch(`/api/license-keys/${keyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to revoke key')
      }

      toast.success('License key revoked')
      fetchKeys()
    } catch (error) {
      console.error('Error revoking key:', error)
      toast.error('Failed to revoke license key')
    }
  }

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key)
    toast.success('License key copied to clipboard!')
  }

  const getStatusBadge = (status: LicenseKey['status']) => {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        label: 'Pending'
      },
      active: {
        icon: CheckCircle2,
        color: 'bg-green-500/10 text-green-500 border-green-500/20',
        label: 'Active'
      },
      expired: {
        icon: XCircle,
        color: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
        label: 'Expired'
      },
      revoked: {
        icon: AlertCircle,
        color: 'bg-red-500/10 text-red-500 border-red-500/20',
        label: 'Revoked'
      }
    }

    const config = statusConfig[status]
    const Icon = config.icon

    return (
      <Badge variant="outline" className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading license keys...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                License Key Management
              </CardTitle>
              <CardDescription>
                View and manage your license keys
              </CardDescription>
            </div>
            
            {!showGenerateForm && (
              <Button
                onClick={() => setShowGenerateForm(true)}
                className="gap-2"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                Generate New Key
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Generate Key Form */}
          <AnimatePresence>
            {showGenerateForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="pt-6">
                    <form onSubmit={handleGenerateKey} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="newKeyEmail">Email Address</Label>
                        <Input
                          id="newKeyEmail"
                          type="email"
                          placeholder="recipient@example.com"
                          value={newKeyEmail}
                          onChange={(e) => setNewKeyEmail(e.target.value)}
                          required
                          disabled={isGenerating}
                          autoFocus
                        />
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Shield className="h-3 w-3" />
                          A new license key will be sent to this email
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          className="gap-2"
                          disabled={isGenerating}
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4" />
                              Generate Key
                            </>
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowGenerateForm(false)
                            setNewKeyEmail('')
                          }}
                          disabled={isGenerating}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* License Keys List */}
          {keys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-lg mb-2">No License Keys</h3>
              <p className="text-sm text-muted-foreground mb-4">
                You haven't generated any license keys yet
              </p>
              <Button
                onClick={() => setShowGenerateForm(true)}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Generate Your First Key
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {keys.map((licenseKey, index) => (
                  <motion.div
                    key={licenseKey.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border hover:border-primary/30 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            {/* Key Display */}
                            <div className="flex items-center gap-3">
                              <div className="flex-1">
                                <code className="text-sm font-mono font-bold bg-muted px-3 py-2 rounded-md block">
                                  {licenseKey.key}
                                </code>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleCopyKey(licenseKey.key)}
                                className="shrink-0"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Key Details */}
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                {getStatusBadge(licenseKey.status)}
                              </div>
                              
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {licenseKey.status === 'active' && licenseKey.activatedAt
                                    ? `Activated ${format(new Date(licenseKey.activatedAt), 'MMM d, yyyy')}`
                                    : `Expires ${format(new Date(licenseKey.expiresAt), 'MMM d, yyyy')}`
                                  }
                                </span>
                              </div>

                              <div className="text-muted-foreground">
                                {licenseKey.email}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          {licenseKey.status !== 'revoked' && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRevokeKey(licenseKey.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="glass-card border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">About License Keys</h4>
              <p className="text-xs text-muted-foreground">
                License keys are used to activate new accounts. Each key is valid for 7 days and can only be used once.
                Generate new keys to invite others to join 9TD or to create additional accounts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
