// KYC Server Actions (Tasks 35-38)
// Handles KYC submission, verification, and badge management

'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { generateSecureFilePath, saveEncryptedFile, validateFile } from './fileUpload.util';
import { verifyFaceMatch, detectLiveness, calculateVerificationScore } from './faceVerification.util';
import { kycProviderRegistry } from './kycProvider.util';
import { logAction } from '@/lib/utils/audit';

/**
 * Submit KYC documents
 */
export async function submitKYCDocumentsAction(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = session.user.id;

    // Check if user already has pending KYC
    const existingKYC = await prisma.kYCRecord.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'UNDER_REVIEW'] },
      },
    });

    if (existingKYC) {
      return { success: false, error: 'You already have a pending KYC submission' };
    }

    // Validate consent
    const consentGiven = formData.get('consent') === 'true';
    if (!consentGiven) {
      return { success: false, error: 'You must provide consent to proceed with KYC' };
    }

    // Get uploaded files
    const documentFront = formData.get('documentFront') as File;
    const documentBack = formData.get('documentBack') as File | null;
    const selfie = formData.get('selfie') as File;
    const videoSelfie = formData.get('videoSelfie') as File | null;
    const documentType = formData.get('documentType') as string;

    // Validate files
    if (!documentFront || !selfie) {
      return { success: false, error: 'Document front and selfie are required' };
    }

    const docValidation = validateFile(
      { mimetype: documentFront.type, size: documentFront.size },
      ['image/jpeg', 'image/png'],
      10 * 1024 * 1024 // 10MB
    );
    if (!docValidation.valid) {
      return { success: false, error: `Invalid document: ${docValidation.error}` };
    }

    const selfieValidation = validateFile(
      { mimetype: selfie.type, size: selfie.size },
      ['image/jpeg', 'image/png'],
      5 * 1024 * 1024 // 5MB
    );
    if (!selfieValidation.valid) {
      return { success: false, error: `Invalid selfie: ${selfieValidation.error}` };
    }

    // Save encrypted files
    const docFrontPath = generateSecureFilePath(userId, 'doc_front');
    const docFrontBuffer = Buffer.from(await documentFront.arrayBuffer());
    const docFrontResult = await saveEncryptedFile(docFrontPath, docFrontBuffer);

    let docBackPath: string | undefined;
    let docBackIv: string | undefined;
    if (documentBack) {
      docBackPath = generateSecureFilePath(userId, 'doc_back');
      const docBackBuffer = Buffer.from(await documentBack.arrayBuffer());
      const docBackResult = await saveEncryptedFile(docBackPath, docBackBuffer);
      docBackIv = docBackResult.iv;
    }

    const selfiePath = generateSecureFilePath(userId, 'selfie');
    const selfieBuffer = Buffer.from(await selfie.arrayBuffer());
    const selfieResult = await saveEncryptedFile(selfiePath, selfieBuffer);

    // Handle video selfie if provided (Task 36)
    let videoSelfiePath: string | undefined;
    let videoSelfieIv: string | undefined;
    let livenessScore: number | undefined;
    
    if (videoSelfie) {
      const videoValidation = validateFile(
        { mimetype: videoSelfie.type, size: videoSelfie.size },
        ['video/mp4', 'video/quicktime'],
        50 * 1024 * 1024 // 50MB
      );
      if (!videoValidation.valid) {
        return { success: false, error: `Invalid video: ${videoValidation.error}` };
      }

      videoSelfiePath = generateSecureFilePath(userId, 'video_selfie');
      const videoBuffer = Buffer.from(await videoSelfie.arrayBuffer());
      const videoResult = await saveEncryptedFile(videoSelfiePath, videoBuffer);
      videoSelfieIv = videoResult.iv;

      // Perform liveness detection
      const livenessResult = await detectLiveness(videoSelfiePath, videoSelfieIv);
      if (!livenessResult.success) {
        return { success: false, error: livenessResult.error || 'Liveness detection failed' };
      }
      livenessScore = livenessResult.livenessScore;

      if (!livenessResult.isLive) {
        return { success: false, error: 'Liveness detection failed. Please ensure you are recording a live video.' };
      }
    }

    // Perform face match verification
    const faceResult = await verifyFaceMatch(
      docFrontPath,
      docFrontResult.iv,
      selfiePath,
      selfieResult.iv
    );

    if (!faceResult.success) {
      return { success: false, error: faceResult.error || 'Face verification failed' };
    }

    // Calculate overall score
    const verificationScore = calculateVerificationScore(
      faceResult.matchScore,
      livenessScore || 0.8 // Default high score if no liveness check
    );

    // Check if we should use third-party KYC provider
    const kycProvider = kycProviderRegistry.getDefaultProvider();
    let kycProviderId: string | undefined;
    let kycProviderResponse: any;

    if (kycProvider && verificationScore.status !== 'pass') {
      // Submit to third-party for manual review
      const providerSession = await kycProvider.createSession(userId, {
        documentType,
      });

      const providerResult = await kycProvider.submitDocuments(providerSession.sessionId, {
        documentType,
        documentFront: docFrontBuffer,
        documentBack: documentBack ? Buffer.from(await documentBack.arrayBuffer()) : undefined,
        selfie: selfieBuffer,
      });

      kycProviderId = providerResult.providerId;
    }

    // Create KYC record
    const kycRecord = await prisma.kYCRecord.create({
      data: {
        userId,
        type: videoSelfie ? 'FULL_KYC' : 'ID_VERIFICATION',
        status: verificationScore.status === 'pass' ? 'VERIFIED' : 'PENDING',
        documentType,
        documentFrontUrl: docFrontResult.path,
        documentBackUrl: docBackPath,
        selfieUrl: selfieResult.path,
        videoSelfieUrl: videoSelfiePath,
        livenessScore,
        faceMatchScore: faceResult.matchScore,
        kycProvider: kycProvider?.name,
        kycProviderId,
        kycProviderResponse,
        consentGiven: true,
        consentTimestamp: new Date(),
        submittedAt: new Date(),
      },
    });

    // If auto-approved, update user verification status
    if (verificationScore.status === 'pass') {
      await prisma.user.update({
        where: { id: userId },
        data: {
          isVerified: true,
          verificationTier: 'VERIFIED',
          kycStatus: 'VERIFIED',
          kycVerifiedAt: new Date(),
        },
      });

      await logAction({
        userId,
        action: 'KYC_VERIFIED',
        description: 'KYC verified automatically',
        metadata: {
          faceMatchScore: faceResult.matchScore,
          livenessScore,
          verificationScore: verificationScore.score,
        },
      });
    } else {
      await prisma.user.update({
        where: { id: userId },
        data: {
          kycStatus: 'PENDING',
          kycSubmittedAt: new Date(),
        },
      });

      await logAction({
        userId,
        action: 'KYC_SUBMITTED',
        description: 'KYC submitted for review',
        metadata: {
          faceMatchScore: faceResult.matchScore,
          livenessScore,
          verificationScore: verificationScore.score,
        },
      });
    }

    revalidatePath('/kyc');

    return {
      success: true,
    };
  } catch (error) {
    console.error('KYC submission error:', error);
    return { success: false, error: 'Failed to submit KYC' };
  }
}

