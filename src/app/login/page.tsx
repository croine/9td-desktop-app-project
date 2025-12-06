"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { Mail, User, Lock, KeyRound, Eye, EyeOff, Shield, Fingerprint, Cpu, CheckCircle2, XCircle, Loader2, ArrowRight, AlertTriangle, Clipboard, ClipboardCheck, Home, UserPlus, LogIn, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

type AuthMethod = 'email' | 'username'

export default function LoginPage() {
  const router = useRouter()
  const [authMethod, setAuthMethod] = useState<AuthMethod>('email')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [licenseKey, setLicenseKey] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showLicenseKey, setShowLicenseKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [capsLockOn, setCapsLockOn] = useState(false)
  const [licensePasted, setLicensePasted] = useState(false)
  
  // Validation states
  const [emailValid, setEmailValid] = useState<boolean | null>(null)
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null)
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null)
  const [licenseKeyValid, setLicenseKeyValid] = useState<boolean | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number
    label: string
    color: string
  }>({ score: 0, label: '', color: '' })

  // Current authentication step (1, 2, 3)
  const [currentStep, setCurrentStep] = useState(1)

  // Password strength calculator
  const calculatePasswordStrength = (password: string) => {
    if (!password) {
      return { score: 0, label: '', color: '' }
    }

    let score = 0
    
    // Length check
    if (password.length >= 8) score += 1
    if (password.length >= 12) score += 1
    
    // Complexity checks
    if (/[a-z]/.test(password)) score += 1
    if (/[A-Z]/.test(password)) score += 1
    if (/[0-9]/.test(password)) score += 1
    if (/[^a-zA-Z0-9]/.test(password)) score += 1

    if (score <= 2) {
      return { score: 1, label: 'Weak', color: 'bg-red-500' }
    } else if (score <= 4) {
      return { score: 2, label: 'Medium', color: 'bg-yellow-500' }
    } else {
      return { score: 3, label: 'Strong', color: 'bg-green-500' }
    }
  }

  // Caps lock detection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true)
    } else {
      setCapsLockOn(false)
    }
  }

  const handleKeyUp = (e: React.KeyboardEvent) => {
    if (e.getModifierState && e.getModifierState('CapsLock')) {
      setCapsLockOn(true)
    } else {
      setCapsLockOn(false)
    }
  }

  // Handle paste license key
  const handlePasteLicense = async () => {
    try {
      const text = await navigator.clipboard.readText()
      const cleaned = text.replace(/[^A-Z0-9]/gi, '').toUpperCase()
      if (cleaned.length >= 16) {
        const truncated = cleaned.slice(0, 16)
        const formatted = truncated.match(/.{1,4}/g)?.join('-') || truncated
        setLicenseKey(formatted)
        setLicensePasted(true)
        toast.success('License key pasted successfully!')
        setTimeout(() => setLicensePasted(false), 2000)
      } else {
        toast.error('Invalid license key format. Expected: 16 characters')
      }
    } catch (err) {
      toast.error('Failed to paste. Please paste manually.')
    }
  }

  // Update current step based on field focus
  useEffect(() => {
    const identifierFilled = authMethod === 'email' ? email.length > 0 : username.length > 0
    const passwordFilled = password.length > 0
    const licenseFilled = licenseKey.length > 0

    if (!identifierFilled) {
      setCurrentStep(1)
    } else if (!passwordFilled) {
      setCurrentStep(2)
    } else if (!licenseFilled) {
      setCurrentStep(3)
    } else {
      setCurrentStep(3)
    }
  }, [email, username, password, licenseKey, authMethod])

  // Real-time validation - RELAXED
  useEffect(() => {
    if (authMethod === 'email' && email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      setEmailValid(emailRegex.test(email))
    } else {
      setEmailValid(null)
    }
  }, [email, authMethod])

  useEffect(() => {
    if (authMethod === 'username' && username.length > 0) {
      setUsernameValid(/^[a-zA-Z0-9_-]{3,20}$/.test(username))
    } else {
      setUsernameValid(null)
    }
  }, [username, authMethod])

  useEffect(() => {
    if (password.length > 0) {
      setPasswordValid(password.length >= 1)
      setPasswordStrength(calculatePasswordStrength(password))
    } else {
      setPasswordValid(null)
      setPasswordStrength({ score: 0, label: '', color: '' })
    }
  }, [password])

  useEffect(() => {
    const formatted = licenseKey.replace(/[^A-Z0-9]/gi, '')
    if (formatted.length > 0) {
      setLicenseKeyValid(formatted.length === 16)
    } else {
      setLicenseKeyValid(null)
    }
  }, [licenseKey])

  const handleLicenseKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    if (value.length > 16) value = value.slice(0, 16)
    
    const formatted = value.match(/.{1,4}/g)?.join('-') || value
    setLicenseKey(formatted)
  }

  const handleForgotPassword = () => {
    toast.info('Password recovery feature coming soon! Please contact support for assistance.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    // Basic validation - allow submission if fields are filled
    const identifier = authMethod === 'email' ? email.trim() : username.trim()
    
    if (!identifier) {
      toast.error(`Please enter your ${authMethod === 'email' ? 'email' : 'username'}`)
      return
    }
    
    if (!password) {
      toast.error('Please enter your password')
      return
    }
    
    // Keep dashes in license key for database matching
    const cleanLicenseKey = licenseKey.trim()
    // Verify format: should be XXXX-XXXX-XXXX-XXXX (19 chars with dashes) or XXXXXXXXXXXXXXXX (16 chars without)
    const keyWithoutDashes = cleanLicenseKey.replace(/-/g, '')
    if (!keyWithoutDashes || keyWithoutDashes.length !== 16) {
      toast.error('Please enter a valid 16-character license key')
      return
    }

    setIsLoading(true)

    try {
      // Call custom signin-multi endpoint directly
      const response = await fetch('/api/auth/signin-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: authMethod,
          ...(authMethod === 'email' 
            ? { email: identifier }
            : { username: identifier }
          ),
          password,
          licenseKey: cleanLicenseKey, // Send WITH dashes as stored in database
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Enhanced error messages
        if (data.code === 'INVALID_CREDENTIALS') {
          toast.error('Invalid credentials or license key. Please check and try again.')
        } else if (data.code === 'EXPIRED_LICENSE_KEY') {
          toast.error('License key has expired. Please renew your license.', {
            action: {
              label: 'Renew',
              onClick: () => router.push('/pricing')
            }
          })
        } else if (data.code === 'INVALID_LICENSE_KEY') {
          toast.error('License key is not active or invalid.')
        } else {
          toast.error(data.error || 'Sign in failed. Please try again.')
        }
        setIsLoading(false)
        return
      }

      // Store session token
      if (data.session?.token) {
        localStorage.setItem('bearer_token', data.session.token)
      }

      toast.success('Welcome back! 🎉')
      setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 500)
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('Something went wrong. Please check your internet connection and try again.')
      setIsLoading(false)
    }
  }

  const ValidationIcon = ({ valid, isValidating }: { valid: boolean | null, isValidating: boolean }) => {
    if (isValidating) {
      return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
    }
    if (valid === true) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
        </motion.div>
      )
    }
    if (valid === false) {
      return (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <XCircle className="h-3.5 w-3.5 text-red-500" />
        </motion.div>
      )
    }
    return null
  }

  const StepIndicator = ({ step, label, isActive, isComplete }: { step: number; label: string; isActive: boolean; isComplete: boolean }) => (
    <motion.div
      className="flex flex-col items-center gap-1.5 flex-1"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: step * 0.05 }}
    >
      <motion.div
        className={`relative w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-300 ${
          isComplete
            ? 'bg-green-500 text-white shadow-md shadow-green-500/40'
            : isActive
            ? 'bg-primary text-primary-foreground shadow-md shadow-primary/40 ring-2 ring-primary/20'
            : 'bg-muted text-muted-foreground'
        }`}
        whileHover={{ scale: 1.05 }}
      >
        {isComplete ? (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            <CheckCircle2 className="h-4 w-4" />
          </motion.div>
        ) : (
          step
        )}
      </motion.div>
      <span className={`text-[10px] font-medium transition-colors ${isActive || isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </motion.div>
  )

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-primary/[0.02] to-background">
      {/* Simple animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 animate-pulse-smooth" />

      {/* Smart Navigation Bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo className="scale-90" />
              <span className="font-display font-bold text-lg hidden sm:inline">9TD</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="gap-2 text-sm"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/register')}
                className="gap-2 text-sm"
              >
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Register</span>
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => router.push('/login')}
                className="gap-2 text-sm"
                disabled
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content container with top padding for fixed nav */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-6 mt-16">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Left side - Branding and features (hidden on mobile) */}
          <motion.div
            className="hidden md:block space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo and title */}
            <div className="text-center">
              <motion.div
                className="mb-4 flex justify-center"
                animate={{
                  y: [0, -5, 0],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Logo className="scale-125" />
              </motion.div>
              <h1 className="text-3xl md:text-4xl font-display font-bold mb-2 bg-gradient-to-r from-primary via-purple-600 to-primary bg-clip-text text-transparent">
                Welcome to 9TD
              </h1>
              <p className="text-sm text-muted-foreground">
                Three-factor authentication for maximum security
              </p>
            </div>

            {/* Security features */}
            <div className="space-y-3">
              {[
                { icon: Shield, label: 'Military-Grade Encryption', desc: 'AES-256 protection', color: 'from-green-500 to-emerald-600' },
                { icon: Fingerprint, label: 'License Verification', desc: 'Unique key authentication', color: 'from-blue-500 to-cyan-600' },
                { icon: Cpu, label: 'Real-Time Validation', desc: 'Instant credential check', color: 'from-purple-500 to-pink-600' },
              ].map((feature, i) => (
                <motion.div
                  key={feature.label}
                  className="flex items-start gap-3 p-3 rounded-xl glass-card hover:shadow-md transition-all duration-300"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.1 }}
                  whileHover={{ x: 8 }}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${feature.color} shadow-md`}>
                    <feature.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm mb-0.5">{feature.label}</h3>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="glass-card p-4 rounded-xl border border-primary/10">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Quick Access
              </h3>
              <div className="space-y-2">
                <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                  <Home className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                  <span>Go to Dashboard</span>
                </Link>
                <Link href="/register" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                  <UserPlus className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                  <span>Create New Account</span>
                </Link>
                <Link href="/pricing" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                  <KeyRound className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                  <span>Purchase License Key</span>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Right side - Authentication form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Card className="glass-card p-6 shadow-xl shadow-primary/5 border border-primary/10">
              {/* Step progress indicator */}
              <div className="flex items-center justify-between mb-6">
                <StepIndicator
                  step={1}
                  label="Identity"
                  isActive={currentStep === 1}
                  isComplete={currentStep > 1}
                />
                <div className="flex-1 h-0.5 bg-muted mx-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-purple-600"
                    initial={{ width: '0%' }}
                    animate={{ width: currentStep >= 2 ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <StepIndicator
                  step={2}
                  label="Password"
                  isActive={currentStep === 2}
                  isComplete={currentStep > 2}
                />
                <div className="flex-1 h-0.5 bg-muted mx-2 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-purple-600"
                    initial={{ width: '0%' }}
                    animate={{ width: currentStep >= 3 ? '100%' : '0%' }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <StepIndicator
                  step={3}
                  label="License"
                  isActive={currentStep === 3}
                  isComplete={licenseKeyValid === true}
                />
              </div>

              {/* Method selector */}
              <div className="flex gap-2 mb-4 p-0.5 bg-muted/30 rounded-lg backdrop-blur-sm">
                {(['email', 'username'] as const).map((method) => (
                  <motion.button
                    key={method}
                    onClick={() => setAuthMethod(method)}
                    className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-all duration-300 ${
                      authMethod === method
                        ? 'bg-gradient-to-r from-primary to-purple-600 text-white shadow-md shadow-primary/20'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {method === 'email' ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <User className="h-4 w-4" />
                      )}
                      <span className="capitalize">{method}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {/* Step 1: Email or Username */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={authMethod}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-1.5"
                  >
                    <Label className="text-xs font-semibold">
                      {authMethod === 'email' ? 'Email Address' : 'Username'}
                    </Label>
                    <div className="relative group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                        {authMethod === 'email' ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                      <Input
                        type={authMethod === 'email' ? 'email' : 'text'}
                        value={authMethod === 'email' ? email : username}
                        onChange={(e) =>
                          authMethod === 'email'
                            ? setEmail(e.target.value)
                            : setUsername(e.target.value)
                        }
                        placeholder={
                          authMethod === 'email'
                            ? 'you@example.com'
                            : 'your_username'
                        }
                        className="pl-10 pr-10 h-10 text-sm rounded-lg border transition-all duration-300 focus:border-primary focus:shadow-md focus:shadow-primary/10"
                        disabled={isLoading}
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <ValidationIcon
                          valid={authMethod === 'email' ? emailValid : usernameValid}
                          isValidating={isValidating}
                        />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Step 2: Password */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.05 }}
                  className="space-y-1.5"
                >
                  <Label className="text-xs font-semibold">Password</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyUp}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-10 text-sm rounded-lg border transition-all duration-300 focus:border-primary focus:shadow-md focus:shadow-primary/10"
                      autoComplete="current-password"
                      disabled={isLoading}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Caps Lock Warning */}
                  <AnimatePresence>
                    {capsLockOn && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500 text-[10px] pt-1"
                      >
                        <AlertTriangle className="h-3 w-3" />
                        <span>Caps Lock is ON</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Step 3: License Key */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="space-y-1.5"
                >
                  <Label className="text-xs font-semibold">License Key</Label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <Input
                      type={showLicenseKey ? 'text' : 'password'}
                      value={licenseKey}
                      onChange={handleLicenseKeyChange}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="pl-10 pr-28 h-10 text-sm font-mono tracking-wide rounded-lg border transition-all duration-300 focus:border-primary focus:shadow-md focus:shadow-primary/10"
                      disabled={isLoading}
                      required
                      maxLength={19}
                      autoComplete="off"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <ValidationIcon valid={licenseKeyValid} isValidating={false} />
                      
                      {/* Paste button */}
                      <motion.button
                        type="button"
                        onClick={handlePasteLicense}
                        className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        title="Paste license key"
                      >
                        {licensePasted ? (
                          <ClipboardCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <Clipboard className="h-4 w-4" />
                        )}
                      </motion.button>
                      
                      <button
                        type="button"
                        onClick={() => setShowLicenseKey(!showLicenseKey)}
                        className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                      >
                        {showLicenseKey ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* License key helper links */}
                  <div className="flex justify-between items-center pt-0.5">
                    <p className="text-[10px] text-muted-foreground">
                      Need a license key?{' '}
                      <Link href="/pricing" className="text-primary hover:underline font-semibold">
                        Get one here
                      </Link>
                    </p>
                  </div>
                </motion.div>

                {/* Remember me */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.15 }}
                  className="flex items-center gap-2 pt-1"
                >
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-xs cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Keep me signed in for 30 days
                  </Label>
                </motion.div>

                {/* Submit button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                  className="pt-2"
                >
                  <Button
                    type="submit"
                    className="w-full h-10 text-sm font-semibold bg-gradient-to-r from-primary via-purple-600 to-primary hover:from-primary/90 hover:via-purple-700 hover:to-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 rounded-lg"
                    disabled={isLoading}
                    style={{ backgroundSize: '200% auto' }}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Authenticating...
                      </>
                    ) : (
                      <>
                        Sign In Securely
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              </form>

              {/* Footer - Enhanced with navigation */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-5 pt-4 border-t border-border/50 space-y-3"
              >
                <p className="text-xs text-muted-foreground text-center">
                  New to 9TD?{' '}
                  <button
                    onClick={() => router.push('/register')}
                    className="text-primary hover:underline font-semibold transition-colors"
                  >
                    Create an account
                  </button>
                </p>
                
                {/* Mobile Quick Links */}
                <div className="md:hidden flex flex-wrap justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/')}
                    className="gap-1.5 text-xs h-8"
                  >
                    <Home className="h-3 w-3" />
                    Home
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/pricing')}
                    className="gap-1.5 text-xs h-8"
                  >
                    <KeyRound className="h-3 w-3" />
                    Get License
                  </Button>
                </div>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}