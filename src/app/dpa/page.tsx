/**
 * Data Processing Agreement (DPA) Page (Task 51: GDPR Compliance)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DPAPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Data Processing Agreement (DPA)</CardTitle>
            <p className="text-muted-foreground mt-2">
              Last updated: {new Date().toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p>
                This Data Processing Agreement ("DPA") governs the processing of personal data by iNAYA Auth 
                ("Data Processor") on behalf of its customers ("Data Controller") in accordance with the 
                General Data Protection Regulation (GDPR) and other applicable data protection laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>"Data Controller"</strong> means the entity that determines the purposes and means 
                  of processing personal data.
                </li>
                <li>
                  <strong>"Data Processor"</strong> means iNAYA Auth, which processes personal data on behalf 
                  of the Data Controller.
                </li>
                <li>
                  <strong>"Data Subject"</strong> means the individual whose personal data is being processed.
                </li>
                <li>
                  <strong>"Personal Data"</strong> means any information relating to an identified or 
                  identifiable natural person.
                </li>
                <li>
                  <strong>"Processing"</strong> means any operation performed on personal data, including 
                  collection, storage, use, and deletion.
                </li>
                <li>
                  <strong>"GDPR"</strong> means the General Data Protection Regulation (EU) 2016/679.
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">3. Scope and Purpose</h2>
              <p>
                This DPA applies to all processing of personal data by iNAYA Auth on behalf of the Data 
                Controller for the purpose of providing authentication and authorization services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">4. Data Processor Obligations</h2>
              <h3 className="text-xl font-medium mb-2">4.1 Processing Instructions</h3>
              <p>
                The Data Processor shall process personal data only on documented instructions from the Data 
                Controller, unless required to do so by EU or member state law.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">4.2 Confidentiality</h3>
              <p>
                The Data Processor shall ensure that persons authorized to process personal data have committed 
                themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">4.3 Security Measures</h3>
              <p>
                The Data Processor shall implement appropriate technical and organizational measures to ensure 
                a level of security appropriate to the risk, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Pseudonymisation and encryption of personal data</li>
                <li>Ability to ensure ongoing confidentiality, integrity, availability, and resilience</li>
                <li>Ability to restore availability and access in a timely manner</li>
                <li>Regular testing and evaluation of security measures</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">4.4 Sub-processors</h3>
              <p>
                The Data Processor shall not engage another processor without prior specific or general written 
                authorization of the Data Controller. The Data Processor maintains a list of sub-processors at 
                the time of agreement.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">4.5 Data Subject Rights</h3>
              <p>
                The Data Processor shall assist the Data Controller by implementing appropriate technical and 
                organizational measures to fulfill the Data Controller's obligation to respond to data subject 
                requests, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Right of access</li>
                <li>Right to rectification</li>
                <li>Right to erasure</li>
                <li>Right to restriction of processing</li>
                <li>Right to data portability</li>
                <li>Right to object</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">4.6 Data Breach Notification</h3>
              <p>
                The Data Processor shall notify the Data Controller without undue delay (and in any event within 
                72 hours) after becoming aware of a personal data breach.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">4.7 Data Protection Impact Assessment</h3>
              <p>
                The Data Processor shall assist the Data Controller in carrying out data protection impact 
                assessments and prior consultations with supervisory authorities.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">4.8 Deletion or Return of Data</h3>
              <p>
                The Data Processor shall, at the choice of the Data Controller, delete or return all personal 
                data to the Data Controller after the end of the provision of services, and delete existing 
                copies unless EU or member state law requires storage.
              </p>

              <h3 className="text-xl font-medium mb-2 mt-4">4.9 Audits and Inspections</h3>
              <p>
                The Data Processor shall make available to the Data Controller all information necessary to 
                demonstrate compliance and allow for and contribute to audits, including inspections, conducted 
                by the Data Controller or another auditor mandated by the Data Controller.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">5. Data Controller Obligations</h2>
              <p>
                The Data Controller shall:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Ensure that its processing of personal data is lawful</li>
                <li>Provide only lawful instructions to the Data Processor</li>
                <li>Be responsible for ensuring compliance with data protection principles</li>
                <li>Respond to data subject requests in a timely manner</li>
                <li>Notify data subjects of any processing activities</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">6. International Data Transfers</h2>
              <p>
                If the Data Processor transfers personal data to a third country or international organization, 
                the Data Processor shall ensure that:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  The third country ensures an adequate level of protection, or
                </li>
                <li>
                  Appropriate safeguards are in place (e.g., Standard Contractual Clauses), or
                </li>
                <li>
                  Binding corporate rules are in place
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">7. Technical and Organizational Measures</h2>
              <p>
                The Data Processor has implemented the following technical and organizational measures:
              </p>
              
              <h3 className="text-xl font-medium mb-2 mt-4">7.1 Physical Security</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Secure data centers with 24/7 monitoring</li>
                <li>Access controls and surveillance</li>
                <li>Environmental controls (fire suppression, temperature control)</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">7.2 Network Security</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Firewalls and intrusion detection systems</li>
                <li>Encryption in transit (TLS 1.3)</li>
                <li>Regular vulnerability scanning</li>
                <li>DDoS protection</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">7.3 Application Security</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Secure coding practices</li>
                <li>Regular security audits and penetration testing</li>
                <li>Input validation and output encoding</li>
                <li>Authentication and authorization controls</li>
                <li>CSRF protection</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">7.4 Data Security</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Encryption at rest (AES-256)</li>
                <li>Secure key management</li>
                <li>Regular backups with encryption</li>
                <li>Data access logging and monitoring</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">7.5 Organizational Measures</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Data protection policies and procedures</li>
                <li>Employee training on data protection</li>
                <li>Confidentiality agreements</li>
                <li>Incident response procedures</li>
                <li>Regular security awareness training</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">8. Duration and Termination</h2>
              <p>
                This DPA shall remain in effect for as long as the Data Processor processes personal data on 
                behalf of the Data Controller. Upon termination of the service agreement, this DPA shall 
                continue to apply to any processing of personal data that occurs after termination.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">9. Liability and Indemnification</h2>
              <p>
                Each party shall be liable for damages caused by its processing in violation of this DPA. 
                The Data Processor shall be liable for damages caused by processing only where it has not 
                complied with its obligations under this DPA or where it has acted outside or contrary to 
                lawful instructions of the Data Controller.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">10. Governing Law</h2>
              <p>
                This DPA shall be governed by and construed in accordance with the laws of the jurisdiction 
                where the Data Controller is established, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
              <p>
                For any questions regarding this DPA or data protection matters, please contact:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-4">
                <li>Data Protection Officer: dpo@inaya-auth.com</li>
                <li>Privacy Team: privacy@inaya-auth.com</li>
                <li>Address: iNAYA TechLab, Security & Privacy Team</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">12. Annexes</h2>
              <h3 className="text-xl font-medium mb-2">Annex 1: List of Sub-processors</h3>
              <p>
                The Data Processor uses the following sub-processors:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Cloud hosting providers (AWS, Google Cloud, Azure)</li>
                <li>Database providers (PostgreSQL)</li>
                <li>Monitoring and logging services</li>
                <li>Email delivery services (for notifications)</li>
                <li>SMS delivery services (for OTP)</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">Annex 2: Description of Processing</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Categories of Data Subjects:</strong> End users, administrators</li>
                <li><strong>Categories of Personal Data:</strong> Name, email, phone, authentication data, session data</li>
                <li><strong>Purpose of Processing:</strong> Authentication, authorization, account management</li>
                <li><strong>Duration of Processing:</strong> Duration of service agreement plus 30 days</li>
              </ul>

              <h3 className="text-xl font-medium mb-2 mt-4">Annex 3: Technical and Organizational Measures</h3>
              <p>
                See Section 7 of this DPA for detailed description of technical and organizational measures.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
