"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { authClient, useSession } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { toast } from 'sonner'
import { Loader2, Shield, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const { data: session, isPending: sessionPending } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })

  // Redirect if already logged in
  useEffect(() => {
    if (!sessionPending && session?.user) {
      router.push('/')
    }
  }, [session, sessionPending, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password length
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await authClient.signUp.email({
        email: formData.email,
        name: formData.name,
        password: formData.password
      })

      if (error?.code) {
        const errorMap: Record<string, string> = {
          USER_ALREADY_EXISTS: "An account with this email already exists"
        }
        toast.error(errorMap[error.code] || "Registration failed. Please try again.")
        setIsLoading(false)
        return
      }

      toast.success("Account created successfully! Redirecting to login...")
      setTimeout(() => {
        router.push("/login?registered=true")
      }, 1500)
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  if (sessionPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  if (session?.user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      
      <div className="w-full max-w-md relative z-10">
        <Card className="glass-card border shadow-xl">
          <CardHeader className="space-y-3 pb-6">
            <div className="flex justify-center">
              <Logo />
            </div>
            <div className="space-y-1 text-center">
              <CardTitle className="text-2xl font-display">
                Create Account
              </CardTitle>
              <CardDescription>
                Get started with 9TD task management
              </CardDescription>
            </div>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={isLoading}
                  autoComplete="off"
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Must be at least 8 characters
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  disabled={isLoading}
                  autoComplete="off"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full h-9 gap-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              
              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">
                    Already have an account?
                  </span>
                </div>
              </div>
              
              <Link href="/login" className="w-full">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-9"
                >
                  Sign In
                </Button>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}