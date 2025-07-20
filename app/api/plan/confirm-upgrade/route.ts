import { type NextRequest, NextResponse } from "next/server"
import { updateUserPlanAndCredits } from "@/lib/database"
import Stripe from "stripe"

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_your_stripe_secret_key"

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
})

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId } = await request.json()

    if (!userId || !sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID and Session ID are required",
        },
        { status: 400 },
      )
    }

    // Retrieve the Stripe Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Validate the session
    if (
      session.payment_status === "paid" &&
      session.client_reference_id === userId &&
      session.metadata?.plan === "pro"
    ) {
      // Update user's plan and credits in your database
      const updateResult = await updateUserPlanAndCredits(
        userId,
        "pro",
        100, // Grant 100 credits for Pro plan
        session.customer as string,
        session.subscription as string,
      )

      if (updateResult.success) {
        return NextResponse.json({
          success: true,
          message: "Plan updated successfully!",
        })
      } else {
        console.error("Database update failed after successful Stripe session:", updateResult.error)
        return NextResponse.json(
          {
            success: false,
            error: "Failed to update user plan in database.",
          },
          { status: 500 },
        )
      }
    } else {
      console.warn("Stripe session validation failed:", {
        sessionId,
        paymentStatus: session.payment_status,
        clientReferenceId: session.client_reference_id,
        metadataPlan: session.metadata?.plan,
      })
      return NextResponse.json(
        {
          success: false,
          error: "Invalid or unpaid Stripe session.",
        },
        { status: 400 },
      )
    }
  } catch (error) {
    console.error("Error confirming Stripe upgrade:", error)
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during plan confirmation.",
      },
      { status: 500 },
    )
  }
}
