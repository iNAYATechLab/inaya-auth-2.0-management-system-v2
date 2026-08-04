// KYC Client Component (Tasks 35-38)
'use client';

import { useEffect, useState } from 'react';
import { getKYCStatusAction, submitKYCDocumentsAction, deleteKYCDataAction } from '@/lib/kyc/kyc.actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Upload,
  FileText,
  Camera,
  Video,
  Loader2,
  AlertCircle,
  Trash2,
} from 'lucide-react';

interface KYCStatus {
  isVerified: boolean;
  verificationTier: string;
  kycStatus: string;
  latestRecord?: {
    id: string;
    status: string;
    rejectionReason?: string;
    submittedAt: Date;
  } | null;
}

export default function KYCClient({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [step, setStep] = useState(1);
  const [consent, setConsent] = useState(false);
  const [documentType, setDocumentType] = useState('national_id');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    const result = await getKYCStatusAction();
    if (result.success && result.data) {
      setKycStatus(result.data as KYCStatus);
    }
    setLoading(false);
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await submitKYCDocumentsAction(formData);

    if (result.success) {
      setSuccess('KYC submitted successfully! Your verification is being processed.');
      await loadStatus();
      setStep(1);
    } else {
      setError(result.error || 'Failed to submit KYC');
    }

    setSubmitting(false);
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete all KYC data? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    const result = await deleteKYCDataAction();

    if (result.success) {
      setSuccess('KYC data deleted successfully');
      await loadStatus();
    } else {
      setError(result.error || 'Failed to delete KYC data');
    }

    setSubmitting(false);
  }

  function getStatusBadge(status: string) {
    const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
      VERIFIED: { icon: CheckCircle2, color: 'bg-green-100 text-green-800', label: 'Verified' },
      PENDING: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      UNDER_REVIEW: { icon: Clock, color: 'bg-blue-100 text-blue-800', label: 'Under Review' },
      REJECTED: { icon: XCircle, color: 'bg-red-100 text-red-800', label: 'Rejected' },
      NOT_SUBMITTED: { icon: AlertCircle, color: 'bg-gray-100 text-gray-800', label: 'Not Submitted' },
    };

    const config = statusConfig[status] || statusConfig.NOT_SUBMITTED;
    const Icon = config.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${config.color}`}>
        <Icon className="w-5 h-5" />
        <span className="font-medium">{config.label}</span>
      </div>
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
          <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
          <p className="text-gray-600 mt-1">Verify your identity to unlock all features</p>
        </div>
        {kycStatus?.isVerified && (
          <Badge className="bg-green-100 text-green-800 border-green-200 px-4 py-2">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Verified Account
          </Badge>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Status Card */}
      {kycStatus && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Verification Status</h2>
            {getStatusBadge(kycStatus.kycStatus)}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600">Verification Tier</p>
              <p className="text-lg font-semibold capitalize">{kycStatus.verificationTier}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Account Status</p>
              <p className="text-lg font-semibold">
                {kycStatus.isVerified ? 'Verified ✓' : 'Basic'}
              </p>
            </div>
          </div>

          {kycStatus.latestRecord && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">Last Submission</p>
              <p className="text-sm">
                {new Date(kycStatus.latestRecord.submittedAt).toLocaleDateString()}
              </p>
              {kycStatus.latestRecord.rejectionReason && (
                <div className="mt-2 p-3 bg-red-50 rounded">
                  <p className="text-sm text-red-800">
                    <strong>Rejection Reason:</strong> {kycStatus.latestRecord.rejectionReason}
                  </p>
                </div>
              )}
            </div>
          )}

          {kycStatus.isVerified && (
            <div className="mt-4 pt-4 border-t">
              <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete KYC Data
              </Button>
              <p className="text-xs text-gray-500 mt-2">
                This will remove all KYC data and reset your verification status
              </p>
            </div>
          )}
        </Card>
      )}

      {/* KYC Submission Form */}
      {(!kycStatus || kycStatus.kycStatus === 'NOT_SUBMITTED' || kycStatus.kycStatus === 'REJECTED') && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Submit KYC Documents</h2>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    s < step
                      ? 'bg-green-500 text-white'
                      : s === step
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {s < step ? '✓' : s}
                </div>
                {s < 4 && (
                  <div className={`w-20 h-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(new FormData(e.currentTarget)); }}>
            {/* Step 1: Consent */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Privacy & Consent</h3>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-900">
                    By submitting KYC documents, you consent to:
                  </p>
                  <ul className="list-disc list-inside mt-2 text-sm text-blue-800 space-y-1">
                    <li>Processing your identity documents for verification</li>
                    <li>Storing encrypted copies of your documents securely</li>
                    <li>Using third-party services for identity verification (if applicable)</li>
                    <li>Retaining data in accordance with our privacy policy</li>
                  </ul>
                </div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="text-sm">
                    I have read and agree to the privacy policy and consent to the processing of my identity documents for KYC verification.
                  </span>
                </label>
                <Button onClick={() => setStep(2)} disabled={!consent}>
                  Continue
                </Button>
              </div>
            )}

            {/* Step 2: Document Type */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Select Document Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: 'national_id', label: 'National ID Card' },
                    { value: 'passport', label: 'Passport' },
                    { value: 'driving_license', label: "Driver's License" },
                  ].map((doc) => (
                    <button
                      key={doc.value}
                      type="button"
                      onClick={() => setDocumentType(doc.value)}
                      className={`p-4 border-2 rounded-lg text-left transition-all ${
                        documentType === doc.value
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <FileText className="w-6 h-6 mb-2" />
                      <p className="font-medium">{doc.label}</p>
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 3: Upload Documents */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Upload Documents</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Document Front *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-600 transition-colors">
                      <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <input
                        type="file"
                        name="documentFront"
                        accept="image/jpeg,image/png"
                        required
                        className="hidden"
                        id="docFront"
                      />
                      <label htmlFor="docFront" className="cursor-pointer text-primary-600 hover:underline">
                        Click to upload front of document
                      </label>
                      <p className="text-xs text-gray-500 mt-1">JPEG or PNG, max 10MB</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Document Back (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-600 transition-colors">
                      <Upload className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <input
                        type="file"
                        name="documentBack"
                        accept="image/jpeg,image/png"
                        className="hidden"
                        id="docBack"
                      />
                      <label htmlFor="docBack" className="cursor-pointer text-primary-600 hover:underline">
                        Click to upload back of document
                      </label>
                      <p className="text-xs text-gray-500 mt-1">JPEG or PNG, max 10MB</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Selfie *</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-600 transition-colors">
                      <Camera className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                      <input
                        type="file"
                        name="selfie"
                        accept="image/jpeg,image/png"
                        required
                        className="hidden"
                        id="selfie"
                      />
                      <label htmlFor="selfie" className="cursor-pointer text-primary-600 hover:underline">
                        Click to upload selfie
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Clear face photo, JPEG or PNG, max 5MB</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)}>Continue</Button>
                </div>
              </div>
            )}

            {/* Step 4: Video Selfie (Optional) */}
            {step === 4 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Video Selfie (Recommended)</h3>
                <p className="text-sm text-gray-600">
                  Recording a 5-second video selfie helps us verify your identity more accurately and speeds up the verification process.
                </p>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-600 transition-colors">
                  <Video className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <input
                    type="file"
                    name="videoSelfie"
                    accept="video/mp4,video/quicktime"
                    className="hidden"
                    id="videoSelfie"
                  />
                  <label htmlFor="videoSelfie" className="cursor-pointer text-primary-600 hover:underline">
                    Click to record video selfie
                  </label>
                  <p className="text-xs text-gray-500 mt-1">MP4 or MOV, max 50MB, 5 seconds</p>
                </div>

                <input type="hidden" name="documentType" value={documentType} />
                <input type="hidden" name="consent" value={consent ? 'true' : 'false'} />

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit KYC'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Card>
      )}
    </div>
  );
}
