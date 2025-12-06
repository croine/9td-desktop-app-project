"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { toast } from 'sonner'
import { Loader2, Mail, CheckCircle2, AlertCircle, Home, LogOut } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function VerifyEmailPendingPage() {
  const router = useRouter()
  const { data: session, isPending: sessionPending, refetch } = useSession()
  const [isResending, setIsResending] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    if (!sessionPending && !session?.user) {
      router.push('/login')
      return
    }

    if (session?.user?.emailVerified) {
      router.push('/')
      return
    }
  }, [session, sessionPending, router])

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const handleResendVerification = async () => {
    if (!session?.user?.email) {
      toast.error('Email not found. Please sign in again.')
      return
    }

    setIsResending(true)
    try {
      const response = await fetch(`/api/verify-email?email=${encodeURIComponent(session.user.email)}`)
      const data = await response.json()

      if (response.ok) {
        toast.success('Verification email sent!', {
          description: 'Please check your inbox and spam folder'
        })
        setResendCooldown(60) // 60 second cooldown
      } else {
        toast.error(data.error || 'Failed to send verification email')
      }
    } catch (error) {
      console.error('Resend error:', error)
      toast.error('Failed to send verification email. Please try again.')
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    try {
      await authClient.signOut()
      localStorage.removeItem('bearer_token')
      await refetch()
      toast.success('Signed out successfully')
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error('Failed to sign out')
      setIsSigningOut(false)
    }
  }

  const handleCheckVerification = async () => {
    await refetch()
    if (session?.user?.emailVerified) {
      toast.success('Email verified!', {
        description: 'Redirecting to dashboard...'
      })
      router.push('/')
    } else {
      toast.info('Email not verified yet', {
        description: 'Please check your inbox and click the verification link'
      })
    }
  }

  if (sessionPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!session?.user) {
    return null
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
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              disabled={isSigningOut}
            >
              {isSigningOut ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 pt-24 pb-12 flex items-center justify-center min-h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg"
        >
          <Card className="glass-card p-8">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950/20 flex items-center justify-center">
                  <Mail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </div>

              {/* Title and Description */}
              <div className="space-y-3">
                <h1 className="font-display text-3xl font-bold">
                  Verify Your Email
                </h1>
                <p className="text-muted-foreground text-lg">
                  We've sent a verification email to:
                </p>
                <p className="font-semibold text-lg">
                  {session.user.email}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3 text-left">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    Click the verification link in your email to activate your account
                  </p>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    Check your spam folder if you don't see it in your inbox
                  </p>
                </div>
                <div className="flex items-start gap-3 text-left">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-foreground">
                    The verification link expires in 1 hour
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button
                  onClick={handleCheckVerification}
                  className="w-full gap-2"
                  variant="default"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  I've Verified My Email
                </Button>

                <Button
                  onClick={handleResendVerification}
                  disabled={isResending || resendCooldown > 0}
                  className="w-full gap-2"
                  variant="outline"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <Mail className="h-4 w-4" />
                      Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      Resend Verification Email
                    </>
                  )}
                </Button>
              </div>

              {/* Help Text */}
              <div className="pt-4 space-y-2">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>Wrong email address?</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="text-sm"
                >
                  Sign out and register again
                </Button>
              </div>
            </div>
          </Card>

          {/* Footer Help */}
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
