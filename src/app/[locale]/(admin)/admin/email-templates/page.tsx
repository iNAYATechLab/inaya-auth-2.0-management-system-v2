'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Mail, Check, History, Eye } from 'lucide-react';
import { EmailTemplatePreview } from '@/components/email/EmailTemplatePreview';

interface TemplateVersion {
  id: string;
  version: number;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: Record<string, string>;
  isActive: boolean;
  createdAt: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  activeVersionId: string | null;
  versions: TemplateVersion[];
}

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showVersionForm, setShowVersionForm] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<TemplateVersion | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const tenantId = 'demo-tenant-id';
      const response = await fetch(`/api/admin/email-templates?tenantId=${tenantId}`);
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (formData: FormData) => {
    try {
      const tenantId = 'demo-tenant-id';
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          name: formData.get('name'),
          type: formData.get('type'),
          subject: formData.get('subject'),
          htmlContent: formData.get('htmlContent'),
          textContent: formData.get('textContent'),
        }),
      });

      if (response.ok) {
        setShowCreateForm(false);
        loadTemplates();
      }
    } catch (error) {
      console.error('Error creating template:', error);
    }
  };

  const handleCreateVersion = async (formData: FormData) => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(
        `/api/admin/email-templates/${selectedTemplate.id}/versions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: formData.get('subject'),
            htmlContent: formData.get('htmlContent'),
            textContent: formData.get('textContent'),
          }),
        }
      );

      if (response.ok) {
        setShowVersionForm(false);
        loadTemplates();
      }
    } catch (error) {
      console.error('Error creating version:', error);
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(
        `/api/admin/email-templates/${selectedTemplate.id}/versions/${versionId}/activate`,
        { method: 'PUT' }
      );

      if (response.ok) {
        loadTemplates();
      }
    } catch (error) {
      console.error('Error activating version:', error);
    }
  };

  const handlePreviewVersion = async (version: TemplateVersion) => {
    setPreviewVersion(version);
    setShowPreviewModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Email Templates</h1>
          <p className="text-neutral-600 mt-1">
            Manage email templates and their versions
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
            <CardDescription>Create a new email template with initial version</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleCreateTemplate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input id="name" name="name" required placeholder="welcome" />
                </div>
                <div>
                  <Label htmlFor="type">Template Type</Label>
                  <select
                    id="type"
                    name="type"
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md"
                    required
                  >
                    <option value="WELCOME">Welcome</option>
                    <option value="VERIFICATION">Verification</option>
                    <option value="PASSWORD_RESET">Password Reset</option>
                    <option value="TWO_FACTOR">Two Factor</option>
                    <option value="LOGIN_ALERT">Login Alert</option>
                    <option value="SUBSCRIPTION">Subscription</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="OTP">OTP</option>
                    <option value="KYC">KYC</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
              </div>
              <div>
                <Label htmlFor="subject">Email Subject</Label>
                <Input id="subject" name="subject" required placeholder="Welcome to {{companyName}}!" />
              </div>
              <div>
                <Label htmlFor="htmlContent">HTML Content</Label>
                <textarea
                  id="htmlContent"
                  name="htmlContent"
                  rows={10}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md font-mono text-sm"
                  required
                  placeholder="Enter HTML email template..."
                />
              </div>
              <div>
                <Label htmlFor="textContent">Plain Text Content</Label>
                <textarea
                  id="textContent"
                  name="textContent"
                  rows={5}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-md font-mono text-sm"
                  placeholder="Enter plain text version..."
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Create Template</Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all ${
              selectedTemplate?.id === template.id
                ? 'ring-2 ring-primary-600'
                : 'hover:shadow-md'
            }`}
            onClick={() => {
              setSelectedTemplate(template);
              setShowVersionForm(false);
            }}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary-600" />
                  {template.name}
                </CardTitle>
                {template.isActive && (
                  <Badge variant="default">Active</Badge>
                )}
              </div>
              <CardDescription>
                Type: {template.type}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">
                  {template.versions.length} version{template.versions.length !== 1 ? 's' : ''}
                </span>
                <Badge variant="outline">
                  v{template.versions[0]?.version || 0}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedTemplate && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Version History: {selectedTemplate.name}
                </CardTitle>
                <CardDescription>
                  Manage different versions of this template
                </CardDescription>
              </div>
              <Button onClick={() => setShowVersionForm(!showVersionForm)}>
                <Plus className="w-4 h-4 mr-2" />
                New Version
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {showVersionForm && (
              <form action={handleCreateVersion} className="space-y-4 mb-6 p-4 border border-neutral-200 rounded-lg">
                <div>
                  <Label htmlFor="new-subject">Email Subject</Label>
                  <Input id="new-subject" name="subject" required />
                </div>
                <div>
                  <Label htmlFor="new-html">HTML Content</Label>
                  <textarea
                    id="new-html"
                    name="htmlContent"
                    rows={8}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md font-mono text-sm"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="new-text">Plain Text Content</Label>
                  <textarea
                    id="new-text"
                    name="textContent"
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md font-mono text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Version</Button>
                  <Button type="button" variant="outline" onClick={() => setShowVersionForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {selectedTemplate.versions.map((version) => (
                <div
                  key={version.id}
                  className={`p-4 border rounded-lg ${
                    version.isActive
                      ? 'border-green-500 bg-green-50'
                      : 'border-neutral-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">v{version.version}</Badge>
                      <span className="text-sm text-neutral-600">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                      {version.isActive && (
                        <Badge className="bg-green-500">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewVersion(version)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Preview
                      </Button>
                      {!version.isActive && (
                        <Button
                          size="sm"
                          onClick={() => handleActivateVersion(version.id)}
                        >
                          Activate
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">
                    <strong>Subject:</strong> {version.subject}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Modal */}
      {showPreviewModal && previewVersion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Preview: {selectedTemplate?.name} (v{previewVersion.version})
              </h2>
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>
                Close
              </Button>
            </div>
            <div className="p-6">
              <EmailTemplatePreview
                htmlContent={previewVersion.htmlContent}
                textContent={previewVersion.textContent}
                subject={previewVersion.subject}
                variables={previewVersion.variables}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
