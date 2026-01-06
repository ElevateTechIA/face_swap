'use client';
// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/auth/AuthProvider';
import { RefreshCw, ArrowLeft, Receipt } from 'lucide-react';
import { TransactionCard } from '@/app/components/TransactionCard';

interface Transaction {
  transactionId: string;
  type: 'purchase' | 'usage' | 'bonus';
  credits: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  metadata?: any;
  createdAt: any;
}

export default function TransactionsPage() {
  const router = useRouter();
  const { user, getUserIdToken } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [lastId, setLastId] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  // Stats
  const [totalPurchased, setTotalPurchased] = useState(0);
  const [totalUsed, setTotalUsed] = useState(0);

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }

    loadTransactions();
  }, [user]);

  useEffect(() => {
    // Calculate stats when transactions change
    const purchased = transactions
      .filter(t => t.type === 'purchase' || t.type === 'bonus')
      .reduce((sum, t) => sum + t.credits, 0);

    const used = transactions
      .filter(t => t.type === 'usage')
      .reduce((sum, t) => sum + Math.abs(t.credits), 0);

    setTotalPurchased(purchased);
    setTotalUsed(used);
  }, [transactions]);

  const loadTransactions = async (loadMore = false) => {
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const token = await getUserIdToken();
      const url = loadMore && lastId
        ? `/api/transactions?limit=50&startAfter=${lastId}`
        : '/api/transactions?limit=50';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error fetching transactions');
      }

      const data = await response.json();

      if (loadMore) {
        setTransactions(prev => [...prev, ...data.transactions]);
      } else {
        setTransactions(data.transactions);
      }

      setHasMore(data.hasMore);
      setLastId(data.lastId);

    } catch (error) {
      console.error('Error loading transactions:', error);
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
          onClick={() => router.push('/credits')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft size={20} />
          Volver
        </button>

        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Receipt size={32} className="text-pink-600" />
            <h1 className="text-5xl font-black tracking-tighter uppercase italic">
              <span className="text-pink-600">Transacciones</span>
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Historial completo de créditos
          </p>
        </div>

        {/* Stats */}
        {transactions.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
              <p className="text-sm text-gray-400 mb-2">Total Comprado</p>
              <p className="text-3xl font-black text-green-400">
                +{totalPurchased} <span className="text-xl">🪙</span>
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
              <p className="text-sm text-gray-400 mb-2">Total Usado</p>
              <p className="text-3xl font-black text-red-400">
                -{totalUsed} <span className="text-xl">🪙</span>
              </p>
            </div>
          </div>
        )}

        {/* Transactions list */}
        {transactions.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Receipt size={32} className="text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No hay transacciones</h2>
            <p className="text-gray-500 mb-6">
              Tus compras y usos de créditos aparecerán aquí
            </p>
            <button
              onClick={() => router.push('/credits')}
              className="px-6 py-3 rounded-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 text-white active:scale-95 transition-all"
            >
              Comprar Créditos
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-8">
              {transactions.map((transaction) => (
                <TransactionCard key={transaction.transactionId} transaction={transaction} />
              ))}
            </div>

            {/* Load More button */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={() => loadTransactions(true)}
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
          <p>Todas las transacciones están registradas de forma segura</p>
          <p className="mt-1">Puedes consultar tu historial en cualquier momento</p>
        </div>
      </div>
    </div>
  );
}
