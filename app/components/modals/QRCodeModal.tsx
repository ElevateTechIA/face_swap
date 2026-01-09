'use client';

import React, { useRef } from 'react';
import { X, Download } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useTranslations } from 'next-intl';
import { getShareUrl, downloadQRCode } from '@/lib/share/qr-utils';
import { toast } from 'sonner';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ isOpen, onClose }: QRCodeModalProps) {
  const t = useTranslations('share');
  const qrRef = useRef<HTMLDivElement>(null);
  const shareUrl = getShareUrl();

  const handleDownload = async () => {
    try {
      await downloadQRCode(qrRef);
      toast.success(t('qrDownloaded') || 'QR descargado correctamente');
    } catch (error) {
      toast.error('Error al descargar el QR');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-b from-gray-900 to-black border border-white/10 rounded-3xl p-8 max-w-md w-full"
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
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">{t('qrCode')}</h3>
          <p className="text-gray-400 text-sm mb-6">{t('qrTitle')}</p>

          {/* QR Code */}
          <div
            ref={qrRef}
            className="bg-white p-6 rounded-2xl inline-block mb-6"
          >
            <QRCodeSVG
              value={shareUrl}
              size={256}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* URL */}
          <p className="text-xs text-gray-500 mb-6 break-all">{shareUrl}</p>

          {/* Botón descargar */}
          <button
            onClick={handleDownload}
            className="w-full bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold py-3 px-6 rounded-2xl hover:shadow-lg hover:shadow-pink-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Download size={20} />
            {t('qrDownload')}
          </button>
        </div>
      </div>
    </div>
  );
}
