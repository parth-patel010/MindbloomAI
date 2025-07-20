import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, updateLoginAttempt, testDatabaseConnection } from "@/lib/database"
import { loginSchema, sanitizeInput } from "@/lib/validation"
import { verifyPassword } from "@/lib/security"

export async function POST(request: NextRequest) {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection()
    if (!dbConnected) {
      console.error("Database connection failed during login")
      return NextResponse.json(
        {
          success: false,
          error: "Service temporarily unavailable. Please try again later.",
        },
        { status: 503 },
      )
    }

    // Parse request body
    let requestBody
    try {
      requestBody = await request.json()
    } catch (error) {
      console.error("JSON parsing error:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request format. Please check your data and try again.",
        },
        { status: 400 },
      )
    }

    // Sanitize and validate inputs
    const sanitizedData = {
      email: sanitizeInput(requestBody.email || "").toLowerCase(),
      password: requestBody.password || "",
    }

    const validationResult = loginSchema.safeParse(sanitizedData)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Please provide valid email and password",
        },
        { status: 400 },
      )
    }

    const { email, password } = validationResult.data

    // Get user from database
    const userResult = await getUserByEmail(email)
    if (!userResult.success || !userResult.user) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    const user = userResult.user

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)

    // Update login attempt tracking
    await updateLoginAttempt(user.id, isValidPassword)

    if (!isValidPassword) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid email or password",
        },
        { status: 401 },
      )
    }

    // Prepare user data (exclude sensitive information)
    const { password_hash, token_version, failed_login_attempts, locked_until, ...userWithoutSensitiveData } = user

    // Return success with user data (no JWT tokens)
    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: userWithoutSensitiveData,
    })
  } catch (error) {
    console.error("Unexpected error during login:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 },
    )
  }
}
