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

        console.log('[Pages Init] Starting page initialization...');
        console.log('[Pages Init] Total APP_ROUTES defined:', APP_ROUTES.length);
        console.log('[Pages Init] APP_ROUTES:', APP_ROUTES);

        // Step 1: Get all existing pages from the database
        // Use a large limit to get all pages at once
        const existingPagesResponse = await pagesApi.getAll({ limit: 100 });
        const existingPages = existingPagesResponse.data;
        const existingRoutes = new Set(existingPages.map(page => page.route));

        console.log('[Pages Init] Existing pages in DB:', existingPages.length);
        console.log('[Pages Init] Existing routes:', Array.from(existingRoutes));

        // Step 2: Find missing routes
        const missingRoutes = APP_ROUTES.filter(
          route => !existingRoutes.has(route.route)
        );

        console.log('[Pages Init] Missing routes:', missingRoutes.length);
        console.log('[Pages Init] Missing routes details:', missingRoutes);

        if (missingRoutes.length === 0) {
          console.log('[Pages Init] No missing routes, all pages are synced!');
          return;
        }

        // Step 3: Create missing pages using bulk creation endpoint
        console.log('[Pages Init] Creating missing pages...');
        const result = await pagesApi.createFromRoutes({
          routes: missingRoutes,
          skipExisting: true, // Skip if route already exists (safety check)
        });
        
        console.log('[Pages Init] Pages created successfully!');
        console.log('[Pages Init] Result:', result);
      } catch (error: any) {
        console.error('[Pages Init] Error initializing pages:', error);
        console.error('[Pages Init] Error details:', error.response?.data || error.message);
        console.error('[Pages Init] Full error response:', error.response);
        console.error('[Pages Init] Error config:', error.config);
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
