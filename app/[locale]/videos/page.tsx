'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth/AuthProvider';
import { AppHeader } from '@/app/components/AppHeader';
import { MobileMenu } from '@/app/components/MobileMenu';
import { BottomTabBar } from '@/app/components/BottomTabBar';
import { ShareModal } from '@/app/components/modals/ShareModal';
import { Play, Film, Package, Sparkles, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useBrand } from '@/app/contexts/BrandContext';

export default function VideosPage() {
  const router = useRouter();
  const { user, signInWithGoogle, signOutUser } = useAuth();
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const { brand } = useBrand();

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const isGuestMode = !user;

  const features = [
    {
      icon: Film,
      title: t('videos.videoTemplates'),
      description: t('videos.videoTemplatesDesc'),
      color: 'from-pink-500 to-rose-500',
      iconBg: 'bg-pink-500/10',
      iconColor: 'text-pink-500',
    },
    {
      icon: Package,
      title: t('videos.animateProduct'),
      description: t('videos.animateProductDesc'),
      color: 'from-purple-500 to-indigo-500',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden">
      <AppHeader
        isGuestMode={isGuestMode}
        userCredits={0}
        loadingCredits={false}
        isSigningIn={isSigningIn}
        onSignIn={async () => {
          setIsSigningIn(true);
          try {
            await signInWithGoogle();
          } catch (error) {
            console.error('Error signing in:', error);
          } finally {
            setIsSigningIn(false);
          }
        }}
        onMenuClick={() => setShowMobileMenu(true)}
        onLogoClick={() => router.push(`/${locale}`)}
      />

      <main className="max-w-md mx-auto px-6 pt-20 pb-24 min-h-screen flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white/20" />
          </div>
          <h1 className="text-2xl font-black text-center">
            {t('videos.comingSoon')}
          </h1>
          <p className="text-sm text-gray-400 text-center max-w-xs">
            {t('videos.subtitle')}
          </p>
        </div>

        {/* Feature Cards */}
        <div className="flex flex-col gap-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${feature.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
                {/* Coming soon badge */}
                <div className="mt-4 flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-600/20 to-purple-600/20 border border-pink-500/20">
                    <span className="text-xs font-semibold text-pink-400">
                      {t('videos.comingSoon')}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <BottomTabBar />

      <MobileMenu
        isOpen={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
        user={user}
        onSignOut={signOutUser}
        onShareApp={() => {
          setShowMobileMenu(false);
          setShowShareModal(true);
        }}
        currentLocale={locale}
        onChangeLocale={(newLocale) => {
          router.push(pathname.replace(`/${locale}`, `/${newLocale}`));
        }}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        type="app"
      />
    </div>
  );
}
