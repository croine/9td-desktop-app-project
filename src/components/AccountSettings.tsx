"use client"

import { useState, useEffect } from 'react'
import { useSession } from '@/lib/auth-client'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { 
  User, 
  Mail, 
  Lock, 
  Image as ImageIcon,
  Shield,
  Eye,
  EyeOff,
  Upload,
  Circle,
  Square,
  RectangleHorizontal,
  Palette,
  Save,
  Loader2
} from 'lucide-react'

interface AccountData {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image: string | null
    createdAt: string
    updatedAt: string
  }
  preferences: {
    customTitle: string
    showEmail: boolean
    blurEmail: boolean
    avatarUrl: string | null
    avatarShape: 'circle' | 'square' | 'rounded'
    avatarColorScheme: 'solid' | 'gradient' | 'rainbow' | 'fade'
    avatarBorderColor: string
    showPassword: boolean
    accountVisibility: 'private' | 'public' | 'team'
    twoFactorEnabled: boolean
  }
}

export function AccountSettings() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarShape, setAvatarShape] = useState<'circle' | 'square' | 'rounded'>('circle')
  const [avatarColorScheme, setAvatarColorScheme] = useState<'solid' | 'gradient' | 'rainbow' | 'fade'>('gradient')
  const [avatarBorderColor, setAvatarBorderColor] = useState('#6366f1')
  const [showEmail, setShowEmail] = useState(false)
  const [blurEmail, setBlurEmail] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [accountVisibility, setAccountVisibility] = useState<'private' | 'public' | 'team'>('private')
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchAccountSettings()
    }
  }, [session])

  const fetchAccountSettings = async () => {
    try {
      const token = localStorage.getItem("bearer_token")
      if (!token) {
        toast.error('Authentication required')
        return
      }

      const response = await fetch('/api/user/account-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data: AccountData = await response.json()
        setAccountData(data)
        
        // Set form states
        setName(data.user.name)
        setEmail(data.user.email)
        setAvatarUrl(data.preferences.avatarUrl || '')
        setAvatarShape(data.preferences.avatarShape)
        setAvatarColorScheme(data.preferences.avatarColorScheme)
        setAvatarBorderColor(data.preferences.avatarBorderColor)
        setShowEmail(data.preferences.showEmail)
        setBlurEmail(data.preferences.blurEmail)
        setShowPassword(data.preferences.showPassword)
        setAccountVisibility(data.preferences.accountVisibility)
        setTwoFactorEnabled(data.preferences.twoFactorEnabled)
      } else {
        toast.error('Failed to fetch account settings')
      }
    } catch (error) {
      console.error('Failed to fetch account settings:', error)
      toast.error('Failed to fetch account settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      toast.error('Name cannot be empty')
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })

      if (response.ok) {
        toast.success('Profile updated successfully')
        await fetchAccountSettings()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateAvatar = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch('/api/user/avatar', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ avatarUrl: avatarUrl || null }),
      })

      if (response.ok) {
        toast.success('Avatar updated successfully')
        await fetchAccountSettings()
      } else {
        toast.error('Failed to update avatar')
      }
    } catch (error) {
      toast.error('Failed to update avatar')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdatePreferences = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch('/api/user/account-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          avatarShape,
          avatarColorScheme,
          avatarBorderColor,
          showEmail,
          blurEmail,
          showPassword,
          accountVisibility,
          twoFactorEnabled,
        }),
      })

      if (response.ok) {
        toast.success('Preferences updated successfully')
        await fetchAccountSettings()
      } else {
        toast.error('Failed to update preferences')
      }
    } catch (error) {
      toast.error('Failed to update preferences')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill in all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }

    setIsSaving(true)
    try {
      const token = localStorage.getItem("bearer_token")
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (response.ok) {
        toast.success('Password changed successfully')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to change password')
      }
    } catch (error) {
      toast.error('Failed to change password')
    } finally {
      setIsSaving(false)
    }
  }

  const getAvatarBorderClass = () => {
    const shapeClasses = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded-2xl'
    }
    
    const colorClasses = {
      solid: `ring-4`,
      gradient: `ring-4 ring-gradient`,
      rainbow: `ring-4 animate-rainbow`,
      fade: `ring-4 animate-pulse`
    }
    
    return `${shapeClasses[avatarShape]} ${colorClasses[avatarColorScheme]}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!accountData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load account settings</p>
      </div>
    )
  }

  const initials = accountData.user.name
    ? accountData.user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : accountData.user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your profile, avatar, security, and privacy settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Information */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-xl font-semibold">Profile Information</h2>
                <p className="text-sm text-muted-foreground">
                  Update your personal information
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
                {accountData.user.emailVerified && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    ✓ Email verified
                  </p>
                )}
              </div>

              <Button onClick={handleUpdateProfile} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Profile
              </Button>
            </div>
          </div>
        </Card>

        {/* Avatar Customization */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <ImageIcon className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-xl font-semibold">Avatar Customization</h2>
                <p className="text-sm text-muted-foreground">
                  Customize your profile picture appearance
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              {/* Avatar Preview */}
              <div className="space-y-3">
                <Label>Preview</Label>
                <Avatar 
                  className={`h-32 w-32 ${getAvatarBorderClass()}`}
                  style={{ 
                    borderColor: avatarBorderColor,
                    '--tw-ring-color': avatarBorderColor 
                  } as any}
                >
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={name} />}
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-semibold text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Avatar Controls */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="avatarUrl">Avatar Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="avatarUrl"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                    />
                    <Button onClick={handleUpdateAvatar} disabled={isSaving}>
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter a direct image URL for your avatar
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Frame Shape</Label>
                    <Select value={avatarShape} onValueChange={(value: any) => setAvatarShape(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="circle">
                          <div className="flex items-center gap-2">
                            <Circle className="h-4 w-4" />
                            Circle
                          </div>
                        </SelectItem>
                        <SelectItem value="square">
                          <div className="flex items-center gap-2">
                            <Square className="h-4 w-4" />
                            Square
                          </div>
                        </SelectItem>
                        <SelectItem value="rounded">
                          <div className="flex items-center gap-2">
                            <RectangleHorizontal className="h-4 w-4" />
                            Rounded
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Color Scheme</Label>
                    <Select value={avatarColorScheme} onValueChange={(value: any) => setAvatarColorScheme(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="rainbow">Rainbow</SelectItem>
                        <SelectItem value="fade">Fade</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="borderColor">Border Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="borderColor"
                      type="color"
                      value={avatarBorderColor}
                      onChange={(e) => setAvatarBorderColor(e.target.value)}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      value={avatarBorderColor}
                      onChange={(e) => setAvatarBorderColor(e.target.value)}
                      placeholder="#6366f1"
                      className="flex-1"
                    />
                  </div>
                </div>

                <Button onClick={handleUpdatePreferences} disabled={isSaving} className="w-full">
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Palette className="mr-2 h-4 w-4" />
                  Apply Avatar Settings
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Security & Password */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-xl font-semibold">Security & Password</h2>
                <p className="text-sm text-muted-foreground">
                  Update your password and security settings
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    autoComplete="off"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  autoComplete="off"
                />
              </div>

              <Button onClick={handleChangePassword} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Lock className="mr-2 h-4 w-4" />
                Change Password
              </Button>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="twoFactor" className="text-base font-medium">
                    Two-Factor Authentication
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  id="twoFactor"
                  checked={twoFactorEnabled}
                  onCheckedChange={(checked) => {
                    setTwoFactorEnabled(checked)
                    toast.info('Two-factor authentication feature coming soon')
                  }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Privacy Settings */}
        <Card className="glass-card p-6">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <h2 className="font-display text-xl font-semibold">Privacy & Visibility</h2>
                <p className="text-sm text-muted-foreground">
                  Control what information is visible
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="showEmail" className="text-base font-medium">
                    Show Email Address
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display your email in your profile
                  </p>
                </div>
                <Switch
                  id="showEmail"
                  checked={showEmail}
                  onCheckedChange={setShowEmail}
                />
              </div>

              {showEmail && (
                <div className="flex items-center justify-between pl-4 border-l-2">
                  <div className="space-y-1">
                    <Label htmlFor="blurEmail" className="text-base font-medium">
                      Blur Email Address
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Show email with blur effect for privacy
                    </p>
                  </div>
                  <Switch
                    id="blurEmail"
                    checked={blurEmail}
                    onCheckedChange={setBlurEmail}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="showPassword" className="text-base font-medium">
                    Show Password in Settings
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Display password fields in account settings
                  </p>
                </div>
                <Switch
                  id="showPassword"
                  checked={showPassword}
                  onCheckedChange={setShowPassword}
                />
              </div>

              <div className="space-y-2">
                <Label>Account Visibility</Label>
                <Select value={accountVisibility} onValueChange={(value: any) => setAccountVisibility(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="space-y-1">
                        <div className="font-medium">Private</div>
                        <div className="text-xs text-muted-foreground">Only you can see your profile</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="team">
                      <div className="space-y-1">
                        <div className="font-medium">Team</div>
                        <div className="text-xs text-muted-foreground">Visible to team members only</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="space-y-1">
                        <div className="font-medium">Public</div>
                        <div className="text-xs text-muted-foreground">Visible to everyone</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleUpdatePreferences} disabled={isSaving} className="w-full">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Privacy Settings
              </Button>
            </div>
          </div>
        </Card>

        {/* Account Info */}
        <Card className="glass-card p-6">
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Account Information</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">User ID:</span>
                <p className="font-mono text-xs mt-1">{accountData.user.id}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Member Since:</span>
                <p className="font-medium mt-1">
                  {new Date(accountData.user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}