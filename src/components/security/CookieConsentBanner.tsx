/**
 * Cookie Consent Banner Component (Task 51: GDPR Compliance)
 */

'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Cookie } from 'lucide-react';
import { updateCookieConsentAction } from '@/lib/security/gdpr.actions';
import type { CookieConsent } from '@/lib/security/gdpr.util';

export default function CookieConsentBanner() {
  const [show, setShow] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true, // Always true
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already given consent
    const storedConsent = localStorage.getItem('cookie-consent');
    if (!storedConsent) {
      setShow(true);
    }
  }, []);

  async function handleAcceptAll() {
    const fullConsent: CookieConsent = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };

    await updateCookieConsentAction(fullConsent);
    localStorage.setItem('cookie-consent', JSON.stringify(fullConsent));
    setShow(false);
  }

  async function handleAcceptSelected() {
    await updateCookieConsentAction(consent);
    localStorage.setItem('cookie-consent', JSON.stringify(consent));
    setShow(false);
  }

  function handleRejectAll() {
    const minimalConsent: CookieConsent = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };

    localStorage.setItem('cookie-consent', JSON.stringify(minimalConsent));
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
      <Card className="max-w-4xl mx-auto p-6">
        <div className="flex items-start gap-4">
          <Cookie className="w-8 h-8 text-primary-600 flex-shrink-0 mt-1" />
          
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Cookie Consent</h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
              </p>
            </div>

            {/* Cookie Categories */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Essential Cookies</span>
                  <p className="text-xs text-muted-foreground">Required for the website to function</p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.essential}
                  disabled
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Analytics Cookies</span>
                  <p className="text-xs text-muted-foreground">Help us understand how you use the site</p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.analytics}
                  onChange={(e) => setConsent({ ...consent, analytics: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Marketing Cookies</span>
                  <p className="text-xs text-muted-foreground">Used for personalized advertising</p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.marketing}
                  onChange={(e) => setConsent({ ...consent, marketing: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium">Preference Cookies</span>
                  <p className="text-xs text-muted-foreground">Remember your settings and preferences</p>
                </div>
                <input
                  type="checkbox"
                  checked={consent.preferences}
                  onChange={(e) => setConsent({ ...consent, preferences: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleAcceptAll} size="sm">
                Accept All
              </Button>
              <Button onClick={handleAcceptSelected} variant="outline" size="sm">
                Accept Selected
              </Button>
              <Button onClick={handleRejectAll} variant="ghost" size="sm">
                Reject All
              </Button>
              <a href="/privacy-policy#cookies" className="text-xs text-primary-600 hover:underline self-center">
                Learn more about cookies
              </a>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleRejectAll}
            className="flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
