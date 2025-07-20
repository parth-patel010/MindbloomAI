import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Using only the three Stripe keys you mentioned
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "sk_test_your_stripe_secret_key"
const STRIPE_PRODUCT_ID = process.env.STRIPE_PRODUCT_ID || "prod_your_product_id"
// Explicitly set the domain for redirect
const DOMAIN = "https://mindbloomai.vercel.app"

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-04-10",
})

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

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            product: STRIPE_PRODUCT_ID, // ← your product ID
            unit_amount: 9900, // ₹ 99 in the smallest currency unit
            currency: "inr",
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${DOMAIN}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/?canceled=true`,
      client_reference_id: userId,
      metadata: { userId, plan: "pro" },
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    })
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create checkout session",
      },
      { status: 500 },
    )
  }
}
