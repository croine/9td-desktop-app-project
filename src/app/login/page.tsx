"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { 
  Mail, Lock, Key, Eye, EyeOff, ArrowRight, 
  Shield, Sparkles, CheckCircle2, AlertCircle,
  User, Loader2
} from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

type SignInMethod = 'email' | 'username'

export default function LoginPage() {
  const router = useRouter()
  const [signInMethod, setSignInMethod] = useState<SignInMethod>('email')
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

  // Validate email format
  useEffect(() => {
    if (!email) {
      setEmailValid(null)
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setEmailValid(emailRegex.test(email))
  }, [email])

  // Validate username format
  useEffect(() => {
    if (!username) {
      setUsernameValid(null)
      return
    }
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
    setUsernameValid(usernameRegex.test(username))
  }, [username])

  // Validate password
  useEffect(() => {
    if (!password) {
      setPasswordValid(null)
      return
    }
    setPasswordValid(password.length >= 6)
  }, [password])

  // Validate license key
  useEffect(() => {
    if (!licenseKey) {
      setLicenseKeyValid(null)
      return
    }
    // Remove dashes and check length
    const cleanKey = licenseKey.replace(/-/g, '')
    setLicenseKeyValid(cleanKey.length === 16)
  }, [licenseKey])

  // Auto-format license key
  const handleLicenseKeyChange = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    
    // Add dashes every 4 characters
    let formatted = ''
    for (let i = 0; i < cleaned.length && i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += '-'
      }
      formatted += cleaned[i]
    }
    
    setLicenseKey(formatted)
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate all fields
    if (signInMethod === 'email' && !emailValid) {
      toast.error('Please enter a valid email address')
      return
    }
    
    if (signInMethod === 'username' && !usernameValid) {
      toast.error('Please enter a valid username')
      return
    }
    
    if (!passwordValid) {
      toast.error('Password must be at least 6 characters')
      return
    }
    
    if (!licenseKeyValid) {
      toast.error('Please enter a valid 16-character license key')
      return
    }

    setIsLoading(true)

    try {
      const cleanLicenseKey = licenseKey.replace(/-/g, '')
      
      const response = await fetch('/api/auth/signin-multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: signInMethod,
          email: signInMethod === 'email' ? email : undefined,
          username: signInMethod === 'username' ? username : undefined,
          password,
          license_key: cleanLicenseKey,
          rememberMe
        })
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Sign in failed')
        setIsLoading(false)
        return
      }

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
      toast.error('An error occurred during sign in')
      setIsLoading(false)
    }
  }

  const getFieldIcon = (isValid: boolean | null) => {
    if (isValid === null) return null
    if (isValid) return <CheckCircle2 className="h-4 w-4 text-green-500" />
    return <AlertCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 left-20 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-64 h-64 bg-blue-300/10 rounded-full blur-2xl"
          animate={{
            x: [-32, 32, -32],
            y: [-32, 32, -32],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo & Title */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-4 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="font-display text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-muted-foreground">
              Sign in to access your 9TD dashboard
            </p>
          </motion.div>

          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <Card className="glass-card p-8 shadow-2xl border-2 border-blue-100 dark:border-blue-900/50">
              {/* Method Selector */}
              <div className="flex gap-2 mb-6 p-1 bg-muted/50 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSignInMethod('email')}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    signInMethod === 'email'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => setSignInMethod('username')}
                  className={`flex-1 py-2.5 px-4 rounded-md font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                    signInMethod === 'username'
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                      : 'text-foreground/70 hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <User className="h-4 w-4" />
                  Username
                </button>
              </div>

              <form onSubmit={handleSignIn} className="space-y-5">
                {/* Email or Username Field */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={signInMethod}
                    initial={{ opacity: 0, x: signInMethod === 'email' ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: signInMethod === 'email' ? 20 : -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold">
                        1
                      </span>
                      {signInMethod === 'email' ? 'Email Address' : 'Username'}
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {signInMethod === 'email' ? <Mail className="h-5 w-5" /> : <User className="h-5 w-5" />}
                      </div>
                      <Input
                        type={signInMethod === 'email' ? 'email' : 'text'}
                        placeholder={signInMethod === 'email' ? 'you@example.com' : 'your_username'}
                        value={signInMethod === 'email' ? email : username}
                        onChange={(e) => signInMethod === 'email' ? setEmail(e.target.value) : setUsername(e.target.value)}
                        className="pl-11 pr-10 h-12 border-2 focus:border-blue-500 transition-all duration-300"
                        required
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {signInMethod === 'email' ? getFieldIcon(emailValid) : getFieldIcon(usernameValid)}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Password Field */}
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold">
                      2
                    </span>
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Lock className="h-5 w-5" />
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-11 pr-10 h-12 border-2 focus:border-blue-500 transition-all duration-300"
                      autoComplete="off"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* License Key Field */}
                <div>
                  <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-bold">
                      3
                    </span>
                    License Key
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <Key className="h-5 w-5" />
                    </div>
                    <Input
                      type="text"
                      placeholder="XXXX-XXXX-XXXX-XXXX"
                      value={licenseKey}
                      onChange={(e) => handleLicenseKeyChange(e.target.value)}
                      className="pl-11 pr-10 h-12 border-2 focus:border-blue-500 transition-all duration-300 font-mono tracking-wider"
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getFieldIcon(licenseKeyValid)}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Enter the 16-character key sent to your email
                  </p>
                </div>

                {/* Remember Me */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm font-medium cursor-pointer">
                    Remember me for 30 days
                  </Label>
                </div>

                {/* Submit Button */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/60 transition-all duration-300"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In Securely
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Security Badge */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span>Three-factor authentication enabled</span>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Register Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-center mt-6"
          >
            <Card className="glass-card p-4 border border-blue-100 dark:border-blue-900/50">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link 
                  href="/register" 
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors inline-flex items-center gap-1 group"
                >
                  Create one now
                  <Sparkles className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                </Link>
              </p>
            </Card>
          </motion.div>

          {/* Features Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-8 grid grid-cols-3 gap-4 text-center"
          >
            {[
              { icon: Shield, label: 'Secure' },
              { icon: Sparkles, label: 'Advanced' },
              { icon: CheckCircle2, label: 'Verified' }
            ].map((feature, index) => (
              <motion.div
                key={feature.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1, duration: 0.3 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{feature.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}