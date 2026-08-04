// Webhooks Client Component (Task 44)
'use client';

import { useEffect, useState } from 'react';
import { getWebhooksAction, createWebhookAction, deleteWebhookAction, getWebhookDeliveriesAction } from '@/lib/developer/developer.actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Webhook, Plus, Trash2, CheckCircle, AlertCircle, Activity } from 'lucide-react';

const WEBHOOK_EVENTS = [
  'user.created',
  'user.updated',
  'user.deleted',
  'user.login',
  'user.logout',
  'tenant.created',
  'tenant.updated',
  'tenant.deleted',
  'oauth.client.created',
  'api.key.created',
  'security.alert',
  'kyc.submitted',
  'kyc.verified',
  'kyc.rejected',
];

interface WebhookItem {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

interface WebhookDelivery {
  id: string;
  event: string;
  payload: any;
  statusCode?: number;
  success: boolean;
  deliveredAt?: string;
  createdAt: string;
}

export default function WebhooksClient() {
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadWebhooks();
  }, []);

  async function loadWebhooks() {
    const result = await getWebhooksAction();
    if (result.success && result.webhooks) {
      setWebhooks(result.webhooks);
    }
    setLoading(false);
  }

  async function handleCreate(formData: FormData) {
    const result = await createWebhookAction(formData);
    
    if (result.success && result.webhook) {
      setNewWebhookSecret(result.webhook.secret);
      setShowCreateForm(false);
      setMessage({ type: 'success', text: 'Webhook created successfully!' });
      await loadWebhooks();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create webhook' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    
    const result = await deleteWebhookAction(id);
    if (result.success) {
      setMessage({ type: 'success', text: 'Webhook deleted' });
      await loadWebhooks();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete webhook' });
    }
  }

  async function viewDeliveries(webhookId: string) {
    setSelectedWebhook(webhookId);
    const result = await getWebhookDeliveriesAction(webhookId);
    if (result.success && result.deliveries) {
      setDeliveries(result.deliveries);
    }
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
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Webhooks</h1>
          <p className="text-neutral-600">
            Subscribe to events and receive real-time notifications
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Webhook
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

      {/* New Webhook Secret */}
      {newWebhookSecret && (
        <Card className="mb-6 p-6 border-2 border-primary-200 bg-primary-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-primary-900 mb-2">
                🔐 Webhook Signing Secret
              </h3>
              <p className="text-sm text-primary-700 mb-3">
                Use this secret to verify webhook signatures. Save it now - you won't see it again!
              </p>
              <code className="block bg-white px-4 py-2 rounded border border-primary-200 font-mono text-sm break-all">
                {newWebhookSecret}
              </code>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setNewWebhookSecret(null)}
            >
              ✕
            </Button>
          </div>
        </Card>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card className="mb-6 p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Create New Webhook</h2>
          <form action={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Webhook URL
              </label>
              <input
                type="url"
                name="url"
                required
                placeholder="https://your-app.com/webhooks"
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-xs text-neutral-500 mt-1">
                The URL where we'll send POST requests for subscribed events
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Events to Subscribe
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-neutral-200 rounded-lg p-4">
                {WEBHOOK_EVENTS.map((event) => (
                  <label key={event} className="flex items-center gap-2 p-2 hover:bg-neutral-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      name="events"
                      value={event}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700 font-mono">{event}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">Create Webhook</Button>
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

      {/* Webhooks List */}
      {webhooks.length === 0 ? (
        <Card className="p-12 text-center">
          <Webhook className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            No Webhooks Yet
          </h3>
          <p className="text-neutral-600 mb-6">
            Create your first webhook to start receiving event notifications
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Webhook
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <Card key={webhook.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Webhook className="w-5 h-5 text-primary-700" />
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {webhook.url}
                    </h3>
                    {!webhook.isActive && (
                      <span className="px-2 py-1 text-xs font-medium bg-error-100 text-error-800 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-neutral-600">
                      <span>Events:</span>
                      <div className="flex flex-wrap gap-1">
                        {(webhook.events as string[]).slice(0, 3).map((event) => (
                          <span key={event} className="px-2 py-0.5 text-xs bg-primary-100 text-primary-800 rounded">
                            {event}
                          </span>
                        ))}
                        {(webhook.events as string[]).length > 3 && (
                          <span className="px-2 py-0.5 text-xs bg-neutral-100 text-neutral-600 rounded">
                            +{(webhook.events as string[]).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-neutral-600">
                      <span>Created: {new Date(webhook.createdAt).toLocaleDateString()}</span>
                      {webhook.lastTriggeredAt && (
                        <span>Last triggered: {new Date(webhook.lastTriggeredAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => viewDeliveries(webhook.id)}
                  >
                    <Activity className="w-4 h-4 mr-1" />
                    View Logs
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(webhook.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Delivery Logs */}
              {selectedWebhook === webhook.id && deliveries.length > 0 && (
                <div className="mt-4 pt-4 border-t border-neutral-200">
                  <h4 className="font-semibold text-neutral-900 mb-3">Recent Deliveries</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {deliveries.slice(0, 10).map((delivery) => (
                      <div
                        key={delivery.id}
                        className={`p-3 rounded-lg border ${
                          delivery.success
                            ? 'bg-success-50 border-success-200'
                            : 'bg-error-50 border-error-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{delivery.event}</span>
                          <span className="text-xs text-neutral-600">
                            {new Date(delivery.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          {delivery.statusCode && (
                            <span className={`px-2 py-0.5 rounded ${
                              delivery.statusCode >= 200 && delivery.statusCode < 300
                                ? 'bg-success-100 text-success-800'
                                : 'bg-error-100 text-error-800'
                            }`}>
                              {delivery.statusCode}
                            </span>
                          )}
                          <span className={delivery.success ? 'text-success-700' : 'text-error-700'}>
                            {delivery.success ? '✓ Delivered' : '✗ Failed'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
