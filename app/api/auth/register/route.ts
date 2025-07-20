import { type NextRequest, NextResponse } from "next/server"
import { createUser, testDatabaseConnection } from "@/lib/database"
import { registerSchema, sanitizeInput } from "@/lib/validation"
import { hashPassword } from "@/lib/security"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection()
    if (!dbConnected) {
      console.error("Database connection failed during registration")
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
      name: sanitizeInput(requestBody.name || ""),
    }

    const validationResult = registerSchema.safeParse(sanitizedData)
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }))

      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: errors,
        },
        { status: 400 },
      )
    }

    const { email, password, name } = validationResult.data

    // Hash password securely
    let passwordHash: string
    try {
      passwordHash = await hashPassword(password)
    } catch (error) {
      console.error("Password hashing failed:", error)
      return NextResponse.json(
        {
          success: false,
          error: "Registration failed. Please try again.",
        },
        { status: 500 },
      )
    }

    // Generate secure user ID
    const userId = uuidv4()

    // Create user in database
    const createResult = await createUser({
      id: userId,
      email,
      name,
      password_hash: passwordHash,
    })

    if (!createResult.success) {
      if (createResult.error?.includes("already exists")) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this email address already exists",
          },
          { status: 409 },
        )
      }

      console.error("User creation failed:", createResult.error)
      return NextResponse.json(
        {
          success: false,
          error: "Registration failed. Please try again.",
        },
        { status: 500 },
      )
    }

    // Return success with user data (no JWT tokens)
    return NextResponse.json(
      {
        success: true,
        message: "Registration successful",
        user: {
          id: createResult.user!.id,
          email: createResult.user!.email,
          name: createResult.user!.name,
          created_at: createResult.user!.created_at,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Unexpected error during registration:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 },
    )
  }
}
