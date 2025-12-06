"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { LicenseKeyInput } from '@/components/LicenseKeyInput'
import { toast } from 'sonner'
import { Loader2, Shield, ArrowRight, Mail, CheckCircle2, Key, Sparkles, User, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

type RegistrationStep = 'email' | 'license-key' | 'complete-profile'

export default function RegisterPage() {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = useSession()
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!sessionPending && session?.user) {
      router.push('/')
    }
  }, [session, sessionPending, router])

  // Check username availability with debounce
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

  // Step 1: Request license key
  const handleRequestLicenseKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/license-keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), sendEmail: true })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to generate license key')
        setIsLoading(false)
        return
      }

      toast.success('🔑 License key generated!', {
        description: 'Check your email for the activation code'
      })
      
      // Move to license key entry step
      setCurrentStep('license-key')
    } catch (error) {
      console.error('License key generation error:', error)
      toast.error('Failed to generate license key. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Verify license key
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
        toast.success('✅ License key verified!', {
          description: 'Proceeding to account creation...'
        })
        // Auto-advance to profile completion after successful verification
        setTimeout(() => {
          setCurrentStep('complete-profile')
        }, 1000)
      }

      return { valid: data.valid, reason: data.reason }
    } catch (error) {
      console.error('License key verification error:', error)
      return { valid: false, reason: 'Failed to verify license key' }
    }
  }

  // Step 3: Complete profile and activate account
  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    // Validate username if provided
    if (formData.username && !usernameAvailable) {
      toast.error('Please choose an available username or leave it empty')
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

      toast.success('🎉 Account created successfully!', {
        description: 'Redirecting to login...'
      })
      
      setTimeout(() => {
        router.push('/login?registered=true')
      }, 1500)
    } catch (error) {
      console.error('Account activation error:', error)
      toast.error('Failed to create account. Please try again.')
      setIsLoading(false)
    }
  }

  const handleResendKey = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/license-keys/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to resend license key')
        setIsLoading(false)
        return
      }

      toast.success('📧 License key resent!', {
        description: 'Check your email for the new activation code'
      })
    } catch (error) {
      console.error('Resend error:', error)
      toast.error('Failed to resend license key')
    } finally {
      setIsLoading(false)
    }
  }

  if (sessionPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (session?.user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      {/* Floating particles effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            initial={{ 
              x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000), 
              y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)
            }}
            animate={{ 
              y: [null, Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000)],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
      </div>
      
      <div className="w-full max-w-2xl relative z-10">
        <Card className="glass-card border-2 shadow-xl">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex justify-center">
              <Logo />
            </div>
            
            {/* Enhanced Step indicator */}
            <div className="flex items-center justify-center gap-3 pt-2">
              {['email', 'license-key', 'complete-profile'].map((step, index) => (
                <div key={step} className="flex items-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ 
                      scale: currentStep === step ? 1.3 : 1,
                    }}
                    className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                      currentStep === step 
                        ? 'bg-primary ring-4 ring-primary/30' 
                        : index < ['email', 'license-key', 'complete-profile'].indexOf(currentStep)
                        ? 'bg-primary/50'
                        : 'bg-muted'
                    }`}
                  >
                    {currentStep === step && (
                      <motion.div
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 rounded-full bg-primary"
                      />
                    )}
                  </motion.div>
                  {index < 2 && (
                    <div className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                      index < ['email', 'license-key', 'complete-profile'].indexOf(currentStep)
                        ? 'bg-primary' 
                        : 'bg-muted'
                    }`} />
                  )}
                </div>
              ))}
            </div>
            
            <div className="space-y-2 text-center">
              <CardTitle className="text-2xl font-display flex items-center justify-center gap-2">
                {currentStep === 'email' && (
                  <>
                    <Mail className="h-5 w-5 text-primary" />
                    Request License Key
                  </>
                )}
                {currentStep === 'license-key' && (
                  <>
                    <Key className="h-5 w-5 text-primary" />
                    Verify License Key
                  </>
                )}
                {currentStep === 'complete-profile' && (
                  <>
                    <Sparkles className="h-5 w-5 text-primary" />
                    Complete Your Profile
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-sm">
                {currentStep === 'email' && 'Enter your email to receive a secure license key'}
                {currentStep === 'license-key' && 'Enter the license key sent to your email'}
                {currentStep === 'complete-profile' && 'Create your account credentials to get started'}
              </CardDescription>
            </div>
          </CardHeader>

          <AnimatePresence mode="wait">
            {/* Step 1: Email Entry */}
            {currentStep === 'email' && (
              <motion.form
                key="email-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequestLicenseKey}
              >
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      autoComplete="email"
                      autoFocus
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      A secure 16-character license key will be sent to this email
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-11 gap-2 font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating key...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        Generate License Key
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                  
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-card px-2 text-muted-foreground font-medium">
                        Already have an account?
                      </span>
                    </div>
                  </div>
                  
                  <Link href="/login" className="w-full">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 font-semibold"
                    >
                      Sign In
                    </Button>
                  </Link>
                </CardFooter>
              </motion.form>
            )}

            {/* Step 2: License Key Entry */}
            {currentStep === 'license-key' && (
              <motion.div
                key="license-key-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <CardContent className="space-y-6 py-6">
                  <LicenseKeyInput
                    onVerify={handleVerifyLicenseKey}
                    onKeyChange={(key) => setLicenseKey(key)}
                    disabled={isLoading}
                    autoFocus
                  />
                  
                  <div className="text-center space-y-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleResendKey}
                      disabled={isLoading}
                      className="text-xs font-medium"
                    >
                      Didn't receive the key? Click to resend
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Check your spam folder if you don't see the email
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 font-semibold"
                    onClick={() => setCurrentStep('email')}
                    disabled={isLoading}
                  >
                    ← Back to Email
                  </Button>
                </CardFooter>
              </motion.div>
            )}

            {/* Step 3: Complete Profile */}
            {currentStep === 'complete-profile' && (
              <motion.form
                key="profile-step"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleCompleteRegistration}
              >
                <CardContent className="space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center justify-center gap-2 text-green-500 bg-green-500/10 rounded-lg p-4 mb-4 border border-green-500/30"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-sm font-semibold">License key verified successfully!</span>
                  </motion.div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      disabled={isLoading}
                      autoComplete="name"
                      autoFocus
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="username">Username (Optional)</Label>
                      {checkingUsername && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Checking...
                        </span>
                      )}
                      {!checkingUsername && usernameAvailable === true && formData.username.length >= 3 && (
                        <span className="text-xs text-green-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Available
                        </span>
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <span className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Taken
                        </span>
                      )}
                    </div>
                    <Input
                      id="username"
                      type="text"
                      placeholder="john_doe"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      disabled={isLoading}
                      autoComplete="off"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Create a unique username for quick sign-in (3-20 characters)
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      disabled={isLoading}
                      autoComplete="off"
                      minLength={8}
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-primary" />
                      Must be at least 8 characters long
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                      disabled={isLoading}
                      autoComplete="off"
                      className="h-11"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col space-y-3 pt-2">
                  <Button
                    type="submit"
                    className="w-full h-11 gap-2 font-semibold"
                    disabled={isLoading || (formData.username && !usernameAvailable)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Create Account
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>
      </div>
    </div>
  )
}