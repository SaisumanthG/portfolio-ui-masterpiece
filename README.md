# Saisumanth Portfolio

A fast, animated, fully customizable personal portfolio built with **React + Vite + TypeScript** on the frontend and **Lovable Cloud (managed Postgres + Realtime WebSockets)** as the backend. Every section — Home, Projects, Internships, Hackathons, Conference Papers, Certificates — is editable from a built-in admin panel and syncs in real time across every browser/device viewing the site.

---

## 1. Simple explanation (for anyone)

Think of this site as **two apps in one**:

1. **Public portfolio** that any visitor sees.
2. **Admin panel** (`/web/admin`) that I use to update content (text, images, PDFs, theme, layout) without ever touching code.

When I save a change in the admin panel, every other browser currently viewing my portfolio refreshes automatically — no page reload, no waiting. That magic comes from a **WebSocket** channel.

## 2. Technical explanation (for engineers)

- **Frontend**: React 18 SPA (Vite + TypeScript + Tailwind + shadcn/ui + Framer Motion).
- **State**: A single JSON document (`portfolio_db`) holds every piece of editable content. It lives in three places that stay in sync:
  1. **`localStorage`** for instant offline-first reads (zero blank-screen risk).
  2. **Postgres `portfolio_content` table** (Lovable Cloud) as the durable source of truth.
  3. **Supabase Realtime broadcast channel** that pushes updates to every open browser via WebSocket.
- **CRUD**: All create/update/delete operations go through `src/lib/database.ts`. Writes are persisted locally for instant UI, then debounced and broadcast over the realtime channel; subscribers apply the patch and re-render.
- **Auth**: Admin panel is gated by a local credential check (`admin / admin@123`). Postgres RLS policies restrict writes to authenticated admins via the `has_role()` security-definer function.
- **Realtime fallback**: If the WebSocket fails, the site keeps working from `localStorage` — no degraded UX.

---

## 3. Architecture

```
        ┌──────────────────────┐
        │   Browser (React)    │
        │  - Public pages      │
        │  - Admin panel       │
        └─────────┬────────────┘
                  │  read/write
                  ▼
       ┌─────────────────────────┐
       │   src/lib/database.ts   │
       │  localStorage cache +   │◄──────────┐
       │  realtime broadcaster   │           │
       └─────────┬───────────────┘           │
                 │                            │ WebSocket
                 ▼                            │ (Supabase Realtime)
       ┌─────────────────────────┐           │
       │   Lovable Cloud         │           │
       │   - Postgres            │───────────┘
       │   - Realtime channel    │  push updates
       │   - RLS policies        │  to all clients
       └─────────────────────────┘
```

---

## 4. Tech stack & why

| Layer        | Tech                                     | Why                                                          |
|--------------|------------------------------------------|--------------------------------------------------------------|
| Build tool   | **Vite 5**                               | Sub-second HMR, modern ESM, tiny prod bundle.                |
| UI runtime   | **React 18 + TypeScript 5**              | Type safety, hooks ecosystem, mature tooling.                |
| Styling      | **Tailwind v3 + shadcn/ui**              | Token-based design system, accessible primitives.            |
| Animation    | **Framer Motion**                        | Parallax hero, staggered card reveals, hover lifts.          |
| Backend      | **Lovable Cloud** (managed Postgres)     | Zero-ops DB + Realtime + Auth + Storage on one URL.          |
| Realtime     | **Supabase Realtime (WebSocket)**        | Push updates to every browser instantly.                     |
| Routing      | **react-router-dom**                     | SPA navigation; SPA fallback handled by hosting.             |
| Forms/UI     | **react-hook-form + zod + sonner**       | Robust admin forms + validation + toasts.                    |
| Hosting      | **Lovable Hosting** (also Vercel-ready)  | Built-in SPA fallback; `vercel.json` included for portability.|

---

## 5. Project structure

