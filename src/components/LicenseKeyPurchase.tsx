"use client"

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { KeyRound, Mail, User, Loader2, CheckCircle2, Copy, CheckCheck, ArrowRight, CreditCard, Zap, Shield, Lock, Clock, Infinity, Sparkles, Star, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

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
    <div className="w-full max-w-7xl mx-auto">
      <AnimatePresence mode="wait">
        {!purchasedKey ? (
          <motion.div
            key="purchase-form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Hero Section */}
            <div className="text-center mb-16 space-y-6">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <Infinity className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">LIFETIME ACCESS</span>
              </div>
              
              <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                  One Payment.
                </span>
                <br />
                <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Yours Forever.
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
                Skip the subscription. Own your productivity software with a single payment.
              </p>
            </div>

            {/* Main License Card */}
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Left: Pricing & Features */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 rounded-3xl blur-2xl opacity-60 group-hover:opacity-80 transition-opacity" />
                <Card className="relative p-10 rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-50/90 via-teal-50/90 to-cyan-50/90 dark:from-emerald-950/90 dark:via-teal-950/90 dark:to-cyan-950/90 backdrop-blur-xl overflow-hidden shadow-2xl">
                  {/* Special Badge */}
                  <div className="absolute -top-1 -right-1 px-5 py-2 rounded-bl-2xl rounded-tr-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    LIMITED OFFER
                  </div>

                  {/* Decorative pattern */}
                  <div className="absolute top-0 left-0 w-40 h-40 opacity-10">
                    <div className="grid grid-cols-5 gap-2 rotate-12">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
                      ))}
                    </div>
                  </div>

                  <div className="relative space-y-8">
                    {/* Icon & Title */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                          <KeyRound className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="font-display text-3xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                            Pro License
                          </h3>
                          <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                            Lifetime access • One-time payment
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="space-y-3">
                      <div className="flex items-baseline gap-3">
                        <span className="font-display text-6xl font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 bg-clip-text text-transparent">
                          $49
                        </span>
                        <div className="flex flex-col">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            one-time
                          </span>
                          <span className="text-sm text-emerald-500 dark:text-emerald-400 line-through">
                            $149 regular price
                          </span>
                        </div>
                      </div>
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30">
                        <Star className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                          Save $100 • 67% OFF Launch Discount
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-4 pt-6 border-t border-emerald-300 dark:border-emerald-800">
                      <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                        Everything Included:
                      </p>
                      <ul className="space-y-3">
                        {[
                          { text: "All Pro features unlocked", icon: <Zap className="h-4 w-4" /> },
                          { text: "Lifetime updates & support", icon: <Infinity className="h-4 w-4" /> },
                          { text: "No monthly fees ever", icon: <CheckCircle2 className="h-4 w-4" /> },
                          { text: "7-day money-back guarantee", icon: <Shield className="h-4 w-4" /> },
                          { text: "Instant email delivery", icon: <Mail className="h-4 w-4" /> },
                          { text: "Secure activation system", icon: <Lock className="h-4 w-4" /> },
                        ].map((feature) => (
                          <li key={feature.text} className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
                              {feature.icon}
                            </div>
                            <span className="text-sm text-emerald-900 dark:text-emerald-100 font-medium pt-0.5">
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Trust Badge */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 rounded-2xl p-5 border border-emerald-500/20">
                      <div className="flex items-start gap-3">
                        <Shield className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                            100% Secure Payment
                          </p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300 leading-relaxed">
                            All transactions are encrypted with 256-bit SSL and processed securely through Stripe. Your payment information is never stored on our servers.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right: Purchase Form */}
              <div className="relative space-y-6">
                <Card className="relative p-10 rounded-3xl border-2 border-border/50 bg-card/50 backdrop-blur-xl shadow-xl">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h2 className="font-display text-3xl font-bold">
                        Get Your License
                      </h2>
                      <p className="text-muted-foreground font-medium">
                        Enter your details to proceed to secure checkout
                      </p>
                    </div>

                    <form onSubmit={handlePurchase} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-semibold flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="John Doe"
                          className="h-12 text-base border-2 focus:border-emerald-500 transition-colors"
                          disabled={isLoading}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="h-12 text-base border-2 focus:border-emerald-500 transition-colors"
                          disabled={isLoading}
                          required
                        />
                        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-500/30 rounded-xl p-3 mt-2">
                          <p className="text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2 font-medium">
                            <Mail className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>
                              <strong className="font-bold">License key will be sent to this email</strong> immediately after payment. Please ensure it's correct and check your spam folder.
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-2xl p-6 border border-border/50">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                          What Happens Next
                        </h3>
                        <ol className="space-y-3">
                          {[
                            "Secure payment via Stripe ($49)",
                            "Instant license key delivery to your email",
                            "Activate in your account dashboard",
                            "Enjoy lifetime Pro access!"
                          ].map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm">
                              <span className="shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center text-xs font-bold">
                                {i + 1}
                              </span>
                              <span className="text-muted-foreground font-medium pt-0.5">
                                {step}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-14 text-base font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 text-white shadow-xl hover:shadow-2xl transition-all"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Opening Stripe Checkout...
                          </>
                        ) : (
                          <>
                            <Lock className="h-5 w-5 mr-2" />
                            Proceed to Secure Checkout
                            <ArrowRight className="h-5 w-5 ml-2" />
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-6 pt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <span>7-day refund</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <span>Instant delivery</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <span>Secure payment</span>
                        </div>
                      </div>
                    </form>
                  </div>
                </Card>

                {/* Payment Methods & Stripe Badge */}
                <Card className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-xl">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                        Accepted Payment Methods
                      </h3>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#635BFF]/10 border border-[#635BFF]/20">
                        <svg className="h-4 w-4" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.3 11.5c0-.7.6-1.2 1.4-1.2 1.2 0 2.8.4 4 1.1V8.5c-1.3-.5-2.6-.8-4-.8-3.3 0-5.5 1.7-5.5 4.6 0 4.5 6.2 3.8 6.2 5.7 0 .7-.7 1.3-1.6 1.3-1.4 0-3.2-.6-4.6-1.4v2.9c1.5.7 3 1 4.6 1 3.4 0 5.7-1.7 5.7-4.6-.1-4.8-6.2-4-6.2-5.7z" fill="#635BFF"/>
                        </svg>
                        <span className="text-xs font-bold text-[#635BFF]">Powered by Stripe</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                      {/* Credit Card Icons */}
                      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Visa</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Mastercard</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Amex</span>
                      </div>
                      <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                        <CreditCard className="h-5 w-5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">Discover</span>
                      </div>
                    </div>

                    <div className="pt-2 text-center">
                      <p className="text-xs text-muted-foreground">
                        All major credit cards and debit cards accepted. Secured by bank-level encryption.
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Email Guarantee Badge */}
                <Card className="p-6 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/50 dark:to-teal-950/50">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shrink-0">
                      <Mail className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-bold text-emerald-900 dark:text-emerald-100 flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Guaranteed Email Delivery
                      </p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 leading-relaxed">
                        Your license key will be automatically sent to your email <strong>within seconds</strong> of completing payment. We use reliable email infrastructure to ensure delivery.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <AlertCircle className="h-4 w-4 text-emerald-600" />
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          Don't see it? Check your spam/junk folder or contact support
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Comparison callout */}
                <Card className="p-6 rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/50 dark:to-orange-950/50">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                      <Star className="h-5 w-5 text-white" />
                    </div>
                    <div className="space-y-2">
                      <p className="font-semibold text-amber-900 dark:text-amber-100">
                        Compare: Pro Subscription vs License
                      </p>
                      <div className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        <p>• Pro Monthly: <span className="font-semibold">$12/month = $144/year</span></p>
                        <p>• Pro Annual: <span className="font-semibold">$115/year</span></p>
                        <p className="text-emerald-700 dark:text-emerald-300 font-bold">• License Key: $49 one-time 🎉</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="success-message"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="max-w-3xl mx-auto"
          >
            <Card className="glass-card p-10 shadow-2xl border-2 border-green-500/30 rounded-3xl">
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
                  className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 mb-6 shadow-2xl"
                >
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </motion.div>
                <h2 className="font-display text-4xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Payment Successful! 🎉
                </h2>
                <p className="text-xl text-muted-foreground">
                  Your license key has been sent to your email
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-950/80 dark:to-emerald-950/80 rounded-2xl p-8 border-2 border-green-500/30 mb-6">
                <Label className="text-sm font-bold text-green-700 dark:text-green-300 mb-4 block uppercase tracking-wider flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Your License Key
                </Label>
                <div className="bg-card border-2 border-green-500/30 rounded-xl p-6 mb-4 relative group">
                  <p className="font-mono text-2xl md:text-3xl font-bold text-center tracking-wider break-all bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {purchasedKey}
                  </p>
                  <Button
                    onClick={handleCopy}
                    variant="ghost"
                    size="sm"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
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
                  className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  {copied ? (
                    <>
                      <CheckCheck className="h-4 w-4 mr-2" />
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy License Key
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-4 mb-8">
                <div className="bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-500/30 rounded-2xl p-6">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <Mail className="h-5 w-5 text-blue-600" />
                    Check Your Email
                  </h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                    We've sent detailed activation instructions to your email address. Please check your inbox (and spam folder) for the email containing your license key and setup guide.
                  </p>
                </div>

                <div className="bg-gradient-to-br from-muted to-muted/50 rounded-2xl p-6 border border-border/50">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    How to Activate
                  </h3>
                  <ol className="space-y-3">
                    {[
                      { step: "Copy your license key from above", icon: <Copy className="h-4 w-4" /> },
                      { step: "Sign in or create an account", icon: <User className="h-4 w-4" /> },
                      { step: "Go to Settings → Account", icon: <KeyRound className="h-4 w-4" /> },
                      { step: "Paste and activate your license", icon: <CheckCircle2 className="h-4 w-4" /> },
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-white flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </span>
                        <div className="flex items-center gap-2 pt-1">
                          {item.icon}
                          <span className="text-sm font-medium">{item.step}</span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => window.location.href = '/login'}
                  className="flex-1 h-14 text-base font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 shadow-lg"
                >
                  Activate License Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="sm:w-auto h-14 border-2"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
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