import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { cleanupExpiredRateLimits } from '@/lib/rateLimit/rateLimit.util';

// POST /api/admin/rate-limits/cleanup - Clean up expired rate limits
export async function POST(request: NextRequest) {
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

    const cleanedCount = await cleanupExpiredRateLimits();

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired rate limit records`,
      cleanedCount,
    });
  } catch (error) {
    console.error('Error cleaning up rate limits:', error);
    return NextResponse.json(
      { error: 'Failed to clean up rate limits' },
      { status: 500 }
    );
  }
}
