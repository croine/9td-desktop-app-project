"use client"

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Check, Loader2, Sparkles, Key, AlertCircle } from 'lucide-react'
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
  
  // Particle animation state
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([])

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [autoFocus])

  const handleSegmentChange = async (index: number, value: string) => {
    // Only allow alphanumeric characters
    const sanitized = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    
    if (sanitized.length <= 4) {
      const newSegments = [...segments]
      newSegments[index] = sanitized
      setSegments(newSegments)
      
      // Reset verification status when user types
      if (verificationStatus !== 'idle') {
        setVerificationStatus('idle')
        setErrorMessage('')
      }
      
      // Notify parent of key change
      const fullKey = newSegments.join('-')
      onKeyChange?.(fullKey)
      
      // Auto-advance to next field when segment is complete
      if (sanitized.length === 4 && index < 3) {
        inputRefs.current[index + 1]?.focus()
      }
      
      // Auto-verify when all segments are complete
      if (index === 3 && sanitized.length === 4) {
        const allFilled = newSegments.every(seg => seg.length === 4)
        if (allFilled) {
          await verifyKey(newSegments.join('-'))
        }
      }
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Move to previous field on backspace if current field is empty
    if (e.key === 'Backspace' && segments[index] === '' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }
    
    // Move to next field on dash
    if (e.key === '-' && index < 3) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
    
    // Move right with arrow key
    if (e.key === 'ArrowRight' && index < 3) {
      e.preventDefault()
      inputRefs.current[index + 1]?.focus()
    }
    
    // Move left with arrow key
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedText = e.clipboardData.getData('text')
    
    // Try to parse license key format
    const cleanText = pastedText.toUpperCase().replace(/[^A-Z0-9-]/g, '')
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
    
    // Create particle burst effect
    createParticleBurst()
    
    try {
      const result = await onVerify(fullKey)
      
      if (result.valid) {
        setVerificationStatus('valid')
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

  const createParticleBurst = () => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
    }))
    setParticles(newParticles)
    
    // Clear particles after animation
    setTimeout(() => setParticles([]), 1000)
  }

  const getSegmentStyle = (index: number) => {
    if (verificationStatus === 'valid') {
      return 'border-green-500 bg-green-500/10 ring-2 ring-green-500/20'
    }
    if (verificationStatus === 'invalid') {
      return 'border-red-500 bg-red-500/10 ring-2 ring-red-500/20'
    }
    if (segments[index].length === 4) {
      return 'border-blue-500 bg-blue-500/10 ring-2 ring-blue-500/20'
    }
    return 'border-border'
  }

  const isComplete = segments.every(seg => seg.length === 4)

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium">
          <Key className="h-4 w-4 text-primary" />
          License Key
        </Label>
        
        <div className="relative">
          {/* Holographic background effect */}
          <AnimatePresence>
            {verificationStatus === 'valid' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute inset-0 -z-10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-green-500/20 blur-xl animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Key input segments */}
          <div className="flex gap-2 items-center justify-center relative">
            {/* Particle effects */}
            <AnimatePresence>
              {particles.map(particle => (
                <motion.div
                  key={particle.id}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{ 
                    opacity: 0, 
                    x: particle.x, 
                    y: particle.y, 
                    scale: 0 
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute left-1/2 top-1/2 w-2 h-2 bg-primary rounded-full pointer-events-none"
                />
              ))}
            </AnimatePresence>
            
            {segments.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
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
                      w-20 h-12 text-center text-lg font-mono font-bold
                      uppercase tracking-wider transition-all duration-300
                      ${getSegmentStyle(index)}
                      focus:ring-2 focus:ring-primary/50 focus:border-primary
                      disabled:opacity-50 disabled:cursor-not-allowed
                    `}
                    placeholder="••••"
                  />
                  
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
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                      style={{ transform: 'skewX(-20deg)' }}
                    />
                  )}
                </motion.div>
                
                {index < 3 && (
                  <span className="text-muted-foreground font-bold text-xl">-</span>
                )}
              </div>
            ))}
            
            {/* Verification status indicator */}
            <AnimatePresence mode="wait">
              {isVerifying && (
                <motion.div
                  key="verifying"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="ml-3"
                >
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </motion.div>
              )}
              
              {verificationStatus === 'valid' && !isVerifying && (
                <motion.div
                  key="valid"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  className="ml-3"
                >
                  <div className="relative">
                    <Check className="h-6 w-6 text-green-500" />
                    <motion.div
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 0.6 }}
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
                  className="ml-3"
                >
                  <AlertCircle className="h-6 w-6 text-red-500" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Error message */}
        <AnimatePresence>
          {errorMessage && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-red-500 flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </motion.p>
          )}
        </AnimatePresence>
        
        {/* Success message */}
        <AnimatePresence>
          {verificationStatus === 'valid' && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-green-500 flex items-center gap-2 font-medium"
            >
              <Sparkles className="h-4 w-4" />
              License key verified successfully!
            </motion.p>
          )}
        </AnimatePresence>
      </div>
      
      {/* Helper text */}
      <p className="text-xs text-muted-foreground text-center">
        Enter your 16-character license key in format: XXXX-XXXX-XXXX-XXXX
      </p>
    </div>
  )
}
