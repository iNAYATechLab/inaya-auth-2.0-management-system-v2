// Security Checkup Client Component (Task 31)
'use client';

import { useEffect, useState } from 'react';
import {
  runSecurityCheckupAction,
  getSecurityCheckupAction,
} from '@/lib/security/security.actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

interface SecurityCheck {
  id: string;
  title: string;
  description: string;
  status: 'pass' | 'fail' | 'warning';
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation?: string;
  fixUrl?: string;
}

interface SecurityScoreResult {
  score: number;
  grade: string;
  checks: SecurityCheck[];
  recommendations: Array<{
    priority: number;
    title: string;
    description: string;
    action: string;
    fixUrl: string;
  }>;
}

export default function SecurityCheckupClient() {
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SecurityScoreResult | null>(null);

  useEffect(() => {
    loadCheckup();
  }, []);

  async function loadCheckup() {
    const res = await getSecurityCheckupAction();
    if (res.success && res.data) {
      setResult(res.data as unknown as SecurityScoreResult);
    }
    setLoading(false);
  }

  async function runCheckup() {
    setRunning(true);
    const res = await runSecurityCheckupAction();
    if (res.success && res.data) {
      setResult(res.data as unknown as SecurityScoreResult);
    }
    setRunning(false);
  }

  function getScoreColor(score: number) {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  function getGradeColor(grade: string) {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  }

  function getStatusIcon(status: string) {
    if (status === 'pass') return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (status === 'fail') return <XCircle className="w-5 h-5 text-red-600" />;
    return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
  }

  function getSeverityBadge(severity: string) {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-blue-100 text-blue-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[severity]}`}>
        {severity}
      </span>
    );
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Checkup</h1>
          <p className="text-gray-600 mt-1">
            Review your account security and get recommendations
          </p>
        </div>
        <Button onClick={runCheckup} disabled={running}>
          {running ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Running Checkup...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run New Checkup
            </>
          )}
        </Button>
      </div>

      {/* Security Score Card */}
      {result && (
        <Card className="p-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Your Security Score</p>
              <div className="flex items-baseline gap-4">
                <span className={`text-6xl font-bold ${getScoreColor(result.score)}`}>
                  {result.score}
                </span>
                <span
                  className={`text-2xl font-bold px-4 py-1 rounded ${getGradeColor(result.grade)}`}
                >
                  Grade: {result.grade}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {result.checks.filter((c) => c.status === 'pass').length} of{' '}
                {result.checks.length} checks passed
              </p>
            </div>
            <Shield className="w-24 h-24 text-primary-600 opacity-20" />
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {result && result.recommendations.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Priority Recommendations</h2>
          <div className="space-y-3">
            {result.recommendations.map((rec) => (
              <div
                key={rec.priority}
                className="flex items-start gap-4 p-4 bg-red-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold">
                  {rec.priority}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                </div>
                <a href={rec.fixUrl}>
                  <Button variant="outline" size="sm">
                    {rec.action}
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Security Checks */}
      {result && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Security Checks</h2>
          <div className="space-y-3">
            {result.checks.map((check) => (
              <div
                key={check.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-shrink-0 mt-0.5">{getStatusIcon(check.status)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{check.title}</h3>
                    {getSeverityBadge(check.severity)}
                  </div>
                  <p className="text-sm text-gray-600">{check.description}</p>
                  {check.recommendation && (
                    <p className="text-sm text-orange-600 mt-2">
                      💡 {check.recommendation}
                    </p>
                  )}
                </div>
                {check.fixUrl && check.status !== 'pass' && (
                  <a href={check.fixUrl}>
                    <Button variant="outline" size="sm">
                      Fix
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
