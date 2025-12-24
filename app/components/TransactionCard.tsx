'use client';

import React from 'react';
import { ArrowUp, ArrowDown, Gift, Receipt } from 'lucide-react';

interface TransactionCardProps {
  transaction: {
    transactionId: string;
    type: 'purchase' | 'usage' | 'bonus';
    credits: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string;
    metadata?: any;
    createdAt: any;
  };
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const isPositive = transaction.credits > 0;
  const isPurchase = transaction.type === 'purchase';
  const isBonus = transaction.type === 'bonus';

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';

    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return '';
    }
  };

  const getIcon = () => {
    if (isPurchase) return <Receipt size={20} className="text-green-500" />;
    if (isBonus) return <Gift size={20} className="text-purple-500" />;
    return isPositive ? (
      <ArrowUp size={20} className="text-green-500" />
    ) : (
      <ArrowDown size={20} className="text-red-500" />
    );
  };

  const getTypeLabel = () => {
    if (isPurchase) return 'Compra';
    if (isBonus) return 'Bono';
    return 'Uso';
  };

  return (
    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-4">
        {/* Icon and info */}
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0">
            {getIcon()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold">{getTypeLabel()}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  isPositive
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}
              >
                {isPositive ? '+' : ''}
                {transaction.credits} créditos
              </span>
            </div>

            <p className="text-sm text-gray-400 truncate">{transaction.description}</p>

            <p className="text-xs text-gray-500 mt-1">{formatDate(transaction.createdAt)}</p>
          </div>
        </div>

        {/* Balance */}
        <div className="text-right flex-shrink-0">
          <p className="text-xs text-gray-500">Balance</p>
          <p className="text-sm font-bold">
            {transaction.balanceAfter} <span className="text-gray-500">🪙</span>
          </p>
        </div>
      </div>
    </div>
  );
}
