'use client';

import React, { useState } from 'react';
import { Download, RefreshCw, ZoomIn, Trash2 } from 'lucide-react';
import { ImagePreviewModal } from './modals/ImagePreviewModal';
import { toast } from 'sonner';
import { useAuth } from '@/app/auth/AuthProvider';

interface HistoryCardProps {
  faceSwap: {
    faceSwapId: string;
    resultImageUrl: string;
    style: string;
    completedAt: any;
  };
  onDelete?: () => void;
}

export function HistoryCard({ faceSwap, onDelete }: HistoryCardProps) {
  const { getUserIdToken } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDelete = async () => {
    try {
      setDeleting(true);

      // Get auth token using the proper auth hook
      const token = await getUserIdToken();

      const response = await fetch('/api/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          faceSwapId: faceSwap.faceSwapId,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al eliminar');
      }

      toast.success('Imagen eliminada del historial');
      setShowDeleteConfirm(false);

      // Notify parent component to remove from list
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting face swap:', error);
      toast.error('Error al eliminar la imagen');
    } finally {
      setDeleting(false);
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
      } else if (timestamp?.seconds || timestamp?._seconds) {
        // Firestore Timestamp en formato objeto (tanto 'seconds' como '_seconds')
        const seconds = timestamp.seconds || timestamp._seconds;
        date = new Date(seconds * 1000);
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
      <div className="relative aspect-[3/4] rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-white/5 group hover:border-pink-500/50 transition-all">
        {/* Image - Clickeable para preview */}
        <img
          src={faceSwap.resultImageUrl}
          alt={`Face swap ${faceSwap.style}`}
          className="w-full h-full object-cover cursor-pointer"
          onError={() => setImageError(true)}
          onClick={() => setShowPreview(true)}
          loading="lazy"
        />

        {/* Botones en la esquina superior */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDeleteConfirm(true);
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-500/80 backdrop-blur-sm border border-red-400/50 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation hover:bg-red-600"
            aria-label="Eliminar"
          >
            <Trash2 size={14} className="text-white sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPreview(true);
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity touch-manipulation"
            aria-label="Ver en grande"
          >
            <ZoomIn size={14} className="text-white sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Overlay - Siempre visible en mobile, hover en desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 sm:p-4 pointer-events-none">
          <p className="text-[10px] sm:text-xs font-bold uppercase mb-0.5 sm:mb-1">{faceSwap.style}</p>
          <p className="text-[9px] sm:text-xs text-gray-400 mb-2 sm:mb-3">{formatDate(faceSwap.completedAt)}</p>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            disabled={downloading}
            className="w-full px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 transition-all disabled:opacity-50 pointer-events-auto touch-manipulation"
          >
            {downloading ? (
              <>
                <RefreshCw size={14} className="animate-spin sm:w-4 sm:h-4" />
                <span className="text-[11px] sm:text-xs">Descargando...</span>
              </>
            ) : (
              <>
                <Download size={14} className="sm:w-4 sm:h-4" />
                <span className="text-[11px] sm:text-xs">Descargar</span>
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

      {/* Modal de confirmación de eliminación */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-black mb-2">¿Eliminar imagen?</h3>
            <p className="text-gray-400 text-sm mb-6">
              Esta acción no se puede deshacer. La imagen se eliminará permanentemente de tu historial.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 font-bold text-sm hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-3 rounded-xl bg-red-500 font-bold text-sm hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