/**
 * Get user KYC status
 */
export async function getKYCStatusAction(): Promise<{
  success: boolean;
  data?: {
    isVerified: boolean;
    verificationTier: string;
    kycStatus: string;
    latestRecord?: any;
  };
}> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        isVerified: true,
        verificationTier: true,
        kycStatus: true,
        kycRecords: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      return { success: false };
    }

    return {
      success: true,
      data: {
        isVerified: user.isVerified,
        verificationTier: user.verificationTier,
        kycStatus: user.kycStatus,
        latestRecord: user.kycRecords[0] || null,
      },
    };
  } catch (error) {
    console.error('Get KYC status error:', error);
    return { success: false };
  }
}

/**
 * Admin: Approve KYC
 */
export async function approveKYCAction(kycId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminUser || !['ADMIN', 'SUPERADMIN'].includes(adminUser.role)) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const kycRecord = await prisma.kYCRecord.findUnique({
      where: { id: kycId },
    });

    if (!kycRecord) {
      return { success: false, error: 'KYC record not found' };
    }

    // Update KYC record
    await prisma.kYCRecord.update({
      where: { id: kycId },
      data: {
        status: 'VERIFIED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        verifiedAt: new Date(),
      },
    });

    // Update user verification status
    await prisma.user.update({
      where: { id: kycRecord.userId },
      data: {
        isVerified: true,
        verificationTier: 'VERIFIED',
        kycStatus: 'VERIFIED',
        kycVerifiedAt: new Date(),
      },
    });

    // Log action
    await logAction({
      userId: kycRecord.userId,
      action: 'KYC_VERIFIED',
      description: 'KYC manually verified by admin',
      metadata: { reviewedBy: session.user.id },
    });

    revalidatePath('/admin/kyc');

    return { success: true };
  } catch (error) {
    console.error('Approve KYC error:', error);
    return { success: false, error: 'Failed to approve KYC' };
  }
}

