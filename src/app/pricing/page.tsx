"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import { useCustomer } from "autumn-js/react"
import { PricingTable } from "@/components/autumn/pricing-table"
import { PlanUsageIndicator } from "@/components/PlanUsageIndicator"
import { LicenseKeyPurchase } from "@/components/LicenseKeyPurchase"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Check, Zap, Crown, Users, Star, Sparkles, Lock, TrendingUp, Shield, Rocket, Target, Brain, Palette, FileDown, Puzzle, Workflow, Mail, HardDrive, ListChecks, Filter, Flag, BarChart3, Bell, Database, KeyRound, CreditCard, CheckCircle2, XCircle } from "lucide-react"
import { PageContainer } from "@/components/LoadingStates"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

const productDetails = [
  {
    id: "free",
    description: "Perfect for personal task management and getting started",
    items: [
      {
        featureId: "tasks",
        primaryText: "50 tasks per month",
        secondaryText: "Basic task creation and management",
        icon: <ListChecks className="h-4 w-4" />
      },
      {
        featureId: "projects",
        primaryText: "2 projects",
        secondaryText: "Simple project organization",
        icon: <Target className="h-4 w-4" />
      },
      {
        featureId: "basic_features",
        primaryText: "Core Features",
        secondaryText: "Task lists, calendar, and dashboard",
        icon: <Star className="h-4 w-4" />
      },
      {
        featureId: "basic_analytics",
        primaryText: "Basic Analytics",
        secondaryText: "Simple productivity insights",
        icon: <BarChart3 className="h-4 w-4" />
      }
    ]
  },
  {
    id: "pro",
    description: "Advanced productivity tools for professionals and power users",
    recommendText: "Most Popular",
    items: [
      {
        featureId: "tasks",
        primaryText: "1,000 tasks per month",
        secondaryText: "20x more capacity for power users",
        icon: <TrendingUp className="h-4 w-4" />
      },
      {
        featureId: "unlimited_projects",
        primaryText: "Unlimited Projects",
        secondaryText: "Create as many projects as you need",
        icon: <Rocket className="h-4 w-4" />
      },
      {
        featureId: "advanced_views",
        primaryText: "Advanced Views",
        secondaryText: "Kanban, Gantt, Time Blocking & more",
        icon: <Sparkles className="h-4 w-4" />
      },
      {
        featureId: "pomodoro",
        primaryText: "Pomodoro Timer",
        secondaryText: "Focus sessions with task integration",
        icon: <Zap className="h-4 w-4" />
      },
      {
        featureId: "advanced_analytics",
        primaryText: "Advanced Analytics",
        secondaryText: "Detailed time tracking & insights",
        icon: <BarChart3 className="h-4 w-4" />
      },
      {
        featureId: "ai_assistant",
        primaryText: "AI Task Assistant",
        secondaryText: "Smart scheduling and task suggestions",
        icon: <Brain className="h-4 w-4" />
      },
      {
        featureId: "custom_themes",
        primaryText: "Custom Themes",
        secondaryText: "Personalize with custom colors",
        icon: <Palette className="h-4 w-4" />
      },
      {
        featureId: "advanced_export",
        primaryText: "Advanced Export",
        secondaryText: "Export to PDF, Excel, CSV",
        icon: <FileDown className="h-4 w-4" />
      },
      {
        featureId: "automation_rules",
        primaryText: "Automation Rules",
        secondaryText: "Custom automation workflows",
        icon: <Workflow className="h-4 w-4" />
      },
      {
        featureId: "email_notifications",
        primaryText: "Email Notifications",
        secondaryText: "Stay updated with email alerts",
        icon: <Mail className="h-4 w-4" />
      },
      {
        featureId: "file_storage",
        primaryText: "5 GB File Storage",
        secondaryText: "Attach files to your tasks",
        icon: <HardDrive className="h-4 w-4" />
      },
      {
        featureId: "custom_fields",
        primaryText: "Custom Fields",
        secondaryText: "Create custom task attributes",
        icon: <ListChecks className="h-4 w-4" />
      },
      {
        featureId: "advanced_filtering",
        primaryText: "Advanced Filtering",
        secondaryText: "Powerful search and filters",
        icon: <Filter className="h-4 w-4" />
      },
      {
        featureId: "goals_tracking",
        primaryText: "Goals & OKRs",
        secondaryText: "Track goals and objectives",
        icon: <Flag className="h-4 w-4" />
      },
      {
        featureId: "priority_notifications",
        primaryText: "Priority Notifications",
        secondaryText: "Smart task reminders",
        icon: <Bell className="h-4 w-4" />
      },
      {
        featureId: "priority_support",
        primaryText: "Priority Support",
        secondaryText: "24hr email response time",
        icon: <Shield className="h-4 w-4" />
      }
    ]
  },
  {
    id: "team",
    description: "Complete team collaboration and enterprise features",
    items: [
      {
        primaryText: "Unlimited Tasks",
        secondaryText: "No monthly limits on tasks",
        icon: <TrendingUp className="h-4 w-4" />
      },
      {
        primaryText: "Everything from Pro",
        secondaryText: "All Pro features included",
        icon: <Star className="h-4 w-4" />
      },
      {
        featureId: "message_system",
        primaryText: "Team Messaging",
        secondaryText: "Real-time collaboration",
        icon: <Users className="h-4 w-4" />
      },
      {
        featureId: "advanced_permissions",
        primaryText: "Advanced Permissions",
        secondaryText: "Role-based access control",
        icon: <Lock className="h-4 w-4" />
      },
      {
        featureId: "team_analytics",
        primaryText: "Team Analytics",
        secondaryText: "Team productivity dashboards",
        icon: <BarChart3 className="h-4 w-4" />
      },
      {
        featureId: "integrations",
        primaryText: "Third-Party Integrations",
        secondaryText: "Connect your favorite tools",
        icon: <Puzzle className="h-4 w-4" />
      },
      {
        featureId: "api_access",
        primaryText: "API Access",
        secondaryText: "REST API for custom integrations",
        icon: <Workflow className="h-4 w-4" />
      },
      {
        featureId: "workload_management",
        primaryText: "Workload Balancing",
        secondaryText: "Distribute tasks across team",
        icon: <Target className="h-4 w-4" />
      },
      {
        featureId: "data_backup",
        primaryText: "Daily Backups",
        secondaryText: "Automatic data protection",
        icon: <Database className="h-4 w-4" />
      },
      {
        featureId: "file_storage",
        primaryText: "50 GB File Storage",
        secondaryText: "10x storage for teams",
        icon: <HardDrive className="h-4 w-4" />
      },
      {
        featureId: "priority_support",
        primaryText: "24/7 Priority Support",
        secondaryText: "12hr response time",
        icon: <Shield className="h-4 w-4" />
      }
    ]
  }
]

