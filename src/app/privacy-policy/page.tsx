/**
 * Privacy Policy Page (Task 51: GDPR Compliance)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                iNAYA Auth ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our authentication and authorization management platform.
              </p>
              <p>
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-medium mb-2">2.1 Personal Information</h3>
              <p>We may collect personal information that you provide to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Name and email address</li>
                <li>Phone number (if provided)</li>
                <li>Profile information (avatar, preferences)</li>
                <li>Authentication credentials (encrypted passwords)</li>
                <li>Two-factor authentication data</li>
                <li>OAuth provider information</li>
                <li>Device and session information</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">2.2 Automatically Collected Information</h3>
              <p>When you access our platform, we automatically collect:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>IP address and geolocation data</li>
                <li>Browser type and version</li>
                <li>Device information</li>
                <li>Operating system</li>
                <li>Login attempts and security events</li>
                <li>Usage patterns and analytics</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Authentication:</strong> To provide secure authentication and authorization services</li>
                <li><strong>Account Management:</strong> To create and manage your account</li>
                <li><strong>Security:</strong> To detect and prevent unauthorized access, fraud, and security incidents</li>
                <li><strong>Communication:</strong> To send you important notifications about your account</li>
                <li><strong>Improvement:</strong> To improve our platform and user experience</li>
                <li><strong>Compliance:</strong> To comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
              <p>We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Service Providers:</strong> We may share information with trusted third-party service providers who assist us in operating our platform</li>
                <li><strong>Legal Requirements:</strong> We may disclose information when required by law, regulation, or legal process</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> We may share information with your explicit consent</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption of data at rest and in transit</li>
                <li>Secure password hashing using bcrypt/argon2</li>
                <li>Two-factor authentication</li>
                <li>Regular security audits and penetration testing</li>
                <li>Access controls and authentication</li>
                <li>Monitoring and logging of security events</li>
              </ul>
              <p className="mt-4">
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. Your Rights (GDPR)</h2>
              <p>If you are a resident of the European Economic Area (EEA), you have certain data protection rights. These include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Right to Access:</strong> You have the right to request copies of your personal data</li>
                <li><strong>Right to Rectification:</strong> You have the right to request correction of inaccurate information</li>
                <li><strong>Right to Erasure:</strong> You have the right to request deletion of your personal data under certain conditions</li>
                <li><strong>Right to Restrict Processing:</strong> You have the right to request restriction of processing your personal data</li>
                <li><strong>Right to Data Portability:</strong> You have the right to request transfer of your data to another organization or directly to you</li>
                <li><strong>Right to Withdraw Consent:</strong> You have the right to withdraw your consent at any time</li>
              </ul>
              <p className="mt-4">
                To exercise any of these rights, please contact us or use the data management features in your account settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
              <p>
                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Data:</strong> Retained for the duration of your account plus 30 days after deletion</li>
                <li><strong>Security Logs:</strong> Retained for 90 days for security monitoring</li>
                <li><strong>Authentication Logs:</strong> Retained for 1 year for audit purposes</li>
                <li><strong>Backup Data:</strong> Retained for 30 days</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our platform and store certain information. Cookies are files with a small amount of data that may include an anonymous unique identifier.
              </p>
              <h3 className="text-xl font-medium mb-2 mt-4">8.1 Types of Cookies We Use</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Essential Cookies:</strong> Required for the platform to function properly</li>
                <li><strong>Authentication Cookies:</strong> Used to keep you logged in</li>
                <li><strong>Security Cookies:</strong> Used for CSRF protection and security measures</li>
                <li><strong>Analytics Cookies:</strong> Used to analyze usage patterns (with your consent)</li>
                <li><strong>Preference Cookies:</strong> Used to remember your preferences (with your consent)</li>
              </ul>
              <p className="mt-4">
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
              <p>
                Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to read the privacy policies of all third-party websites or services that you visit.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
              <p>
                Our platform is not intended for use by children under the age of 16. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Changes to This Privacy Policy</h2>
              <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
              <p className="mt-4">
                You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Contact Us</h2>
              <p>
                If you have any questions about this Privacy Policy or wish to exercise your data protection rights, please contact us:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Email: privacy@inaya-auth.com</li>
                <li>Address: iNAYA TechLab, Security & Privacy Team</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">13. Data Protection Officer</h2>
              <p>
                We have appointed a Data Protection Officer (DPO) who is responsible for overseeing questions in relation to this Privacy Policy. If you have any questions about this Privacy Policy, please contact our DPO at dpo@inaya-auth.com.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
