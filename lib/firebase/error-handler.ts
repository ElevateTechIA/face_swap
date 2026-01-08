/**
 * Firebase Error Handler
 * Maneja errores comunes de Firebase y IndexedDB
 */

export class FirebaseErrorHandler {
  /**
   * Maneja errores de IndexedDB y AbortError
   */
  static handleIndexedDBError(error: any): void {
    if (error.name === 'AbortError') {
      console.warn('⚠️ IndexedDB transaction aborted. This is usually safe to ignore.');
      return;
    }

    if (error.message?.includes('IndexedDB')) {
      console.error('❌ IndexedDB error:', error);
      
      // Intentar limpiar IndexedDB corrupto
      if (typeof window !== 'undefined' && window.indexedDB) {
        try {
          // Lista de bases de datos de Firebase que pueden estar corruptas
          const dbNames = [
            'firebaseLocalStorageDb',
            'firestore',
            'firebase-heartbeat-database',
            'firebase-installations-database'
          ];

          dbNames.forEach(dbName => {
            window.indexedDB.deleteDatabase(dbName);
          });

          console.log('✅ IndexedDB limpiado. Por favor recarga la página.');
        } catch (cleanupError) {
          console.error('❌ Error al limpiar IndexedDB:', cleanupError);
        }
      }
    }
  }

  /**
   * Maneja errores de autenticación
   */
  static handleAuthError(error: any): string {
    const errorCode = error.code || error.message;

    const errorMessages: { [key: string]: string } = {
      'auth/popup-closed-by-user': 'Ventana de inicio de sesión cerrada',
      'auth/cancelled-popup-request': 'Solicitud de inicio de sesión cancelada',
      'auth/popup-blocked': 'Popup bloqueado por el navegador. Por favor habilita los popups.',
      'auth/network-request-failed': 'Error de red. Verifica tu conexión a internet.',
      'auth/too-many-requests': 'Demasiados intentos. Por favor espera un momento.',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
      'auth/user-not-found': 'Usuario no encontrado.',
      'auth/wrong-password': 'Contraseña incorrecta.',
      'auth/invalid-email': 'Email inválido.',
    };

    return errorMessages[errorCode] || 'Error al iniciar sesión. Por favor intenta de nuevo.';
  }

  /**
   * Wrapper para operaciones de Firebase con manejo de errores
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    errorContext: string = 'Firebase operation'
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error: any) {
      console.error(`❌ Error in ${errorContext}:`, error);
      
      // Manejar errores específicos
      this.handleIndexedDBError(error);
      
      // Re-lanzar errores críticos
      if (error.code?.startsWith('auth/')) {
        throw error;
      }

      return null;
    }
  }
}

/**
 * Hook para monitorear errores de IndexedDB en el navegador
 */
export function setupIndexedDBErrorMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Monitorear errores globales
  const originalError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (error && (error.name === 'AbortError' || error.message?.includes('IndexedDB'))) {
      FirebaseErrorHandler.handleIndexedDBError(error);
      return true; // Prevenir que el error se propague
    }
    
    if (originalError) {
      return originalError(message, source, lineno, colno, error);
    }
    return false;
  };

  // Monitorear promesas rechazadas
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    if (error && (error.name === 'AbortError' || error.message?.includes('IndexedDB'))) {
      FirebaseErrorHandler.handleIndexedDBError(error);
      event.preventDefault(); // Prevenir que el error se muestre en consola
    }
  });
}
