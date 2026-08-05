import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PUT /api/admin/email-templates/[templateId]/versions/[versionId]/activate - Activate a version
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string; versionId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { templateId, versionId } = await params;

    // Verify version belongs to template
    const version = await prisma.emailTemplateVersion.findFirst({
      where: {
        id: versionId,
        templateId,
      },
    });

    if (!version) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      );
    }

    // Deactivate all versions of this template
    await prisma.emailTemplateVersion.updateMany({
      where: { templateId },
      data: { isActive: false },
    });

    // Activate selected version
    await prisma.emailTemplateVersion.update({
      where: { id: versionId },
      data: { isActive: true },
    });

    // Update template's active version ID
    await prisma.emailTemplate.update({
      where: { id: templateId },
      data: { activeVersionId: versionId },
    });

    return NextResponse.json({
      message: 'Version activated successfully',
      versionId,
    });
  } catch (error) {
    console.error('Error activating template version:', error);
    return NextResponse.json(
      { error: 'Failed to activate version' },
      { status: 500 }
    );
  }
}
