'use client';

import React, { useState } from 'react';
import { Download, RefreshCw, ZoomIn } from 'lucide-react';
import { ImagePreviewModal } from './modals/ImagePreviewModal';
import { toast } from 'sonner';

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
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Solución para evitar CORS: usar API route como proxy
      const response = await fetch(`/api/download-image?url=${encodeURIComponent(faceSwap.resultImageUrl)}`);

      if (!response.ok) {
        throw new Error('Error descargando imagen');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `face-swap-${faceSwap.faceSwapId}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      toast.success('Imagen descargada');
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error('Error al descargar la imagen');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';

    try {
      let date: Date;

      // Manejar diferentes formatos de timestamp
      if (timestamp?.toDate && typeof timestamp.toDate === 'function') {
        // Firestore Timestamp
        date = timestamp.toDate();
      } else if (timestamp?.seconds) {
        // Firestore Timestamp en formato objeto
        date = new Date(timestamp.seconds * 1000);
      } else if (timestamp instanceof Date) {
        // Ya es un objeto Date
        date = timestamp;
      } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
        // String o número de timestamp
        date = new Date(timestamp);
      } else {
        // Si no se puede parsear, retornar vacío
        console.warn('Formato de fecha desconocido:', timestamp);
        return '';
      }

      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', timestamp);
        return '';
      }

      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (error) {
      console.error('Error formateando fecha:', error, timestamp);
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
    <>
      <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/10 bg-white/5 group hover:border-pink-500/50 transition-all">
        {/* Image - Clickeable para preview */}
        <img
          src={faceSwap.resultImageUrl}
          alt={`Face swap ${faceSwap.style}`}
          className="w-full h-full object-cover cursor-pointer"
          onError={() => setImageError(true)}
          onClick={() => setShowPreview(true)}
          loading="lazy"
        />

        {/* Botón de zoom en la esquina */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPreview(true);
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Ver en grande"
        >
          <ZoomIn size={16} className="text-white" />
        </button>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 pointer-events-none">
          <p className="text-xs font-bold uppercase mb-1">{faceSwap.style}</p>
          <p className="text-xs text-gray-400 mb-3">{formatDate(faceSwap.completedAt)}</p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            disabled={downloading}
            className="w-full px-4 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 pointer-events-auto"
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

      {/* Modal de preview */}
      <ImagePreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        imageUrl={faceSwap.resultImageUrl}
        title={faceSwap.style}
        onDownload={handleDownload}
      />
    </>
  );
}
