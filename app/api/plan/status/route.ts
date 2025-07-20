import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      // Default response for unauthenticated users
      return NextResponse.json({
        success: true,
        plan: "free",
        credits: 3,
        nextReset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    // Get user plan from database
    const userResult = await sql`
      SELECT plan, credits, credits_reset_at 
      FROM users 
      WHERE id = ${userId}
    `

    if (userResult.length === 0) {
      return NextResponse.json({
        success: true,
        plan: "free",
        credits: 3,
        nextReset: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
    }

    const user = userResult[0]

    let currentCredits = user.credits || 0
    let nextResetDate = new Date(user.credits_reset_at)

    // Check if credits need to be reset
    if (nextResetDate < new Date()) {
      let newCredits = 0
      const newResetDate = new Date()
      newResetDate.setMonth(newResetDate.getMonth() + 1) // Set to one month from now

      if (user.plan === "free") {
        newCredits = 3
      } else if (user.plan === "pro") {
        newCredits = 100
      }

      // Only update if credits are not already at the reset amount
      if (currentCredits !== newCredits) {
        await sql`
          UPDATE users 
          SET credits = ${newCredits}, credits_reset_at = ${newResetDate.toISOString()}, updated_at = NOW()
          WHERE id = ${userId}
        `
        currentCredits = newCredits
        nextResetDate = newResetDate
      }
    }

    return NextResponse.json({
      success: true,
      plan: user.plan || "free",
      credits: currentCredits, // Use the potentially reset credits
      nextReset: nextResetDate.toISOString(), // Use the potentially updated reset date
    })
  } catch (error) {
    console.error("Plan status error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch plan status",
      },
      { status: 500 },
    )
  }
}
