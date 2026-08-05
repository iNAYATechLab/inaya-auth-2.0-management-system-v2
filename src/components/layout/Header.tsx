'use client';

import { useTranslations } from 'next-intl';
import { useSession, signOut } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  Settings,
  ChevronDown,
  Shield,
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const t = useTranslations('dashboard');
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-neutral-200">
      <div className="flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Left: Menu Button & Search */}
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search Bar - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-neutral-50 rounded-lg border border-neutral-200 w-96">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder={t('header.searchPlaceholder')}
              className="bg-transparent outline-none text-sm flex-1"
            />
          </div>
        </div>

        {/* Right: Notifications & User Menu */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-neutral-100 transition-colors">
            <Bell className="w-5 h-5 text-neutral-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-error-500 rounded-full"></span>
          </button>

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-accent-500 rounded-full flex items-center justify-center">
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || 'User'}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-neutral-900">
                  {session?.user?.name || 'User'}
                </p>
                <p className="text-xs text-neutral-500">
                  {session?.user?.email || 'user@example.com'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-neutral-600" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-neutral-200 py-2">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-neutral-200">
                  <p className="text-sm font-medium text-neutral-900">
                    {session?.user?.name || 'User'}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {session?.user?.email || 'user@example.com'}
                  </p>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    {t('dropdown.profile')}
                  </Link>
                  <Link
                    href="/security"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Shield className="w-4 h-4" />
                    {t('dropdown.security')}
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    {t('dropdown.settings')}
                  </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-neutral-200 my-2"></div>

                {/* Sign Out */}
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  {t('dropdown.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