```
.
├── public/                       # Static assets (favicon, logo, robots)
├── src/
│   ├── assets/                   # Bundled images (default project/cert images)
│   ├── components/
│   │   ├── Layout.tsx            # Header + sidebar + PingMe + outlet
│   │   ├── PingMe.tsx            # Glass contact button (Email/LinkedIn/WhatsApp)
│   │   ├── ShareFallbackDialog.tsx
│   │   └── ui/                   # shadcn components
│   ├── hooks/
│   │   └── use-customization.ts  # Live theme/layout subscription per page
│   ├── integrations/supabase/    # Auto-generated client + types (do not edit)
│   ├── lib/
│   │   ├── database.ts           # ★ CRUD + realtime sync + defaults
│   │   ├── theme.ts              # Theme presets + contrast engine
│   │   ├── professional-themes.ts
│   │   └── share.ts              # Web Share API helpers
│   ├── pages/
│   │   ├── Home.tsx              # Hero, About, Skills, Profiles, College, Resume
│   │   ├── Projects.tsx
│   │   ├── Internships.tsx
│   │   ├── Hackathons.tsx
│   │   ├── Papers.tsx            # Conference papers + PDF viewer
│   │   ├── Certificates.tsx
│   │   ├── Admin.tsx             # ★ Full CRUD + theming + uploads
│   │   ├── DatabaseViewer.tsx    # JSON export/import/reset
│   │   └── NotFound.tsx
│   ├── App.tsx                   # Router
│   ├── main.tsx                  # React entrypoint
│   └── index.css                 # Design tokens (HSL CSS variables)
├── supabase/
│   ├── config.toml               # Project ref
│   └── migrations/               # SQL: portfolio_content, user_roles, RLS, has_role()
├── vercel.json                   # SPA rewrite for Vercel deploys
└── package.json
```

---

## 6. How CRUD works

Every editable section calls helpers from `src/lib/database.ts`:

```ts
addRecord("projects", { title, description, image, ... });
updateRecord("certificates", id, { previewImage });
deleteRecord("papers", id);
getAllRecords("homeProfile");
```

Internally each call:

1. Mutates the in-memory database object.
2. Persists to `localStorage` (with progressive size-stripping to dodge browser quota errors on big base64 images).
3. Fires a `portfolio-db-updated` window event so the current tab re-renders.
4. Debounces a **broadcast** over the `portfolio-db-live-sync` Supabase Realtime channel so every other open browser receives the new value and applies it.

Components subscribe with one line:

```ts
useEffect(() => {
  const load = () => setData(getAllRecords("projects"));
  load();
  return subscribeToDatabaseChanges(load);
}, []);
```

---

## 7. How the database integration works

- A single Postgres table `portfolio_content (id text, data jsonb, updated_at timestamptz)` stores the whole document keyed by id.
- RLS policies:
  - **Public SELECT** — anyone can read.
  - **Admin INSERT/UPDATE** — only users with the `admin` role (looked up via `has_role(auth.uid(), 'admin')`) can write.
- Roles live in a separate `user_roles` table — never on profiles — to prevent privilege escalation.
- The frontend uses the publishable anon key for reads and writes flow through the same realtime channel (no service-role key in the browser).

---

## 8. How real-time sync works

- On first interaction, `startRealtimeSync()` opens a **WebSocket** to Supabase Realtime and joins the `portfolio-db-live-sync` channel.
- On every save, the new JSON is broadcast with a `clientId` so the originating tab ignores its own echo.
- Receivers write the payload to `localStorage` and dispatch the same change event the local code path uses — so every page is update-source-agnostic.
- If the socket can't connect, the local cache still serves the UI; the next successful broadcast catches everyone up.

---

## 9. How images are handled

- Uploads in the admin panel are stored as base64 inside the JSON document (no separate bucket needed for a personal portfolio).
- A built-in **crop / zoom / nudge** tool writes a `"x,y,zoom"` string per image (`imageNudge`, `previewImageNudge`, `logoImageNudge`, etc.).
- On render, a small helper converts that into:
  - `object-position: (50+x)% (50+y)%` — never crops past the box.
  - `transform: scale(z)` — only applied when zoom ≠ 1, with `transform-origin: center` so logos don't distort.
