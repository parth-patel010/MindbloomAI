import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

const sql = neon(process.env.DATABASE_URL)

// Database connection test function
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1 as test`
    return true
  } catch (error) {
    console.error("Database connection failed:", error)
    return false
  }
}

// User interfaces
export interface User {
  id: string
  email: string
  name: string
  email_verified: boolean
  last_login: Date | null
  failed_login_attempts: number
  locked_until: Date | null
  created_at: Date
  updated_at: Date
  plan: string
  credits: number
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  plan_expires_at: Date | null
  credits_reset_at: Date | null
}

export interface UserWithPassword extends User {
  password_hash: string
}

// Database operations with error handling
export async function createUser(userData: {
  id: string
  email: string
  name: string
  password_hash: string
}): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${userData.email}
    `

    if (existingUser.length > 0) {
      return { success: false, error: "User with this email already exists" }
    }

    // Insert new user
    const result = await sql`
      INSERT INTO users (
        id, email, name, password_hash, email_verified,
        failed_login_attempts, created_at, updated_at,
        plan, credits, credits_reset_at
      )
      VALUES (
        ${userData.id}, ${userData.email}, ${userData.name}, ${userData.password_hash},
        false, 0, NOW(), NOW(),
        'free', 3, NOW() + INTERVAL '1 month'
      )
      RETURNING id, email, name, email_verified, last_login,
                failed_login_attempts, locked_until, created_at, updated_at,
                plan, credits, stripe_customer_id, stripe_subscription_id,
                plan_expires_at, credits_reset_at
    `

    if (result.length === 0) {
      return { success: false, error: "Failed to create user" }
    }

    return {
      success: true,
      user: result[0] as User,
    }
  } catch (error) {
    console.error("Database error in createUser:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database operation failed",
    }
  }
}

export async function getUserByEmail(
  email: string,
): Promise<{ success: boolean; error?: string; user?: UserWithPassword }> {
  try {
    const result = await sql`
      SELECT id, email, name, password_hash, email_verified,
             last_login, failed_login_attempts, locked_until, created_at, updated_at,
             plan, credits, stripe_customer_id, stripe_subscription_id,
             plan_expires_at, credits_reset_at
      FROM users 
      WHERE email = ${email}
    `

    if (result.length === 0) {
      return { success: false, error: "User not found" }
    }

    const user = result[0] as UserWithPassword

    // Check if account is locked
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
      return { success: false, error: "Account is temporarily locked due to too many failed login attempts" }
    }

    return {
      success: true,
      user,
    }
  } catch (error) {
    console.error("Database error in getUserByEmail:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database operation failed",
    }
  }
}

export async function updateLoginAttempt(
  userId: string,
  success: boolean,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (success) {
      // Reset failed attempts and update last login
      await sql`
        UPDATE users 
        SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW(), updated_at = NOW()
        WHERE id = ${userId}
      `
    } else {
      // Increment failed attempts
      const result = await sql`
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1,
            locked_until = CASE 
              WHEN failed_login_attempts + 1 >= 5 THEN NOW() + INTERVAL '1 hour'
              ELSE locked_until
            END,
            updated_at = NOW()
        WHERE id = ${userId}
        RETURNING failed_login_attempts
      `

      if (result.length > 0 && result[0].failed_login_attempts >= 5) {
        return { success: false, error: "Account locked due to too many failed attempts" }
      }
    }

    return { success: true }
  } catch (error) {
    console.error("Database error in updateLoginAttempt:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database operation failed",
    }
  }
}

export async function getUserById(id: string): Promise<{ success: boolean; error?: string; user?: User }> {
  try {
    const result = await sql`
      SELECT id, email, name, email_verified, last_login,
             failed_login_attempts, locked_until, created_at, updated_at,
             plan, credits, stripe_customer_id, stripe_subscription_id,
             plan_expires_at, credits_reset_at
      FROM users 
      WHERE id = ${id}
    `

    if (result.length === 0) {
      return { success: false, error: "User not found" }
    }

    return {
      success: true,
      user: result[0] as User,
    }
  } catch (error) {
    console.error("Database error in getUserById:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database operation failed",
    }
  }
}

export async function updateUserPlanAndCredits(
  userId: string,
  plan: "free" | "pro",
  credits: number,
  stripeCustomerId: string | null = null,
  stripeSubscriptionId: string | null = null,
): Promise<{ success: boolean; error?: string }> {
  try {
    await sql`
      UPDATE users
      SET 
        plan = ${plan},
        credits = ${credits},
        stripe_customer_id = ${stripeCustomerId},
        stripe_subscription_id = ${stripeSubscriptionId},
        plan_expires_at = NOW() + INTERVAL '1 month', -- Assuming monthly plans
        credits_reset_at = NOW() + INTERVAL '1 month',
        updated_at = NOW()
      WHERE id = ${userId}
    `
    return { success: true }
  } catch (error) {
    console.error("Database error in updateUserPlanAndCredits:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Database operation failed",
    }
  }
}

// Other database interfaces
export interface MoodEntry {
  id: string
  user_id: string
  mood_score: number
  mood_text: string
  activities: string[]
  notes?: string
  advice?: string
  created_at: Date
}

export interface StudySession {
  id: string
  user_id: string
  subject: string
  duration: number
  break_duration: number
  completed: boolean
  created_at: Date
}

export interface CareerInterest {
  id: string
  user_id: string
  interests: string[]
  skills: string[]
  career_suggestions: string[]
  created_at: Date
}

export interface QuizResult {
  id: string
  user_id: string
  subject: string
  score: number
  total_questions: number
  xp_earned: number
  created_at: Date
}

export interface ParentMessage {
  id: string
  user_id: string
  original_message: string
  translated_message: string
  emotion_tags: string[]
  created_at: Date
}

export { sql }
