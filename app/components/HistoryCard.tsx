'use client';

import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';

interface HistoryCardProps {
  faceSwap: {
    faceSwapId: string;
    resultImageUrl: string;
    style: string;
    completedAt: any;
  };
}

export function HistoryCard({ faceSwap }: HistoryCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const response = await fetch(faceSwap.resultImageUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `face-swap-${faceSwap.faceSwapId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error al descargar la imagen');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';

    try {
      // Handle Firestore Timestamp
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      return '';
    }
  };

  if (imageError) {
    return (
      <div className="aspect-[3/4] rounded-3xl border border-white/10 bg-white/5 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Imagen no disponible</p>
      </div>
    );
  }

  return (
    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 bg-white/5 group hover:border-pink-500/50 transition-all">
      {/* Image */}
      <img
        src={faceSwap.resultImageUrl}
        alt={`Face swap ${faceSwap.style}`}
        className="w-full h-full object-cover"
        onError={() => setImageError(true)}
        loading="lazy"
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
        <p className="text-xs font-bold uppercase mb-1">{faceSwap.style}</p>
        <p className="text-xs text-gray-400 mb-3">{formatDate(faceSwap.completedAt)}</p>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
        >
          {downloading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Descargando...
            </>
          ) : (
            <>
              <Download size={16} />
              Descargar
            </>
          )}
        </button>
      </div>
    </div>
  );
}
