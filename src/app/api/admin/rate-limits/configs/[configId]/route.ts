import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PUT /api/admin/rate-limits/configs/[configId] - Update rate limit configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
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

    const { configId } = await params;
    const body = await request.json();
    const { name, type, maxRequests, windowSeconds, blockDuration, description, isActive } = body;

    // Check if config exists
    const existingConfig = await prisma.rateLimitConfig.findUnique({
      where: { id: configId },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Rate limit configuration not found' },
        { status: 404 }
      );
    }

    // Update configuration
    const updatedConfig = await prisma.rateLimitConfig.update({
      where: { id: configId },
      data: {
        name: name || existingConfig.name,
        type: type || existingConfig.type,
        maxRequests: maxRequests ? parseInt(maxRequests) : existingConfig.maxRequests,
        windowSeconds: windowSeconds ? parseInt(windowSeconds) : existingConfig.windowSeconds,
        blockDuration: blockDuration !== undefined ? parseInt(blockDuration) : existingConfig.blockDuration,
        description: description !== undefined ? description : existingConfig.description,
        isActive: isActive !== undefined ? isActive : existingConfig.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      config: updatedConfig,
    });
  } catch (error) {
    console.error('Error updating rate limit config:', error);
    return NextResponse.json(
      { error: 'Failed to update rate limit configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/rate-limits/configs/[configId] - Delete rate limit configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ configId: string }> }
) {
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

    const { configId } = await params;

    // Check if config exists
    const existingConfig = await prisma.rateLimitConfig.findUnique({
      where: { id: configId },
    });

    if (!existingConfig) {
      return NextResponse.json(
        { error: 'Rate limit configuration not found' },
        { status: 404 }
      );
    }

    // Delete configuration
    await prisma.rateLimitConfig.delete({
      where: { id: configId },
    });

    return NextResponse.json({
      success: true,
      message: 'Rate limit configuration deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting rate limit config:', error);
    return NextResponse.json(
      { error: 'Failed to delete rate limit configuration' },
      { status: 500 }
    );
  }
}
