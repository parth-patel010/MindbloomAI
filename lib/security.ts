import { randomBytes } from "crypto"
import bcrypt from "bcryptjs"

// Password security configuration
export const PASSWORD_CONFIG = {
  minLength: 8,
  maxLength: 128,
  saltRounds: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false,
}

// Enhanced security configuration
export const SECURITY_CONFIG = {
  JWT_SECRET: "752b2236bce2a73cdf4aec81d7b5108fbc2777d19e4bc4e25dfc074d7948e828",
  JWT_REFRESH_SECRET: "752b2236bce2a73cdf4aec81d7b5108fbc2777d19e4bc4e25dfc074d7948e828_refresh",
  SESSION_DURATION: 24 * 60 * 60, // 24 hours
  REFRESH_DURATION: 7 * 24 * 60 * 60, // 7 days
}

// Hash password securely
export async function hashPassword(password: string): Promise<string> {
  try {
    return await bcrypt.hash(password, PASSWORD_CONFIG.saltRounds)
  } catch (error) {
    console.error("Password hashing failed:", error)
    throw new Error("Password hashing failed")
  }
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hashedPassword)
  } catch (error) {
    console.error("Password verification failed:", error)
    return false
  }
}

// Generate secure random token
export function generateSecureToken(length = 32): string {
  return randomBytes(length).toString("hex")
}

// Validate password strength
export function validatePasswordStrength(password: string): {
  isValid: boolean
  errors: string[]
  score: number
} {
  const errors: string[] = []
  let score = 0

  // Length check
  if (password.length < PASSWORD_CONFIG.minLength) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.minLength} characters long`)
  } else if (password.length >= PASSWORD_CONFIG.minLength) {
    score += 1
  }

  if (password.length > PASSWORD_CONFIG.maxLength) {
    errors.push(`Password must be less than ${PASSWORD_CONFIG.maxLength} characters long`)
  }

  // Character requirements
  if (PASSWORD_CONFIG.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  } else if (/[A-Z]/.test(password)) {
    score += 1
  }

  if (PASSWORD_CONFIG.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  } else if (/[a-z]/.test(password)) {
    score += 1
  }

  if (PASSWORD_CONFIG.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number")
  } else if (/\d/.test(password)) {
    score += 1
  }

  if (PASSWORD_CONFIG.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain at least one special character")
  } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1
  }

  // Additional security checks
  if (password.length >= 12) score += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(score, 5), // Max score of 5
  }
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+=/gi, "") // Remove event handlers
    .substring(0, 1000) // Limit length
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return generateSecureToken(32)
}

// Rate limiting with sliding window
const rateLimitStore = new Map<string, { requests: number[]; blocked: boolean; blockUntil?: number }>()

export function checkRateLimit(
  identifier: string,
  maxRequests = 5,
  windowMs: number = 15 * 60 * 60 * 1000, // 15 minutes
  blockDurationMs: number = 60 * 60 * 1000, // 1 hour
): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now()
  const windowStart = now - windowMs

  let userLimit = rateLimitStore.get(identifier)

  if (!userLimit) {
    userLimit = { requests: [], blocked: false }
    rateLimitStore.set(identifier, userLimit)
  }

  // Check if user is currently blocked
  if (userLimit.blocked && userLimit.blockUntil && now < userLimit.blockUntil) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: userLimit.blockUntil,
    }
  }

  // Clear expired block
  if (userLimit.blocked && userLimit.blockUntil && now >= userLimit.blockUntil) {
    userLimit.blocked = false
    userLimit.blockUntil = undefined
    userLimit.requests = []
  }

  // Remove old requests outside the window
  userLimit.requests = userLimit.requests.filter((timestamp) => timestamp > windowStart)

  // Check if limit exceeded
  if (userLimit.requests.length >= maxRequests) {
    // Block user for extended period
    userLimit.blocked = true
    userLimit.blockUntil = now + blockDurationMs

    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: userLimit.blockUntil,
    }
  }

  // Add current request
  userLimit.requests.push(now)

  return {
    allowed: true,
    remainingRequests: maxRequests - userLimit.requests.length,
    resetTime: windowStart + windowMs,
  }
}
