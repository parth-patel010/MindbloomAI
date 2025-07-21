"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Copy, Share, MessageCircle, Sparkles, Heart, Mail } from "lucide-react" // Added Mail icon
import { useAuth } from "@/lib/auth"
import { usePlan } from "@/lib/plan-context"

const emotionTags = [
  {
    label: "Overwhelmed",
    emoji: "😰",
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    hoverColor: "hover:bg-yellow-200",
  },
  {
    label: "Misunderstood",
    emoji: "😔",
    color: "bg-red-100 text-red-700 border-red-200",
    hoverColor: "hover:bg-red-200",
  },
  { label: "Lost", emoji: "😕", color: "bg-gray-100 text-gray-700 border-gray-200", hoverColor: "hover:bg-gray-200" },
  {
    label: "Scared",
    emoji: "😨",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    hoverColor: "hover:bg-purple-200",
  },
  {
    label: "Frustrated",
    emoji: "😤",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    hoverColor: "hover:bg-orange-200",
  },
  {
    label: "Anxious",
    emoji: "😰",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    hoverColor: "hover:bg-blue-200",
  },
]

interface ParentTranslatorProps {
  onBack: () => void
}

export default function ParentTranslator({ onBack }: ParentTranslatorProps) {
  const [originalMessage, setOriginalMessage] = useState("")
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([])
  const [translatedMessage, setTranslatedMessage] = useState("") // This will now be editable
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState("")
  const { user } = useAuth()
  const { refreshPlan } = usePlan()

  const handleTranslate = async () => {
    if (!originalMessage.trim() || !user) return

    setLoading(true)
    setErrorMsg("")
    try {
      const response = await fetch("/api/parent-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          originalMessage,
          emotionTags: selectedEmotions,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setTranslatedMessage(data.translatedMessage)
        await refreshPlan() // Update credits after successful AI response
      } else {
        const data = await response.json()
        setErrorMsg(data.message || "Something went wrong. Please try again.")
      }
    } catch (error) {
      console.error("Error translating message:", error)
      setErrorMsg("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const toggleEmotion = (emotion: string) => {
    setSelectedEmotions((prev) => (prev.includes(emotion) ? prev.filter((e) => e !== emotion) : [...prev, emotion]))
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(translatedMessage)
      // Could add a toast notification here
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const shareMessage = () => {
    if (navigator.share) {
      navigator.share({
        text: translatedMessage,
      })
    } else {
      // Fallback for desktop or unsupported browsers
      alert("Native share not supported on this device. Please use copy or email options.")
    }
  }

  const emailMessage = () => {
    const subject = encodeURIComponent("A message from MindBloom Translator")
    const body = encodeURIComponent(translatedMessage)
    window.open(`mailto:?subject=${subject}&body=${body}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-green-50 to-blue-50 p-4 sm:p-6 flex items-center justify-center">
      <Card className="w-full max-w-md mx-auto bg-white/90 backdrop-blur-sm border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="bg-gradient-to-r from-teal-500 to-green-600 text-white rounded-t-lg">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <CardTitle className="ml-2 flex items-center text-lg sm:text-xl">
              <MessageCircle className="h-5 w-5 mr-2 animate-pulse" />
              DearParents Translator
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6 sm:p-8 space-y-6">
          {!translatedMessage ? (
            <>
              {/* Original Message Input */}
              <div className="animate-in slide-in-from-left-4 duration-500">
                <h3 className="font-semibold mb-3 text-gray-800 flex items-center text-base sm:text-lg">
                  <Heart className="h-4 w-4 mr-2 text-teal-500" />
                  What do you want to say?
                </h3>
                <Textarea
                  placeholder="Type your message to your parents... 💬"
                  value={originalMessage}
                  onChange={(e) => setOriginalMessage(e.target.value)}
                  className="bg-white/70 border-teal-200 focus:border-teal-400 focus:ring-teal-200 rounded-xl"
                  rows={4}
                />
              </div>

              {/* Emotion Tags */}
              <div className="animate-in slide-in-from-right-4 duration-500 delay-200">
                <h3 className="font-semibold mb-4 text-gray-800 text-base sm:text-lg">How are you feeling?</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {emotionTags.map((emotion) => {
                    const isSelected = selectedEmotions.includes(emotion.label)
                    return (
                      <button
                        key={emotion.label}
                        onClick={() => toggleEmotion(emotion.label)}
                        className={`flex items-center justify-center p-3 rounded-xl transition-all duration-300 text-sm font-medium transform hover:scale-105 border-2 ${isSelected
                            ? `${emotion.color} border-current shadow-lg scale-105`
                            : `bg-gray-50 hover:bg-gray-100 text-gray-700 border-transparent ${emotion.hoverColor}`
                          }`}
                      >
                        <span className="mr-2 text-lg">{emotion.emoji}</span>
                        {emotion.label}
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
                onClick={handleTranslate}
                disabled={!originalMessage.trim() || loading}
                className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 py-3 text-lg font-semibold rounded-xl animate-in slide-in-from-bottom-4 duration-500 delay-300"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Translating with AI...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Sparkles className="h-5 w-5 mr-2" />
                    Translate Message
                  </div>
                )}
              </Button>
            </>
          ) : (
            <>
              {/* Translated Message (Editable) */}
              <div className="animate-in slide-in-from-top-4 duration-500">
                <h3 className="font-semibold mb-4 text-gray-800 flex items-center text-base sm:text-lg">
                  <Sparkles className="h-4 w-4 mr-2 text-green-500 animate-pulse" />
                  Here's a kinder way to say it:
                </h3>
                <Textarea
                  value={translatedMessage}
                  onChange={(e) => setTranslatedMessage(e.target.value)}
                  className="bg-gradient-to-r from-teal-50 to-green-50 p-6 rounded-xl border border-teal-100 shadow-inner text-gray-700 leading-relaxed whitespace-pre-line text-base min-h-[150px]"
                  rows={6}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="flex-1 bg-white/70 border-teal-200 hover:bg-teal-50 hover:border-teal-300 transform hover:scale-105 transition-all duration-200"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button
                  onClick={shareMessage}
                  variant="outline"
                  className="flex-1 bg-white/70 border-teal-200 hover:bg-teal-50 hover:border-teal-300 transform hover:scale-105 transition-all duration-200"
                >
                  <Share className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button
                  onClick={emailMessage}
                  variant="outline"
                  className="flex-1 bg-white/70 border-teal-200 hover:bg-teal-50 hover:border-teal-300 transform hover:scale-105 transition-all duration-200"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>

              <Button
                onClick={() => setTranslatedMessage("")} // This now acts as "Start New Translation"
                className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 animate-in slide-in-from-bottom-4 duration-500 delay-300"
              >
                Start New Translation
              </Button>

              <Button
                onClick={onBack}
                variant="outline"
                className="w-full bg-white/70 border-gray-200 hover:bg-gray-50 animate-in slide-in-from-bottom-4 duration-500 delay-400"
              >
                Back to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
