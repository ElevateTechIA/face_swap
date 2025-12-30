'use client';

import React from 'react';
import { X, History, Share2, LogOut, User, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
  onShareApp: () => void;
  currentLocale: string;
  onChangeLocale: (locale: string) => void;
}

export function MobileMenu({
  isOpen,
  onClose,
  user,
  onSignOut,
  onShareApp,
  currentLocale,
  onChangeLocale,
}: MobileMenuProps) {
  const router = useRouter();
  const t = useTranslations();

  if (!isOpen) return null;

  const menuItems = [
    {
      icon: History,
      label: t('history.title') || 'Historial',
      onClick: () => {
        router.push('/history');
        onClose();
      },
      show: !!user,
    },
    {
      icon: Share2,
      label: t('share.shareApp') || 'Compartir App',
      onClick: () => {
        onShareApp();
        onClose();
      },
      show: true,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute top-0 right-0 w-64 h-full bg-gradient-to-b from-gray-900 to-black border-l border-white/10 p-6 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del menú */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black italic uppercase">Menu</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Usuario info */}
        {user && (
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt="Profile"
                className="w-12 h-12 rounded-full border-2 border-pink-500/50"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.displayName || 'Usuario'}</p>
              <p className="text-xs text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Opciones del menú */}
        <nav className="flex-1 space-y-2">
          {menuItems.map(
            (item, index) =>
              item.show && (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-pink-500/50 transition-all active:scale-95"
                >
                  <item.icon size={20} className="text-pink-500" />
                  <span className="font-medium">{item.label}</span>
                </button>
              )
          )}

          {/* Selector de idioma */}
          <div className="pt-2">
            <p className="text-xs text-gray-400 uppercase font-bold mb-2 px-4">
              <Globe size={12} className="inline mr-1" />
              Idioma
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onChangeLocale('es');
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  currentLocale === 'es'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                🇪🇸 ES
              </button>
              <button
                onClick={() => {
                  onChangeLocale('en');
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  currentLocale === 'en'
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white'
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                🇺🇸 EN
              </button>
            </div>
          </div>
        </nav>

        {/* Botón de logout */}
        {user && (
          <button
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 hover:bg-red-500/20 transition-all active:scale-95"
          >
            <LogOut size={20} />
            <span className="font-bold">{t('common.signOut')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
