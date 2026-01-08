'use client';

import React, { useState, useEffect } from 'react';
import { X, Sparkles, Gift, Clock, Download, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LoginGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => Promise<void>;
  resultImage?: string;
}

export function LoginGateModal({ isOpen, onClose, onLogin, resultImage }: LoginGateModalProps) {
  const t = useTranslations('loginGate');
  const tAuth = useTranslations('auth');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutos
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await onLogin();
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in p-3 sm:p-4">
      <div className="relative max-w-md w-full bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl sm:rounded-3xl border border-pink-500/30 shadow-2xl shadow-pink-500/20 overflow-hidden max-h-[95vh] overflow-y-auto">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors touch-manipulation"
        >
          <X size={18} className="sm:w-5 sm:h-5" />
        </button>

        <div className="relative p-5 sm:p-8 text-center">
          {/* Icon */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 animate-pulse">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-4xl font-black tracking-tighter mb-2 sm:mb-3 uppercase italic">
            {t('title')}<br />
            <span className="text-pink-500">{t('titleHighlight')}</span>
          </h2>

          {/* Preview thumbnail if available */}
          {resultImage && (
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto mb-4 sm:mb-6 rounded-xl sm:rounded-2xl overflow-hidden border-2 border-pink-500/50">
              <img src={resultImage} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}

          {/* Urgency timer */}
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-red-500/20 border border-red-500/30 mb-4 sm:mb-6">
            <Clock size={14} className="text-red-400 sm:w-4 sm:h-4" />
            <span className="text-red-400 font-bold text-xs sm:text-sm">
              {t('offerExpires', { time: formatTime(timeLeft) })}
            </span>
          </div>

          {/* Value proposition */}
          <p className="text-gray-300 mb-4 sm:mb-6 text-base sm:text-lg px-2">
            {t.rich('signInNowAndGet', {
              now: (chunks) => <span className="font-bold text-white">{chunks}</span>
            })}:
          </p>

          {/* Benefits */}
          <div className="space-y-2 sm:space-y-3 mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20">
              <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-pink-400 flex-shrink-0" />
              <p className="text-left text-xs sm:text-sm">
                <span className="font-bold text-white">{t('benefit1')}</span>
                <span className="text-gray-400"> {t('benefit1Desc')}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
              <Download className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 flex-shrink-0" />
              <p className="text-left text-xs sm:text-sm">
                <span className="font-bold text-white">{t('benefit2')}</span>
                <span className="text-gray-400"> {t('benefit2Desc')}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-white/5 border border-white/10">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 flex-shrink-0" />
              <p className="text-left text-xs sm:text-sm">
                <span className="font-bold text-white">{t('benefit3')}</span>
                <span className="text-gray-400"> {t('benefit3Desc')}</span>
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full h-14 sm:h-16 rounded-xl sm:rounded-2xl font-black text-lg sm:text-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-xl shadow-pink-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4 uppercase italic touch-manipulation"
          >
            {isLoggingIn ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {tAuth('signingIn')}
              </>
            ) : (
              <>
                <Sparkles size={24} />
                {tAuth('signInWithGoogle')}
              </>
            )}
          </button>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-gray-500">
            <div className="flex -space-x-1.5 sm:-space-x-2">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border-2 border-black" />
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-black" />
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-black" />
            </div>
            <span className="text-center">{t('socialProof')}</span>
          </div>

          {/* Fine print */}
          <p className="text-[10px] sm:text-xs text-gray-600 mt-4 sm:mt-6 px-2">
            {t('finePrint')}
          </p>
        </div>
      </div>
    </div>
  );
}
