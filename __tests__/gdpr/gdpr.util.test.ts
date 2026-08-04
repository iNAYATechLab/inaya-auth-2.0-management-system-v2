// GDPR Utilities Tests
import {
  hasAcceptedPrivacyPolicy,
  getGDPRConsent,
} from '@/lib/security/gdpr.util';

// Mock prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    gDPRConsent: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';

describe('GDPR Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hasAcceptedPrivacyPolicy', () => {
    it('should return true if user has accepted privacy policy', async () => {
      (prisma.gDPRConsent.findUnique as jest.Mock).mockResolvedValue({
        userId: 'test-user',
        privacyPolicyAccepted: true,
        privacyPolicyAcceptedAt: new Date(),
      });

      const result = await hasAcceptedPrivacyPolicy('test-user');
      expect(result).toBe(true);
    });

    it('should return false if user has not accepted privacy policy', async () => {
      (prisma.gDPRConsent.findUnique as jest.Mock).mockResolvedValue({
        userId: 'test-user',
        privacyPolicyAccepted: false,
      });

      const result = await hasAcceptedPrivacyPolicy('test-user');
      expect(result).toBe(false);
    });

    it('should return false if no consent record exists', async () => {
      (prisma.gDPRConsent.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await hasAcceptedPrivacyPolicy('test-user');
      expect(result).toBe(false);
    });
  });

  describe('getGDPRConsent', () => {
    it('should return consent object if exists', async () => {
      const mockConsent = {
        userId: 'test-user',
        privacyPolicyAccepted: true,
        cookieConsent: { essential: true, analytics: false },
        dataProcessingAccepted: true,
      };

      (prisma.gDPRConsent.findUnique as jest.Mock).mockResolvedValue(mockConsent);

      const result = await getGDPRConsent('test-user');
      expect(result).toEqual(mockConsent);
    });

    it('should return null if no consent exists', async () => {
      (prisma.gDPRConsent.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getGDPRConsent('test-user');
      expect(result).toBeNull();
    });
  });
});
