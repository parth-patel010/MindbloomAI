import { NextRequest, NextResponse } from "next/server";
import { sql, updateUserPlanAndCredits, getUserByEmail } from "@/lib/database";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Webhook received:', body);

        const { status, order_id, remark1, remark2 } = body;

        // Validate required fields
        if (!status || !order_id) {
            console.error('Missing required fields in webhook');
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // Find the payment record
        const paymentRecord = await sql`
            SELECT * FROM payment_gateway 
            WHERE order_id = ${order_id}
        `;

        if (paymentRecord.length === 0) {
            console.error('Payment record not found for order_id:', order_id);
            return NextResponse.json({ error: "Payment record not found" }, { status: 404 });
        }

        const payment = paymentRecord[0];
        console.log('Found payment record:', payment);

        // Update payment status based on webhook data
        let dbStatus = 'pending';
        if (status === 'SUCCESS' || status === 'COMPLETED') {
            dbStatus = 'success';
        } else if (status === 'FAILED' || status === 'ERROR') {
            dbStatus = 'failed';
        }

        console.log(`Updating payment status to: ${dbStatus}`);

        // Update the payment record
        await sql`
            UPDATE payment_gateway 
            SET status = ${dbStatus}
            WHERE order_id = ${order_id}
        `;

        // If payment is successful, upgrade user plan
        if (dbStatus === 'success') {
            console.log('Payment successful, upgrading user plan for:', payment.user_email);

            const userRes = await getUserByEmail(payment.user_email);
            console.log('User lookup result:', userRes);

            if (userRes.success && userRes.user) {
                console.log('Upgrading user plan:', userRes.user.id, 'to pro with 100 credits');
                const updateResult = await updateUserPlanAndCredits(userRes.user.id, "pro", 100);
                console.log('Plan upgrade result:', updateResult);

                if (updateResult.success) {
                    console.log('User plan upgraded successfully for:', payment.user_email);
                } else {
                    console.error('Failed to upgrade user plan:', updateResult.error);
                }
            } else {
                console.error('Failed to find user for plan upgrade:', userRes.error);
            }
        }

        console.log(`Payment ${order_id} updated to status: ${dbStatus}`);

        return NextResponse.json({
            success: true,
            message: "Webhook processed successfully"
        });

    } catch (error) {
        console.error('Webhook processing error:', error);
        return NextResponse.json({
            error: "Failed to process webhook"
        }, { status: 500 });
    }
}

// Handle GET requests (for webhook verification)
export async function GET(req: NextRequest) {
    return NextResponse.json({
        message: "Webhook endpoint is active",
        timestamp: new Date().toISOString()
    });
} 