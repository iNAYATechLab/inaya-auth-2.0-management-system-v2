import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { replaceVariables, type TemplateVariables } from '@/lib/email/emailTemplate.util';

// POST /api/admin/email-templates/preview - Generate email preview
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
    const { htmlContent, textContent, subject, variables } = body;

    if (!htmlContent) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    // Default sample variables if not provided
    const sampleVariables: TemplateVariables = variables || {
      companyName: 'iNAYA TechLab',
      userName: 'John Doe',
      loginUrl: 'https://app.inaya-auth.com/login',
      verificationUrl: 'https://app.inaya-auth.com/verify?token=abc123',
      resetUrl: 'https://app.inaya-auth.com/reset-password?token=xyz789',
      expiryTime: '24 hours',
      year: new Date().getFullYear().toString(),
      supportEmail: 'support@inaya-auth.com',
      otpCode: '123456',
    };

    // Replace variables in content
    const previewHtml = replaceVariables(htmlContent, sampleVariables);
    const previewText = textContent ? replaceVariables(textContent, sampleVariables) : '';
    const previewSubject = subject ? replaceVariables(subject, sampleVariables) : '';

    return NextResponse.json({
      previewHtml,
      previewText,
      previewSubject,
      variables: sampleVariables,
    });
  } catch (error) {
    console.error('Error generating preview:', error);
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    );
  }
}
