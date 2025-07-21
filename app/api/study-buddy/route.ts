import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/database"
import { generateStudyBuddyAnswer } from "@/lib/gemini"

function formatGeminiAnswer(answer: string): string {
    // Bold: Replace **word** with <b>word</b>
    let formatted = answer.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Add <br> after numbered or bulleted points if not already present
    formatted = formatted.replace(/(\d+\.\s+.+?)(?=(<br>|\\n|$))/g, '$1<br>');
    formatted = formatted.replace(/([\-*\u2022]\s+.+?)(?=(<br>|\\n|$))/g, '$1<br>');
    // Add <br> after </b> if not already followed by <br>
    formatted = formatted.replace(/(<\/b>)(?!<br>)/g, '$1<br>');
    // Replace double <br> with paragraph breaks for clarity
    formatted = formatted.replace(/(<br>\s*){2,}/g, '<br><br>');
    // Replace single \n with <br>
    formatted = formatted.replace(/\n/g, '<br>');
    return formatted;
}

export async function POST(request: NextRequest) {
    try {
        const { userId, messages } = await request.json()
        if (!userId || !messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: "User ID and messages required" }, { status: 400 })
        }

        // Deduct 2 credits
        const userResult = await sql`SELECT credits FROM users WHERE id = ${userId}`
        if (!userResult.length) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }
        const currentCredits = userResult[0].credits || 0
        if (currentCredits < 2) {
            return NextResponse.json({ error: "Not enough credits. Each prompt uses 2 credits." }, { status: 403 })
        }
        await sql`
      UPDATE users SET credits = credits - 2, updated_at = NOW() WHERE id = ${userId}
    `
        await sql`
      INSERT INTO credit_usage (user_id, feature, credits_used, created_at)
      VALUES (${userId}, 'study_buddy', 2, NOW())
    `

        // Generate answer from Gemini
        let answer = ""
        try {
            answer = await generateStudyBuddyAnswer(messages)
            answer = formatGeminiAnswer(answer)
        } catch (err) {
            // Refund credits if AI fails
            await sql`
        UPDATE users SET credits = credits + 2, updated_at = NOW() WHERE id = ${userId}
      `
            return NextResponse.json({ error: "AI service unavailable. Credits refunded. Please try again." }, { status: 503 })
        }

        return NextResponse.json({ answer })
    } catch (error) {
        console.error("Study Buddy error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
} 