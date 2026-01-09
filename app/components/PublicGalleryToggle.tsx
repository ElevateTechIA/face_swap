'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Globe, Lock, Users, Sparkles, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth/AuthProvider';

interface PublicGalleryToggleProps {
  faceSwapId: string;
  initialIsPublic?: boolean;
  onToggle?: (isPublic: boolean) => void;
}

export function PublicGalleryToggle({
  faceSwapId,
  initialIsPublic = false,
  onToggle
}: PublicGalleryToggleProps) {
  const t = useTranslations();
  const { getUserIdToken } = useAuth();
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isLoading, setIsLoading] = useState(false);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [caption, setCaption] = useState('');

  const handleToggle = async (makePublic: boolean) => {
    setIsLoading(true);

    try {
      // Get auth token
      const token = await getUserIdToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/gallery/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          faceSwapId,
          isPublic: makePublic,
          caption: caption || undefined,
          displayName: 'Anonymous' // TODO: Get from user settings
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update gallery');
      }

      setIsPublic(makePublic);
      setShowCaptionInput(false);
      setCaption(''); // Clear caption after publishing
      onToggle?.(makePublic);

      if (makePublic) {
        toast.success(t('gallery.published'));
      } else {
        toast.success(t('gallery.unpublished'));
      }

    } catch (error: any) {
      console.error('Error toggling gallery:', error);
      toast.error(error.message || t('gallery.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Toggle Button */}
      <button
        onClick={() => {
          if (isPublic) {
            // Unpublish directly, no caption needed
            handleToggle(false);
          } else {
            // Show caption input for publishing
            setShowCaptionInput(true);
          }
        }}
        disabled={isLoading || showCaptionInput}
        className={`w-full p-4 rounded-2xl border-2 transition-all active:scale-95 disabled:opacity-50 ${
          isPublic
            ? 'border-pink-500 bg-pink-500/10'
            : showCaptionInput
            ? 'border-indigo-500/50 bg-indigo-500/5'
            : 'border-white/10 bg-white/5 hover:border-pink-500/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isPublic ? (
              <Globe size={20} className="text-pink-500" />
            ) : showCaptionInput ? (
              <Edit3 size={20} className="text-indigo-400" />
            ) : (
              <Lock size={20} className="text-gray-400" />
            )}
            <div className="text-left">
              <p className="font-bold text-sm">
                {isPublic
                  ? t('gallery.public')
                  : showCaptionInput
                  ? 'Add Caption...'
                  : 'Publish to Gallery'}
              </p>
              <p className="text-xs text-gray-500">
                {isPublic
                  ? t('gallery.publicDesc')
                  : showCaptionInput
                  ? 'Fill caption below to publish'
                  : 'Share your creation with the world'}
              </p>
            </div>
          </div>

          <div className={`relative w-14 h-7 rounded-full transition-all duration-300 ${
            isPublic ? 'bg-gradient-to-r from-pink-500 to-pink-600' : 'bg-gray-700'
          }`}>
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${
              isPublic ? 'left-7' : 'left-0.5'
            }`} />
          </div>
        </div>
      </button>

      {/* Caption Input (shown when toggling to public) */}
      {showCaptionInput && !isPublic && (
        <div className="animate-fade-in space-y-3">
          <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
            <div className="flex items-start gap-2 mb-3">
              <Sparkles size={16} className="text-indigo-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-indigo-200">
                {t('gallery.captionHint')}
              </p>
            </div>

            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={t('gallery.captionPlaceholder')}
              maxLength={150}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-pink-500/50 transition-colors resize-none"
              rows={3}
            />

            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                {caption.length}/150
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setShowCaptionInput(false);
                setCaption('');
              }}
              className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 font-medium hover:bg-white/10 transition-all active:scale-95"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={() => handleToggle(true)}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold hover:shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {isLoading ? t('common.loading') : t('gallery.publishNow')}
            </button>
          </div>
        </div>
      )}

      {/* Stats Preview (if public) */}
      {isPublic && (
        <div className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <span className="text-sm text-gray-300">
              {t('gallery.visibleInGallery')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
