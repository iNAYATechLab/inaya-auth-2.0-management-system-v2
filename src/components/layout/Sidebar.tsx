'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  User,
  Shield,
  Key,
  Fingerprint,
  Monitor,
  CreditCard,
  Code,
  Webhook,
  BadgeCheck,
  Download,
  Bell,
  Settings,
  ChevronLeft,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const t = useTranslations('dashboard');
  const pathname = usePathname();

  const navigationItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: t('navigation.dashboard'),
      href: '/dashboard',
    },
    {
      icon: User,
      label: t('navigation.profile'),
      href: '/profile',
    },
    {
      icon: Shield,
      label: t('navigation.security'),
      href: '/security',
    },
    {
      icon: Key,
      label: t('navigation.twoFactor'),
      href: '/security/2fa',
    },
    {
      icon: Fingerprint,
      label: t('navigation.passkeys'),
      href: '/passkeys',
    },
    {
      icon: Monitor,
      label: t('navigation.sessions'),
      href: '/sessions',
    },
    {
      icon: CreditCard,
      label: t('navigation.billing'),
      href: '/billing',
    },
    {
      icon: Code,
      label: t('navigation.apiKeys'),
      href: '/api-keys',
    },
    {
      icon: Webhook,
      label: t('navigation.webhooks'),
      href: '/webhooks',
    },
    {
      icon: BadgeCheck,
      label: t('navigation.kyc'),
      href: '/kyc',
    },
    {
      icon: Download,
      label: t('navigation.dataManagement'),
      href: '/data-management',
    },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-neutral-200 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-500 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-neutral-900">iNAYA</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-4 overflow-y-auto h-[calc(100vh-8rem)]">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-700 font-medium shadow-sm'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive && 'text-primary-700')} />
                <span className="text-sm">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-200">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all"
            onClick={onClose}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm">{t('navigation.settings')}</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
