import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext';

/**
 * Custom hook to trigger accessible floating toast notifications
 * Provides fallback safe functions if consumed outside of ToastProvider.
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    return {
      showToast: () => {},
      success: () => {},
      error: () => {},
      info: () => {},
      warning: () => {},
      dismissToast: () => {}
    };
  }

  return context;
}

export default useToast;
