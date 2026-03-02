import { FirebaseError } from 'firebase/app';

export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}

class ErrorService {
  private errorHandlers: Map<string, (error: AppError) => void> = new Map();

  /**
   * Register a global error handler
   */
  registerHandler(id: string, handler: (error: AppError) => void): void {
    this.errorHandlers.set(id, handler);
  }

  /**
   * Unregister an error handler
   */
  unregisterHandler(id: string): void {
    this.errorHandlers.delete(id);
  }

  /**
   * Handle an error and notify all registered handlers
   */
  handleError(error: unknown, context?: string): AppError {
    const appError = this.parseError(error, context);
    
    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${context || 'Error'}]:`, appError);
    }

    // Notify all handlers
    this.errorHandlers.forEach(handler => {
      try {
        handler(appError);
      } catch (e) {
        console.error('Error in error handler:', e);
      }
    });

    return appError;
  }

  /**
   * Parse different error types into a consistent format
   */
  private parseError(error: unknown, context?: string): AppError {
    // Firebase errors
    if (error instanceof FirebaseError) {
      return {
        message: this.getFirebaseErrorMessage(error.code),
        code: error.code,
        details: error
      };
    }

    // Standard errors
    if (error instanceof Error) {
      return {
        message: error.message,
        details: error
      };
    }

    // String errors
    if (typeof error === 'string') {
      return {
        message: error
      };
    }

    // Unknown errors
    return {
      message: context ? `An error occurred in ${context}` : 'An unexpected error occurred',
      details: error
    };
  }

  /**
   * Get user-friendly messages for Firebase error codes
   */
  private getFirebaseErrorMessage(code: string): string {
    const messages: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email',
      'auth/wrong-password': 'Incorrect password',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password should be at least 6 characters',
      'auth/invalid-email': 'Invalid email address',
      'auth/operation-not-allowed': 'This operation is not allowed',
      'auth/too-many-requests': 'Too many attempts. Please try again later',
      'permission-denied': 'You do not have permission to perform this action',
      'not-found': 'The requested resource was not found',
      'already-exists': 'This resource already exists',
      'unavailable': 'Service temporarily unavailable. Please try again',
    };

    return messages[code] || 'An error occurred. Please try again';
  }
}

export const errorService = new ErrorService();
