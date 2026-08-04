/**
 * Admin Backup Client Component (Task 49)
 */

'use client';

import { useEffect, useState } from 'react';
import { 
  createSystemBackupAction, 
  listBackupsAction, 
  restoreFromBackupAction,
  deleteBackupAction,
  exportSystemDataAction
} from '@/lib/admin/admin.actions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Trash2, HardDrive, CheckCircle, AlertCircle } from 'lucide-react';

interface Backup {
  filename: string;
  size: number;
  createdAt: string;
}

export default function AdminBackupClient() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  async function loadBackups() {
    const result = await listBackupsAction();
    if (result.success && result.backups) {
      setBackups(result.backups as Backup[]);
    }
    setLoading(false);
  }

  async function handleCreateBackup() {
    setCreatingBackup(true);
    setMessage(null);

    const result = await createSystemBackupAction({
      compress: true,
      encrypt: true,
      includeMedia: false,
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Backup created successfully!' });
      await loadBackups();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to create backup' });
    }

    setCreatingBackup(false);
  }

  async function handleRestore(filename: string) {
    if (!confirm('Are you sure you want to restore from this backup? This will overwrite current data.')) {
      return;
    }

    setMessage(null);
    const result = await restoreFromBackupAction(filename);

    if (result.success) {
      setMessage({ type: 'success', text: 'Backup restored successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to restore backup' });
    }
  }

  async function handleDelete(filename: string) {
    if (!confirm('Are you sure you want to delete this backup?')) {
      return;
    }

    setMessage(null);
    const result = await deleteBackupAction(filename);

    if (result.success) {
      setMessage({ type: 'success', text: 'Backup deleted successfully!' });
      await loadBackups();
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to delete backup' });
    }
  }

  async function handleExportSystem() {
    setMessage(null);
    const result = await exportSystemDataAction();

    if (result.success && result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename || 'system-export.json';
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'System data exported successfully!' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to export system data' });
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Backup & Data Management</h1>
        <p className="text-neutral-600">Create backups, restore data, and export system information</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-success-50 border border-success-200 text-success-800'
            : 'bg-error-50 border border-error-200 text-error-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <HardDrive className="w-8 h-8 text-primary-700" />
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Create Backup</h2>
              <p className="text-sm text-neutral-600">Create a full system backup</p>
            </div>
          </div>
          <Button onClick={handleCreateBackup} disabled={creatingBackup} className="w-full">
            {creatingBackup ? 'Creating Backup...' : 'Create Backup Now'}
          </Button>
          <p className="text-xs text-neutral-500 mt-2">
            Backups are encrypted and stored securely
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Download className="w-8 h-8 text-green-700" />
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Export System Data</h2>
              <p className="text-sm text-neutral-600">Export all system data as JSON</p>
            </div>
          </div>
          <Button onClick={handleExportSystem} variant="outline" className="w-full">
            Export System Data
          </Button>
          <p className="text-xs text-neutral-500 mt-2">
            Download a JSON file with all system data
          </p>
        </Card>
      </div>

      {/* Backups List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">Available Backups</h2>
        
        {backups.length === 0 ? (
          <div className="text-center py-12">
            <HardDrive className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
            <p className="text-neutral-600">No backups available</p>
            <p className="text-sm text-neutral-500 mt-2">Create your first backup to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={backup.filename} className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <HardDrive className="w-6 h-6 text-neutral-600" />
                  <div>
                    <div className="font-medium text-neutral-900">{backup.filename}</div>
                    <div className="text-sm text-neutral-600">
                      {formatFileSize(backup.size)} • {new Date(backup.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRestore(backup.filename)}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(backup.filename)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
