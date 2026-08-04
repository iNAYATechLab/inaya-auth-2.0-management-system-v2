// Developer Portal Landing Page (Task 43)
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import { Key, Webhook, BookOpen, Code2, Zap } from 'lucide-react';

export default async function DeveloperPortalPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-inaya-gradient shadow-inaya-lg mb-4">
            <Code2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">Developer Portal</h1>
          <p className="text-lg text-neutral-600">
            Build powerful integrations with iNAYA Auth API
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/developer/api-keys" className="group">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-inaya-lg transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center">
                  <Key className="w-6 h-6 text-primary-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">API Keys</h3>
                  <p className="text-sm text-neutral-600">Manage your API credentials</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Create and manage API keys</span>
                <span className="text-primary-700 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link href="/developer/webhooks" className="group">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-inaya-lg transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-accent-100 flex items-center justify-center">
                  <Webhook className="w-6 h-6 text-accent-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Webhooks</h3>
                  <p className="text-sm text-neutral-600">Real-time event notifications</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Subscribe to events</span>
                <span className="text-accent-700 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link href="/developer/docs" className="group">
            <div className="bg-white rounded-xl border border-neutral-200 p-6 hover:shadow-inaya-lg transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-lg bg-success-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-success-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Documentation</h3>
                  <p className="text-sm text-neutral-600">API reference & guides</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-neutral-500">Learn how to integrate</span>
                <span className="text-success-700 group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="bg-white rounded-xl border border-neutral-200 p-8">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
            What You Can Build
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'Real-time Events',
                description: 'Get notified instantly when users sign up, log in, or change their profile',
              },
              {
                icon: Key,
                title: 'Secure API Access',
                description: 'Authenticate your applications with secure API keys',
              },
              {
                icon: Code2,
                title: 'Custom Integrations',
                description: 'Build custom workflows and integrations with our REST API',
              },
              {
                icon: Webhook,
                title: 'Webhook Events',
                description: 'Subscribe to user lifecycle events and security alerts',
              },
              {
                icon: BookOpen,
                title: 'Comprehensive Docs',
                description: 'Detailed documentation with examples and best practices',
              },
              {
                icon: Zap,
                title: 'Multi-Tenant Support',
                description: 'Manage multiple organizations and their users',
              },
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 mb-1">{feature.title}</h3>
                  <p className="text-sm text-neutral-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-primary-700 to-accent-500 rounded-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
            <p className="text-white/90 mb-6">
              Create your first API key and start building integrations in minutes
            </p>
            <Link
              href="/developer/api-keys"
              className="inline-flex items-center gap-2 bg-white text-primary-700 px-6 py-3 rounded-lg font-semibold hover:bg-white/90 transition-colors"
            >
              <Key className="w-5 h-5" />
              Create API Key
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