- All previews use `object-contain` to preserve aspect ratio on every viewport (mobile / tablet / desktop / split-screen). Lazy loading via the browser's native behavior keeps initial paint fast.

---

## 10. Deployment

### Lovable (recommended)
Click **Publish** in the Lovable editor. Lovable Hosting includes built-in SPA fallback, so deep links work out of the box.

### Vercel
1. Import the repo into Vercel.
2. Build command: `npm run build` · Output dir: `dist`.
3. `vercel.json` already rewrites every path to `/index.html` so React Router handles routing without 404s.
4. Add the Cloud env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) in Vercel project settings.

The backend (Postgres + Realtime + RLS) is already live on Lovable Cloud — nothing to deploy separately.

---

## 11. Local setup

```bash
# 1. Install
npm install

# 2. Run dev server
npm run dev      # http://localhost:8080

# 3. Production build
npm run build && npm run preview
```

`.env` is auto-managed by Lovable Cloud — no manual configuration needed.

Admin panel: `/web/admin` — credentials `admin / admin@123`
Database viewer (JSON export/import/reset): `/web/database`

---

## 12. My learning journey: from `IndexedDB` to managed Postgres

The first version of this portfolio kept everything in **`localStorage` / `IndexedDB`**. That worked for one device but had real problems:

- Different browsers showed different content.
- Big base64 images blew past the 5 MB localStorage quota → blank-screen `QuotaExceededError`.
- No way to update content from my phone and have my laptop reflect it.

**Upgrade plan that I shipped:**

1. Kept `localStorage` as a *fallback cache* — never removed it, so the site can never go blank.
2. Added a Postgres table (`portfolio_content`) as the durable source of truth.
3. Layered a **Supabase Realtime WebSocket channel** on top so writes propagate instantly to every viewer.
4. Added progressive payload-shrinking to gracefully degrade huge image uploads instead of crashing.
5. Locked writes behind RLS + a separate `user_roles` table to avoid privilege escalation.

Result: same UI, same speed, but now globally synchronized with zero data loss.

---

## 13. Interview prep — quick answers

**Q: Walk me through your project.**
> A React + Vite portfolio whose every section is editable from an in-app admin panel. State is a JSON document persisted to a managed Postgres table on Lovable Cloud and broadcast over Supabase Realtime WebSockets, so when I save a change all open browsers update instantly. Reads always hit a `localStorage` cache first, so the site never shows a blank screen.

**Q: Why Postgres instead of MongoDB?**
> Lovable Cloud ships managed Postgres with Realtime, RLS, Auth, and Storage on a single endpoint — zero ops. For a single-document content model the JSONB column gives me Mongo-style flexibility with relational guarantees, ACID writes, and a built-in WebSocket fan-out I'd otherwise have to build with Socket.IO + a separate Node server.

**Q: How does real-time work?**
> Each browser subscribes to a named Supabase Realtime channel. On save, the originating client persists locally for instant feedback, then broadcasts the JSON over the channel with a `clientId`. Every other client writes the payload to `localStorage` and dispatches the same change event the local write path uses, so subscribers re-render uniformly. If the socket drops, the local cache keeps serving the UI.

**Q: How do you prevent privilege escalation?**
> Roles live in a separate `user_roles` table, never on the profile. RLS policies check membership through a `SECURITY DEFINER` function `has_role(uid, role)`, which avoids both client-side spoofing and recursive RLS lookups.

**Q: How do you avoid blank screens?**
> Three layers: bundled defaults in code, a `localStorage` cache, and the Postgres source of truth. The UI always reads from the cache, and remote updates patch the cache — readers never wait on the network.

---

## 14. Don'ts (rules I follow)

- ❌ Never write custom color classes — only semantic Tailwind tokens defined in `index.css`.
- ❌ Never store roles on the profile/users table.
- ❌ Never edit `src/integrations/supabase/{client,types}.ts` — auto-generated.
- ❌ Never bypass `getNudgeStyle` for images — that helper guarantees no distortion across breakpoints.

---

© 2026 Saisumanth — ALL rights reserved
