'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth/AuthProvider';
import { RefreshCw, ArrowLeft, History as HistoryIcon } from 'lucide-react';
import { HistoryCard } from '@/app/components/HistoryCard';

interface FaceSwapHistory {
  faceSwapId: string;
  resultImageUrl: string;
  style: string;
  completedAt: any;
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, getUserIdToken } = useAuth();

  const [history, setHistory] = useState<FaceSwapHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    loadHistory();
  }, [user]);

  const loadHistory = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const token = await getUserIdToken();
      const url = loadMore && lastId
        ? `/api/history?limit=20&startAfter=${lastId}`
        : '/api/history?limit=20';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error fetching history');
      }

      const data = await response.json();

      if (loadMore) {
        setHistory(prev => [...prev, ...data.history]);
      } else {
        setHistory(data.history);
      }

      setHasMore(data.hasMore);
      setLastId(data.lastId);

    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">
        <RefreshCw className="w-12 h-12 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      <div className="max-w-md mx-auto px-6 py-12">
        {/* Header */}
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <HistoryIcon size={32} className="text-pink-600" />
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">
              Tu <span className="text-pink-600">Historial</span>
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Tus Face Swaps anteriores
          </p>
        </div>

        {/* Grid de history */}
        {history.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <HistoryIcon size={32} className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No hay historial aún</h2>
            <p className="text-gray-500 mb-6">
              Tus Face Swaps completados aparecerán aquí
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-white active:scale-95 transition-all"
            >
              Crear tu primer Face Swap
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {history.map((item) => (
                <HistoryCard key={item.faceSwapId} faceSwap={item} />
              ))}
            </div>

            {/* Load More button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => loadHistory(true)}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-2xl font-bold bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  {loadingMore ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Cargando...
                    </>
                  ) : (
                    'Cargar más'
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer note */}
        <div className="text-center mt-12 text-sm text-gray-500">
          <p>Tus imágenes se guardan automáticamente después de cada Face Swap</p>
          <p className="mt-1">Puedes descargarlas en cualquier momento</p>
        </div>
      </div>
    </div>
  );
}
