// API Keys Client Component (Task 43)
'use client';

import { useEffect, useState } from 'react';
import { getApiKeysAction, createApiKeyAction, revokeApiKeyAction, deleteApiKeyAction } from '@/lib/developer/developer.actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Key, Plus, Copy, Trash2, Ban, CheckCircle, AlertCircle } from 'lucide-react';

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  expiresAt?: string;
  lastUsedAt?: string;
  isActive: boolean;
  createdAt: string;
}

export default function ApiKeysClient() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  async function loadApiKeys() {
    const result = await getApiKeysAction();
    if (result.success && result.apiKeys) {
      setApiKeys(result.apiKeys as unknown as ApiKey[]);
    }
    setLoading(false);
  }

  async function handleCreate(formData: FormData) {
    const result = await createApiKeyAction(formData);
    
    if (result.success && result.apiKey) {
      setNewApiKey(result.apiKey.rawKey);
      setShowCreateForm(false);
      setMessage({ type: 'success', text: 'API key created successfully!' });
      await loadApiKeys();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create API key' });
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    
    const result = await revokeApiKeyAction(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'API key revoked' });
      await loadApiKeys();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to revoke API key' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this API key? This cannot be undone.')) return;
    
    const result = await deleteApiKeyAction(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'API key deleted' });
      await loadApiKeys();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete API key' });
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
    setTimeout(() => setMessage(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">API Keys</h1>
          <p className="text-neutral-600">
            Create and manage API keys for authenticating your applications
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-success-50 border border-success-200 text-success-800'
            : 'bg-error-50 border border-error-200 text-error-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* New API Key Display */}
      {newApiKey && (
        <Card className="mb-6 p-6 border-2 border-primary-200 bg-primary-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900 mb-2">
                🎉 Your New API Key
              </h3>
              <p className="text-sm text-primary-700 mb-3">
                Copy this key now. You won't be able to see it again!
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-4 py-2 rounded border border-primary-200 font-mono text-sm break-all">
                  {newApiKey}
                </code>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(newApiKey)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNewApiKey(null)}
            >
              ✕
            </Button>
          </div>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Create New API Key</h2>
          <form action={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Key Name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g., Production API Key"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Permissions
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['users:read', 'users:write', 'tenants:read', 'tenants:write', 'oauth:read', 'oauth:write'].map((perm) => (
                  <label key={perm} className="flex items-center gap-2 p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 cursor-pointer">
                    <input
                      type="checkbox"
                      name="permissions"
                      value={perm}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">{perm}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Expires In (optional)
              </label>
              <select
                name="expiresIn"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Never</option>
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                <option value="365">1 year</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Create API Key</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* API Keys List */}
      {apiKeys.length === 0 ? (
        <Card className="p-12 text-center">
          <Key className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            No API Keys Yet
          </h3>
          <p className="text-neutral-600 mb-6">
            Create your first API key to start building integrations
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create API Key
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {apiKey.name}
                    </h3>
                    {!apiKey.isActive && (
                      <span className="px-2 py-1 text-xs font-medium bg-error-100 text-error-800 rounded">
                        Revoked
                      </span>
                    )}
                    {apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date() && (
                      <span className="px-2 py-1 text-xs font-medium bg-warning-100 text-warning-800 rounded">
                        Expired
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <span className="font-mono bg-neutral-100 px-2 py-1 rounded">
                        {apiKey.keyPrefix}...
                      </span>
                      <span>Created {new Date(apiKey.createdAt).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-neutral-600">
                      <span>Permissions:</span>
                      <div className="flex flex-wrap gap-1">
                        {(apiKey.permissions as string[]).map((perm) => (
                          <span key={perm} className="px-2 py-0.5 text-xs bg-primary-100 text-primary-800 rounded">
                            {perm}
                          </span>
                        ))}
                      </div>
                    </div>

                    {apiKey.lastUsedAt && (
                      <div className="text-neutral-600">
                        Last used: {new Date(apiKey.lastUsedAt).toLocaleString()}
                      </div>
                    )}

                    {apiKey.expiresAt && (
                      <div className="text-neutral-600">
                        Expires: {new Date(apiKey.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {apiKey.isActive && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevoke(apiKey.id)}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Revoke
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(apiKey.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
