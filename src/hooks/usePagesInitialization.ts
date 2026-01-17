import { useEffect, useRef } from 'react';
import { pagesApi } from '../api/pages';
import { APP_ROUTES } from '../utils/appRoutes';

/**
 * Hook to initialize application routes/pages in the database on app startup
 * 
 * This hook:
 * 1. Checks if user is admin (required for page initialization)
 * 2. Gets all existing pages from the database
 * 3. Compares with defined routes
 * 4. Creates missing pages using bulk creation endpoint
 * 
 * Pages are now global and shared across all companies (no company_id needed)
 * 
 * @param isAdmin - Whether the current user is an admin (profile === 'admin')
 * @param enabled - Whether to enable page initialization (default: true)
 */
export const usePagesInitialization = (
  isAdmin: boolean,
  enabled: boolean = true
) => {
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only initialize once per app session
    if (!enabled || !isAdmin || hasInitialized.current) {
      return;
    }

    const initializePages = async () => {
      try {
        // Mark as initializing immediately to prevent duplicate calls
        hasInitialized.current = true;

        // Step 1: Get all existing pages from the database
        // Use a large limit to get all pages at once
        const existingPagesResponse = await pagesApi.getAll({ limit: 100 });
        const existingPages = existingPagesResponse.data;
        const existingRoutes = new Set(existingPages.map(page => page.route));

        // Step 2: Find missing routes
        const missingRoutes = APP_ROUTES.filter(
          route => !existingRoutes.has(route.route)
        );

        if (missingRoutes.length === 0) {
          return;
        }

        // Step 3: Create missing pages using bulk creation endpoint
        await pagesApi.createFromRoutes({
          routes: missingRoutes,
          skipExisting: true, // Skip if route already exists (safety check)
        });
      } catch (error: any) {
        console.error('[Pages Init] Error initializing pages:', error);
        // Allow retry on next app start if initialization failed
        hasInitialized.current = false;
      }
    };

    // Initialize pages after a short delay to ensure API is ready
    // This prevents blocking the initial app render
    const timeoutId = setTimeout(() => {
      initializePages();
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, isAdmin]);
};
