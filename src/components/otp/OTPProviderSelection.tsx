/**
 * OTP Provider Selection Component
 * Task 18: Select OTP delivery method (Email, SMS, WhatsApp, Telegram)
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageSquare, Send, Smartphone, CheckCircle } from 'lucide-react';

export type OTPProvider = 'email' | 'sms' | 'whatsapp' | 'telegram';

interface OTPProviderSelectionProps {
  email?: string;
  phone?: string;
  availableProviders: OTPProvider[];
  onSelect: (provider: OTPProvider) => Promise<{ success: boolean; error?: string }>;
  title?: string;
  description?: string;
}

export function OTPProviderSelection({
  email,
  phone,
  availableProviders,
  onSelect,
  title = 'Choose Verification Method',
  description = 'Select how you want to receive the verification code',
}: OTPProviderSelectionProps) {
  const [selectedProvider, setSelectedProvider] = useState<OTPProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const providers = [
    {
      id: 'email' as OTPProvider,
      name: 'Email',
      icon: Mail,
      description: 'Receive code via email',
      recipient: email,
      color: 'blue',
    },
    {
      id: 'sms' as OTPProvider,
      name: 'SMS',
      icon: MessageSquare,
      description: 'Receive code via SMS',
      recipient: phone,
      color: 'green',
    },
    {
      id: 'whatsapp' as OTPProvider,
      name: 'WhatsApp',
      icon: Send,
      description: 'Receive code via WhatsApp',
      recipient: phone,
      color: 'emerald',
    },
    {
      id: 'telegram' as OTPProvider,
      name: 'Telegram',
      icon: Smartphone,
      description: 'Receive code via Telegram',
      recipient: phone,
      color: 'cyan',
    },
  ];

  const availableProviderData = providers.filter(p => availableProviders.includes(p.id));

  const handleSelect = async (provider: OTPProvider) => {
    setSelectedProvider(provider);
    setError('');
    setLoading(true);

    try {
      const result = await onSelect(provider);
      
      if (!result.success) {
        setError(result.error || 'Failed to send OTP');
        setSelectedProvider(null);
      }
    } catch (err) {
      setError('Failed to send OTP. Please try again.');
      setSelectedProvider(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider List */}
        <div className="space-y-3">
          {availableProviderData.map((provider) => {
            const Icon = provider.icon;
            const isSelected = selectedProvider === provider.id;
            const isDisabled = loading && !isSelected;

            return (
              <Button
                key={provider.id}
                variant="outline"
                onClick={() => handleSelect(provider.id)}
                disabled={isDisabled}
                className="w-full h-auto p-4 justify-start hover:bg-neutral-50"
              >
                <div className="flex items-center gap-4 w-full">
                  <div className={`w-12 h-12 rounded-lg bg-${provider.color}-100 flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 text-${provider.color}-600`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-neutral-900">{provider.name}</span>
                      {isSelected && loading && (
                        <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    <p className="text-sm text-neutral-600">{provider.description}</p>
                    {provider.recipient && (
                      <p className="text-xs text-neutral-500 mt-1">
                        {provider.recipient}
                      </p>
                    )}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-3">
            <p className="text-sm text-error-600">{error}</p>
          </div>
        )}

        {/* Help Text */}
        <p className="text-xs text-neutral-500 text-center">
          Choose the most convenient method for you. You'll receive a 6-digit verification code.
        </p>
      </CardContent>
    </Card>
  );
}
