"use client"

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Check, Loader2, Sparkles, Key, AlertCircle, Shield, Zap } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LicenseKeyInputProps {
  onVerify: (key: string) => Promise<{ valid: boolean; reason?: string }>
  onKeyChange?: (key: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export function LicenseKeyInput({ 
  onVerify, 
  onKeyChange,
  disabled = false,
  autoFocus = true 
}: LicenseKeyInputProps) {
  const [segments, setSegments] = useState<string[]>(['', '', '', ''])
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  
  // Enhanced particle animation state
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number }>>([])
  const [scanLinePosition, setScanLinePosition] = useState(0)

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  useEffect(() => {
    if (isVerifying) {
      const interval = setInterval(() => {
        setScanLinePosition(prev => (prev >= 100 ? 0 : prev + 5))
      }, 50)
      return () => clearInterval(interval)
    } else {
      setScanLinePosition(0)
    }
  }, [isVerifying])

  const handleSegmentChange = async (index: number, value: string) => {
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9!@#$%^&*]/g, '')
    
    if (sanitized.length <= 4) {
      const newSegments = [...segments]
      newSegments[index] = sanitized
      setSegments(newSegments)
      
      if (verificationStatus !== 'idle') {
        setVerificationStatus('idle')
        setErrorMessage('')
      }
      
      const fullKey = newSegments.join('-')
      onKeyChange?.(fullKey)
      
      if (sanitized.length === 4 && index < 3) {
        inputRefs.current[index + 1]?.focus()
      }
      
      if (index === 3 && sanitized.length === 4) {
        const allFilled = newSegments.every(seg => seg.length === 4)
        if (allFilled) {
          await verifyKey(newSegments.join('-'))
        }
      }
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && segments[index] === '' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }
    
    if (e.key === '-' && index < 3) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
    
    if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    
    const cleanText = pastedText.toUpperCase().replace(/[^A-Z0-9!@#$%^&*-]/g, '')
    const parts = cleanText.split('-').filter(p => p.length > 0)
    
    if (parts.length === 4 && parts.every(p => p.length === 4)) {
      setSegments(parts)
      onKeyChange?.(parts.join('-'))
      verifyKey(parts.join('-'))
    }
  }

  const verifyKey = async (fullKey: string) => {
    setIsVerifying(true)
    setVerificationStatus('idle')
    setErrorMessage('')
    
    createEnhancedParticleBurst()
    
    try {
      const result = await onVerify(fullKey)
      
      if (result.valid) {
        setVerificationStatus('valid')
        createSuccessParticles()
      } else {
        setVerificationStatus('invalid')
        setErrorMessage(result.reason || 'Invalid license key')
      }
    } catch (error) {
      setVerificationStatus('invalid')
      setErrorMessage('Failed to verify license key')
    } finally {
      setIsVerifying(false)
    }
  }

  const createEnhancedParticleBurst = () => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b']
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 120 - 60,
      y: Math.random() * 120 - 60,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 3 + 1,
    }))
    setParticles(newParticles)
    
    setTimeout(() => setParticles([]), 1200)
  }

  const createSuccessParticles = () => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: Date.now() + i + 1000,
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      color: '#22c55e',
      size: Math.random() * 4 + 2,
    }))
    setParticles(prev => [...prev, ...newParticles])
    
    setTimeout(() => setParticles([]), 2000)
  }

  const getSegmentStyle = (index: number) => {
    const baseStyle = 'relative transition-all duration-300'
    
    if (verificationStatus === 'valid') {
      return `${baseStyle} border-green-500 bg-gradient-to-br from-green-500/20 to-emerald-500/20 ring-2 ring-green-500/50 shadow-lg shadow-green-500/30`
    }
    if (verificationStatus === 'invalid') {
      return `${baseStyle} border-red-500 bg-gradient-to-br from-red-500/20 to-rose-500/20 ring-2 ring-red-500/50 shadow-lg shadow-red-500/30 animate-shake`
    }
    if (segments[index].length === 4) {
      return `${baseStyle} border-blue-500 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 ring-2 ring-blue-500/30 shadow-md shadow-blue-500/20`
    }
    return `${baseStyle} border-border hover:border-primary/50`
  }

  const isComplete = segments.every(seg => seg.length === 4)

  return (
    <div className="space-y-4">
      {/* Futuristic Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-xl animate-pulse-smooth" />
        <div className="relative glass-card p-3 sm:p-4 rounded-xl border-2 border-primary/20">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="relative">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary animate-pulse-smooth" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <Zap className="h-2 w-2 text-yellow-500 absolute -top-1 -right-1" />
              </motion.div>
            </div>
            <div className="text-center">
              <h3 className="font-display font-bold text-sm sm:text-base bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                SECURE LICENSE AUTHENTICATION
              </h3>
              <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 font-mono">
                NEURAL VERIFICATION SYSTEM • AES-256 ENCRYPTED
              </p>
            </div>
          </div>

          {/* Key Input Area - COMPACT */}
          <div className="relative py-3 sm:py-4">
            {/* Holographic background layers */}
            <AnimatePresence>
              {verificationStatus === 'valid' && (
                <>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 -z-10"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/30 via-emerald-500/30 to-green-500/30 blur-2xl animate-pulse" />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    className="absolute inset-0 -z-10"
                    style={{
                      backgroundImage: 'linear-gradient(#22c55e 1px, transparent 1px), linear-gradient(90deg, #22c55e 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}
                  />
                </>
              )}
            </AnimatePresence>

            {isVerifying && (
              <motion.div
                className="absolute inset-0 pointer-events-none z-10"
                style={{ overflow: 'hidden' }}
              >
                <motion.div
                  className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
                  style={{ 
                    position: 'absolute',
                    top: `${scanLinePosition}%`,
                    boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)'
                  }}
                />
              </motion.div>
            )}
            
            {/* Key input segments - SMALLER SIZES */}
            <div className="flex flex-wrap sm:flex-nowrap gap-1 sm:gap-1.5 items-center justify-center relative">
              {/* Enhanced particle effects */}
              <AnimatePresence>
                {particles.map(particle => (
                  <motion.div
                    key={particle.id}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    animate={{ 
                      opacity: 0, 
                      x: particle.x, 
                      y: particle.y, 
                      scale: 0,
                      rotate: Math.random() * 360
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="absolute left-1/2 top-1/2 rounded-full pointer-events-none"
                    style={{ 
                      width: particle.size,
                      height: particle.size,
                      backgroundColor: particle.color,
                      boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
                    }}
                  />
                ))}
              </AnimatePresence>
              
              {segments.map((segment, index) => (
                <div key={index} className="flex items-center gap-1 sm:gap-1.5">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                    className="relative group"
                  >
                    {/* Glow effect background */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity duration-300" />
                    
                    <Input
                      ref={el => inputRefs.current[index] = el}
                      type="text"
                      value={segment}
                      onChange={(e) => handleSegmentChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={handlePaste}
                      disabled={disabled || isVerifying}
                      maxLength={4}
                      className={`
                        relative w-14 h-10 sm:w-16 sm:h-12 text-center text-sm sm:text-base font-mono font-extrabold
                        uppercase tracking-wider backdrop-blur-md
                        ${getSegmentStyle(index)}
                        focus:ring-4 focus:ring-primary/50 focus:border-primary focus:scale-105
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                      placeholder="••••"
                    />
                    
                    {/* Corner accents - tiny */}
                    <div className="absolute -top-0.5 -left-0.5 w-1 h-1 border-t-2 border-l-2 border-primary/50 rounded-tl" />
                    <div className="absolute -top-0.5 -right-0.5 w-1 h-1 border-t-2 border-r-2 border-primary/50 rounded-tr" />
                    <div className="absolute -bottom-0.5 -left-0.5 w-1 h-1 border-b-2 border-l-2 border-primary/50 rounded-bl" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-1 h-1 border-b-2 border-r-2 border-primary/50 rounded-br" />
                    
                    {/* Holographic shine effect */}
                    {segment.length === 4 && verificationStatus === 'idle' && (
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '200%' }}
                        transition={{ 
                          duration: 1.5, 
                          repeat: Infinity, 
                          repeatDelay: 2 
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none rounded"
                        style={{ transform: 'skewX(-20deg)' }}
                      />
                    )}

                    {/* Segment completion indicator */}
                    {segment.length === 4 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full"
                      />
                    )}
                  </motion.div>
                  
                  {index < 3 && (
                    <motion.span 
                      className="text-muted-foreground/50 font-bold text-base sm:text-lg font-mono"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      ━
                    </motion.span>
                  )}
                </div>
              ))}
              
              {/* Verification status indicator - compact */}
              <AnimatePresence mode="wait">
                {isVerifying && (
                  <motion.div
                    key="verifying"
                    initial={{ scale: 0, opacity: 0, rotate: -180 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0, opacity: 0, rotate: 180 }}
                    className="ml-1.5 sm:ml-2"
                  >
                    <div className="relative">
                      <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin text-primary" />
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary"
                      />
                    </div>
                  </motion.div>
                )}
                
                {verificationStatus === 'valid' && !isVerifying && (
                  <motion.div
                    key="valid"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    className="ml-1.5 sm:ml-2"
                  >
                    <div className="relative">
                      <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 drop-shadow-lg" />
                      <motion.div
                        initial={{ scale: 1, opacity: 1 }}
                        animate={{ scale: 3, opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 rounded-full bg-green-500"
                      />
                    </div>
                  </motion.div>
                )}
                
                {verificationStatus === 'invalid' && !isVerifying && (
                  <motion.div
                    key="invalid"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    className="ml-1.5 sm:ml-2"
                  >
                    <motion.div
                      animate={{ rotate: [0, -10, 10, -10, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500 drop-shadow-lg" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          
          {/* Status Messages - compact */}
          <div className="min-h-[40px] sm:min-h-[50px] flex items-center justify-center px-2">
            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-card border-red-500/50 bg-red-500/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg"
                >
                  <p className="text-[10px] sm:text-xs text-red-500 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span className="break-words">{errorMessage}</span>
                  </p>
                </motion.div>
              )}
              
              {verificationStatus === 'valid' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  className="glass-card border-green-500/50 bg-green-500/10 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg"
                >
                  <p className="text-[10px] sm:text-xs text-green-500 flex items-center gap-1.5 font-semibold">
                    <Sparkles className="h-3 w-3 animate-pulse flex-shrink-0" />
                    <span className="break-words">AUTHENTICATION SUCCESSFUL</span>
                  </p>
                </motion.div>
              )}

              {verificationStatus === 'idle' && !errorMessage && (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-[9px] sm:text-[10px] text-muted-foreground text-center font-mono px-2"
                >
                  Enter 16-character key: XXXX-XXXX-XXXX-XXXX
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}