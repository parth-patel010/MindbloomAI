import { NextRequest, NextResponse } from "next/server";
import { sql, updateUserPlanAndCredits, getUserByEmail } from "@/lib/database";

export async function POST(req: NextRequest) {
    try {
        const { user_email, user_name, phone_number } = await req.json();
        if (!user_email || !user_name || !phone_number) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }
        const result = await sql`
      INSERT INTO payment_gateway (user_email, user_name, phone_number, status)
      VALUES (${user_email}, ${user_name}, ${phone_number}, 'pending')
      RETURNING id
    `;
        return NextResponse.json({ success: true, id: result[0].id });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create payment record" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const { id, status } = await req.json();
        if (!id || !["pending", "failed", "success"].includes(status)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }
        await sql`UPDATE payment_gateway SET status = ${status} WHERE id = ${id}`;
        // If success, also upgrade the user's plan
        if (status === "success") {
            // Get user email from payment_gateway
            const payment = await sql`SELECT user_email FROM payment_gateway WHERE id = ${id}`;
            if (payment.length > 0) {
                const userRes = await getUserByEmail(payment[0].user_email);
                if (userRes.success && userRes.user) {
                    await updateUserPlanAndCredits(userRes.user.id, "pro", 100);
                }
            }
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const user_email = searchParams.get("user_email");
        if (!user_email) {
            return NextResponse.json({ error: "Missing user_email" }, { status: 400 });
        }
        const transactions = await sql`
      SELECT id, user_email, user_name, phone_number, status, created_at
      FROM payment_gateway
      WHERE user_email = ${user_email}
      ORDER BY created_at DESC
      LIMIT 5
    `;
        return NextResponse.json({ success: true, transactions });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
} 