'use client';

import { useState } from 'react';

/**
 * ErrorBoundaryTest Component
 *
 * DEVELOPMENT ONLY: Use this component to test error boundaries
 *
 * Usage:
 * 1. Import: import { ErrorBoundaryTest } from '@/app/components/ErrorBoundaryTest';
 * 2. Add to any page: <ErrorBoundaryTest />
 * 3. Click buttons to test different error scenarios
 * 4. Remove import before committing to production
 *
 * @example
 * ```tsx
 * import { ErrorBoundaryTest } from '@/app/components/ErrorBoundaryTest';
 *
 * export default function Page() {
 *   return (
 *     <div>
 *       <ErrorBoundaryTest />
 *       {/* Your page content *\/}
 *     </div>
 *   );
 * }
 * ```
 */
export function ErrorBoundaryTest() {
  const [shouldThrow, setShouldThrow] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // This will trigger the error boundary
  if (shouldThrow) {
    throw new Error('Test error thrown by ErrorBoundaryTest component');
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg shadow-xl max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg
            className="w-5 h-5 text-yellow-600"
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
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">
            Error Boundary Test
          </h3>
          <p className="text-xs text-yellow-700 mb-3">
            Development only. Test error handling.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => setShouldThrow(true)}
              className="w-full px-3 py-2 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 transition-colors"
            >
              Throw Error
            </button>
            <button
              onClick={async () => {
                await new Promise(resolve => setTimeout(resolve, 500));
                throw new Error('Test async error');
              }}
              className="w-full px-3 py-2 bg-orange-600 text-white text-xs font-medium rounded hover:bg-orange-700 transition-colors"
            >
              Throw Async Error
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
