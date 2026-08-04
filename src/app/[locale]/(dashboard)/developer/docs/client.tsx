// API Documentation Client Component (Task 44)
'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Code2, Key, Webhook, Zap, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export default function DocsClient() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function copyCode(code: string, id: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const CodeBlock = ({ code, id }: { code: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="outline"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyCode(code, id)}
      >
        {copiedCode === id ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-inaya-gradient shadow-inaya-lg mb-4">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-neutral-900 mb-2">API Documentation</h1>
        <p className="text-lg text-neutral-600">
          Complete guide to integrating with iNAYA Auth API
        </p>
      </div>

      {/* Table of Contents */}
      <Card className="mb-8 p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Table of Contents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="#authentication" className="flex items-center gap-2 text-primary-700 hover:underline">
            <Key className="w-4 h-4" />
            <span>Authentication</span>
          </a>
          <a href="#endpoints" className="flex items-center gap-2 text-primary-700 hover:underline">
            <Code2 className="w-4 h-4" />
            <span>API Endpoints</span>
          </a>
          <a href="#webhooks" className="flex items-center gap-2 text-primary-700 hover:underline">
            <Webhook className="w-4 h-4" />
            <span>Webhooks</span>
          </a>
          <a href="#sdks" className="flex items-center gap-2 text-primary-700 hover:underline">
            <Zap className="w-4 h-4" />
            <span>SDKs & Libraries</span>
          </a>
        </div>
      </Card>

      {/* Authentication Section */}
      <section id="authentication" className="mb-12">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Key className="w-6 h-6 text-primary-700" />
          Authentication
        </h2>
        <p className="text-neutral-600 mb-4">
          All API requests require authentication using an API key. Include your API key in the <code className="bg-neutral-100 px-2 py-1 rounded">Authorization</code> header:
        </p>
        <CodeBlock
          id="auth-header"
          code={`Authorization: Bearer YOUR_API_KEY`}
        />
        <p className="text-neutral-600 mt-4 mb-4">
          You can create API keys from the <a href="/developer/api-keys" className="text-primary-700 hover:underline">API Keys</a> page.
        </p>
      </section>

      {/* API Endpoints Section */}
      <section id="endpoints" className="mb-12">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Code2 className="w-6 h-6 text-primary-700" />
          API Endpoints
        </h2>

        <h3 className="text-xl font-semibold text-neutral-900 mb-3">Base URL</h3>
        <CodeBlock
          id="base-url"
          code={`https://api.inaya-auth.com/v1`}
        />

        <h3 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">Users</h3>
        
        <Card className="mb-4 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold bg-success-100 text-success-800 rounded">GET</span>
            <code className="text-sm font-mono">/users</code>
          </div>
          <p className="text-sm text-neutral-600 mb-2">List all users in your tenant</p>
          <CodeBlock
            id="get-users"
            code={`curl -X GET "https://api.inaya-auth.com/v1/users" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
        </Card>

        <Card className="mb-4 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold bg-primary-100 text-primary-800 rounded">POST</span>
            <code className="text-sm font-mono">/users</code>
          </div>
          <p className="text-sm text-neutral-600 mb-2">Create a new user</p>
          <CodeBlock
            id="create-user"
            code={`curl -X POST "https://api.inaya-auth.com/v1/users" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'`}
          />
        </Card>

        <Card className="mb-4 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold bg-success-100 text-success-800 rounded">GET</span>
            <code className="text-sm font-mono">/users/:id</code>
          </div>
          <p className="text-sm text-neutral-600 mb-2">Get user details</p>
          <CodeBlock
            id="get-user"
            code={`curl -X GET "https://api.inaya-auth.com/v1/users/USER_ID" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
        </Card>

        <h3 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">Tenants</h3>
        
        <Card className="mb-4 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold bg-success-100 text-success-800 rounded">GET</span>
            <code className="text-sm font-mono">/tenants</code>
          </div>
          <p className="text-sm text-neutral-600 mb-2">List all tenants (Super Admin only)</p>
          <CodeBlock
            id="get-tenants"
            code={`curl -X GET "https://api.inaya-auth.com/v1/tenants" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
        </Card>

        <h3 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">OAuth Clients</h3>
        
        <Card className="mb-4 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-semibold bg-success-100 text-success-800 rounded">GET</span>
            <code className="text-sm font-mono">/oauth/clients</code>
          </div>
          <p className="text-sm text-neutral-600 mb-2">List OAuth clients for your tenant</p>
          <CodeBlock
            id="get-oauth-clients"
            code={`curl -X GET "https://api.inaya-auth.com/v1/oauth/clients" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
        </Card>
      </section>

      {/* Webhooks Section */}
      <section id="webhooks" className="mb-12">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Webhook className="w-6 h-6 text-primary-700" />
          Webhooks
        </h2>
        <p className="text-neutral-600 mb-4">
          Webhooks allow you to receive real-time notifications when events occur in your tenant.
        </p>

        <h3 className="text-xl font-semibold text-neutral-900 mb-3">Verifying Webhook Signatures</h3>
        <p className="text-neutral-600 mb-4">
          All webhook payloads are signed using HMAC-SHA256. Verify the signature to ensure the payload is authentic:
        </p>
        <CodeBlock
          id="verify-webhook"
          code={`import crypto from 'crypto';

function verifyWebhookSignature(payload, signature, secret, timestamp) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(\`\${timestamp}.\${payload}\`)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}`}
        />

        <h3 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">Available Events</h3>
        <Card className="p-4">
          <ul className="space-y-2 text-sm">
            {[
              'user.created - New user registered',
              'user.updated - User profile updated',
              'user.deleted - User deleted',
              'user.login - User logged in',
              'user.logout - User logged out',
              'tenant.created - New tenant created',
              'tenant.updated - Tenant updated',
              'oauth.client.created - OAuth client created',
              'api.key.created - API key created',
              'security.alert - Security alert triggered',
              'kyc.submitted - KYC verification submitted',
              'kyc.verified - KYC verification approved',
              'kyc.rejected - KYC verification rejected',
            ].map((event, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="w-2 h-2 bg-primary-700 rounded-full"></span>
                <code className="text-neutral-700">{event}</code>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* SDKs Section */}
      <section id="sdks" className="mb-12">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary-700" />
          SDKs & Libraries
        </h2>
        <p className="text-neutral-600 mb-4">
          Official SDKs are available for popular languages:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-2">JavaScript/TypeScript</h3>
            <CodeBlock
              id="js-sdk"
              code={`npm install @inaya/auth-sdk

import { InayaAuth } from '@inaya/auth-sdk';

const client = new InayaAuth({
  apiKey: 'YOUR_API_KEY'
});

const users = await client.users.list();`}
            />
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-2">Python</h3>
            <CodeBlock
              id="py-sdk"
              code={`pip install inaya-auth

from inaya_auth import InayaAuth

client = InayaAuth(api_key="YOUR_API_KEY")
users = client.users.list()`}
            />
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-2">Go</h3>
            <CodeBlock
              id="go-sdk"
              code={`go get github.com/inaya/auth-go

import "github.com/inaya/auth-go"

client := auth.NewClient("YOUR_API_KEY")
users, _ := client.Users.List()`}
            />
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-neutral-900 mb-2">PHP</h3>
            <CodeBlock
              id="php-sdk"
              code={`composer require inaya/auth-php

use Inaya\\Auth\\Client;

$client = new Client('YOUR_API_KEY');
$users = $client->users()->list();`}
            />
          </Card>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">Rate Limits</h2>
        <p className="text-neutral-600 mb-4">
          API requests are rate limited to ensure fair usage:
        </p>
        <Card className="p-4">
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="font-semibold">Free Plan:</span>
              <span className="text-neutral-600">100 requests/minute</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-semibold">Starter Plan:</span>
              <span className="text-neutral-600">1,000 requests/minute</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-semibold">Professional Plan:</span>
              <span className="text-neutral-600">10,000 requests/minute</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="font-semibold">Enterprise Plan:</span>
              <span className="text-neutral-600">Custom limits</span>
            </li>
          </ul>
        </Card>
      </section>

      {/* Support */}
      <section>
        <Card className="p-6 bg-primary-50 border-primary-200">
          <h2 className="text-xl font-semibold text-primary-900 mb-2">Need Help?</h2>
          <p className="text-primary-700 mb-4">
            If you have questions or need assistance with the API, reach out to our support team:
          </p>
          <div className="flex gap-4">
            <a
              href="mailto:support@inaya-auth.com"
              className="inline-flex items-center gap-2 bg-primary-700 text-white px-4 py-2 rounded-lg hover:bg-primary-800 transition-colors"
            >
              Email Support
            </a>
            <a
              href="https://docs.inaya-auth.com"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-4 py-2 rounded-lg border border-primary-200 hover:bg-primary-50 transition-colors"
            >
              Full Documentation
            </a>
          </div>
        </Card>
      </section>
    </div>
  );
}
