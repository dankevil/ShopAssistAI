# Tech Context

- Technologies:
    - Backend: Node.js, Express, TypeScript
    - Frontend: React, Vite, TypeScript, Tailwind CSS, Shadcn/ui, TanStack Query
    - Database: Drizzle ORM (PostgreSQL assumed for prod), `connect-pg-simple` (session store)
    - API: OpenAI API, Shopify Admin API, WordPress REST API
    - Auth: `express-session`, Shopify OAuth, WordPress Application Passwords (Basic Auth)
    - Libraries: `node-fetch` (for WP service), `zod` (validation)
- Setup: Requires Node.js installation. Use `npm install`. Start scripts: `start-dev.bat`, `start-prod.bat`.
- Constraints: Requires HTTPS for WordPress connection due to Basic Auth. Requires OpenAI API key.
- Dependencies: See `package.json` (client, server, shared). 