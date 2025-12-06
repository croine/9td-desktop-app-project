"use client"

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, Mail, ArrowRight, Home } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired'

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<VerificationStatus>('loading')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(5)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token found. Please check your email for the correct link.')
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        })

        const data = await response.json()

        if (!response.ok) {
          if (data.error.includes('expired')) {
            setStatus('expired')
            setMessage('Your verification link has expired. Please request a new one.')
          } else {
            setStatus('error')
            setMessage(data.error || 'Email verification failed. Please try again.')
          }
          return
        }

        setStatus('success')
        setMessage('Email verified successfully!')
        toast.success('Email verified!', {
          description: 'You can now sign in to your account'
        })

        // Start countdown and redirect
        let timeLeft = 5
        const countdownInterval = setInterval(() => {
          timeLeft--
          setCountdown(timeLeft)
          
          if (timeLeft <= 0) {
            clearInterval(countdownInterval)
            router.push('/login?verified=true')
          }
        }, 1000)

        return () => clearInterval(countdownInterval)
      } catch (error) {
        console.error('Verification error:', error)
        setStatus('error')
        setMessage('An unexpected error occurred. Please try again.')
      }
    }

    verifyEmail()
  }, [token, router])

  const handleResendVerification = async () => {
    // For resending, we'd need the email - in production, you might want to
    // ask the user to enter their email or store it in the URL
    toast.info('Please return to the registration page to request a new verification email')
    setTimeout(() => router.push('/register'), 2000)
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
            
            <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
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
          <Card className="glass-card p-8">
            {status === 'loading' && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold">
                    Verifying Email
                  </h1>
                  <p className="text-muted-foreground">
                    Please wait while we verify your email address...
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="flex justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/20 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </motion.div>
                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold text-green-600 dark:text-green-400">
                    Email Verified!
                  </h1>
                  <p className="text-muted-foreground">
                    {message}
                  </p>
                  <p className="text-sm text-muted-foreground pt-4">
                    Redirecting to login in <span className="font-semibold text-primary">{countdown}</span> seconds...
                  </p>
                </div>
                <Button
                  onClick={() => router.push('/login?verified=true')}
                  className="w-full gap-2"
                >
                  Continue to Login
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/20 flex items-center justify-center">
                    <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold text-red-600 dark:text-red-400">
                    Verification Failed
                  </h1>
                  <p className="text-muted-foreground">
                    {message}
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/register')}
                    className="w-full gap-2"
                  >
                    Back to Registration
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Go to Login
                  </Button>
                </div>
              </div>
            )}

            {status === 'expired' && (
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-950/20 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h1 className="font-display text-2xl font-bold text-orange-600 dark:text-orange-400">
                    Link Expired
                  </h1>
                  <p className="text-muted-foreground">
                    {message}
                  </p>
                </div>
                <div className="space-y-3">
                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    className="w-full gap-2"
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Redirecting...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4" />
                        Request New Link
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/login')}
                    className="w-full"
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Help Text */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Need help? Contact us at{' '}
            <a href="mailto:support@9td.app" className="text-primary hover:underline">
              support@9td.app
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
