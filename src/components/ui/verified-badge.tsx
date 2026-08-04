// Verified Badge Component (Task 37)
// Green tick badge for verified accounts

import { CheckCircle2 } from 'lucide-react';

interface VerifiedBadgeProps {
  isVerified: boolean;
  tier?: 'BASIC' | 'VERIFIED' | 'PREMIUM';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function VerifiedBadge({ isVerified, tier = 'BASIC', size = 'md', showLabel = false }: VerifiedBadgeProps) {
  if (!isVerified) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const badgeColors = {
    BASIC: 'bg-gray-100 text-gray-600',
    VERIFIED: 'bg-green-100 text-green-600',
    PREMIUM: 'bg-purple-100 text-purple-600',
  };

  const iconColors = {
    BASIC: 'text-gray-500',
    VERIFIED: 'text-green-500',
    PREMIUM: 'text-purple-500',
  };

  const labels = {
    BASIC: 'Basic Account',
    VERIFIED: 'Verified Account',
    PREMIUM: 'Premium Verified',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <div className={`${badgeColors[tier]} p-1 rounded-full`}>
        <CheckCircle2 className={`${sizeClasses[size]} ${iconColors[tier]}`} />
      </div>
      {showLabel && (
        <span className={`text-xs font-medium ${iconColors[tier]}`}>
          {labels[tier]}
        </span>
      )}
    </div>
  );
}
