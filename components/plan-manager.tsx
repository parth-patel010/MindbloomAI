"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Crown, Zap, Check, Sparkles, CreditCard, Calendar, ExternalLink } from "lucide-react"
import { usePlan } from "@/lib/plan-context"
import PaymentGateway from "./payment-gateway";

interface PlanManagerProps {
  onBack: () => void
}

export default function PlanManager({ onBack }: PlanManagerProps) {
  const { currentPlan, credits, loading } = usePlan();
  const [showPayment, setShowPayment] = useState(false);
  const [upgrading, setUpgrading] = useState(false)

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const result = await upgradeToProPlan()
      if (!result.success) {
        alert(result.error || "Upgrade failed. Please try again.")
      }
      // If successful, user will be redirected to Stripe Checkout
    } catch (error) {
      alert("An error occurred. Please try again.")
    } finally {
      setUpgrading(false)
    }
  }

  const plans = [
    {
      id: "free",
      name: "Free Plan",
      price: "₹0",
      period: "forever",
      credits: 3,
      icon: Zap,
      color: "from-blue-500 to-indigo-600",
      bgColor: "from-blue-50 to-indigo-50",
      features: [
        "3 AI consultations per month",
        "Basic mood tracking",
        "Parent communication help",
        "Focus assistance",
        "Overwhelm support",
      ],
      current: currentPlan === "free",
    },
    {
      id: "pro",
      name: "Pro Plan",
      price: "₹99",
      period: "per month",
      credits: 100,
      icon: Crown,
      color: "from-yellow-500 to-orange-600",
      bgColor: "from-yellow-50 to-orange-50",
      features: [
        "100 AI consultations per month",
        "Advanced mood analytics",
        "Priority support",
        "Unlimited parent communication help",
        "Advanced focus strategies",
        "Stress management tools",
        "Progress tracking",
      ],
      current: currentPlan === "pro",
      popular: true,
    },
  ]

  return (
    <div className="min-h-screen min-w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-0 m-0">
      {showPayment ? (
        <PaymentGateway onBack={() => setShowPayment(false)} />
      ) : (
        <Card className="w-full min-h-screen h-full bg-white/90 backdrop-blur-sm border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-500 rounded-none">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="ml-2 flex items-center text-lg sm:text-xl">
                <CreditCard className="h-5 w-5 mr-2 animate-pulse" />
                Manage Your Plan
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Current Status */}
            <div className="text-center p-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl border border-teal-100 animate-in slide-in-from-top-4 duration-500">
              <div className="flex items-center justify-center mb-2">
                {currentPlan === "pro" ? (
                  <Crown className="h-6 w-6 text-yellow-600 mr-2" />
                ) : (
                  <Zap className="h-6 w-6 text-blue-600 mr-2" />
                )}
                <span className="font-semibold text-gray-800 text-base sm:text-lg">
                  Currently on {currentPlan === "pro" ? "Pro" : "Free"} Plan
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-teal-600 mb-1">
                {loading ? "..." : credits} credits remaining
              </div>
              <div className="text-sm text-gray-600">
                {currentPlan === "pro" ? "Resets monthly" : "Resets monthly on free plan"}
              </div>
            </div>
            {/* Plans */}
            <div className="space-y-4">
              {plans.map((plan, index) => {
                const IconComponent = plan.icon;
                return (
                  <div
                    key={plan.id}
                    className={`relative p-5 rounded-2xl border-2 transition-all duration-300 animate-in slide-in-from-left-4 duration-500 ${plan.current
                        ? "border-green-300 bg-gradient-to-r from-green-50 to-emerald-50"
                        : `bg-gradient-to-r ${plan.bgColor} border-gray-200 hover:border-gray-300`
                      }`}
                    style={{ animationDelay: `${600 + index * 100}ms` }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                          MOST POPULAR
                        </div>
                      </div>
                    )}
                    {plan.current && (
                      <div className="absolute -top-3 right-4">
                        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center">
                          <Check className="h-3 w-3 mr-1" />
                          CURRENT
                        </div>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className={`p-3 rounded-xl bg-gradient-to-r ${plan.color} text-white shadow-lg mr-4`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-800">{plan.name}</h3>
                          <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-gray-900">{plan.price}</span>
                            <span className="text-sm text-gray-600 ml-1">/{plan.period}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center mb-2">
                        <Sparkles className="h-4 w-4 text-purple-500 mr-2" />
                        <span className="font-semibold text-gray-700">{plan.credits} AI consultations/month</span>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm text-gray-600">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    {!plan.current && plan.id === "pro" && (
                      <Button
                        onClick={() => setShowPayment(true)}
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                      >
                        <div className="flex items-center justify-center">
                          <Crown className="h-4 w-4 mr-2" />
                          Upgrade to Pro
                        </div>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
            {/* Payment Info */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 animate-in slide-in-from-bottom-4 duration-500 delay-800">
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <CreditCard className="h-4 w-4 mr-2" />
                <span className="font-medium">Secure Payment</span>
              </div>
              <div className="text-xs text-gray-500">
                Your payment is processed securely. You can cancel anytime from your account.
              </div>
            </div>
            {/* Next Billing */}
            {currentPlan === "pro" && (
              <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 animate-in slide-in-from-bottom-4 duration-500 delay-900">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Next billing: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            )}
            <Button
              onClick={onBack}
              variant="outline"
              className="w-full bg-white/70 border-gray-200 hover:bg-gray-50 animate-in slide-in-from-bottom-4 duration-500 delay-1000"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
