"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Cloud, BookOpen, Users, Clock, Heart, Home, Sparkles, Waves } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { usePlan } from "@/lib/plan-context"

const commonStressors = [
  { label: "School Work", icon: BookOpen, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Social Pressure", icon: Users, color: "bg-purple-100 text-purple-700 border-purple-200" },
  { label: "Time Management", icon: Clock, color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "Family Issues", icon: Home, color: "bg-green-100 text-green-700 border-green-200" },
  { label: "Future Worries", icon: Cloud, color: "bg-gray-100 text-gray-700 border-gray-200" },
  { label: "Self-Doubt", icon: Heart, color: "bg-pink-100 text-pink-700 border-pink-200" },
]

interface OverwhelmHelperProps {
  onBack: () => void
}

export default function OverwhelmHelper({ onBack }: OverwhelmHelperProps) {
  const [selectedStressors, setSelectedStressors] = useState<string[]>([])
  const [intensity, setIntensity] = useState([5])
  const [advice, setAdvice] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const { user } = useAuth()
  const { refreshPlan } = usePlan()

  const handleSubmit = async () => {
    if (selectedStressors.length === 0 || !user) return

    setLoading(true)
    setErrorMsg("")
    try {
      const response = await fetch("/api/overwhelm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          stressors: selectedStressors,
          intensity: intensity[0],
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAdvice(data.advice)
        await refreshPlan() // Update credits after successful AI response
      } else {
        const data = await response.json()
        setErrorMsg(data.message || "Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error("Error getting overwhelm advice:", error)
      setErrorMsg("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleStressor = (stressor: string) => {
    setSelectedStressors((prev) => (prev.includes(stressor) ? prev.filter((s) => s !== stressor) : [...prev, stressor]))
  }

  const getIntensityColor = (value: number) => {
    if (value <= 3) return "text-green-600"
    if (value <= 6) return "text-yellow-600"
    if (value <= 8) return "text-orange-600"
    return "text-red-600"
  }

  const getIntensityLabel = (value: number) => {
    if (value <= 2) return "Mild"
    if (value <= 4) return "Moderate"
    if (value <= 6) return "Noticeable"
    if (value <= 8) return "High"
    return "Overwhelming"
  }

  if (advice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 sm:p-6 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-t-lg">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="ml-2 flex items-center text-lg sm:text-xl">
                <Waves className="h-5 w-5 mr-2 animate-pulse" />
                Your Calm Strategy
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100 shadow-inner">
              <div className="flex items-center mb-3">
                <Sparkles className="h-5 w-5 text-teal-500 mr-2 animate-pulse" />
                <span className="text-sm font-medium text-teal-700">AI-Powered Support</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">{advice}</p>
              </div>
            </div>
            <Button
              onClick={onBack}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-0 m-0">
      <Card className="w-full min-h-screen h-full bg-white/90 backdrop-blur-sm border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-500 rounded-none">
        <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="ml-2 flex items-center text-lg sm:text-xl">
              <Waves className="h-5 w-5 mr-2 animate-pulse" />I Feel Overwhelmed
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Intensity Slider */}
          <div className="animate-in slide-in-from-top-4 duration-500">
            <h3 className="font-semibold mb-4 text-gray-800 flex items-center text-base sm:text-lg">
              <Heart className="h-4 w-4 mr-2 text-emerald-500" />
              How overwhelmed do you feel? (1-10)
            </h3>
            <div className="space-y-4">
              <Slider value={intensity} onValueChange={setIntensity} max={10} min={1} step={1} className="w-full" />
              <div className="text-center">
                <span className={`text-2xl font-bold ${getIntensityColor(intensity[0])}`}>{intensity[0]}/10</span>
                <p className={`text-sm font-medium ${getIntensityColor(intensity[0])}`}>
                  {getIntensityLabel(intensity[0])}
                </p>
              </div>
            </div>
          </div>

          {/* Stressors */}
          <div className="animate-in slide-in-from-left-4 duration-500 delay-200">
            <h3 className="font-semibold mb-4 text-gray-800 text-base sm:text-lg">What's causing the overwhelm?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {commonStressors.map((stressor) => {
                const IconComponent = stressor.icon
                const isSelected = selectedStressors.includes(stressor.label)
                return (
                  <button
                    key={stressor.label}
                    onClick={() => toggleStressor(stressor.label)}
                    className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 text-sm font-medium transform hover:scale-105 border-2 ${isSelected
                      ? `${stressor.color} border-current shadow-lg scale-105`
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-transparent hover:border-gray-200"
                      }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {stressor.label}
                  </button>
                )
              })}
            </div>
          </div>

          {errorMsg && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{errorMsg}</div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={selectedStressors.length === 0 || loading}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 py-3 text-lg font-semibold rounded-xl animate-in slide-in-from-bottom-4 duration-500 delay-300"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Getting calming strategies...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Get Support
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
