'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from "@/lib/auth";
import { PlanProvider } from "@/lib/plan-context";
import PaymentGateway from '@/components/payment-gateway';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

function PaymentGatewayContent() {
    const router = useRouter();
    const { user, loading } = useAuth();

    const handleBack = () => {
        router.push('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-200 border-t-orange-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading payment gateway...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        router.push('/');
        return null;
    }

    return <PaymentGateway onBack={handleBack} />;
}

export default function PaymentGatewayPage() {
    return (
        <AuthProvider>
            <PlanProvider>
                <PaymentGatewayContent />
            </PlanProvider>
        </AuthProvider>
    );
} 