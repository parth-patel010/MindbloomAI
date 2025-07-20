import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { translateParentMessage } from "@/lib/gemini"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const { userId, originalMessage, emotionTags } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    // Check and deduct credit first
    const { origin } = new URL(request.url) // always points at the current deployment
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

    // Generate translated message
    let translatedMessage = ""
    try {
      translatedMessage = await translateParentMessage(originalMessage, emotionTags)
    } catch (aiErr) {
      console.error("AI translation failed:", aiErr)
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

    // Save message
    const messageId = uuidv4()
    await sql`
      INSERT INTO parent_messages (id, user_id, original_message, translated_message, emotion_tags, created_at)
      VALUES (${messageId}, ${userId}, ${originalMessage}, ${translatedMessage}, ${JSON.stringify(emotionTags)}, NOW())
    `

    // Get updated credit count
    const creditData = await creditResponse.json()

    return NextResponse.json({
      id: messageId,
      translatedMessage,
      remainingCredits: creditData.remainingCredits,
      message: "Message translated successfully",
    })
  } catch (error) {
    console.error("Parent message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
