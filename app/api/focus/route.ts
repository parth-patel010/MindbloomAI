import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { generateFocusAdvice } from "@/lib/gemini"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const { userId, situation, distractions } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Check and deduct credit first
    const { origin } = new URL(request.url)
    const creditResponse = await fetch(`${origin}/api/plan/use-credit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    })

    if (!creditResponse.ok) {
      let creditError: any = {}
      try {
        creditError = await creditResponse.json()
      } catch {
        creditError = { error: "Unexpected response from credit API" }
      }
      return NextResponse.json(
        {
          error: "INSUFFICIENT_CREDITS",
          message:
            creditError.error === "No credits remaining"
              ? "You've used all your credits for this month. Upgrade to Pro for more!"
              : "Unable to process request. Please try again.",
        },
        { status: 403 },
      )
    }

    // Generate AI advice
    let advice = ""
    try {
      advice = await generateFocusAdvice(situation, distractions)
    } catch (aiErr) {
      console.error("AI focus advice generation failed:", aiErr)
      // Refund the credit since AI failed
      await sql`
        UPDATE users 
        SET credits = credits + 1, updated_at = NOW()
        WHERE id = ${userId}
      `
      return NextResponse.json(
        {
          error: "AI_SERVICE_UNAVAILABLE",
          message: "Our AI helper is temporarily unavailable. Please try again in a few minutes.",
        },
        { status: 503 },
      )
    }

    // Save focus session
    const sessionId = uuidv4()
    await sql`
      INSERT INTO focus_sessions (id, user_id, situation, distractions, advice, created_at)
      VALUES (${sessionId}, ${userId}, ${situation}, ${JSON.stringify(distractions)}, ${advice}, NOW())
    `

    // Get updated credit count
    const creditData = await creditResponse.json()

    return NextResponse.json({
      id: sessionId,
      advice,
      remainingCredits: creditData.remainingCredits,
      message: "Focus advice generated successfully",
    })
  } catch (error) {
    console.error("Focus advice error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
