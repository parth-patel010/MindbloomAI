import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { usePlan } from "@/lib/plan-context";
import { Sparkles, CheckCircle, XCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function PaymentGateway({ onBack }) {
    const { user } = useAuth();
    const { refreshPlan } = usePlan();
    const searchParams = useSearchParams();
    const [phone, setPhone] = useState("");
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recent, setRecent] = useState([]);
    const [checkingStatus, setCheckingStatus] = useState(false);

    useEffect(() => {
        if (user?.email) {
            fetchRecentTransactions();
        }
    }, [user]);

    // Check for redirect from payment gateway
    useEffect(() => {
        const orderId = searchParams.get('order_id');
        const status = searchParams.get('status');

        if (orderId) {
            // User returned from payment gateway
            checkPaymentStatus(orderId);

            // Clear URL parameters
            const url = new URL(window.location);
            url.searchParams.delete('order_id');
            url.searchParams.delete('status');
            window.history.replaceState({}, '', url);
        }
    }, [searchParams]);

    const fetchRecentTransactions = async () => {
        try {
            const res = await fetch(`/api/payment-gateway?user_email=${encodeURIComponent(user.email)}`);
            const data = await res.json();
            if (data.success) setRecent(data.transactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const handlePayment = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/payment-gateway", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_email: user.email,
                    user_name: user.name,
                    phone_number: phone,
                }),
            });
            const data = await res.json();

            if (data.success) {
                setTransaction({
                    ...data,
                    user_email: user.email,
                    user_name: user.name,
                    phone_number: phone,
                    status: "pending"
                });
                // Redirect to payment gateway
                if (data.payment_url) {
                    window.open(data.payment_url, '_blank');
                }
            } else {
                alert(data.error || "Failed to create payment");
            }
        } catch (error) {
            console.error('Payment error:', error);
            alert("Failed to process payment");
        } finally {
            setLoading(false);
            fetchRecentTransactions();
        }
    };

    const checkPaymentStatus = async (orderId) => {
        setCheckingStatus(true);
        try {
            const res = await fetch("/api/payment-gateway", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ order_id: orderId }),
            });
            const data = await res.json();

            if (data.success) {
                // Update the transaction status
                setTransaction(prev => prev ? { ...prev, status: data.status } : null);
                fetchRecentTransactions();

                if (data.status === 'success') {
                    alert("Payment successful! Your plan has been upgraded to Pro.");
                    // Refresh plan context to show updated plan
                    await refreshPlan();
                    // Clear the transaction to show payment form again
                    setTimeout(() => {
                        setTransaction(null);
                    }, 3000);
                } else if (data.status === 'failed') {
                    alert("Payment failed. Please try again.");
                }
            }
        } catch (error) {
            console.error('Status check error:', error);
            alert("Failed to check payment status");
        } finally {
            setCheckingStatus(false);
        }
    };

    const openPaymentUrl = (paymentUrl) => {
        if (paymentUrl) {
            window.open(paymentUrl, '_blank');
        }
    };

    const resetTransaction = () => {
        setTransaction(null);
        setPhone("");
    };

    return (
        <div className="min-h-screen min-w-full bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 p-0 m-0 flex flex-col items-center justify-center">
            <Card className="w-full min-h-screen h-full bg-white/90 border-0 shadow-2xl rounded-none">
                <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
                            ←
                        </Button>
                        <CardTitle className="ml-2 flex items-center text-lg sm:text-xl">
                            <Sparkles className="h-5 w-5 mr-2 animate-pulse" />
                            Payment Gateway
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6 flex flex-col items-center">
                    {!transaction ? (
                        <>
                            <div className="text-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">Upgrade to Pro Plan</h3>
                                <p className="text-sm text-gray-600">Get unlimited access to all features</p>
                                <p className="text-2xl font-bold text-orange-600 mt-2">₹1.00</p>
                            </div>
                            <Input
                                type="tel"
                                placeholder="Enter your phone number"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full max-w-xs bg-white/80 border-yellow-200 focus:border-orange-400 focus:ring-orange-200 rounded-xl"
                                disabled={loading}
                            />
                            <Button
                                onClick={handlePayment}
                                disabled={!phone || loading}
                                className="w-full max-w-xs bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-lg rounded-xl"
                            >
                                {loading ? "Creating Payment..." : "Pay ₹1.00"}
                            </Button>
                        </>
                    ) : (
                        <div className="w-full max-w-xs space-y-4">
                            <div className="text-center">
                                <div className="text-lg font-semibold">Transaction Details</div>
                                <div className="text-sm text-gray-600">Name: {transaction.user_name}</div>
                                <div className="text-sm text-gray-600">Email: {transaction.user_email}</div>
                                <div className="text-sm text-gray-600">Phone: {transaction.phone_number}</div>
                                <div className="text-sm text-gray-600">Order ID: {transaction.order_id}</div>
                                <div className="flex items-center justify-center mt-2">
                                    {transaction.status === "pending" && <Clock className="text-yellow-500 mr-2" />}
                                    {transaction.status === "success" && <CheckCircle className="text-green-500 mr-2" />}
                                    {transaction.status === "failed" && <XCircle className="text-red-500 mr-2" />}
                                    <span className={`font-bold capitalize ${transaction.status === "success" ? "text-green-600" : transaction.status === "failed" ? "text-red-600" : "text-yellow-600"}`}>
                                        {transaction.status}
                                    </span>
                                </div>

                                {transaction.payment_url && transaction.status === "pending" && (
                                    <div className="mt-4 space-y-2">
                                        <Button
                                            onClick={() => openPaymentUrl(transaction.payment_url)}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Complete Payment
                                        </Button>
                                        <Button
                                            onClick={() => checkPaymentStatus(transaction.order_id)}
                                            disabled={checkingStatus}
                                            variant="outline"
                                            className="w-full"
                                        >
                                            <RefreshCw className={`h-4 w-4 mr-2 ${checkingStatus ? 'animate-spin' : ''}`} />
                                            {checkingStatus ? "Checking..." : "Check Status"}
                                        </Button>
                                    </div>
                                )}

                                {transaction.status === "success" && (
                                    <div className="mt-4">
                                        <Button
                                            onClick={resetTransaction}
                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            Make Another Payment
                                        </Button>
                                    </div>
                                )}

                                {transaction.status === "failed" && (
                                    <div className="mt-4">
                                        <Button
                                            onClick={resetTransaction}
                                            className="w-full bg-red-600 hover:bg-red-700 text-white"
                                        >
                                            Try Again
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Recent Transactions */}
                    <div className="w-full max-w-xs mt-8">
                        <div className="font-semibold mb-2 text-gray-700">Recent Transactions</div>
                        <div className="space-y-2">
                            {recent.length === 0 && <div className="text-xs text-gray-500">No recent transactions.</div>}
                            {recent.map((tx) => (
                                <div key={tx.id} className="p-3 rounded-xl bg-gray-50 border flex flex-col">
                                    <div className="flex items-center gap-2">
                                        {tx.status === "pending" && <Clock className="text-yellow-500" />}
                                        {tx.status === "success" && <CheckCircle className="text-green-500" />}
                                        {tx.status === "failed" && <XCircle className="text-red-500" />}
                                        <span className={`font-bold capitalize ${tx.status === "success" ? "text-green-600" : tx.status === "failed" ? "text-red-600" : "text-yellow-600"}`}>{tx.status}</span>
                                        <span className="ml-auto text-xs text-gray-400">{new Date(tx.created_at).toLocaleString()}</span>
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1">Phone: {tx.phone_number}</div>
                                    {tx.order_id && <div className="text-xs text-gray-500">Order: {tx.order_id}</div>}
                                    {tx.payment_url && tx.status === "pending" && (
                                        <Button
                                            onClick={() => openPaymentUrl(tx.payment_url)}
                                            size="sm"
                                            variant="outline"
                                            className="mt-2 text-xs"
                                        >
                                            <ExternalLink className="h-3 w-3 mr-1" />
                                            Complete Payment
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 