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
import { ArrowLeft, Check, Zap, Crown, Users, Star, Sparkles, Lock, TrendingUp, Shield, Rocket, Target, Brain, Palette, FileDown, Puzzle, Workflow, Mail, HardDrive, ListChecks, Filter, Flag, BarChart3, Bell, Database, KeyRound, CreditCard, CheckCircle2, XCircle, ArrowRight, Info, Clock, Infinity, MessageSquare, Calendar, Globe, X } from "lucide-react"
import { PageContainer } from "@/components/LoadingStates"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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
  
  const urlTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(urlTab === 'license' ? 'license' : 'subscription')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  
  const currentPlan = customer?.products?.at(-1)
  const planName = currentPlan?.name || "Free"

  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      toast.success('Payment successful! Check your email for your license key.', {
        duration: 5000,
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />
      })
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
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('canceled')
      window.history.replaceState({}, '', newUrl.toString())
    }
  }, [searchParams])

  useEffect(() => {
    if (urlTab === 'license') {
      setActiveTab('license')
    }
  }, [urlTab])

  const getPrice = (baseMonthly: number) => {
    if (billingCycle === 'annual') {
      return Math.floor(baseMonthly * 0.8) // 20% discount for annual
    }
    return baseMonthly
  }

  return (
    <PageContainer>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Decorative Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-500/10 to-transparent rounded-full blur-3xl" />
        </div>

        {/* Navigation */}
        <div className="relative border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2 hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {session?.user && !isLoading && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm">
                <div className={`w-2 h-2 rounded-full animate-pulse ${
                  planName === "Free" ? "bg-slate-500" :
                  planName === "Pro" ? "bg-blue-500" :
                  "bg-purple-500"
                }`} />
                <span className="text-sm text-muted-foreground">Your current plan:</span>
                <span className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{planName}</span>
              </div>
            )}
            
            <div className="space-y-4">
              <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Pricing that grows with you
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto font-medium">
                Start free, upgrade when you're ready. No hidden fees, no surprises.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>14-day money back</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Tabs */}
        <div className="relative container mx-auto px-4 pb-24">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="inline-flex h-14 items-center justify-center rounded-xl bg-muted/50 backdrop-blur-sm p-1.5 border border-border/50">
                <TabsTrigger 
                  value="subscription" 
                  className="relative px-8 py-3 text-sm font-semibold rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-foreground gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Subscription Plans
                </TabsTrigger>
                <TabsTrigger 
                  value="license" 
                  className="relative px-8 py-3 text-sm font-semibold rounded-lg transition-all data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-foreground gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  One-Time License
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="subscription" className="space-y-20 mt-0">
              {/* Billing Toggle */}
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-4 p-2 rounded-xl bg-muted/50 backdrop-blur-sm border border-border/50">
                  <Label 
                    htmlFor="billing-toggle" 
                    className={`px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer transition-all ${
                      billingCycle === 'monthly' ? 'bg-background shadow-md' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    Monthly
                  </Label>
                  <Switch
                    id="billing-toggle"
                    checked={billingCycle === 'annual'}
                    onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
                  />
                  <Label 
                    htmlFor="billing-toggle" 
                    className={`px-4 py-2 rounded-lg font-semibold text-sm cursor-pointer transition-all flex items-center gap-2 ${
                      billingCycle === 'annual' ? 'bg-background shadow-md' : 'text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setBillingCycle('annual')}
                  >
                    Annual
                    <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold">
                      Save 20%
                    </span>
                  </Label>
                </div>
              </div>

              {/* Pricing Cards */}
              <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {/* Free Plan */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <Card className="relative h-full p-8 rounded-3xl border-2 border-border/50 bg-gradient-to-br from-slate-50/80 to-slate-100/80 dark:from-slate-900/80 dark:to-slate-800/80 backdrop-blur-xl overflow-hidden">
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                      <div className="grid grid-cols-4 gap-2 rotate-12">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-sm bg-slate-500" />
                        ))}
                      </div>
                    </div>
                    
                    <div className="relative space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
                          Starter
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                          For individuals just getting started
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="font-display text-5xl font-bold text-slate-900 dark:text-slate-100">
                            $0
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 font-medium">
                            /month
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-500">
                          Free forever
                        </p>
                      </div>

                      <Button 
                        className="w-full h-12 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-slate-200 text-white dark:text-slate-900 shadow-lg hover:shadow-xl transition-all"
                        onClick={() => router.push(session?.user ? "/" : "/register")}
                      >
                        Get Started Free
                      </Button>

                      <div className="space-y-4 pt-6 border-t border-slate-300 dark:border-slate-700">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          What's included:
                        </p>
                        <ul className="space-y-3">
                          {[
                            "50 tasks per month",
                            "2 projects",
                            "Basic task views",
                            "Mobile app access",
                            "7-day activity history"
                          ].map((feature) => (
                            <li key={feature} className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-slate-900/10 dark:bg-slate-100/10 flex items-center justify-center">
                                <Check className="h-3 w-3 text-slate-700 dark:text-slate-300" />
                              </div>
                              <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Pro Plan */}
                <div className="relative group lg:-mt-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl blur-xl opacity-60 group-hover:opacity-80 transition-opacity" />
                  <Card className="relative h-full p-8 rounded-3xl border-2 border-blue-500/50 bg-gradient-to-br from-blue-50/90 to-purple-50/90 dark:from-blue-950/90 dark:to-purple-950/90 backdrop-blur-xl overflow-hidden shadow-2xl">
                    {/* Popular Badge */}
                    <div className="absolute -top-1 -right-1 px-4 py-2 rounded-bl-2xl rounded-tr-3xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold shadow-lg">
                      MOST POPULAR
                    </div>

                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                      <div className="grid grid-cols-4 gap-2 -rotate-12">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-blue-500" />
                        ))}
                      </div>
                    </div>
                    
                    <div className="relative space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          <h3 className="font-display text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Pro
                          </h3>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                          For professionals who need more power
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          {billingCycle === 'annual' && (
                            <span className="text-2xl font-bold text-blue-500 line-through">
                              $12
                            </span>
                          )}
                          <span className="font-display text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            ${getPrice(12)}
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-medium">
                            /{billingCycle === 'annual' ? 'month' : 'month'}
                          </span>
                        </div>
                        <p className="text-sm text-blue-500 dark:text-blue-400 font-semibold">
                          {billingCycle === 'annual' ? `$${getPrice(12) * 12} billed annually` : 'Billed monthly'}
                        </p>
                      </div>

                      <Button 
                        className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        Upgrade to Pro
                        <Sparkles className="h-4 w-4 ml-2" />
                      </Button>

                      <div className="space-y-4 pt-6 border-t border-blue-300 dark:border-blue-800">
                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                          Everything in Starter, plus:
                        </p>
                        <ul className="space-y-3">
                          {[
                            "1,000 tasks per month",
                            "Unlimited projects",
                            "Advanced views (Kanban, Gantt)",
                            "Pomodoro timer",
                            "Time tracking & analytics",
                            "AI task assistant",
                            "Custom themes & branding",
                            "Advanced export (PDF, Excel)",
                            "Automation workflows",
                            "5 GB file storage",
                            "Priority support (24h)"
                          ].map((feature) => (
                            <li key={feature} className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Team Plan */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <Card className="relative h-full p-8 rounded-3xl border-2 border-purple-500/50 bg-gradient-to-br from-purple-50/80 to-pink-50/80 dark:from-purple-950/80 dark:to-pink-950/80 backdrop-blur-xl overflow-hidden">
                    {/* Decorative pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({ length: 16 }).map((_, i) => (
                          <div key={i} className="w-2 h-2 rounded-full bg-purple-500" />
                        ))}
                      </div>
                    </div>
                    
                    <div className="relative space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          <h3 className="font-display text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Team
                          </h3>
                        </div>
                        <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                          For teams that need to collaborate
                        </p>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          {billingCycle === 'annual' && (
                            <span className="text-2xl font-bold text-purple-500 line-through">
                              $24
                            </span>
                          )}
                          <span className="font-display text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                            ${getPrice(24)}
                          </span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            /{billingCycle === 'annual' ? 'month' : 'month'}
                          </span>
                        </div>
                        <p className="text-sm text-purple-500 dark:text-purple-400 font-semibold">
                          {billingCycle === 'annual' ? `$${getPrice(24) * 12} billed annually` : 'Per user, billed monthly'}
                        </p>
                      </div>

                      <Button 
                        className="w-full h-12 rounded-xl font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        Upgrade to Team
                        <Users className="h-4 w-4 ml-2" />
                      </Button>

                      <div className="space-y-4 pt-6 border-t border-purple-300 dark:border-purple-800">
                        <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                          Everything in Pro, plus:
                        </p>
                        <ul className="space-y-3">
                          {[
                            "Unlimited tasks",
                            "Team messaging",
                            "Advanced permissions",
                            "Team analytics dashboard",
                            "Workload balancing",
                            "API access",
                            "Third-party integrations",
                            "50 GB file storage",
                            "Daily backups",
                            "Dedicated support (12h)",
                            "Advanced security"
                          ].map((feature) => (
                            <li key={feature} className="flex items-start gap-3">
                              <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                <Check className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-sm text-purple-900 dark:text-purple-100 font-medium">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Enterprise CTA */}
              <div className="max-w-5xl mx-auto">
                <Card className="relative p-12 rounded-3xl border-2 border-border/50 bg-gradient-to-br from-amber-50/80 to-orange-50/80 dark:from-amber-950/80 dark:to-orange-950/80 backdrop-blur-xl overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-800 dark:to-orange-900 rounded-full blur-3xl opacity-20" />
                  
                  <div className="relative grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                        <Crown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-300">ENTERPRISE</span>
                      </div>
                      
                      <h2 className="font-display text-4xl font-bold text-amber-900 dark:text-amber-100">
                        Need something more?
                      </h2>
                      
                      <p className="text-lg text-amber-700 dark:text-amber-300 font-medium">
                        Get custom solutions, dedicated support, and enterprise-grade security for large organizations.
                      </p>

                      <ul className="space-y-2 pt-2">
                        {[
                          "Custom user limits",
                          "SSO & SAML authentication",
                          "Dedicated account manager",
                          "SLA guarantees",
                          "On-premise deployment"
                        ].map((feature) => (
                          <li key={feature} className="flex items-center gap-3">
                            <Check className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span className="text-amber-800 dark:text-amber-200 font-medium">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <Button 
                        size="lg"
                        className="w-full h-14 rounded-xl font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all"
                      >
                        <MessageSquare className="h-5 w-5 mr-2" />
                        Contact Sales
                      </Button>
                      
                      <Button 
                        size="lg"
                        variant="outline"
                        className="w-full h-14 rounded-xl font-semibold border-2 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                      >
                        <Calendar className="h-5 w-5 mr-2" />
                        Schedule a Demo
                      </Button>

                      <p className="text-sm text-center text-amber-600 dark:text-amber-400 font-medium">
                        <Globe className="h-4 w-4 inline mr-1" />
                        Available worldwide • 24/7 support
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Current Usage - Only show for logged in users */}
              {session?.user && (
                <div className="max-w-4xl mx-auto">
                  <Card className="p-8 rounded-3xl border-2 border-border/50 bg-card/50 backdrop-blur-xl">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="font-display text-2xl font-bold mb-2">Your Current Usage</h2>
                          <p className="text-muted-foreground">
                            Track your feature usage for this billing period
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-primary" />
                      </div>
                      <PlanUsageIndicator />
                    </div>
                  </Card>
                </div>
              )}

              {/* FAQ Section */}
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="font-display text-4xl font-bold mb-4">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    Everything you need to know about our pricing
                  </p>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      q: "Can I change plans anytime?",
                      a: "Yes! Upgrade or downgrade whenever you want. Changes take effect immediately."
                    },
                    {
                      q: "What happens if I exceed my limit?",
                      a: "We'll notify you before you hit your limit. You can upgrade or wait for the next cycle."
                    },
                    {
                      q: "Do you offer refunds?",
                      a: "We offer a 14-day money-back guarantee on all paid plans. No questions asked."
                    },
                    {
                      q: "Is my data secure?",
                      a: "Absolutely. We use bank-level encryption and never share your data with third parties."
                    },
                    {
                      q: "Can I pay annually?",
                      a: "Yes! Annual billing saves you 20% compared to monthly billing."
                    },
                    {
                      q: "What payment methods do you accept?",
                      a: "We accept all major credit cards and debit cards through our secure payment processor."
                    }
                  ].map((faq, i) => (
                    <Card key={i} className="p-6 rounded-2xl border-2 border-border/50 bg-card/50 backdrop-blur-xl hover:border-primary/50 transition-colors">
                      <h3 className="font-semibold text-lg mb-3 text-foreground">
                        {faq.q}
                      </h3>
                      <p className="text-muted-foreground font-medium leading-relaxed">
                        {faq.a}
                      </p>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="license" className="space-y-16 mt-0">
              {/* License Key Purchase */}
              <LicenseKeyPurchase />

              {/* License Benefits */}
              <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="font-display text-4xl font-bold mb-4">
                    Why choose a one-time license?
                  </h2>
                  <p className="text-xl text-muted-foreground">
                    Own your software forever with a single payment
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: <Zap className="h-8 w-8" />,
                      title: "Instant Delivery",
                      description: "Get your license key via email within seconds of purchase",
                      gradient: "from-green-500 to-emerald-500"
                    },
                    {
                      icon: <Shield className="h-8 w-8" />,
                      title: "Lifetime Access",
                      description: "Pay once, use forever. No recurring subscription fees",
                      gradient: "from-blue-500 to-cyan-500"
                    },
                    {
                      icon: <Lock className="h-8 w-8" />,
                      title: "Secure Activation",
                      description: "Military-grade encryption with email verification",
                      gradient: "from-purple-500 to-pink-500"
                    }
                  ].map((benefit, i) => (
                    <Card key={i} className="relative p-8 rounded-3xl border-2 border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden group hover:border-primary/50 transition-all">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                      
                      <div className="relative space-y-4">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center text-white shadow-lg`}>
                          {benefit.icon}
                        </div>
                        
                        <div>
                          <h3 className="font-display text-xl font-bold mb-2">
                            {benefit.title}
                          </h3>
                          <p className="text-muted-foreground font-medium">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Final CTA */}
        <div className="relative border-t border-border/50 bg-gradient-to-br from-primary/5 via-purple-500/5 to-pink-500/5 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-20">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="space-y-4">
                <h2 className="font-display text-4xl md:text-5xl font-bold">
                  Ready to supercharge your productivity?
                </h2>
                <p className="text-xl text-muted-foreground">
                  Join thousands of professionals who trust 9TD for their task management
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => router.push(session?.user ? "/" : "/register")}
                  className="h-14 px-8 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all text-lg"
                >
                  {session?.user ? "Go to Dashboard" : "Start Free Trial"}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="h-14 px-8 rounded-xl font-semibold border-2 text-lg"
                >
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Talk to Sales
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Free for 14 days</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}