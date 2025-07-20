import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID required",
        },
        { status: 400 },
      )
    }

    // Get current user credits
    const userResult = await sql`
      SELECT credits, plan FROM users WHERE id = ${userId}
    `

    if (userResult.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "User not found",
        },
        { status: 404 },
      )
    }

    const user = userResult[0]
    const currentCredits = user.credits || 0

    if (currentCredits <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No credits remaining",
        },
        { status: 403 },
      )
    }

    // Deduct one credit
    const newCredits = currentCredits - 1
    await sql`
      UPDATE users 
      SET credits = ${newCredits}, updated_at = NOW()
      WHERE id = ${userId}
    `

    // Log credit usage
    await sql`
      INSERT INTO credit_usage (user_id, feature, credits_used, created_at)
      VALUES (${userId}, 'ai_consultation', 1, NOW())
    `

    return NextResponse.json({
      success: true,
      remainingCredits: newCredits,
      message: "Credit used successfully",
    })
  } catch (error) {
    console.error("Use credit error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to use credit",
      },
      { status: 500 },
    )
  }
}
