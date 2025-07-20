"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  id: string
  email: string
  name: string
  email_verified: boolean
  created_at?: string
}

interface AuthError {
  message: string
  details?: any
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: AuthError }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = () => {
    try {
      // Check localStorage for user data
      const storedUser = localStorage.getItem("mindbloom_user")
      if (storedUser) {
        const userData = JSON.parse(storedUser)
        setUser(userData)
      }
    } catch (error) {
      console.error("Session check error:", error)
      localStorage.removeItem("mindbloom_user")
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        // Store user data in localStorage
        localStorage.setItem("mindbloom_user", JSON.stringify(data.user))
        return { success: true }
      } else {
        return {
          success: false,
          error: {
            message: data.error || "Login failed",
            details: data.details,
          },
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: {
          message: "Network error. Please check your connection and try again.",
        },
      }
    }
  }

  const register = async (
    email: string,
    password: string,
    name: string,
  ): Promise<{ success: boolean; error?: AuthError }> => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUser(data.user)
        // Store user data in localStorage
        localStorage.setItem("mindbloom_user", JSON.stringify(data.user))
        return { success: true }
      } else {
        return {
          success: false,
          error: {
            message: data.error || "Registration failed",
            details: data.details,
          },
        }
      }
    } catch (error) {
      console.error("Registration error:", error)
      return {
        success: false,
        error: {
          message: "Network error. Please check your connection and try again.",
        },
      }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("mindbloom_user")
  }

  // Define the context value explicitly to potentially bypass parsing issues
  const contextValue = { user, login, register, logout, loading }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
