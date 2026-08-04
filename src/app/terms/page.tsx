/**
 * Terms of Service Page (Task 51: GDPR Compliance)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing or using iNAYA Auth ("the Service"), you agree to be bound by these Terms of 
                Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p>
                iNAYA Auth provides authentication and authorization management services, including but not 
                limited to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Multi-factor authentication</li>
                <li>Single sign-on (SSO)</li>
                <li>Identity verification</li>
                <li>Session management</li>
                <li>Security monitoring</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-medium mb-2">3.1 Account Creation</h3>
              <p>
                To use the Service, you must create an account. You agree to provide accurate, current, and 
                complete information during the registration process.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">3.2 Account Security</h3>
              <p>
                You are responsible for safeguarding your account credentials and for any activities or 
                actions under your account. You must notify us immediately upon becoming aware of any breach 
                of security or unauthorized use of your account.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">3.3 Account Termination</h3>
              <p>
                We may terminate or suspend your account at any time for violation of these Terms. Upon 
                termination, your right to use the Service will immediately cease.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p>
                You agree not to use the Service to:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe upon the rights of others</li>
                <li>Transmit any malicious code or engage in hacking activities</li>
                <li>Attempt to gain unauthorized access to other accounts or systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use the Service for any fraudulent or deceptive purposes</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are and will remain the 
                exclusive property of iNAYA Auth. The Service is protected by copyright, trademark, and 
                other laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Payment Terms</h2>
              <h3 className="text-xl font-medium mb-2">6.1 Subscription Plans</h3>
              <p>
                The Service offers various subscription plans with different features and pricing. You agree 
                to pay all fees associated with your selected plan.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">6.2 Billing</h3>
              <p>
                Fees are billed in advance on a monthly or annual basis, depending on your subscription plan. 
                All fees are non-refundable except as required by law.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">6.3 Price Changes</h3>
              <p>
                We reserve the right to change our prices at any time. Price changes will take effect at the 
                start of the next subscription period following the date of the change.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Data Privacy</h2>
              <p>
                Your use of the Service is also governed by our Privacy Policy and Data Processing Agreement. 
                Please review these policies, which also govern the Service and any information we collect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Service Availability</h2>
              <h3 className="text-xl font-medium mb-2">8.1 Uptime</h3>
              <p>
                We strive to provide 99.9% uptime for the Service. However, we do not guarantee that the 
                Service will be available at all times or without interruption.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">8.2 Maintenance</h3>
              <p>
                We may perform scheduled maintenance on the Service. We will provide reasonable notice of 
                scheduled maintenance when possible.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">8.3 Service Modifications</h3>
              <p>
                We reserve the right to modify or discontinue the Service at any time, with or without notice. 
                We shall not be liable to you or any third party for any modification, suspension, or 
                discontinuance of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
              <p>
                In no event shall iNAYA Auth, nor its directors, employees, partners, agents, suppliers, or 
                affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, 
                including without limitation, loss of profits, data, use, goodwill, or other intangible losses, 
                resulting from your access to or use of or inability to access or use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Indemnification</h2>
              <p>
                You agree to defend, indemnify and hold harmless iNAYA Auth and its licensee and licensors, 
                and their employees, contractors, agents, officers and directors, from and against any and 
                all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including 
                but not limited to attorney's fees), resulting from or arising out of your use of the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Governing Law</h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of the jurisdiction 
                where iNAYA Auth is established, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                If a revision is material, we will try to provide at least 30 days notice prior to any new 
                terms taking effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Contact Us</h2>
              <p>
                If you have any questions about these Terms, please contact us:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Email: legal@inaya-auth.com</li>
                <li>Address: iNAYA TechLab, Legal Department</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
