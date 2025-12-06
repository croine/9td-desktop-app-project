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
import { ArrowLeft, Check, Zap, Crown, Users, Star, Sparkles, Lock, TrendingUp, Shield, Rocket, Target, Brain, Palette, FileDown, Puzzle, Workflow, Mail, HardDrive, ListChecks, Filter, Flag, BarChart3, Bell, Database, KeyRound, CreditCard, CheckCircle2, XCircle, ArrowRight, Info } from "lucide-react"
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
  
  const urlTab = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState(urlTab === 'license' ? 'license' : 'subscription')
  
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

  return (
    <PageContainer>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <div className="border-b border-border/50">
          <div className="container mx-auto px-4 py-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="gap-2 hover:bg-accent"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Hero Section - Clean & Focused */}
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            {session?.user && !isLoading && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border border-border/50">
                <div className={`w-2 h-2 rounded-full ${
                  planName === "Free" ? "bg-slate-500" :
                  planName === "Pro" ? "bg-primary" :
                  "bg-amber-500"
                }`} />
                <span className="text-sm text-muted-foreground">Currently on</span>
                <span className="text-sm font-semibold text-foreground">{planName}</span>
              </div>
            )}
            
            <h1 className="font-display text-5xl md:text-6xl font-bold tracking-tight">
              Simple, Transparent Pricing
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your workflow. Upgrade, downgrade, or cancel anytime.
            </p>
          </div>
        </div>

        {/* Pricing Tabs */}
        <div className="container mx-auto px-4 pb-16">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-12">
              <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground">
                <TabsTrigger 
                  value="subscription" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Subscription
                </TabsTrigger>
                <TabsTrigger 
                  value="license" 
                  className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2"
                >
                  <KeyRound className="h-4 w-4" />
                  One-Time License
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="subscription" className="space-y-16 mt-0">
              {/* Pricing Table */}
              <PricingTable productDetails={productDetails} />

              {/* Current Usage - Only show for logged in users */}
              {session?.user && (
                <div className="max-w-3xl mx-auto">
                  <div className="mb-8">
                    <h2 className="font-display text-2xl font-semibold mb-2">Your Usage</h2>
                    <p className="text-muted-foreground">
                      Track your feature usage across the current billing period
                    </p>
                  </div>
                  <PlanUsageIndicator />
                </div>
              )}

              {/* Feature Comparison */}
              <div className="max-w-6xl mx-auto">
                <div className="mb-12">
                  <h2 className="font-display text-3xl font-semibold mb-3 text-center">
                    What's included in each plan
                  </h2>
                  <p className="text-center text-muted-foreground">
                    All plans include our core features. Upgrade for advanced capabilities.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Pro Features */}
                  <Card className="p-6 border-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <h3 className="font-semibold">Pro Features</h3>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>1,000 tasks per month</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>Advanced views (Kanban, Gantt, Timeline)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>AI-powered suggestions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>Time tracking & analytics</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>Custom automation rules</span>
                      </li>
                    </ul>
                  </Card>

                  {/* Team Features */}
                  <Card className="p-6 border-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-amber-600 dark:text-amber-500" />
                      </div>
                      <h3 className="font-semibold">Team Features</h3>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <span>Unlimited tasks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <span>Team messaging & collaboration</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <span>Advanced permissions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <span>Team analytics dashboard</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                        <span>API access & integrations</span>
                      </li>
                    </ul>
                  </Card>

                  {/* Enterprise */}
                  <Card className="p-6 border-2">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-purple-600 dark:text-purple-500" />
                      </div>
                      <h3 className="font-semibold">Enterprise Add-ons</h3>
                    </div>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-500 shrink-0 mt-0.5" />
                        <span>SSO & SAML authentication</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-500 shrink-0 mt-0.5" />
                        <span>Custom data retention</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-500 shrink-0 mt-0.5" />
                        <span>Dedicated account manager</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-500 shrink-0 mt-0.5" />
                        <span>SLA guarantees</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-500 shrink-0 mt-0.5" />
                        <span>Custom integrations</span>
                      </li>
                    </ul>
                  </Card>
                </div>
              </div>

              {/* FAQ */}
              <div className="max-w-3xl mx-auto">
                <div className="mb-12">
                  <h2 className="font-display text-3xl font-semibold mb-3 text-center">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-center text-muted-foreground">
                    Common questions about our pricing and plans
                  </p>
                </div>
                
                <div className="space-y-4">
                  <details className="group border border-border rounded-lg overflow-hidden">
                    <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <span className="font-medium">Can I switch plans anytime?</span>
                      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-6 pb-4 text-sm text-muted-foreground border-t border-border pt-4">
                      Yes, you can upgrade or downgrade at any time. When you upgrade, you'll be charged the prorated difference. When you downgrade, you'll receive credit toward your next billing cycle.
                    </div>
                  </details>

                  <details className="group border border-border rounded-lg overflow-hidden">
                    <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <span className="font-medium">What happens if I exceed my task limit?</span>
                      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-6 pb-4 text-sm text-muted-foreground border-t border-border pt-4">
                      You'll receive a notification when you're approaching your limit. If you reach it, you can either upgrade to a higher plan or wait until the next billing cycle. Your existing tasks remain accessible.
                    </div>
                  </details>

                  <details className="group border border-border rounded-lg overflow-hidden">
                    <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <span className="font-medium">Do you offer refunds?</span>
                      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-6 pb-4 text-sm text-muted-foreground border-t border-border pt-4">
                      We offer a 14-day money-back guarantee on all plans. If you're not satisfied, contact our support team for a full refund.
                    </div>
                  </details>

                  <details className="group border border-border rounded-lg overflow-hidden">
                    <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <span className="font-medium">Is my data secure?</span>
                      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-6 pb-4 text-sm text-muted-foreground border-t border-border pt-4">
                      Yes. All data is encrypted in transit and at rest. We use industry-standard security practices and never share your data with third parties.
                    </div>
                  </details>

                  <details className="group border border-border rounded-lg overflow-hidden">
                    <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-accent/50 transition-colors">
                      <span className="font-medium">What payment methods do you accept?</span>
                      <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <div className="px-6 pb-4 text-sm text-muted-foreground border-t border-border pt-4">
                      We accept all major credit cards through Stripe, our secure payment processor. All transactions are PCI-compliant.
                    </div>
                  </details>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="license" className="space-y-16 mt-0">
              {/* License Key Purchase */}
              <LicenseKeyPurchase />

              {/* License Benefits */}
              <div className="max-w-4xl mx-auto">
                <div className="mb-12">
                  <h2 className="font-display text-3xl font-semibold mb-3 text-center">
                    One-Time Purchase Benefits
                  </h2>
                  <p className="text-center text-muted-foreground">
                    Prefer to own your software? Purchase a perpetual license.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <Card className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                      <Zap className="h-6 w-6 text-green-600 dark:text-green-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Instant Delivery</h3>
                    <p className="text-sm text-muted-foreground">
                      Receive your license key via email immediately after purchase
                    </p>
                  </Card>

                  <Card className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-6 w-6 text-blue-600 dark:text-blue-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Secure Activation</h3>
                    <p className="text-sm text-muted-foreground">
                      Cryptographically secure keys with email verification
                    </p>
                  </Card>

                  <Card className="p-6 text-center">
                    <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                      <Mail className="h-6 w-6 text-purple-600 dark:text-purple-500" />
                    </div>
                    <h3 className="font-semibold mb-2">Easy Setup</h3>
                    <p className="text-sm text-muted-foreground">
                      Step-by-step activation instructions included
                    </p>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* CTA Section */}
        <div className="border-t border-border/50 bg-muted/30">
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="font-display text-3xl font-semibold">
                Ready to get started?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join thousands of professionals who trust 9TD for their task management.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button 
                  size="lg" 
                  onClick={() => router.push(session?.user ? "/" : "/register")}
                  className="gap-2"
                >
                  {session?.user ? "Go to Dashboard" : "Start Free Trial"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => router.push("/")}
                >
                  Learn More
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                No credit card required • Cancel anytime • 14-day money-back guarantee
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}