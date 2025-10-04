"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth"
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  Lock,
  Mail,
  User,
  Sparkles,
  Check,
  X,
  Brain,
} from "lucide-react"

interface PasswordStrength {
  score: number
  feedback: string[]
  color: string
}

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    color: "bg-gray-200",
  })

  const { login, register } = useAuth()

  // Password strength calculation
  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    let score = 0
    const feedback: string[] = []

    if (pwd.length >= 8) {
      score += 1
    } else {
      feedback.push("At least 8 characters")
    }

    if (/[A-Z]/.test(pwd)) {
      score += 1
    } else {
      feedback.push("One uppercase letter")
    }

    if (/[a-z]/.test(pwd)) {
      score += 1
    } else {
      feedback.push("One lowercase letter")
    }

    if (/\d/.test(pwd)) {
      score += 1
    } else {
      feedback.push("One number")
    }

    if (pwd.length >= 12) score += 1
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1

    let color = "bg-red-400"
    if (score >= 2) color = "bg-yellow-400"
    if (score >= 4) color = "bg-green-400"
    if (score >= 5) color = "bg-emerald-500"

    return { score: Math.min(score, 5), feedback, color }
  }

  // Real-time validation
  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = { ...validationErrors }

    switch (field) {
      case "email":
        if (!value) {
          errors.email = "Email is required"
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.email = "Please enter a valid email address"
        } else {
          delete errors.email
        }
        break
      case "password":
        if (!value) {
          errors.password = "Password is required"
        } else if (!isLogin) {
          const strength = calculatePasswordStrength(value)
          setPasswordStrength(strength)
          if (strength.score < 3) {
            errors.password = "Password is too weak"
          } else {
            delete errors.password
          }
        } else {
          delete errors.password
        }
        break
      case "name":
        if (!isLogin) {
          if (!value) {
            errors.name = "Name is required"
          } else if (!/^[a-zA-Z\s'-]+$/.test(value)) {
            errors.name = "Name can only contain letters, spaces, hyphens, and apostrophes"
          } else if (value.length < 2) {
            errors.name = "Name must be at least 2 characters"
          } else {
            delete errors.name
          }
        } else {
          delete errors.name
        }
        break
    }

    setValidationErrors(errors)
  }

  // Update password strength on password change
  useEffect(() => {
    if (!isLogin && password) {
      const strength = calculatePasswordStrength(password)
      setPasswordStrength(strength)
    }
  }, [password, isLogin])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    // Validate all fields
    validateField("email", email)
    validateField("password", password)
    if (!isLogin) validateField("name", name)

    // Check if there are validation errors
    if (Object.keys(validationErrors).length > 0) {
      setLoading(false)
      return
    }

    try {
      let result
      if (isLogin) {
        result = await login(email, password)
      } else {
        result = await register(email, password, name)
      }

      if (result.success) {
        setSuccess(isLogin ? "Login successful! Welcome back! 🎉" : "Registration successful! Welcome to MindBloom! 🌟")
        // Clear form
        setEmail("")
        setPassword("")
        setName("")
        setPasswordStrength({ score: 0, feedback: [], color: "bg-gray-200" })
      } else {
        // Handle errors
        if (result.error?.details && Array.isArray(result.error.details)) {
          const fieldErrors: Record<string, string> = {}
          result.error.details.forEach((detail: any) => {
            fieldErrors[detail.field] = detail.message
          })
          setValidationErrors(fieldErrors)
        } else {
          setError(result.error?.message || "An unexpected error occurred. Please try again. ❌")
        }
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again. 🌐")
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError(null)
    setSuccess(null)
    setValidationErrors({})
    setEmail("")
    setPassword("")
    setName("")
    setPasswordStrength({ score: 0, feedback: [], color: "bg-gray-200" })
  }

  const getStrengthText = (score: number) => {
    if (score === 0) return "Enter password"
    if (score <= 2) return "Weak"
    if (score <= 3) return "Fair"
    if (score <= 4) return "Good"
    return "Strong"
  }

  return (
    <div className="min-h-screen min-w-full bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-0 m-0">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <Card className="w-full min-h-screen h-full bg-white/95 backdrop-blur-xl border-0 shadow-2xl animate-in slide-in-from-bottom-4 duration-700 relative overflow-hidden rounded-none">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
        <div className="absolute -top-10 -right-10 w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full opacity-20 animate-pulse delay-1000"></div>

        <CardHeader className="text-center pb-2 relative">
          <div className="flex justify-center mb-6 animate-in zoom-in-50 duration-500 delay-200">
            <div className="relative">
              {/* Custom MindBloom Logo */}
              <div className="w-20 h-20 rounded-2xl shadow-lg bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
                <Brain className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          <CardTitle className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-in slide-in-from-top-4 duration-500 delay-300">
            {isLogin ? "Welcome Back" : "Join MindBloom"}
          </CardTitle>

          <CardDescription className="text-gray-600 mt-2 animate-in slide-in-from-top-4 duration-500 delay-400">
            {isLogin ? (
              <span className="flex items-center justify-center text-sm sm:text-base">
                <Lock className="h-4 w-4 mr-2" />
                Develop by FreelanceWithParth
              </span>
            ) : (
              <span className="flex items-center justify-center text-sm sm:text-base">
                <Sparkles className="h-4 w-4 mr-2" />
                Where student minds thrive
              </span>
            )}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-6 pb-6 sm:px-8 sm:pb-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="animate-in slide-in-from-left-4 duration-500 delay-500">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      validateField("name", e.target.value)
                    }}
                    className={`pl-10 bg-white/70 border-2 transition-all duration-200 ${validationErrors.name
                      ? "border-red-300 focus:border-red-500"
                      : "border-gray-200 focus:border-purple-400"
                      } rounded-xl h-12`}
                    disabled={loading}
                  />
                </div>
                {validationErrors.name && (
                  <p className="text-red-500 text-xs mt-2 flex items-center animate-in slide-in-from-left-2 duration-200">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {validationErrors.name}
                  </p>
                )}
              </div>
            )}

            <div className="animate-in slide-in-from-left-4 duration-500 delay-600">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    validateField("email", e.target.value)
                  }}
                  className={`pl-10 bg-white/70 border-2 transition-all duration-200 ${validationErrors.email
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-purple-400"
                    } rounded-xl h-12`}
                  disabled={loading}
                />
                {email && !validationErrors.email && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                )}
              </div>
              {validationErrors.email && (
                <p className="text-red-500 text-xs mt-2 flex items-center animate-in slide-in-from-left-2 duration-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div className="animate-in slide-in-from-left-4 duration-500 delay-700">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    validateField("password", e.target.value)
                  }}
                  className={`pl-10 pr-12 bg-white/70 border-2 transition-all duration-200 ${validationErrors.password
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-200 focus:border-purple-400"
                    } rounded-xl h-12`}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {!isLogin && password && (
                <div className="mt-3 space-y-2 animate-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">Password Strength</span>
                    <span
                      className={`font-medium ${passwordStrength.score <= 2
                        ? "text-red-500"
                        : passwordStrength.score <= 3
                          ? "text-yellow-500"
                          : passwordStrength.score <= 4
                            ? "text-blue-500"
                            : "text-green-500"
                        }`}
                    >
                      {getStrengthText(passwordStrength.score)}
                    </span>
                  </div>
                  <Progress value={(passwordStrength.score / 5) * 100} className="h-2" />
                  {passwordStrength.feedback.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>Missing:</p>
                      <ul className="grid grid-cols-2 gap-1">
                        {passwordStrength.feedback.map((item, index) => (
                          <li key={index} className="flex items-center">
                            <X className="h-3 w-3 text-red-400 mr-1" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {validationErrors.password && (
                <p className="text-red-500 text-xs mt-2 flex items-center animate-in slide-in-from-left-2 duration-200">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {validationErrors.password}
                </p>
              )}
            </div>

            {error && (
              <Alert
                variant="destructive"
                className="animate-in slide-in-from-top-2 duration-300 border-red-200 bg-red-50"
              >
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50 animate-in slide-in-from-top-2 duration-300">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 h-12 text-lg font-semibold rounded-xl animate-in slide-in-from-bottom-4 duration-500 delay-800"
              disabled={loading || Object.keys(validationErrors).length > 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {isLogin ? "Signing In..." : "Creating Account..."}
                </>
              ) : (
                <>
                  <Brain className="mr-2 h-5 w-5" />
                  {isLogin ? "Sign In" : "Create Account"}
                </>
              )}
            </Button>

            <div className="text-center animate-in slide-in-from-bottom-4 duration-500 delay-900">
              <button
                type="button"
                onClick={toggleMode}
                className="text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors duration-200 hover:underline"
                disabled={loading}
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </form>

          {/* Simple footer */}
          <div className="flex items-center justify-center space-x-4 pt-4 border-t border-gray-100 animate-in slide-in-from-bottom-4 duration-500 delay-1000 flex-wrap">
            <div className="flex items-center text-xs text-gray-500 mb-1 sm:mb-0">
              <Shield className="h-3 w-3 mr-1" />
              Secure
            </div>
            <div className="flex items-center text-xs text-gray-500 mb-1 sm:mb-0">
              <Lock className="h-3 w-3 mr-1" />
              Private
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Safe
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
