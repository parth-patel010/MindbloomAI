'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';

export default function PaymentSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('checking');
    const [orderId, setOrderId] = useState('');

    useEffect(() => {
        // Get order_id from URL parameters
        const orderIdParam = searchParams.get('order_id');
        if (orderIdParam) {
            setOrderId(orderIdParam);
            checkPaymentStatus(orderIdParam);
        } else {
            setStatus('error');
        }
    }, [searchParams]);

    const checkPaymentStatus = async (orderId: string) => {
        try {
            const response = await fetch('/api/payment-gateway', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ order_id: orderId }),
            });

            const data = await response.json();

            if (data.success) {
                setStatus(data.status);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Error checking payment status:', error);
            setStatus('error');
        }
    };

    const getStatusContent = () => {
        switch (status) {
            case 'success':
                return {
                    icon: <CheckCircle className="h-16 w-16 text-green-500" />,
                    title: 'Payment Successful!',
                    message: 'Your payment has been processed successfully. Your plan has been upgraded to Pro!',
                    color: 'text-green-600',
                    bgColor: 'bg-green-50'
                };
            case 'failed':
                return {
                    icon: <XCircle className="h-16 w-16 text-red-500" />,
                    title: 'Payment Failed',
                    message: 'Your payment could not be processed. Please try again or contact support.',
                    color: 'text-red-600',
                    bgColor: 'bg-red-50'
                };
            case 'pending':
                return {
                    icon: <Clock className="h-16 w-16 text-yellow-500" />,
                    title: 'Payment Pending',
                    message: 'Your payment is being processed. Please wait a moment and refresh this page.',
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50'
                };
            case 'error':
                return {
                    icon: <XCircle className="h-16 w-16 text-red-500" />,
                    title: 'Error',
                    message: 'An error occurred while processing your payment. Please contact support.',
                    color: 'text-red-600',
                    bgColor: 'bg-red-50'
                };
            default:
                return {
                    icon: <Clock className="h-16 w-16 text-blue-500 animate-spin" />,
                    title: 'Checking Payment Status...',
                    message: 'Please wait while we verify your payment.',
                    color: 'text-blue-600',
                    bgColor: 'bg-blue-50'
                };
        }
    };

    const content = getStatusContent();

    return (
        <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white/90 border-0 shadow-2xl">
                <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-4">
                        {content.icon}
                    </div>
                    <CardTitle className={`text-xl font-bold ${content.color}`}>
                        {content.title}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600">
                        {content.message}
                    </p>

                    {orderId && (
                        <div className="text-sm text-gray-500">
                            Order ID: {orderId}
                        </div>
                    )}

                    <div className="space-y-2">
                        {status === 'pending' && (
                            <Button
                                onClick={() => checkPaymentStatus(orderId)}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                Check Status Again
                            </Button>
                        )}

                        <Button
                            onClick={() => router.push('/')}
                            variant="outline"
                            className="w-full"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Home
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 