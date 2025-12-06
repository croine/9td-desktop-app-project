"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { Mail, User, Lock, KeyRound, Eye, EyeOff, Shield, Fingerprint, Cpu, CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

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
  const [isLoading, setIsLoading] = useState(false)
  
  // Validation states
  const [emailValid, setEmailValid] = useState<boolean | null>(null)
  const [usernameValid, setUsernameValid] = useState<boolean | null>(null)
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null)
  const [licenseKeyValid, setLicenseKeyValid] = useState<boolean | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  // Current authentication step (1, 2, 3)
  const [currentStep, setCurrentStep] = useState(1)

  // Holographic grid canvas
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [particles, setParticles] = useState<Array<{ x: number; y: number; vx: number; vy: number }>>([])

  // Initialize holographic grid background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Create grid particles
    const newParticles = []
    for (let i = 0; i < 80; i++) {
      newParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      })
    }
    setParticles(newParticles)

    let animationId: number

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw grid lines
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.05)'
      ctx.lineWidth = 1
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i < canvas.height; i += 50) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      // Update and draw particles
      newParticles.forEach((particle, i) => {
        particle.x += particle.vx
        particle.y += particle.vy

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // Draw particle
        ctx.fillStyle = 'rgba(59, 130, 246, 0.4)'
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2)
        ctx.fill()

        // Draw connections
        newParticles.forEach((otherParticle, j) => {
          if (i !== j) {
            const dx = particle.x - otherParticle.x
            const dy = particle.y - otherParticle.y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < 120) {
              ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - distance / 120)})`
              ctx.lineWidth = 1
              ctx.beginPath()
              ctx.moveTo(particle.x, particle.y)
              ctx.lineTo(otherParticle.x, otherParticle.y)
              ctx.stroke()
            }
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
    }
  }, [])

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

  // Real-time validation
  useEffect(() => {
    const validateEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }

    if (authMethod === 'email' && email.length > 0) {
      setIsValidating(true)
      const timer = setTimeout(() => {
        setEmailValid(validateEmail(email))
        setIsValidating(false)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setEmailValid(null)
    }
  }, [email, authMethod])

  useEffect(() => {
    const validateUsername = (username: string) => {
      return /^[a-zA-Z0-9_-]{3,20}$/.test(username)
    }

    if (authMethod === 'username' && username.length > 0) {
      setIsValidating(true)
      const timer = setTimeout(() => {
        setUsernameValid(validateUsername(username))
        setIsValidating(false)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setUsernameValid(null)
    }
  }, [username, authMethod])

  useEffect(() => {
    if (password.length > 0) {
      setPasswordValid(password.length >= 6)
    } else {
      setPasswordValid(null)
    }
  }, [password])

  useEffect(() => {
    const formatted = licenseKey.replace(/[^A-Z0-9]/gi, '').toUpperCase()
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isLoading) return

    const identifierValid = authMethod === 'email' ? emailValid : usernameValid
    if (!identifierValid || !passwordValid || !licenseKeyValid) {
      toast.error('Please fill all fields correctly')
      return
    }

    setIsLoading(true)

    try {
      const { data, error } = await authClient.signIn.email({
        email: authMethod === 'email' ? email : username,
        password,
        rememberMe,
        callbackURL: '/'
      })

      if (error?.code) {
        toast.error('Invalid credentials. Please check your email, password, and license key.')
        setIsLoading(false)
        return
      }

      const licenseResponse = await fetch('/api/auth/signin-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: authMethod,
          identifier: authMethod === 'email' ? email : username,
          password,
          licenseKey: licenseKey.replace(/-/g, ''),
          rememberMe
        })
      })

      const licenseData = await licenseResponse.json()

      if (!licenseResponse.ok) {
        toast.error(licenseData.error || 'License key verification failed')
        setIsLoading(false)
        return
      }

      toast.success('Welcome back! 🎉')
      setTimeout(() => {
        router.push('/')
      }, 500)
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error('Something went wrong. Please try again.')
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
        animate={isActive ? { scale: [1, 1.03, 1] } : {}}
        transition={{ duration: 2, repeat: isActive ? Infinity : 0 }}
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
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full border border-primary"
            animate={{ scale: [1, 1.4], opacity: [1, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>
      <span className={`text-[10px] font-medium transition-colors ${isActive || isComplete ? 'text-foreground' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </motion.div>
  )

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-background">
      {/* Holographic grid background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full opacity-40"
      />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent" />

      {/* Main content container */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6 items-center">
          {/* Left side - Branding and features */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo and title */}
            <div>
              <motion.div
                className="mb-4"
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
                      placeholder="••••••••"
                      className="pl-10 pr-20 h-10 text-sm rounded-lg border transition-all duration-300 focus:border-primary focus:shadow-md focus:shadow-primary/10"
                      autoComplete="off"
                      disabled={isLoading}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <ValidationIcon valid={passwordValid} isValidating={false} />
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
                      type="text"
                      value={licenseKey}
                      onChange={handleLicenseKeyChange}
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      className="pl-10 pr-10 h-10 text-sm font-mono tracking-wide rounded-lg border transition-all duration-300 focus:border-primary focus:shadow-md focus:shadow-primary/10"
                      disabled={isLoading}
                      required
                      maxLength={19}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <ValidationIcon valid={licenseKeyValid} isValidating={false} />
                    </div>
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

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mt-5 pt-4 border-t border-border/50 text-center"
              >
                <p className="text-xs text-muted-foreground">
                  New to 9TD?{' '}
                  <button
                    onClick={() => router.push('/register')}
                    className="text-primary hover:underline font-semibold transition-colors"
                  >
                    Create an account
                  </button>
                </p>
              </motion.div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  )
}