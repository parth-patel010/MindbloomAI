import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { generateOverwhelmAdvice } from "@/lib/gemini"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const { userId, stressors, intensity } = await request.json()

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
      advice = await generateOverwhelmAdvice(stressors, intensity)
    } catch (aiErr) {
      console.error("AI overwhelm advice generation failed:", aiErr)
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

    // Save overwhelm session
    const sessionId = uuidv4()
    await sql`
      INSERT INTO overwhelm_sessions (id, user_id, stressors, intensity, advice, created_at)
      VALUES (${sessionId}, ${userId}, ${JSON.stringify(stressors)}, ${intensity}, ${advice}, NOW())
    `

    // Get updated credit count
    const creditData = await creditResponse.json()

    return NextResponse.json({
      id: sessionId,
      advice,
      remainingCredits: creditData.remainingCredits,
      message: "Overwhelm advice generated successfully",
    })
  } catch (error) {
    console.error("Overwhelm advice error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