/**
 * Admin: Reject KYC
 */
export async function rejectKYCAction(
  kycId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!adminUser || !['ADMIN', 'SUPERADMIN'].includes(adminUser.role)) {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const kycRecord = await prisma.kYCRecord.findUnique({
      where: { id: kycId },
    });

    if (!kycRecord) {
      return { success: false, error: 'KYC record not found' };
    }

    // Update KYC record
    await prisma.kYCRecord.update({
      where: { id: kycId },
      data: {
        status: 'REJECTED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Update user KYC status
    await prisma.user.update({
      where: { id: kycRecord.userId },
      data: {
        kycStatus: 'REJECTED',
      },
    });

    // Log action
    await logAction({
      userId: kycRecord.userId,
      action: 'KYC_REJECTED',
      description: `KYC rejected: ${reason}`,
      metadata: { reviewedBy: session.user.id, reason },
    });

    revalidatePath('/admin/kyc');

    return { success: true };
  } catch (error) {
    console.error('Reject KYC error:', error);
    return { success: false, error: 'Failed to reject KYC' };
  }
}

/**
 * Delete KYC data (Privacy/GDPR)
 */
export async function deleteKYCDataAction(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const userId = session.user.id;

    // Get all KYC records
    const kycRecords = await prisma.kYCRecord.findMany({
      where: { userId },
    });

    // Delete encrypted files
    for (const record of kycRecords) {
      if (record.documentFrontUrl) {
        await import('./fileUpload.util').then((m) =>
          m.deleteEncryptedFile(record.documentFrontUrl!)
        );
      }
      if (record.documentBackUrl) {
        await import('./fileUpload.util').then((m) =>
          m.deleteEncryptedFile(record.documentBackUrl!)
        );
      }
      if (record.selfieUrl) {
        await import('./fileUpload.util').then((m) =>
          m.deleteEncryptedFile(record.selfieUrl!)
        );
      }
      if (record.videoSelfieUrl) {
        await import('./fileUpload.util').then((m) =>
          m.deleteEncryptedFile(record.videoSelfieUrl!)
        );
      }
    }

    // Delete KYC records from database
    await prisma.kYCRecord.deleteMany({
      where: { userId },
    });

    // Reset user verification status
    await prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: false,
        verificationTier: 'BASIC',
        kycStatus: 'NOT_SUBMITTED',
        kycSubmittedAt: null,
        kycVerifiedAt: null,
      },
    });

    revalidatePath('/kyc');

    return { success: true };
  } catch (error) {
    console.error('Delete KYC data error:', error);
    return { success: false, error: 'Failed to delete KYC data' };
  }
}
