'use client';

import React, { useState } from 'react';
import { X, Instagram, MessageCircle, Facebook, Twitter, Copy, QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  getAppUrl,
  getWhatsAppShareUrl,
  getFacebookShareUrl,
  getTwitterShareUrl,
  copyToClipboard,
  hasWebShareAPI,
  shareViaWebAPI,
  base64ToFile,
  trackShare,
} from '@/lib/share/share-utils';
import { QRCodeModal } from './QRCodeModal';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'app' | 'image';
  resultImage?: string;
  caption?: string;
}

export function ShareModal({ isOpen, onClose, type, resultImage, caption }: ShareModalProps) {
  const t = useTranslations('share');
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const shareUrl = getAppUrl();
  const shareCaption = caption || (type === 'app' ? t('appShare') : t('imageShare'));

  const handleShare = async (platform: string) => {
    setIsSharing(true);
    trackShare(platform, type);

    try {
      switch (platform) {
        case 'instagram':
          await handleInstagramShare();
          break;
        case 'whatsapp':
          handleWhatsAppShare();
          break;
        case 'facebook':
          handleFacebookShare();
          break;
        case 'twitter':
          handleTwitterShare();
          break;
        case 'copy':
          await handleCopyLink();
          break;
      }
    } catch (error) {
      console.error('Error compartiendo:', error);
      toast.error('Error al compartir');
    } finally {
      setIsSharing(false);
    }
  };

  const handleInstagramShare = async () => {
    if (hasWebShareAPI()) {
      const shareData: any = {
        title: 'GLAMOUR Face Swap',
        text: shareCaption,
        url: shareUrl,
      };

      // Si es una imagen, intentar compartirla
      if (type === 'image' && resultImage) {
        const file = await base64ToFile(resultImage, 'face-swap.png');
        if (file) {
          shareData.files = [file];
        }
      }

      const shared = await shareViaWebAPI(shareData);
      if (shared) {
        toast.success(t('shared') || 'Compartido exitosamente');
        onClose();
      }
    } else {
      toast.info('Abre Instagram manualmente para compartir');
    }
  };

  const handleWhatsAppShare = () => {
    const url = getWhatsAppShareUrl(shareUrl, shareCaption);
    window.open(url, '_blank');
    toast.success(t('openedWhatsApp') || 'WhatsApp abierto');
    onClose();
  };

  const handleFacebookShare = () => {
    const url = getFacebookShareUrl(shareUrl);
    window.open(url, '_blank', 'width=600,height=400');
    toast.success(t('openedFacebook') || 'Facebook abierto');
    onClose();
  };

  const handleTwitterShare = () => {
    const url = getTwitterShareUrl(shareUrl, shareCaption);
    window.open(url, '_blank', 'width=600,height=400');
    toast.success(t('openedTwitter') || 'Twitter abierto');
    onClose();
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(shareUrl);
    if (success) {
      toast.success(t('copied'));
      onClose();
    } else {
      toast.error(t('copyError'));
    }
  };

  const handleQRCode = () => {
    setIsQRModalOpen(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <div
          className="relative bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl p-6 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>

          {/* Contenido */}
          <div>
            <h3 className="text-2xl font-bold mb-2">
              {type === 'app' ? t('shareApp') : t('shareImage')}
            </h3>
            <p className="text-gray-400 text-sm mb-6">{shareCaption}</p>

            {/* Botones de redes sociales */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Instagram */}
              <button
                onClick={() => handleShare('instagram')}
                disabled={isSharing}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 text-white font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                <Instagram size={24} />
                <span className="text-sm">{t('instagram')}</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => handleShare('whatsapp')}
                disabled={isSharing}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#25D366] text-white font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                <MessageCircle size={24} />
                <span className="text-sm">{t('whatsapp')}</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleShare('facebook')}
                disabled={isSharing}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#1877F2] text-white font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                <Facebook size={24} />
                <span className="text-sm">{t('facebook')}</span>
              </button>

              {/* Twitter/X */}
              <button
                onClick={() => handleShare('twitter')}
                disabled={isSharing}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-black border border-white/20 text-white font-bold transition-all active:scale-95 disabled:opacity-50"
              >
                <Twitter size={24} />
                <span className="text-sm">{t('twitter')}</span>
              </button>
            </div>

            {/* Botones adicionales */}
            <div className="space-y-3">
              {/* Copiar link */}
              <button
                onClick={() => handleShare('copy')}
                disabled={isSharing}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
              >
                <Copy size={20} />
                {t('copyLink')}
              </button>

              {/* Código QR */}
              <button
                onClick={handleQRCode}
                disabled={isSharing}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-pink-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <QrCode size={20} />
                {t('qrCode')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de QR */}
      <QRCodeModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
    </>
  );
}
