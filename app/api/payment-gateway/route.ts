import { NextRequest, NextResponse } from "next/server";
import { sql, updateUserPlanAndCredits, getUserByEmail } from "@/lib/database";
import CreateOrderSDK from "@/typescript/CreateOrderSDK";
import CheckOrderStatusSDK from "@/typescript/CheckOrderStatusSDK";

// Initialize SDKs
const createOrderSDK = new CreateOrderSDK('https://vision2submit.com');
const checkOrderSDK = new CheckOrderStatusSDK('https://vision2submit.com');

// Payment gateway configuration
const PAYMENT_CONFIG = {
    user_token: process.env.PAYMENT_USER_TOKEN || '2e14002188f1ae07426c32655ddee9af',
    amount: '1', // Amount in INR
    redirect_url: 'https://mindbloomai.vercel.app/payment-success',
};

export async function POST(req: NextRequest) {
    try {
        const { user_email, user_name, phone_number } = await req.json();
        if (!user_email || !user_name || !phone_number) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        // Generate unique order ID
        const order_id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

        // Create payment record in database
        const result = await sql`
            INSERT INTO payment_gateway (user_email, user_name, phone_number, status, order_id)
            VALUES (${user_email}, ${user_name}, ${phone_number}, 'pending', ${order_id})
            RETURNING id
        `;

        // Create order with payment gateway
        const orderPayload = {
            customer_mobile: phone_number,
            user_token: PAYMENT_CONFIG.user_token,
            amount: PAYMENT_CONFIG.amount,
            order_id: order_id,
            redirect_url: PAYMENT_CONFIG.redirect_url,
            remark1: user_email,
            remark2: user_name,
        };

        const paymentResponse = await createOrderSDK.createOrder(orderPayload);

        if (paymentResponse.status) {
            // Update database with payment URL
            await sql`
                UPDATE payment_gateway 
                SET payment_url = ${paymentResponse.result.payment_url}
                WHERE id = ${result[0].id}
            `;

            return NextResponse.json({
                success: true,
                id: result[0].id,
                payment_url: paymentResponse.result.payment_url,
                order_id: order_id
            });
        } else {
            // Update status to failed
            await sql`UPDATE payment_gateway SET status = 'failed' WHERE id = ${result[0].id}`;
            return NextResponse.json({
                error: paymentResponse.message || "Failed to create payment order"
            }, { status: 400 });
        }
    } catch (error) {
        console.error('Payment creation error:', error);
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
            SELECT id, user_email, user_name, phone_number, status, created_at, order_id, payment_url
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

// New endpoint to check order status
export async function PUT(req: NextRequest) {
    try {
        const { order_id } = await req.json();
        if (!order_id) {
            return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
        }

        const statusResponse = await checkOrderSDK.checkOrderStatus({
            user_token: PAYMENT_CONFIG.user_token,
            order_id: order_id
        });

        // Update database status based on payment gateway response
        let dbStatus = 'pending';
        if (statusResponse.status === 'COMPLETED' && statusResponse.result?.status === 'SUCCESS') {
            dbStatus = 'success';
        } else if (statusResponse.status === 'ERROR' || statusResponse.result?.status === 'FAILED') {
            dbStatus = 'failed';
        }

        await sql`
            UPDATE payment_gateway 
            SET status = ${dbStatus}
            WHERE order_id = ${order_id}
        `;

        return NextResponse.json({
            success: true,
            status: dbStatus,
            gateway_response: statusResponse
        });
    } catch (error) {
        console.error('Status check error:', error);
        return NextResponse.json({ error: "Failed to check order status" }, { status: 500 });
    }
} 