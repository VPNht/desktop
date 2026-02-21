import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isRTL } from '../i18n';

/**
 * Hook to manage RTL layout direction based on current language
 */
export function useRTL() {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTLLanguage = isRTL(currentLanguage);

  useEffect(() => {
    // Set document direction
    document.documentElement.dir = isRTLLanguage ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
    
    // Add RTL class to body for Tailwind styling
    if (isRTLLanguage) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
    
    return () => {
      // Cleanup
      document.body.classList.remove('rtl', 'ltr');
    };
  }, [currentLanguage, isRTLLanguage]);

  return {
    isRTL: isRTLLanguage,
    direction: isRTLLanguage ? 'rtl' : 'ltr',
    language: currentLanguage,
  };
}

/**
 * Hook to handle keyboard navigation and accessibility
 */
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modals/dropdowns
      if (e.key === 'Escape') {
        // Dispatch custom event for components to listen to
        window.dispatchEvent(new CustomEvent('escapePressed'));
      }
      
      // Ctrl/Cmd + K for search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('searchShortcut'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

/**
 * Hook for high contrast mode
 */
export function useHighContrast() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
    };
    
    // Initial check
    if (mediaQuery.matches) {
      document.body.classList.add('high-contrast');
    }
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) {
        document.body.classList.add('reduce-motion');
      } else {
        document.body.classList.remove('reduce-motion');
      }
    };
    
    // Initial check
    setPrefersReducedMotion(mediaQuery.matches);
    if (mediaQuery.matches) {
      document.body.classList.add('reduce-motion');
    }
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// React import
import React from 'react';