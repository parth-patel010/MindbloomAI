import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Sparkles, CheckCircle, XCircle, Clock } from "lucide-react";

export default function PaymentGateway({ onBack }) {
    const { user } = useAuth();
    const [phone, setPhone] = useState("");
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [recent, setRecent] = useState([]);

    useEffect(() => {
        if (user?.email) {
            fetch(`/api/payment-gateway?user_email=${encodeURIComponent(user.email)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) setRecent(data.transactions);
                });
        }
    }, [user]);

    const handlePayment = async () => {
        setLoading(true);
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
        setTransaction({ ...data, user_email: user.email, user_name: user.name, phone_number: phone, status: "pending", id: data.id });
        setLoading(false);
        // Refresh recent transactions
        fetch(`/api/payment-gateway?user_email=${encodeURIComponent(user.email)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setRecent(data.transactions);
            });
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
                                {loading ? "Processing..." : "Submit"}
                            </Button>
                        </>
                    ) : (
                        <div className="w-full max-w-xs space-y-4">
                            <div className="text-center">
                                <div className="text-lg font-semibold">Transaction Details</div>
                                <div className="text-sm text-gray-600">Name: {transaction.user_name}</div>
                                <div className="text-sm text-gray-600">Email: {transaction.user_email}</div>
                                <div className="text-sm text-gray-600">Phone: {transaction.phone_number}</div>
                                <div className="flex items-center justify-center mt-2">
                                    {transaction.status === "pending" && <Clock className="text-yellow-500 mr-2" />}
                                    {transaction.status === "success" && <CheckCircle className="text-green-500 mr-2" />}
                                    {transaction.status === "failed" && <XCircle className="text-red-500 mr-2" />}
                                    <span className={`font-bold capitalize ${transaction.status === "success" ? "text-green-600" : transaction.status === "failed" ? "text-red-600" : "text-yellow-600"}`}>
                                        {transaction.status}
                                    </span>
                                </div>
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
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 