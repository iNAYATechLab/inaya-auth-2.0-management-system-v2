// Login Alerts Client Component (Task 32)
'use client';

import { useEffect, useState } from 'react';
import {
  getLoginAlertsAction,
  acknowledgeAlertAction,
  trustDeviceFromAlertAction,
} from '@/lib/security/security.actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  MapPin,
  Monitor,
  Clock,
} from 'lucide-react';

interface LoginAlert {
  id: string;
  ipAddress: string;
  deviceInfo: any;
  location: any;
  riskLevel: string;
  riskFactors: string[];
  isAcknowledged: boolean;
  createdAt: string;
}

export default function LoginAlertsClient() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<LoginAlert[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    const res = await getLoginAlertsAction();
    if (res.success && res.data) {
      setAlerts(res.data as unknown as LoginAlert[]);
    }
    setLoading(false);
  }

  async function acknowledge(alertId: string) {
    setActionLoading(alertId);
    await acknowledgeAlertAction(alertId);
    setAlerts(alerts.filter((a) => a.id !== alertId));
    setActionLoading(null);
  }

  async function trustDevice(alertId: string) {
    setActionLoading(alertId);
    await trustDeviceFromAlertAction(alertId);
    setAlerts(alerts.filter((a) => a.id !== alertId));
    setActionLoading(null);
  }

  function getRiskBadge(level: string) {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colors[level]}`}>
        {level.toUpperCase()} RISK
      </span>
    );
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Login Alerts</h1>
        <p className="text-gray-600 mt-1">
          Review unrecognized login attempts and secure your account
        </p>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All Clear!</h2>
          <p className="text-gray-600">No unrecognized login attempts detected</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Unrecognized Login</h3>
                    <p className="text-sm text-gray-600">{formatDate(alert.createdAt)}</p>
                  </div>
                </div>
                {getRiskBadge(alert.riskLevel)}
              </div>

              {/* Device Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-2">
                  <Monitor className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Device</p>
                    <p className="text-sm font-medium text-gray-900">
                      {alert.deviceInfo?.browser} on {alert.deviceInfo?.os}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium text-gray-900">
                      {alert.location?.city}, {alert.location?.country}
                    </p>
                    <p className="text-xs text-gray-500">{alert.ipAddress}</p>
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              {alert.riskFactors && alert.riskFactors.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Risk Factors:</p>
                  <div className="flex flex-wrap gap-2">
                    {alert.riskFactors.map((factor, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => trustDevice(alert.id)}
                  disabled={actionLoading === alert.id}
                >
                  {actionLoading === alert.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Trust This Device
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => acknowledge(alert.id)}
                  disabled={actionLoading === alert.id}
                >
                  Dismiss
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
