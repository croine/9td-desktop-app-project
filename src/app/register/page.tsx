"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import { LicenseKeyInput } from '@/components/LicenseKeyInput'
import { toast } from 'sonner'
import { Loader2, ArrowRight, CheckCircle2, Key, Sparkles, User, AlertCircle, Home, LogIn, KeyRound, Eye, EyeOff, Check } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

type RegistrationStep = 'license-key' | 'complete-profile'

export default function RegisterPage() {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = useSession()
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('license-key')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  useEffect(() => {
    if (!sessionPending && session?.user) {
      router.push('/')
    }
  }, [session, sessionPending, router])

  useEffect(() => {
    if (!formData.password) {
      setPasswordStrength(0)
      return
    }

    let strength = 0
    if (formData.password.length >= 8) strength++
    if (formData.password.length >= 12) strength++
    if (/[a-z]/.test(formData.password) && /[A-Z]/.test(formData.password)) strength++
    if (/\d/.test(formData.password)) strength++
    if (/[^a-zA-Z0-9]/.test(formData.password)) strength++
    
    setPasswordStrength(Math.min(strength, 5))
  }, [formData.password])

  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username.length < 3) {
        setUsernameAvailable(null)
        return
      }

      setCheckingUsername(true)
      try {
        const response = await fetch('/api/user/check-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: formData.username })
        })

        const data = await response.json()
        
        if (response.ok) {
          setUsernameAvailable(data.available)
        } else {
          setUsernameAvailable(null)
        }
      } catch (error) {
        console.error('Username check error:', error)
        setUsernameAvailable(null)
      } finally {
        setCheckingUsername(false)
      }
    }

    const timeoutId = setTimeout(checkUsername, 500)
    return () => clearTimeout(timeoutId)
  }, [formData.username])

  const handleVerifyLicenseKey = async (key: string): Promise<{ valid: boolean; reason?: string }> => {
    try {
      const response = await fetch('/api/license-keys/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key })
      })

      const data = await response.json()

      if (!response.ok) {
        return { valid: false, reason: data.error || 'Verification failed' }
      }

      if (data.valid) {
        setLicenseKey(key)
        setEmail(data.email || '')
        toast.success('License key verified!', {
          description: 'Continue to complete your profile'
        })
        setTimeout(() => {
          setCurrentStep('complete-profile')
        }, 600)
      }

      return { valid: data.valid, reason: data.reason }
    } catch (error) {
      console.error('License key verification error:', error)
      return { valid: false, reason: 'Failed to verify license key' }
    }
  }

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    if (formData.username && !usernameAvailable) {
      toast.error('Please choose an available username')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/license-keys/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: licenseKey,
          email: email.trim(),
          name: formData.name.trim(),
          username: formData.username.trim() || undefined,
          password: formData.password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Account activation failed')
        setIsLoading(false)
        return
      }

      // Check if email verification is required
      if (data.requiresVerification) {
        toast.success('Account created successfully!', {
          description: 'Please check your email to verify your account'
        })
        
        setTimeout(() => {
          router.push('/verify-email-pending')
        }, 1200)
      } else {
        // Legacy flow for backwards compatibility
        toast.success('Account created successfully!', {
          description: 'Redirecting to login...'
        })
        
        setTimeout(() => {
          router.push('/login?registered=true')
        }, 1200)
      }
    } catch (error) {
      console.error('Account activation error:', error)
      toast.error('Failed to create account')
      setIsLoading(false)
    }
  }

  if (sessionPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (session?.user) {
    return null
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-red-500'
    if (passwordStrength <= 2) return 'bg-orange-500'
    if (passwordStrength <= 3) return 'bg-yellow-500'
    if (passwordStrength <= 4) return 'bg-blue-500'
    return 'bg-green-500'
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength <= 1) return 'Weak'
    if (passwordStrength <= 2) return 'Fair'
    if (passwordStrength <= 3) return 'Good'
    if (passwordStrength <= 4) return 'Strong'
    return 'Excellent'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-header">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Logo />
              <span className="font-display font-bold text-xl">9TD</span>
            </Link>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => router.push('/')}>
                <Home className="h-3 w-3 mr-1.5" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => router.push('/login')}>
                <LogIn className="h-3 w-3 mr-1.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
              <Button size="sm" className="h-8 px-2 text-xs" onClick={() => router.push('/pricing')}>
                <KeyRound className="h-3 w-3 mr-1.5" />
                <span className="hidden sm:inline">Get License</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-muted-foreground">
              {currentStep === 'license-key' 
                ? 'Enter your license key to get started'
                : 'Complete your profile information'
              }
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className={`flex items-center gap-2 ${
              currentStep === 'license-key' ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'complete-profile'
                  ? 'bg-primary/20 text-primary'
                  : 'bg-primary text-primary-foreground'
              }`}>
                {currentStep === 'complete-profile' ? <Check className="h-4 w-4" /> : '1'}
              </div>
            </div>
            
            <div className={`w-12 h-0.5 rounded-full ${
              currentStep === 'complete-profile' ? 'bg-primary' : 'bg-muted'
            }`} />
            
            <div className={`flex items-center gap-2 ${
              currentStep === 'complete-profile' ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                currentStep === 'complete-profile'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
            </div>
          </div>

          {/* Form */}
          <Card className="glass-card p-6">
            <AnimatePresence mode="wait">
              {currentStep === 'license-key' && (
                <motion.div
                  key="license"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Key className="h-6 w-6 text-primary" />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3 text-sm text-center">
                    Don't have a key?{' '}
                    <Link href="/pricing" className="text-primary hover:underline font-semibold">
                      Get one here
                    </Link>
                  </div>

                  <LicenseKeyInput
                    onVerify={handleVerifyLicenseKey}
                    onKeyChange={(key) => setLicenseKey(key)}
                    disabled={isLoading}
                    autoFocus
                  />

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground">
                        Already registered?
                      </span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" onClick={() => router.push('/login')}>
                    <LogIn className="h-4 w-4 mr-2" />
                    Sign In
                  </Button>
                </motion.div>
              )}

              {currentStep === 'complete-profile' && (
                <motion.form
                  key="profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleCompleteRegistration}
                  className="space-y-5"
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/20 flex items-center justify-center">
                      <User className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={isLoading}
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="username">
                        Username <span className="text-xs text-muted-foreground">(optional)</span>
                      </Label>
                      {checkingUsername && (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      )}
                      {!checkingUsername && usernameAvailable === true && formData.username.length >= 3 && (
                        <Badge variant="outline" className="text-xs text-green-600 dark:text-green-400 border-green-600/20">
                          Available
                        </Badge>
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <Badge variant="outline" className="text-xs text-red-600 dark:text-red-400 border-red-600/20">
                          Taken
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="username"
                      placeholder="johndoe"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        disabled={isLoading}
                        minLength={8}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {formData.password && (
                      <div className="space-y-1.5">
                        <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-all ${
                                i < passwordStrength ? getPasswordStrengthColor() : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Strength: {getPasswordStrengthText()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        disabled={isLoading}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-10 w-10 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Passwords don't match
                      </p>
                    )}
                  </div>

                  <div className="pt-2 space-y-3">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || (formData.username && !usernameAvailable)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Create Account
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setCurrentStep('license-key')}
                      disabled={isLoading}
                    >
                      Change License Key
                    </Button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </Card>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}