"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, Mail, User, Loader2, CheckCircle2, Copy, CheckCheck, ArrowRight, CreditCard } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

export function LicenseKeyPurchase() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [purchasedKey, setPurchasedKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !name) {
      toast.error('Please fill in all fields')
      return
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address')
      return
    }

    setIsLoading(true)

    try {
      // Create Stripe checkout session for license key purchase
      const response = await fetch('/api/license-keys/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          name,
          returnUrl: `${window.location.origin}/pricing?tab=license&success=true`
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to create checkout session')
        setIsLoading(false)
        return
      }

      // Redirect to Stripe checkout
      if (data.checkoutUrl) {
        // Handle iframe compatibility
        const isInIframe = window.self !== window.top
        if (isInIframe) {
          window.parent.postMessage({ 
            type: "OPEN_EXTERNAL_URL", 
            data: { url: data.checkoutUrl } 
          }, "*")
          toast.success('Opening Stripe checkout in new tab...')
        } else {
          window.location.href = data.checkoutUrl
        }
      } else {
        toast.error('Failed to get checkout URL')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error('Something went wrong. Please try again.')
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (purchasedKey) {
      await navigator.clipboard.writeText(purchasedKey)
      setCopied(true)
      toast.success('License key copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleReset = () => {
    setPurchasedKey(null)
    setCopied(false)
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!purchasedKey ? (
          <motion.div
            key="purchase-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card p-8 shadow-xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 mb-4 shadow-lg">
                  <KeyRound className="h-8 w-8 text-white" />
                </div>
                <h2 className="font-display text-3xl font-bold mb-3">
                  Purchase License Key
                </h2>
                <p className="text-muted-foreground text-lg">
                  Get instant access to all premium features with a one-time license key
                </p>
                
                {/* Price Display */}
                <div className="mt-6 inline-flex items-baseline gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20">
                  <span className="text-4xl font-bold">$49</span>
                  <span className="text-muted-foreground">one-time</span>
                </div>
              </div>

              <form onSubmit={handlePurchase} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      className="pl-10 h-12 text-base"
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-10 h-12 text-base"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your license key will be sent to this email after payment
                  </p>
                </div>

                <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg p-6 border border-primary/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    What's Included
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Instant license key delivery via email after payment
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Valid for 7 days from purchase
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      One-time activation per key
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Step-by-step activation guide included
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Full access to premium features
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Secure payment via Stripe
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <strong>Secure Payment:</strong> All transactions are processed securely through Stripe with 256-bit SSL encryption.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary via-purple-600 to-primary hover:from-primary/90 hover:via-purple-700 hover:to-primary/90 shadow-lg shadow-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Redirecting to Checkout...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5 mr-2" />
                      Proceed to Checkout
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  By purchasing, you agree to our Terms of Service and Privacy Policy
                </p>
              </form>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="success-message"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="glass-card p-8 shadow-xl border-2 border-green-500/20">
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 500, 
                    damping: 30,
                    delay: 0.1 
                  }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-6 shadow-lg"
                >
                  <CheckCircle2 className="h-10 w-10 text-white" />
                </motion.div>
                <h2 className="font-display text-3xl font-bold mb-3">
                  License Key Generated! 🎉
                </h2>
                <p className="text-muted-foreground text-lg">
                  Your license key has been sent to your email
                </p>
              </div>

              <div className="bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-lg p-6 border-2 border-primary/30 mb-6">
                <Label className="text-sm font-semibold text-muted-foreground mb-3 block uppercase tracking-wide">
                  Your License Key
                </Label>
                <div className="bg-card border-2 border-border rounded-lg p-4 mb-4 relative group">
                  <p className="font-mono text-2xl font-bold text-center tracking-wider break-all">
                    {purchasedKey}
                  </p>
                  <Button
                    onClick={handleCopy}
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {copied ? (
                      <CheckCheck className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="h-4 w-4 mr-2 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy License Key
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-blue-600" />
                    Check Your Email
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We've sent detailed activation instructions to your email address. Please check your inbox (and spam folder) for the email.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-muted to-muted/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-3">Next Steps:</h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <span>Copy your license key from above</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <span>Go to the login page or register if you don't have an account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <span>Enter your email, password, and paste the license key</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        4
                      </span>
                      <span>Activate and enjoy all premium features!</span>
                    </li>
                  </ol>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-purple-600"
                >
                  Go to Login
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="h-12"
                >
                  Purchase Another
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}