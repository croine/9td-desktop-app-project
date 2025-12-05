"use client"

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface VoiceInputProps {
  onTranscript: (text: string) => void
  onError?: (error: string) => void
  className?: string
  autoStart?: boolean
}

export function VoiceInput({ onTranscript, onError, className, autoStart = false }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    // Check if browser supports speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.lang = 'en-US'

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = ''
          let finalTranscript = ''

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcriptPiece = event.results[i][0].transcript
            if (event.results[i].isFinal) {
              finalTranscript += transcriptPiece + ' '
            } else {
              interimTranscript += transcriptPiece
            }
          }

          const currentTranscript = finalTranscript || interimTranscript
          setTranscript(currentTranscript.trim())
          
          if (finalTranscript) {
            onTranscript(finalTranscript.trim())
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error)
          const errorMessage = `Speech recognition error: ${event.error}`
          setError(errorMessage)
          if (onError) onError(errorMessage)
          setIsListening(false)
          
          if (event.error !== 'no-speech') {
            toast.error('Voice input error', {
              description: event.error === 'not-allowed' 
                ? 'Microphone access denied. Please enable it in your browser settings.'
                : `Error: ${event.error}`
            })
          }
        }

        recognitionRef.current.onend = () => {
          setIsListening(false)
        }
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [onTranscript, onError])

  useEffect(() => {
    if (autoStart && isSupported && !isListening) {
      startListening()
    }
  }, [autoStart, isSupported])

  const startListening = async () => {
    if (!isSupported) {
      const errorMsg = 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.'
      setError(errorMsg)
      if (onError) onError(errorMsg)
      toast.error('Not supported', { description: errorMsg })
      return
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true })
      
      setError(null)
      setTranscript('')
      setIsListening(true)
      recognitionRef.current?.start()
      toast.success('Voice input active', { description: 'Start speaking to create a task' })
    } catch (err: any) {
      const errorMsg = 'Microphone access denied. Please enable microphone permissions.'
      setError(errorMsg)
      if (onError) onError(errorMsg)
      toast.error('Permission denied', { description: errorMsg })
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
      toast.info('Voice input stopped')
    }
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!isSupported) {
    return (
      <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <div className="flex items-start gap-3">
          <MicOff className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Voice input not supported
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Please use Chrome, Edge, or Safari for voice input features.
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={isListening ? "destructive" : "default"}
          size="lg"
          onClick={toggleListening}
          className={cn(
            "gap-2 relative overflow-hidden",
            isListening && "animate-pulse"
          )}
        >
          {isListening ? (
            <>
              <MicOff className="h-5 w-5" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="h-5 w-5" />
              Start Voice Input
            </>
          )}
        </Button>

        {isListening && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
            <Volume2 className="h-4 w-4 text-primary" />
            <span>Listening...</span>
          </div>
        )}
      </div>

      {transcript && (
        <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Mic className="h-3 w-3" />
              Live Transcript
            </div>
            <p className="text-sm font-medium">{transcript}</p>
          </div>
        </Card>
      )}

      {error && (
        <Card className="p-3 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </Card>
      )}

      <div className="text-xs text-muted-foreground">
        <span className="font-medium">Tip:</span> Speak naturally like "Create task: Review report tomorrow at 3pm with high priority"
      </div>
    </div>
  )
}
