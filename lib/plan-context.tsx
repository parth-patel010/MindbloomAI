"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth"

interface PlanContextType {
  currentPlan: "free" | "pro"
  credits: number
  loading: boolean
  refreshPlan: () => Promise<void>
  useCredit: () => Promise<boolean>
  upgradeToProPlan: () => Promise<{ success: boolean; error?: string }>
}

const PlanContext = createContext<PlanContextType | undefined>(undefined)

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro">("free")
  const [credits, setCredits] = useState(3)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      refreshPlan()
    } else {
      setLoading(false)
    }
  }, [user])

  const refreshPlan = async () => {
    if (!user) return

    setLoading(true)
    try {
      const response = await fetch(`/api/plan/status?userId=${user.id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentPlan(data.plan)
        setCredits(data.credits)
      } else {
        // Default to free plan if API fails
        setCurrentPlan("free")
        setCredits(3)
      }
    } catch (error) {
      console.error("Error fetching plan status:", error)
      setCurrentPlan("free")
      setCredits(3)
    } finally {
      setLoading(false)
    }
  }

  const useCredit = async (): Promise<boolean> => {
    if (!user || credits <= 0) return false

    try {
      const response = await fetch("/api/plan/use-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })

      if (response.ok) {
        const data = await response.json()
        setCredits(data.remainingCredits)
        return true
      }
      return false
    } catch (error) {
      console.error("Error using credit:", error)
      return false
    }
  }

  const upgradeToProPlan = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "User not authenticated" }

    try {
      const response = await fetch("/api/plan/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Redirect to Stripe Checkout
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl
        }
        return { success: true }
      } else {
        return { success: false, error: data.error || "Upgrade failed" }
      }
    } catch (error) {
      console.error("Error upgrading plan:", error)
      return { success: false, error: "Network error occurred" }
    }
  }

  return (
    <PlanContext.Provider
      value={{
        currentPlan,
        credits,
        loading,
        refreshPlan,
        useCredit,
        upgradeToProPlan,
      }}
    >
      {children}
    </PlanContext.Provider>
  )
}

export function usePlan() {
  const context = useContext(PlanContext)
  if (context === undefined) {
    throw new Error("usePlan must be used within a PlanProvider")
  }
  return context
}
