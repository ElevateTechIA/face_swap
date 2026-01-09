'use client';

import React from 'react';
import { X, Download } from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  title?: string;
  onDownload?: () => void;
}

export function ImagePreviewModal({ isOpen, onClose, imageUrl, title, onDownload }: ImagePreviewModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botones en la parte superior */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          {onDownload && (
            <button
              onClick={onDownload}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 flex items-center justify-center text-white hover:shadow-lg hover:shadow-pink-500/20 transition-all active:scale-95"
              aria-label="Descargar"
            >
              <Download size={20} />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
            aria-label="Cerrar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Imagen */}
        <img
          src={imageUrl}
          alt="Preview"
          className="w-full h-auto max-h-[90vh] object-contain rounded-2xl"
        />
      </div>
    </div>
  );
}
