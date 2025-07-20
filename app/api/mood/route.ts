import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { generateMoodAdvice } from "@/lib/gemini"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const { userId, moodScore, moodText, activities, notes } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Check and deduct credit first
    // Build the correct absolute URL for the same deployment
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
      advice = await generateMoodAdvice(moodScore, notes || moodText)
    } catch (aiErr) {
      console.error("AI advice generation failed:", aiErr)
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

    // Save mood entry
    const moodId = uuidv4()
    await sql`
      INSERT INTO mood_entries (id, user_id, mood_score, mood_text, activities, notes, advice, created_at)
      VALUES (${moodId}, ${userId}, ${moodScore}, ${moodText}, ${JSON.stringify(activities)}, ${notes}, ${advice}, NOW())
    `

    // Get updated credit count
    let creditData: any = { remainingCredits: 0 }
    try {
      creditData = await creditResponse.json()
    } catch {
      // If parsing fails, keep default (shouldn’t happen on success)
    }

    return NextResponse.json({
      id: moodId,
      advice,
      remainingCredits: creditData.remainingCredits,
      message: "Mood entry saved successfully",
    })
  } catch (error) {
    console.error("Mood entry error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const moodEntries = await sql`
      SELECT * FROM mood_entries 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 30
    `

    return NextResponse.json({ moodEntries })
  } catch (error) {
    console.error("Get mood entries error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
