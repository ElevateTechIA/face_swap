'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function LocalizedError({ error, reset }: ErrorProps) {
  const t = useTranslations('errorBoundary');

  useEffect(() => {
    // Log error to console in development
    console.error('Error caught in localized boundary:', error);

    // TODO: Send to error tracking service (Sentry, DataDog, etc.)
    // Example: Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Error Icon */}
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Error Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {t('title')}
        </h1>

        {/* Error Description */}
        <p className="text-gray-600 mb-6">
          {t('description')}
        </p>

        {/* Error Details (only in development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
            <p className="text-xs font-mono text-gray-700 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-2">
                {t('errorId')}: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            {t('tryAgain')}
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('goHome')}
          </a>
        </div>

        {/* Support Link */}
        <p className="text-sm text-gray-500 mt-6">
          {t('needHelp')}{' '}
          <a
            href="mailto:support@yourapp.com"
            className="text-purple-600 hover:underline"
          >
            {t('contactSupport')}
          </a>
        </p>
      </div>
    </div>
  );
}
