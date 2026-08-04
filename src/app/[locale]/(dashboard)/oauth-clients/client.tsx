/**
 * OAuth Clients Client Component
 * Task 23-26: SSO Client Management UI
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { deleteOAuthClientAction } from '@/lib/oauth/oauth-client.actions';

interface OAuthClient {
  id: string;
  clientId: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  isPublic: boolean;
  createdAt: Date;
  logoUrl?: string | null;
  websiteUrl?: string | null;
}

interface OAuthClientsClientProps {
  clients: OAuthClient[];
}

export default function OAuthClientsClient({ clients: initialClients }: OAuthClientsClientProps) {
  const [clients, setClients] = useState(initialClients);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`Are you sure you want to delete "${clientName}"? This will revoke all active tokens and disconnect all users.`)) {
      return;
    }

    const result = await deleteOAuthClientAction(clientId);

    if (result.success) {
      setClients(clients.filter(c => c.id !== clientId));
      setMessage({ type: 'success', text: 'OAuth client deleted successfully' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete client' });
    }
  };

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
            <span className="text-3xl">🔐</span>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">No OAuth Applications</h3>
          <p className="text-neutral-600 mb-6">
            Create your first OAuth application to enable Single Sign-On for your projects.
          </p>
          <a
            href="/oauth-clients/new"
            className="inline-block px-6 py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-lg font-medium transition-all"
          >
            Create Your First Application
          </a>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg border ${
            message.type === 'success'
              ? 'bg-success-50 border-success-200 text-success-700'
              : 'bg-error-50 border-error-200 text-error-700'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Clients List */}
      {clients.map((client) => (
        <Card key={client.id} className="hover:shadow-inaya-lg transition-all">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                {/* Logo */}
                <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {client.logoUrl ? (
                    <img src={client.logoUrl} alt={client.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">🔐</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-neutral-900 truncate">
                      {client.name}
                    </h3>
                    {client.isActive ? (
                      <span className="px-2 py-0.5 text-xs font-medium bg-success-100 text-success-700 rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-600 rounded-full">
                        Inactive
                      </span>
                    )}
                    {client.isPublic && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-info-100 text-info-700 rounded-full">
                        Public
                      </span>
                    )}
                  </div>

                  {client.description && (
                    <p className="text-sm text-neutral-600 mb-2 line-clamp-2">
                      {client.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <span>Client ID: <code className="bg-neutral-100 px-2 py-0.5 rounded font-mono">{client.clientId.substring(0, 16)}...</code></span>
                    <span>Created: {new Date(client.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <a
                  href={`/oauth-clients/${client.id}`}
                  className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-sm font-medium text-neutral-700 transition-all"
                >
                  Manage
                </a>
                <button
                  onClick={() => handleDelete(client.id, client.name)}
                  className="px-4 py-2 border border-error-200 hover:bg-error-50 rounded-lg text-sm font-medium text-error-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
