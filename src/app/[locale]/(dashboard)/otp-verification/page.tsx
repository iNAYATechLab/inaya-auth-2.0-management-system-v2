/**
 * OTP Verification Example Page
 * Task 18: Complete OTP verification flow example
 */

'use client';

import { useState } from 'react';
import { OTPProviderSelection, OTPProvider } from '@/components/otp/OTPProviderSelection';
import { OTPVerification } from '@/components/otp/OTPVerification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export default function OTPVerificationExamplePage() {
  const [step, setStep] = useState<'select' | 'verify' | 'success'>('select');
  const [selectedProvider, setSelectedProvider] = useState<OTPProvider | null>(null);
  const [recipient, setRecipient] = useState('');

  const handleProviderSelect = async (provider: OTPProvider) => {
    setSelectedProvider(provider);
    
    // In real app, get recipient from user profile
    const recipientValue = provider === 'email' 
      ? 'user@example.com' 
      : '+8801712345678';
    
    setRecipient(recipientValue);

    // Simulate sending OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setStep('verify');
    return { success: true };
  };

  const handleVerify = async (otp: string) => {
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For demo, accept any 6-digit OTP
    if (otp.length === 6) {
      return { success: true };
    }
    
    return { success: false, error: 'Invalid OTP. Please try again.' };
  };

  const handleResend = async () => {
    // Simulate resending OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { success: true };
  };

  const handleSuccess = () => {
    setStep('success');
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-success-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success-600" />
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">Verification Complete!</h2>
              <p className="text-neutral-600">Your phone number has been verified successfully.</p>
              <button
                onClick={() => setStep('select')}
                className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        {step === 'select' ? (
          <OTPProviderSelection
            title="Verify Your Phone Number"
            description="Choose how you want to receive the verification code"
            email="user@example.com"
            phone="+8801712345678"
            availableProviders={['email', 'sms', 'whatsapp', 'telegram']}
            onSelect={handleProviderSelect}
          />
        ) : (
          <OTPVerification
            title="Enter Verification Code"
            description="We've sent a 6-digit code to your selected method"
            recipient={recipient}
            onVerify={handleVerify}
            onResend={handleResend}
            onSuccess={handleSuccess}
            countdown={300} // 5 minutes
          />
        )}
      </div>
    </div>
  );
}
