import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST /api/admin/email-templates/[templateId]/versions - Create new version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
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

    const { templateId } = await params;
    const body = await request.json();
    const { subject, htmlContent, textContent, variables } = body;

    if (!subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Subject and HTML content are required' },
        { status: 400 }
      );
    }

    // Get template
    const template = await prisma.emailTemplate.findUnique({
      where: { id: templateId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1,
        },
      },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Calculate next version number
    const lastVersion = template.versions[0]?.version || 0;
    const nextVersion = lastVersion + 1;

    // Create new version
    const newVersion = await prisma.emailTemplateVersion.create({
      data: {
        templateId,
        version: nextVersion,
        subject,
        htmlContent,
        textContent: textContent || '',
        variables: variables || {},
        isActive: false, // Not active by default
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ version: newVersion }, { status: 201 });
  } catch (error) {
    console.error('Error creating template version:', error);
    return NextResponse.json(
      { error: 'Failed to create version' },
      { status: 500 }
    );
  }
}

// GET /api/admin/email-templates/[templateId]/versions - Get all versions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { templateId } = await params;

    const versions = await prisma.emailTemplateVersion.findMany({
      where: { templateId },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error('Error fetching template versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}
