'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Settings, 
  Trash2, 
  Plus, 
  RefreshCw,
  Shield,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface RateLimitStats {
  byType: Array<{
    type: string;
    totalRequests: number;
    uniqueKeys: number;
  }>;
  totalBlocked: number;
}

interface RateLimitConfig {
  id: string;
  name: string;
  type: string;
  maxRequests: number;
  windowSeconds: number;
  blockDuration: number;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function RateLimitsPage() {
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [configs, setConfigs] = useState<RateLimitConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<RateLimitConfig | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, configsRes] = await Promise.all([
        fetch('/api/admin/rate-limits'),
        fetch('/api/admin/rate-limits/configs'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (configsRes.ok) {
        const configsData = await configsRes.json();
        setConfigs(configsData.configs);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConfig = async (formData: FormData) => {
    try {
      const response = await fetch('/api/admin/rate-limits/configs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          type: formData.get('type'),
          maxRequests: formData.get('maxRequests'),
          windowSeconds: formData.get('windowSeconds'),
          blockDuration: formData.get('blockDuration') || 0,
          description: formData.get('description'),
        }),
      });

      if (response.ok) {
        setShowConfigForm(false);
        loadData();
      }
    } catch (error) {
      console.error('Error creating config:', error);
    }
  };

  const handleUpdateConfig = async (formData: FormData) => {
    if (!editingConfig) return;

    try {
      const response = await fetch(`/api/admin/rate-limits/configs/${editingConfig.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          type: formData.get('type'),
          maxRequests: formData.get('maxRequests'),
          windowSeconds: formData.get('windowSeconds'),
          blockDuration: formData.get('blockDuration'),
          description: formData.get('description'),
          isActive: formData.get('isActive') === 'true',
        }),
      });

      if (response.ok) {
        setEditingConfig(null);
        loadData();
      }
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    try {
      const response = await fetch(`/api/admin/rate-limits/configs/${configId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting config:', error);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Are you sure you want to clean up expired rate limits?')) return;

    try {
      const response = await fetch('/api/admin/rate-limits/cleanup', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        loadData();
      }
    } catch (error) {
      console.error('Error cleaning up:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Rate Limiting</h1>
          <p className="text-neutral-600 mt-1">
            Monitor and manage API rate limits
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCleanup} variant="outline">
            <Trash2 className="w-4 h-4 mr-2" />
            Cleanup
          </Button>
          <Button onClick={() => setShowConfigForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Config
          </Button>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-primary-600" />
                  Blocked Requests
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                {stats.totalBlocked}
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                Currently blocked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Total Requests
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {stats.byType.reduce((sum, stat) => sum + stat.totalRequests, 0)}
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                Last hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  Active Keys
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {stats.byType.reduce((sum, stat) => sum + stat.uniqueKeys, 0)}
              </div>
              <p className="text-sm text-neutral-600 mt-1">
                Unique rate limit keys
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats by Type */}
      {stats && stats.byType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Rate Limit Statistics by Type</CardTitle>
            <CardDescription>
              Breakdown of rate limits by type in the last hour
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.byType.map((stat) => (
                <div key={stat.type} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {stat.type}
                    </Badge>
                    <div className="flex gap-4 text-sm text-neutral-600">
                      <span>
                        <strong>{stat.totalRequests}</strong> requests
                      </span>
                      <span>
                        <strong>{stat.uniqueKeys}</strong> unique keys
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configurations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Rate Limit Configurations
          </CardTitle>
          <CardDescription>
            Configure rate limits for different endpoints and users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <p>No custom configurations yet.</p>
              <p className="text-sm mt-1">Using default rate limit configurations.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {configs.map((config) => (
                <div key={config.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{config.name}</h3>
                        <Badge variant={config.isActive ? 'default' : 'secondary'}>
                          {config.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">{config.type}</Badge>
                      </div>
                      {config.description && (
                        <p className="text-sm text-neutral-600 mb-2">
                          {config.description}
                        </p>
                      )}
                      <div className="flex gap-4 text-sm text-neutral-600">
                        <span>
                          <strong>{config.maxRequests}</strong> requests per{' '}
                          <strong>{config.windowSeconds}</strong> seconds
                        </span>
                        {config.blockDuration > 0 && (
                          <span>
                            Block for <strong>{config.blockDuration}</strong> seconds
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingConfig(config)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteConfig(config.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Config Modal */}
      {(showConfigForm || editingConfig) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto">
            <CardHeader>
              <CardTitle>
                {editingConfig ? 'Edit Configuration' : 'Create New Configuration'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                action={editingConfig ? handleUpdateConfig : handleCreateConfig}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      defaultValue={editingConfig?.name}
                      required
                      placeholder="e.g., auth_login"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      name="type"
                      defaultValue={editingConfig?.type}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                      required
                    >
                      <option value="IP_GLOBAL">IP Global</option>
                      <option value="IP_AUTH">IP Auth</option>
                      <option value="USER_GLOBAL">User Global</option>
                      <option value="USER_AUTH">User Auth</option>
                      <option value="USER_API">User API</option>
                      <option value="ENDPOINT">Endpoint</option>
                      <option value="TENANT_API">Tenant API</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="maxRequests">Max Requests</Label>
                    <Input
                      id="maxRequests"
                      name="maxRequests"
                      type="number"
                      defaultValue={editingConfig?.maxRequests}
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="windowSeconds">Window (seconds)</Label>
                    <Input
                      id="windowSeconds"
                      name="windowSeconds"
                      type="number"
                      defaultValue={editingConfig?.windowSeconds}
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="blockDuration">Block Duration (seconds)</Label>
                    <Input
                      id="blockDuration"
                      name="blockDuration"
                      type="number"
                      defaultValue={editingConfig?.blockDuration}
                      min="0"
                      placeholder="0 = no blocking"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    defaultValue={editingConfig?.description}
                    placeholder="Optional description"
                  />
                </div>
                {editingConfig && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      defaultChecked={editingConfig.isActive}
                      className="rounded"
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="submit">
                    {editingConfig ? 'Update' : 'Create'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowConfigForm(false);
                      setEditingConfig(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
