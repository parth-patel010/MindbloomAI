"use client"

import { useState, useEffect } from "react"
import { useAuth, AuthProvider } from "@/lib/auth"
import { PlanProvider } from "@/lib/plan-context"
import AuthForm from "@/components/auth-form"
import MoodChecker from "@/components/mood-checker"
import ParentTranslator from "@/components/parent-translator"
import FocusHelper from "@/components/focus-helper"
import OverwhelmHelper from "@/components/overwhelm-helper"
import PlanManager from "@/components/plan-manager"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, Focus, Waves, Sparkles, Crown, Zap } from "lucide-react"
import { usePlan } from "@/lib/plan-context"
import { useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

function Dashboard() {
  const [currentView, setCurrentView] = useState<"dashboard" | "mood" | "parent" | "focus" | "overwhelm" | "plan">(
    "dashboard",
  )
  const { user, logout } = useAuth()
  const { currentPlan, credits, loading: planLoading, refreshPlan } = usePlan()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")
    const sessionId = searchParams.get("session_id")

    const handlePaymentRedirect = async () => {
      if (success && sessionId && user) {
        try {
          const response = await fetch("/api/plan/confirm-upgrade", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: user.id, sessionId }),
          })

          const data = await response.json()

          if (response.ok && data.success) {
            toast({
              title: "🎉 Plan Upgraded!",
              description: "Your MindBloom Pro plan has been activated successfully. Enjoy your new credits!",
              duration: 5000,
            })
            await refreshPlan() // Refresh plan context to show updated credits
          } else {
            toast({
              title: "❌ Upgrade Failed",
              description: data.error || "There was an issue confirming your payment. Please contact support.",
              variant: "destructive",
              duration: 7000,
            })
          }
        } catch (error) {
          console.error("Error confirming payment:", error)
          toast({
            title: "❌ Network Error",
            description: "Could not confirm payment due to a network issue. Please try again.",
            variant: "destructive",
            duration: 7000,
          })
        }
      } else if (canceled) {
        toast({
          title: "❌ Upgrade Canceled",
          description: "Your plan upgrade was canceled. You can try again anytime.",
          variant: "destructive",
          duration: 5000,
        })
      }
      // Clear the query parameters to prevent toast from showing again on refresh
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    if (user) {
      handlePaymentRedirect()
    }
  }, [searchParams, toast, user, refreshPlan])

  const supportOptions = [
    {
      id: "mood",
      label: "Mood Check-In",
      description: "Check your emotional well-being",
      icon: Heart,
      color: "from-pink-500 to-purple-600",
      bgColor: "bg-gradient-to-br from-pink-50 to-purple-50",
      credits: 1,
    },
    {
      id: "parent",
      label: "Calm a Fight with Parents",
      description: "Get help communicating with parents",
      icon: MessageCircle,
      color: "from-teal-500 to-green-600",
      bgColor: "bg-gradient-to-br from-teal-50 to-green-50",
      credits: 1,
    },
    {
      id: "focus",
      label: "I Can't Focus",
      description: "Get strategies to improve concentration",
      icon: Focus,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-gradient-to-br from-blue-50 to-indigo-50",
      credits: 1,
    },
    {
      id: "overwhelm",
      label: "I Feel Overwhelmed",
      description: "Find calm in the chaos",
      icon: Waves,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
      credits: 1,
    },
  ]

  const handleOptionClick = (optionId: string, requiredCredits: number) => {
    if (credits < requiredCredits) {
      setCurrentView("plan")
      return
    }
    setCurrentView(optionId as any)
  }

  if (currentView === "mood") {
    return <MoodChecker onBack={() => setCurrentView("dashboard")} />
  }

  if (currentView === "parent") {
    return <ParentTranslator onBack={() => setCurrentView("dashboard")} />
  }

  if (currentView === "focus") {
    return <FocusHelper onBack={() => setCurrentView("dashboard")} />
  }

  if (currentView === "overwhelm") {
    return <OverwhelmHelper onBack={() => setCurrentView("dashboard")} />
  }

  if (currentView === "plan") {
    return <PlanManager onBack={() => setCurrentView("dashboard")} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        <CardContent className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4 animate-in zoom-in-50 duration-500">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl shadow-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent mb-2 animate-in slide-in-from-top-4 duration-500 delay-200">
              MindBloom
            </h1>
            <p className="text-gray-600 text-sm sm:text-base mb-6 animate-in slide-in-from-top-4 duration-500 delay-300">
              Where student minds thrive ✨
            </p>

            {/* Current Plan Display */}
            <div className="mb-6 animate-in slide-in-from-top-4 duration-500 delay-400">
              <button
                onClick={() => setCurrentView("plan")}
                className={`w-full p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                  currentPlan === "pro"
                    ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 hover:border-yellow-300"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {currentPlan === "pro" ? (
                      <Crown className="h-5 w-5 text-yellow-600 mr-2" />
                    ) : (
                      <Zap className="h-5 w-5 text-blue-600 mr-2" />
                    )}
                    <div className="text-left">
                      <div className="font-semibold text-gray-800">
                        {currentPlan === "pro" ? "Pro Plan" : "Free Plan"}
                      </div>
                      <div className="text-sm text-gray-600">
                        {planLoading ? "Loading..." : `${credits} credits remaining`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Tap to manage</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 p-3 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl animate-in slide-in-from-top-4 duration-500 delay-500">
              <span className="text-sm text-gray-600 mb-2 sm:mb-0">
                Welcome back, <span className="font-semibold text-teal-600">{user?.name}</span> 👋
              </span>
              <Button variant="ghost" size="sm" onClick={logout} className="text-gray-500 hover:text-gray-700">
                Sign Out
              </Button>
            </div>

            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 animate-in slide-in-from-top-4 duration-500 delay-600">
              How can we support your mind today? 💙
            </h2>
          </div>

          {/* Support Options */}
          <div className="space-y-4">
            {supportOptions.map((option, index) => {
              const IconComponent = option.icon
              const canUse = credits >= option.credits
              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id, option.credits)}
                  disabled={!canUse && currentPlan === "free"}
                  className={`w-full text-left p-5 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                    option.bgColor
                  } border border-white/50 animate-in slide-in-from-left-4 duration-500 ${
                    canUse ? "opacity-100" : "opacity-60"
                  }`}
                  style={{ animationDelay: `${700 + index * 100}ms` }}
                >
                  <div className="flex items-center">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${option.color} text-white shadow-lg mr-4`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-800 text-lg mb-1 flex items-center flex-wrap">
                        {option.label}
                        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full mt-1 sm:mt-0">
                          {option.credits} credit{option.credits > 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                      {!canUse && <div className="text-xs text-red-500 mt-1">Not enough credits - Upgrade to Pro</div>}
                    </div>
                    <div className="text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Footer Message */}
          <div className="mt-8 text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 animate-in slide-in-from-bottom-4 duration-500 delay-1000">
            <p className="text-sm text-gray-600">Remember: You're not alone in this journey 🌱</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 border-t-teal-600 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-teal-600 animate-pulse" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Loading MindBloom...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing your wellness journey ✨</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthForm />
  }

  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <PlanProvider>
        <AppContent />
      </PlanProvider>
    </AuthProvider>
  )
}