export default function PricingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending } = useSession()
  const { customer, isLoading } = useCustomer()
  
  // Get tab from URL or default to subscription
  const urlTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(urlTab === 'license' ? 'license' : 'subscription')
  
  const currentPlan = customer?.products?.at(-1)
  const planName = currentPlan?.name || "Free"

  // Handle success/cancel states from URL
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    const sessionId = searchParams.get('session_id')

    if (success === 'true') {
      toast.success('Payment successful! Check your email for your license key.', {
        duration: 5000,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />
      })
      // Clean up URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('success')
      newUrl.searchParams.delete('session_id')
      window.history.replaceState({}, '', newUrl.toString())
    }

    if (canceled === 'true') {
      toast.error('Payment canceled. Your license key was not generated.', {
        duration: 5000,
        icon: <XCircle className="h-5 w-5 text-red-500" />
      })
      // Clean up URL parameters
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('canceled')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])

  // Update tab when URL changes
  useEffect(() => {
    if (urlTab === 'license') {
      setActiveTab('license')
    }
  }, [urlTab])

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-smooth" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse-smooth" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse-smooth" style={{ animationDelay: '2s' }} />
        </div>

        <div className="relative">
          {/* Header */}
          <div className="container mx-auto px-4 pt-8 pb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2 mb-6 hover:gap-3 transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Hero Section */}
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Animated Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 border border-primary/30 backdrop-blur-sm">
                <div className="relative">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <div className="absolute inset-0 blur-md bg-primary/50 animate-pulse" />
                </div>
                <span className="text-sm font-semibold bg-gradient-to-r from-primary via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  Premium Plans Now Available
                </span>
              </div>
              
              {/* Main Heading with Gradient */}
              <h1 className="font-display text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-foreground via-primary to-purple-500 bg-clip-text text-transparent animate-gradient">
                  Supercharge Your
                </span>
                <br />
                <span className="bg-gradient-to-r from-purple-500 via-blue-500 to-primary bg-clip-text text-transparent animate-gradient" style={{ animationDelay: '0.5s' }}>
                  Productivity
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Unlock powerful features and take your task management to the next level. 
                From AI-powered assistance to team collaboration, we've got you covered.
              </p>

              {/* Current Plan Badge */}
              {session?.user && !isLoading && (
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-muted to-muted/50 backdrop-blur-sm border border-border/50 shadow-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      planName === "Free" ? "bg-slate-500" :
                      planName === "Pro" ? "bg-gradient-to-r from-purple-500 to-fuchsia-500" :
                      "bg-gradient-to-r from-amber-400 to-yellow-500"
                    } animate-pulse`} />
                    <span className="text-sm text-muted-foreground">Current plan:</span>
                  </div>
                  <span className="text-sm font-bold text-foreground flex items-center gap-2">
                    {planName !== "Free" && (
                      <Crown className="h-4 w-4 text-yellow-500 animate-float" />
                    )}
                    {planName}
                  </span>
                </div>
              )}

              {/* Social Proof */}
              <div className="flex items-center justify-center gap-6 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">10K+</div>
                  <div className="text-sm text-muted-foreground">Active Users</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">50K+</div>
                  <div className="text-sm text-muted-foreground">Tasks Completed</div>
                </div>
                <div className="w-px h-12 bg-border" />
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">4.9★</div>
                  <div className="text-sm text-muted-foreground">User Rating</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs for Subscription vs License Key */}
          <div className="container mx-auto px-4 py-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12 h-12 glass-card">
                <TabsTrigger value="subscription" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 text-base gap-2">
                  <CreditCard className="h-4 w-4" />
                  Subscription Plans
                </TabsTrigger>
                <TabsTrigger value="license" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 text-base gap-2">
                  <KeyRound className="h-4 w-4" />
                  License Key
                </TabsTrigger>
              </TabsList>

              <TabsContent value="subscription" className="space-y-16">
                {/* Pricing Table */}
                <div>
                  <PricingTable productDetails={productDetails} />
                </div>

                {/* Current Usage Section */}
                {session?.user && (
                  <div className="max-w-3xl mx-auto">
                    <div className="text-center mb-8">
                      <h2 className="font-display text-3xl font-bold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Your Current Usage
                      </h2>
                      <p className="text-muted-foreground">
                        Track your feature usage and plan limits
                      </p>
                    </div>
                    <PlanUsageIndicator />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="license" className="space-y-16">
                {/* License Key Purchase */}
                <div className="py-8">
                  <LicenseKeyPurchase />
                </div>

                {/* License Key Benefits */}
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                    <h2 className="font-display text-3xl font-bold mb-3">
                      Why Choose a License Key?
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      Perfect for users who prefer one-time purchases over subscriptions
                    </p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-6 w-6 text-green-500" />
                      </div>
                      <h3 className="font-semibold mb-2">Instant Access</h3>
                      <p className="text-sm text-muted-foreground">
                        Receive your license key immediately via email and activate within minutes
                      </p>
                    </div>

                    <div className="glass-card p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                        <Shield className="h-6 w-6 text-blue-500" />
                      </div>
                      <h3 className="font-semibold mb-2">Secure & Simple</h3>
                      <p className="text-sm text-muted-foreground">
                        Unique cryptographically generated keys with email verification
                      </p>
                    </div>

                    <div className="glass-card p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-6 w-6 text-purple-500" />
                      </div>
                      <h3 className="font-semibold mb-2">Easy Activation</h3>
                      <p className="text-sm text-muted-foreground">
                        Step-by-step instructions sent directly to your inbox
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Feature Showcase Grid */}
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Everything You Need
                </h2>
                <p className="text-xl text-muted-foreground">
                  Powerful features to transform how you work
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* AI Assistant */}
                <div className="glass-card p-6 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Brain className="h-6 w-6 text-purple-500" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">AI Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Get intelligent task suggestions and smart scheduling powered by AI
                  </p>
                  <div className="mt-4 px-2 py-1 bg-purple-500/10 text-purple-500 text-xs rounded-full inline-block">
                    Pro Feature
                  </div>
                </div>

                {/* Advanced Views */}
                <div className="glass-card p-6 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Sparkles className="h-6 w-6 text-blue-500" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">Advanced Views</h3>
                  <p className="text-sm text-muted-foreground">
                    Kanban boards, Gantt charts, time blocking, and more visualization options
                  </p>
                  <div className="mt-4 px-2 py-1 bg-blue-500/10 text-blue-500 text-xs rounded-full inline-block">
                    Pro Feature
                  </div>
                </div>

                {/* Team Collaboration */}
                <div className="glass-card p-6 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">Team Messaging</h3>
                  <p className="text-sm text-muted-foreground">
                    Real-time collaboration and communication with your team
                  </p>
                  <div className="mt-4 px-2 py-1 bg-amber-500/10 text-amber-500 text-xs rounded-full inline-block">
                    Team Feature
                  </div>
                </div>

                {/* Automation */}
                <div className="glass-card p-6 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Workflow className="h-6 w-6 text-green-500" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">Automation Rules</h3>
                  <p className="text-sm text-muted-foreground">
                    Create custom workflows to automate repetitive tasks
                  </p>
                  <div className="mt-4 px-2 py-1 bg-green-500/10 text-green-500 text-xs rounded-full inline-block">
                    Pro Feature
                  </div>
                </div>

                {/* Analytics */}
                <div className="glass-card p-6 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-6 w-6 text-pink-500" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Detailed insights into productivity and time tracking
                  </p>
                  <div className="mt-4 px-2 py-1 bg-pink-500/10 text-pink-500 text-xs rounded-full inline-block">
                    Pro Feature
                  </div>
                </div>

                {/* API Access */}
                <div className="glass-card p-6 hover:shadow-xl transition-all duration-300 group">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Puzzle className="h-6 w-6 text-orange-500" />
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-2">API & Integrations</h3>
                  <p className="text-sm text-muted-foreground">
                    Connect with your favorite tools and build custom integrations
                  </p>
                  <div className="mt-4 px-2 py-1 bg-orange-500/10 text-orange-500 text-xs rounded-full inline-block">
                    Team Feature
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Frequently Asked Questions
                </h2>
                <p className="text-xl text-muted-foreground">
                  Everything you need to know about our plans
                </p>
              </div>
              
              <div className="grid gap-6">
                <div className="glass-card p-8 hover:shadow-xl transition-all duration-300">
                  <h3 className="font-display text-lg font-semibold mb-3">Can I change plans anytime?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, 
                    and we'll prorate any charges. No questions asked, no hidden fees.
                  </p>
                </div>
                
                <div className="glass-card p-8 hover:shadow-xl transition-all duration-300">
                  <h3 className="font-display text-lg font-semibold mb-3">What happens when I reach my task limit?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    When you reach your monthly task limit, you'll be prompted to upgrade. Your existing tasks 
                    remain accessible, but you won't be able to create new ones until the next billing cycle 
                    or until you upgrade to a higher plan.
                  </p>
                </div>
                
                <div className="glass-card p-8 hover:shadow-xl transition-all duration-300">
                  <h3 className="font-display text-lg font-semibold mb-3">Is there a free trial for paid plans?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Free plan is always available with no time limit. You can start there and upgrade 
                    when you're ready to unlock more features. This allows you to fully explore the platform 
                    before committing to a paid plan.
                  </p>
                </div>
                
                <div className="glass-card p-8 hover:shadow-xl transition-all duration-300">
                  <h3 className="font-display text-lg font-semibold mb-3">How secure is my data?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    All your data is encrypted in transit and at rest using industry-standard encryption. 
                    We use best-in-class security practices and never share your data with third parties. 
                    Team plans include automatic daily backups for extra peace of mind.
                  </p>
                </div>

                <div className="glass-card p-8 hover:shadow-xl transition-all duration-300">
                  <h3 className="font-display text-lg font-semibold mb-3">What payment methods do you accept?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We accept all major credit cards (Visa, Mastercard, American Express) through Stripe, 
                    our secure payment processor. All transactions are encrypted and PCI-compliant.
                  </p>
                </div>

                <div className="glass-card p-8 hover:shadow-xl transition-all duration-300">
                  <h3 className="font-display text-lg font-semibold mb-3">Can I cancel my subscription?</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Yes, you can cancel your subscription at any time through the billing portal. You'll 
                    continue to have access to premium features until the end of your billing period. 
                    Your data is never deleted, so you can always reactivate later.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto">
              <div className="glass-card p-12 text-center relative overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-500/10 blur-3xl" />
                
                <div className="relative">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-500 mb-6">
                    <Rocket className="h-8 w-8 text-white" />
                  </div>
                  
                  <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
                    Ready to Get Started?
                  </h2>
                  <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                    Join thousands of users who have transformed their productivity with our platform. 
                    Start free and upgrade anytime.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      className="gap-2 text-lg px-8"
                      onClick={() => router.push(session?.user ? "/" : "/register")}
                    >
                      {session?.user ? "Go to Dashboard" : "Get Started Free"}
                      <ArrowLeft className="h-5 w-5 rotate-180" />
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="gap-2 text-lg px-8"
                      onClick={() => router.push("/")}
                    >
                      View Features
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}