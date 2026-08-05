'use client';

import { useState } from 'react';
import { Eye, Code, Mail, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EmailTemplatePreviewProps {
  htmlContent: string;
  textContent?: string;
  subject?: string;
  variables?: Record<string, string>;
  onVariablesChange?: (variables: Record<string, string>) => void;
}

export function EmailTemplatePreview({
  htmlContent,
  textContent,
  subject,
  variables = {},
  onVariablesChange,
}: EmailTemplatePreviewProps) {
  const [viewMode, setViewMode] = useState<'visual' | 'html' | 'text'>('visual');
  const [previewData, setPreviewData] = useState<{
    previewHtml?: string;
    previewText?: string;
    previewSubject?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePreview = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/email-templates/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          htmlContent,
          textContent,
          subject,
          variables,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPreviewData(data);
      }
    } catch (error) {
      console.error('Error generating preview:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Email Preview
          </CardTitle>
          <Button onClick={generatePreview} disabled={loading} size="sm">
            {loading ? 'Generating...' : 'Generate Preview'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {previewData ? (
          <>
            {/* View Mode Tabs */}
            <div className="flex gap-2 mb-4 border-b border-neutral-200">
              <button
                onClick={() => setViewMode('visual')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  viewMode === 'visual'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Mail className="w-4 h-4" />
                Visual Preview
              </button>
              <button
                onClick={() => setViewMode('html')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  viewMode === 'html'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Code className="w-4 h-4" />
                HTML Source
              </button>
              <button
                onClick={() => setViewMode('text')}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  viewMode === 'text'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <FileText className="w-4 h-4" />
                Plain Text
              </button>
            </div>

            {/* Preview Content */}
            {viewMode === 'visual' && previewData.previewHtml && (
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                {/* Email Client Header */}
                <div className="bg-neutral-100 px-4 py-3 border-b border-neutral-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  {previewData.previewSubject && (
                    <div className="text-sm">
                      <strong>Subject:</strong> {previewData.previewSubject}
                    </div>
                  )}
                </div>
                
                {/* Email Body */}
                <iframe
                  srcDoc={previewData.previewHtml}
                  className="w-full h-[600px] bg-white"
                  title="Email Preview"
                />
              </div>
            )}

            {viewMode === 'html' && previewData.previewHtml && (
              <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                <pre className="text-xs font-mono overflow-auto max-h-[600px]">
                  <code>{previewData.previewHtml}</code>
                </pre>
              </div>
            )}

            {viewMode === 'text' && previewData.previewText && (
              <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50">
                <pre className="text-sm font-mono whitespace-pre-wrap overflow-auto max-h-[600px]">
                  {previewData.previewText}
                </pre>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Click "Generate Preview" to see how your email will look</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
