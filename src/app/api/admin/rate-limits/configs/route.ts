import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/rate-limits/configs - Get all rate limit configurations
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

    const configs = await prisma.rateLimitConfig.findMany({
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      configs,
    });
  } catch (error) {
    console.error('Error fetching rate limit configs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limit configurations' },
      { status: 500 }
    );
  }
}

// POST /api/admin/rate-limits/configs - Create new rate limit configuration
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

    const body = await request.json();
    const { name, type, maxRequests, windowSeconds, blockDuration, description, isActive } = body;

    // Validate required fields
    if (!name || !type || !maxRequests || !windowSeconds) {
      return NextResponse.json(
        { error: 'Missing required fields: name, type, maxRequests, windowSeconds' },
        { status: 400 }
      );
    }

    // Create configuration
    const newConfig = await prisma.rateLimitConfig.create({
      data: {
        name,
        type,
        maxRequests: parseInt(maxRequests),
        windowSeconds: parseInt(windowSeconds),
        blockDuration: blockDuration ? parseInt(blockDuration) : 0,
        description: description || '',
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({
      success: true,
      config: newConfig,
    });
  } catch (error) {
    console.error('Error creating rate limit config:', error);
    return NextResponse.json(
      { error: 'Failed to create rate limit configuration' },
      { status: 500 }
    );
  }
}
