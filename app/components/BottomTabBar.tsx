'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, Play } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('tabs');
  const locale = useLocale();

  const tabs = [
    {
      key: 'faceswap',
      label: t('faceSwap'),
      icon: Sparkles,
      href: `/${locale}`,
      isActive: pathname === `/${locale}` || pathname === `/${locale}/`,
    },
    {
      key: 'videos',
      label: t('videos'),
      icon: Play,
      href: `/${locale}/videos`,
      isActive: pathname.startsWith(`/${locale}/videos`),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-16 bg-theme-bg-secondary/70 backdrop-blur-2xl border-t border-theme z-50 flex items-center justify-around px-4 pb-[env(safe-area-inset-bottom)]">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => router.push(tab.href)}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-all active:scale-95 ${
              tab.isActive
                ? 'text-pink-500'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <Icon size={22} className={tab.isActive ? 'fill-pink-500/20' : ''} />
            <span className={`text-xs font-semibold ${tab.isActive ? 'text-pink-500' : ''}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
