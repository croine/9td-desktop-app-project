"use client"

import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Log to external service (optional)
    // logErrorToService(error, errorInfo)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
          <Card className="glass-card p-8 max-w-2xl w-full">
            <div className="flex flex-col items-center text-center space-y-6">
              {/* Error Icon */}
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-destructive" />
              </div>

              {/* Error Message */}
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold">
                  Oops! Something went wrong
                </h1>
                <p className="text-muted-foreground text-lg">
                  Don't worry - your data is safe. Let's get you back on track.
                </p>
              </div>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="w-full">
                  <details className="text-left">
                    <summary className="cursor-pointer text-sm font-semibold mb-2 hover:text-primary">
                      🔍 Technical Details (Development Mode)
                    </summary>
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-xs font-mono overflow-auto max-h-60">
                      <div>
                        <strong>Error:</strong>
                        <pre className="mt-1 text-destructive whitespace-pre-wrap">
                          {this.state.error.toString()}
                        </pre>
                      </div>
                      {this.state.errorInfo && (
                        <div>
                          <strong>Component Stack:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center pt-2">
                <Button
                  onClick={this.handleReset}
                  size="lg"
                  className="gap-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <RefreshCw className="h-5 w-5" />
                  Reload Page
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Home className="h-5 w-5" />
                  Go Home
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-sm text-muted-foreground space-y-1 pt-4 border-t border-border/50 w-full">
                <p>If the problem persists, try:</p>
                <ul className="list-disc list-inside space-y-1 text-left">
                  <li>Clearing your browser cache</li>
                  <li>Using a different browser</li>
                  <li>Checking your internet connection</li>
                  <li>Contacting support if the issue continues</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier use
export const ErrorBoundaryWrapper = ({ 
  children, 
  fallback
}: Props) => {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}