import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/email-templates - Get all email templates
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is super admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (user?.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId is required' }, { status: 400 });
    }

    const templates = await prisma.emailTemplate.findMany({
      where: { tenantId },
      include: {
        versions: {
          orderBy: { version: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/email-templates - Create new template
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { tenantId, name, type, subject, htmlContent, textContent, variables } = body;

    if (!tenantId || !name || !type || !subject || !htmlContent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if template already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Template with this name already exists' },
        { status: 400 }
      );
    }

    // Create template with first version
    const template = await prisma.emailTemplate.create({
      data: {
        tenantId,
        name,
        type,
        isActive: true,
        versions: {
          create: {
            version: 1,
            subject,
            htmlContent,
            textContent: textContent || '',
            variables: variables || {},
            isActive: true,
            createdBy: session.user.id,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    // Update active version ID
    await prisma.emailTemplate.update({
      where: { id: template.id },
      data: { activeVersionId: template.versions[0].id },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Error creating email template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}
