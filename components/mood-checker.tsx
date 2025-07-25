"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Heart, Wind, Mic, Lightbulb, Sparkles, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { usePlan } from "@/lib/plan-context"

const moodEmojis = ["😢", "😕", "😐", "🙂", "😊"]
const moodLabels = ["Very Sad", "Sad", "Neutral", "Good", "Great"]

const activities = [
  {
    icon: Wind,
    label: "Start 1-min breathwork",
    color: "bg-green-100 text-green-700",
    hoverColor: "hover:bg-green-200",
  },
  {
    icon: Mic,
    label: "Try a 60-sec voice journaling",
    color: "bg-blue-100 text-blue-700",
    hoverColor: "hover:bg-blue-200",
  },
  {
    icon: Lightbulb,
    label: "Today's pep thought",
    color: "bg-yellow-100 text-yellow-700",
    hoverColor: "hover:bg-yellow-200",
  },
]

interface MoodCheckerProps {
  onBack: () => void
}

export default function MoodChecker({ onBack }: MoodCheckerProps) {
  const [selectedMood, setSelectedMood] = useState<number | null>(null)
  const [notes, setNotes] = useState("")
  const [selectedActivities, setSelectedActivities] = useState<string[]>([])
  const [advice, setAdvice] = useState("")
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { refreshPlan } = usePlan()
  const [errorMsg, setErrorMsg] = useState("")

  const handleSubmit = async () => {
    if (selectedMood === null || !user) return

    setLoading(true)
    setErrorMsg("")
    try {
      const response = await fetch("/api/mood", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          moodScore: selectedMood + 1,
          moodText: moodLabels[selectedMood],
          activities: selectedActivities,
          notes,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setAdvice(data.advice)
        // Refresh plan to update credit count
        await refreshPlan()
      } else {
        if (data.error === "INSUFFICIENT_CREDITS") {
          setErrorMsg(data.message || "You don't have enough credits. Please upgrade to continue.")
        } else {
          setErrorMsg(data.message || "Something went wrong. Please try again.")
        }
      }
    } catch (error) {
      console.error("Error submitting mood:", error)
      setErrorMsg("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleActivity = (activity: string) => {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity],
    )
  }

  if (advice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 sm:p-6 flex items-center justify-center">
        <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-t-lg">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <CardTitle className="ml-2 flex items-center text-lg sm:text-xl">
                <Heart className="h-5 w-5 mr-2 animate-pulse" />
                Your Personalized Advice
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 sm:p-8 space-y-6">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-6 rounded-xl border border-pink-100 shadow-inner">
              <div className="flex items-center mb-3">
                <Sparkles className="h-5 w-5 text-purple-500 mr-2 animate-pulse" />
                <span className="text-sm font-medium text-purple-700">AI-Powered Support</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">{advice}</p>
              </div>
            </div>
            <Button
              onClick={onBack}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen min-w-full bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-0 m-0">
      <Card className="w-full min-h-screen h-full bg-white/90 backdrop-blur-sm border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-500 rounded-none">
        <CardHeader className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="ml-2 flex items-center text-lg sm:text-xl">
              <Heart className="h-5 w-5 mr-2 animate-pulse" />
              Mood & Mental Check-In
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-8">
          {/* Mood Selection */}
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">How are you feeling today?</h3>
            <div className="flex justify-center space-x-3 mb-4 flex-wrap gap-y-2">
              {moodEmojis.map((emoji, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedMood(index)}
                  className={`text-5xl p-3 rounded-full transition-all duration-300 transform hover:scale-110 ${selectedMood === index
                    ? "bg-gradient-to-r from-pink-100 to-purple-100 scale-110 shadow-lg ring-4 ring-pink-200"
                    : "hover:bg-gray-100 hover:shadow-md"
                    }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            {selectedMood !== null && (
              <div className="animate-in fade-in-50 duration-300">
                <p className="text-purple-600 font-semibold text-lg">{moodLabels[selectedMood]}</p>
              </div>
            )}
          </div>

          {/* What's going on? */}
          <div className="animate-in slide-in-from-left-4 duration-500 delay-200">
            <h3 className="font-semibold mb-3 text-center text-gray-800 text-base sm:text-lg">What's going on?</h3>
            <Textarea
              placeholder="Share what's on your mind... 💭"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-white/70 border-purple-200 focus:border-purple-400 focus:ring-purple-200 rounded-xl"
              rows={3}
            />
          </div>

          {errorMsg && (
            <div className="animate-in slide-in-from-top-2 duration-300">
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start">
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Unable to process request</p>
                  <p className="text-xs mt-1">{errorMsg}</p>
                </div>
              </div>
            </div>
          )}

          {/* Activities */}
          <div className="space-y-3 animate-in slide-in-from-right-4 duration-500 delay-300">
            <h3 className="font-semibold text-center text-gray-800 mb-4 text-base sm:text-lg">Try these activities:</h3>
            {activities.map((activity, index) => {
              const IconComponent = activity.icon
              const isSelected = selectedActivities.includes(activity.label)
              return (
                <button
                  key={index}
                  onClick={() => toggleActivity(activity.label)}
                  className={`w-full flex items-center p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${isSelected
                    ? `${activity.color} border-2 border-current shadow-lg scale-105`
                    : `bg-gray-50 hover:bg-gray-100 border-2 border-transparent ${activity.hoverColor} hover:shadow-md`
                    }`}
                >
                  <div className={`p-3 rounded-xl mr-4 ${isSelected ? "bg-white/30" : activity.color}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-left">{activity.label}</span>
                </button>
              )
            })}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={selectedMood === null || loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 py-3 text-lg font-semibold rounded-xl"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Getting your personalized advice...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Sparkles className="h-5 w-5 mr-2" />
                Get AI-Powered Advice (1 credit)
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
