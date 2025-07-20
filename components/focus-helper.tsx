"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { CardContent } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CardHeader } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { Focus } from "lucide-react"
import { Sparkles } from "lucide-react"
import { Brain } from "lucide-react"
import { Smartphone, Music, Users, Coffee, Tv } from "lucide-react"
import { useAuth } from "@/lib/auth"

const commonDistractions = [
  { label: "Social Media", icon: Smartphone, color: "bg-blue-100 text-blue-700 border-blue-200" },
  { label: "Music/Videos", icon: Music, color: "bg-purple-100 text-purple-700 border-purple-200" },
  { label: "Friends/Family", icon: Users, color: "bg-green-100 text-green-700 border-green-200" },
  { label: "Hunger/Snacks", icon: Coffee, color: "bg-orange-100 text-orange-700 border-orange-200" },
  { label: "TV/Netflix", icon: Tv, color: "bg-red-100 text-red-700 border-red-200" },
  { label: "Daydreaming", icon: Brain, color: "bg-pink-100 text-pink-700 border-pink-200" },
]

interface FocusHelperProps {
  onBack: () => void
}

export default function FocusHelper({ onBack }: FocusHelperProps) {
  const [situation, setSituation] = useState("")
  const [selectedDistractions, setSelectedDistractions] = useState<string[]>([])
  const [advice, setAdvice] = useState("")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const { user } = useAuth()

  const handleSubmit = async () => {
    if (!situation.trim() || !user) return

    setLoading(true)
    setErrorMsg("")
    try {
      const response = await fetch("/api/focus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          situation,
          distractions: selectedDistractions,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setAdvice(data.advice)
      } else {
        const data = await response.json()
        setErrorMsg(data.message || "Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error("Error getting focus advice:", error)
      setErrorMsg("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleDistraction = (distraction: string) => {
    setSelectedDistractions((prev) =>
      prev.includes(distraction) ? prev.filter((d) => d !== distraction) : [...prev, distraction],
    )
  }

  if (advice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="ml-2 flex items-center text-lg sm:text-xl">
                <Focus className="h-5 w-5 mr-2 animate-pulse" />
                Your Focus Strategy
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 shadow-inner">
              <div className="flex items-center mb-3">
                <Sparkles className="h-5 w-5 text-indigo-500 mr-2 animate-pulse" />
                <span className="text-sm font-medium text-indigo-700">AI-Powered Focus Tips</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">{advice}</p>
              </div>
            </div>
            <Button
              onClick={onBack}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 sm:p-6 flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="ml-2 flex items-center text-lg sm:text-xl">
              <Focus className="h-5 w-5 mr-2 animate-pulse" />I Can't Focus
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Situation Input */}
          <div className="animate-in slide-in-from-left-4 duration-500">
            <h3 className="font-semibold mb-3 text-gray-800 flex items-center text-base sm:text-lg">
              <Brain className="h-4 w-4 mr-2 text-blue-500" />
              What's making it hard to focus?
            </h3>
            <Textarea
              placeholder="Describe what you're trying to focus on and what's challenging... 🧠"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              className="bg-white/70 border-blue-200 focus:border-blue-400 focus:ring-blue-200 rounded-xl"
              rows={3}
            />
          </div>

          {/* Distractions */}
          <div className="animate-in slide-in-from-right-4 duration-500 delay-200">
            <h3 className="font-semibold mb-4 text-gray-800 text-base sm:text-lg">What's distracting you?</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {commonDistractions.map((distraction) => {
                const IconComponent = distraction.icon
                const isSelected = selectedDistractions.includes(distraction.label)
                return (
                  <button
                    key={distraction.label}
                    onClick={() => toggleDistraction(distraction.label)}
                    className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 text-sm font-medium transform hover:scale-105 border-2 ${
                      isSelected
                        ? `${distraction.color} border-current shadow-lg scale-105`
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border-transparent hover:border-gray-200"
                    }`}
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {distraction.label}
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
            disabled={!situation.trim() || loading}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 py-3 text-lg font-semibold rounded-xl animate-in slide-in-from-bottom-4 duration-500 delay-300"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Getting focus strategies...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Get Focus Help
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
