/**
 * GDPR Data Management Page (Task 51: GDPR Compliance)
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, FileText, AlertTriangle } from 'lucide-react';
import { 
  requestDataDownloadAction, 
  requestDataDeletionAction, 
  getUserDataRequestsAction,
  getGDPRConsentAction 
} from '@/lib/security/gdpr.actions';

interface DataRequest {
  id: string;
  type: 'DOWNLOAD' | 'DELETE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  downloadUrl?: string;
  expiresAt?: string;
  processedAt?: string;
  createdAt: string;
}

export default function GDPRDataManagementPage() {
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    const result = await getUserDataRequestsAction();
    if (result.success && result.requests) {
      setRequests(result.requests);
    }
    setLoading(false);
  }

  async function handleDataDownload() {
    if (!confirm('This will create a download request for all your data. Continue?')) {
      return;
    }

    setProcessing('download');
    const result = await requestDataDownloadAction();
    
    if (result.success) {
      alert('Data download request created. You will be able to download your data once it\'s ready.');
      await loadRequests();
    } else {
      alert('Failed to create download request: ' + result.error);
    }
    
    setProcessing(null);
  }

  async function handleDataDeletion() {
    if (!confirm('WARNING: This action is irreversible! All your data will be permanently deleted. Continue?')) {
      return;
    }

    if (!confirm('Are you absolutely sure? This cannot be undone.')) {
      return;
    }

    setProcessing('delete');
    const result = await requestDataDeletionAction();
    
    if (result.success) {
      alert('Data deletion request created. Your data will be deleted shortly.');
      await loadRequests();
    } else {
      alert('Failed to create deletion request: ' + result.error);
    }
    
    setProcessing(null);
  }

  function getStatusBadge(status: string) {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      FAILED: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Data Management</h1>
          <p className="text-neutral-600">
            Manage your data rights under GDPR. You can download your data or request deletion.
          </p>
        </div>

        {/* Data Download Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5 text-primary-600" />
              Download Your Data
            </CardTitle>
            <CardDescription>
              Request a copy of all your personal data. This includes your profile, authentication history, 
              sessions, and all associated data. The download link will be available for 24 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleDataDownload}
              disabled={processing === 'download'}
            >
              {processing === 'download' ? 'Processing...' : 'Request Data Download'}
            </Button>
            <p className="text-xs text-neutral-500 mt-2">
              Under GDPR Article 15, you have the right to access your personal data.
            </p>
          </CardContent>
        </Card>

        {/* Data Deletion Section */}
        <Card className="mb-6 border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Delete Your Data
            </CardTitle>
            <CardDescription>
              Request permanent deletion of all your personal data. This action is irreversible and will 
              delete your account, all associated data, and remove you from the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Warning: Irreversible Action</p>
                  <p className="text-sm text-red-700 mt-1">
                    This will permanently delete your account and all associated data. You will not be able 
                    to recover your account or data after this action.
                  </p>
                </div>
              </div>
            </div>
            <Button 
              variant="destructive"
              onClick={handleDataDeletion}
              disabled={processing === 'delete'}
            >
              {processing === 'delete' ? 'Processing...' : 'Request Data Deletion'}
            </Button>
            <p className="text-xs text-neutral-500 mt-2">
              Under GDPR Article 17, you have the "right to be forgotten".
            </p>
          </CardContent>
        </Card>

        {/* Data Requests History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Data Requests History
            </CardTitle>
            <CardDescription>
              View your past data download and deletion requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <p className="text-center text-neutral-500 py-8">
                No data requests found.
              </p>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {request.type === 'DOWNLOAD' ? (
                        <Download className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Trash2 className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {request.type === 'DOWNLOAD' ? 'Data Download' : 'Data Deletion'}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {new Date(request.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(request.status)}
                      {request.status === 'COMPLETED' && request.downloadUrl && (
                        <a href={request.downloadUrl} download>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* GDPR Rights Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Your GDPR Rights</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ul className="space-y-2 text-sm">
              <li>
                <strong>Right to Access (Article 15):</strong> You can request a copy of your personal data.
              </li>
              <li>
                <strong>Right to Rectification (Article 16):</strong> You can request correction of inaccurate data.
              </li>
              <li>
                <strong>Right to Erasure (Article 17):</strong> You can request deletion of your data ("right to be forgotten").
              </li>
              <li>
                <strong>Right to Restrict Processing (Article 18):</strong> You can request limitation of data processing.
              </li>
              <li>
                <strong>Right to Data Portability (Article 20):</strong> You can receive your data in a structured format.
              </li>
              <li>
                <strong>Right to Object (Article 21):</strong> You can object to processing of your data.
              </li>
            </ul>
            <p className="mt-4 text-sm">
              For more information about your rights, please read our{' '}
              <a href="/privacy-policy" className="text-primary-600 hover:underline">
                Privacy Policy
              </a>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
