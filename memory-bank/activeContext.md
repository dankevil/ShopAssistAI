# Active Context

- Current Focus: Implementing WordPress integration.
- Recent Changes: 
    - Updated DB schema (`stores`, added `wordpressDataCache`).
    - Updated storage layer (`IStorage`, `MemStorage`) - *Note: Type errors remain in MemStorage.*
    - Created `WordPressService` (`server/lib/wordpress.ts`) for WP REST API communication.
    - Added backend API routes (`/api/wordpress/connect`, `/api/wordpress/sync`, updated `/api/stores`, `/api/chat`).
    - Created frontend lib functions (`client/lib/wordpress.ts`, updated `client/lib/api.ts`).
    - Created frontend page (`client/pages/wordpress.tsx`) and component shell (`client/components/dashboard/WordPressIntegration.tsx`).
    - Updated Memory Bank files.
- Next Steps (WordPress Integration):
    1.  **Fix Linter Errors:** Address remaining TypeScript errors in `server/storage.ts` (`MemStorage` implementation).
    2.  **Complete `WordPressIntegration.tsx` UI:** Implement settings sections (Features, AI, KB, etc.) reusing `ShopifyIntegration` patterns/components where possible. Add display for \"Last Synced\" time.
    3.  **Refine Chat Context (`/api/chat`):** Properly implement Shopify context fetching logic alongside the new WordPress logic.
    4.  **Implement Knowledge Base Update:** Add logic in `/api/wordpress/sync` to trigger AI knowledge base updates using the newly cached WP data.
    5.  **Testing:** Thoroughly test WP connect, sync, settings, and chat functionality. Test Shopify remains unaffected.
    6.  **Deployment:** Plan DB migration if needed. Ensure environment variables for WP are handled.
    7.  **(Optional) Daily Sync Job:** Implement a scheduler for automatic daily sync.
    8.  **(Optional) Sidebar Link:** Manually fix the WP link in `Sidebar.tsx` if desired.
- Active Decisions: Proceeding with WordPress integration using WP REST API and Application Passwords. Using a caching table (`wordpressDataCache`) for fetched WP data. Deferring fixing all `MemStorage` type errors for now to focus on core functionality. 