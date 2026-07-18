'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sparkles, Play } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

const THRESHOLD = 10;

export function BottomTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('tabs');
  const locale = useLocale();

  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;
      const diff = current - lastScrollY.current;

      if (Math.abs(diff) < THRESHOLD) return;

      setVisible(diff < 0 || current < THRESHOLD);
      lastScrollY.current = current;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    {
      key: 'home',
      label: t('home'),
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
    <nav
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-16 bg-theme-bg-secondary/70 backdrop-blur-2xl border-t border-theme z-50 flex items-center justify-around px-4 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => {
              if (tab.key === 'home' && (pathname === `/${locale}` || pathname === `/${locale}/`)) {
                window.dispatchEvent(new Event('resetToHome'));
              } else {
                router.push(tab.href);
              }
            }}
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
