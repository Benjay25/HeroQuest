@AGENTS.md

# HeroQuest — Project Context

## What this project is
A fantasy-themed quest log / todo app. Users track goals as quests, earn XP, and belong to themed factions (guilds). See `PLAN.md` for the full development plan (machine-readable). `hero-quest-plan.html` is the visual version for the human.

## Name
"HeroQuest" is a working title and will change. Do not treat it as permanent.

## Current status
- Phase 0 ✅ complete — project scaffolded, MUI theme, Supabase connected
- Phase 1 ✅ complete — auth, guest mode, app shell, sidebar (collapsible), player card, dashboard layout
- Phase 2 ✅ core complete — quest CRUD, QuestCard (boolean/numeric/checklist, optimistic + batched), create dialog (quick/detailed), fog quick-add, /fog + /quests pages, ComingSoon stubs. Guest curated board + sign-in prompt deferred into Phase 3.
- Phase 3 🔄 in progress — factions: schema, types, queries, reputation awarding, /factions board + /factions/[slug] detail, faction selector in create dialog, faction colour/chip on quest cards. Remaining: leader "mood" badge, admin page (end of phase).

## Faction system (Phase 3)
DB: `factions` (data-driven, admin-editable later), `user_faction_reputation` (per user per guild), `quests.faction_id`. All RLS: factions public-read, reputation private.
- Types: `src/types/database.ts` — Faction, FactionSummary, UserFactionReputation, FactionWithReputation, FACTION_RANKS + factionRankTitle/Progress/xpToNext. Quest has faction_id; QuestWithProgress embeds `faction: FactionSummary | null`.
- Queries: `src/lib/supabase/queries/factions.ts` — getFactions, getFactionsWithReputation, getFactionWithReputation(slug).
- Reputation (Option A): faction-tagged quest completion adds xp_reward to BOTH profile.xp and faction rep, via adjustFactionRep in the completion actions. revalidateQuestSurfaces() refreshes dashboard/quests/fog/factions.
- 3 featured guilds (Fighters/Mages/Hearthkeepers) seeded with lore; 5 placeholders. Fighters leader: Corbin Guster Hammerfist.
- Pages: `/factions` (FactionCard grid, public), `/factions/[slug]` (banner, standing, lore, leader). Faction colour bleeds into quest card accent + a faction chip.

## Quest data layer (Phase 2)
DB tables (all with RLS): `quests` (definitions), `user_quests` (per-user state), `quest_checklist_items`, `user_checklist_progress`. Two-table split = definition vs per-user progress; resets only touch user_quests.
- Types: `src/types/database.ts` — Quest, UserQuest, QuestChecklistItem, UserChecklistProgress, QuestWithProgress (flat join shape the UI wants), plus computeLevel().
- Reads: `src/lib/supabase/queries/quests.ts` — getUserQuests, getUserQuestsByType, groupQuestsByType, completionCounts.
- Mutations: `src/lib/supabase/actions/quests.ts` — createQuest (writes quests + user_quests + optional checklist items), quickAddFog (form action, title only), toggleQuestComplete, setNumericProgress, setChecklistItemsComplete (batched, multi-item), setChecklistItemProgress (numeric), deleteQuest. Completion actions adjust profile.xp and recompute level via adjustXp. recomputeChecklistQuest (parallelized fetches) auto-completes/un-completes a checklist parent when its items change.
- Reads embed checklist items + per-user progress: QUEST_SELECT in queries/quests.ts. QuestWithProgress carries `checklist: ChecklistItemWithProgress[]` (empty for non-checklist).
- Quest types: daily | weekly | story | fog | epic. Completion: boolean | checklist | numeric (all interactive). faction_id deferred to Phase 3.
- Checklist UI: `src/components/ui/ChecklistItems.tsx` — boolean items get a check circle, numeric items (weekly sub-quests) get a progress editor.

## App shell layout (viewport-filling, no height math)
- `(app)/layout.tsx`: outer Box `height: 100dvh`, `overflow: hidden`, flex column. AppNav takes natural height (border included). Content row `flexGrow:1, minHeight:0`. `<main>` has `overflowY:auto` so pages scroll INSIDE main, never the document. This replaced fragile `calc(100vh - …)` math that caused 1px scrollbars.
- Sidebar fills the row via `height:100%` + flex stretch (no sticky/NAV_HEIGHT calc), scrolls internally.
- Dashboard fills via flex: Stack `height:{md:'100%'}`, padded Box `flexGrow:{md:1}` flex-column, quest grid `flexGrow:{md:1}, minHeight:{md:0}`. Quest containers scroll internally. On xs everything is auto-height and main scrolls normally.
- PlayerCard is full-bleed (borderRadius 0, no border), content centred via inner Stack maxWidth 1000.
- Sidebar: collapsible, defaults to collapsed (true), persists in localStorage 'heroquest-sidebar-collapsed'.

## Established file structure (key files)
- `src/proxy.ts` — route protection (Next.js 16 proxy, replaces middleware)
- `src/theme/theme.ts` — single source of truth for all colours/fonts
- `src/theme/ThemeRegistry.tsx` — MUI + App Router SSR compatibility
- `src/lib/supabase/client.ts` — Supabase browser client
- `src/lib/supabase/server.ts` — Supabase server client
- `src/lib/supabase/actions/auth.ts` — signIn, signUp, signOut server actions
- `src/components/ui/SubmitButton.tsx` — shared form submit button using useFormStatus
- `src/components/layout/AppNav.tsx` — persistent nav bar, receives user as prop
- `src/app/(auth)/login/` and `signup/` — auth pages (Server Components)
- `src/app/(app)/layout.tsx` — app shell layout, fetches user server-side
- `src/app/(app)/dashboard/` — protected dashboard (placeholder)

## User roles
Not yet implemented. Planned for start of Phase 4.
- `role` column on `profiles` table — `'user'` (default) | `'admin'`
- Admin routes: `/admin/*` — protected in proxy.ts and via RLS
- Do not build admin UI before the role system is in place

## Established routes
| Route | Auth required | Notes |
|---|---|---|
| `/` | No | Landing page, redirects logged-in users to /dashboard |
| `/login` | No | Redirects logged-in users to /dashboard |
| `/signup` | No | Redirects logged-in users to /dashboard |
| `/dashboard` | Yes | Quest dashboard (PlayerCard + 1:2:1 quest grid) |
| `/quests` | Yes | Quest Board — filterable full list (QuestsBrowser). Guest/curated view deferred to Phase 3 |
| `/fog` | Yes | Full-page fog list + quick-add |
| `/factions` | No | ComingSoon stub (Phase 3) |
| `/profile` | Yes | ComingSoon stub (Phase 5) |

## Stack
- **Next.js 16** (App Router) + TypeScript
- **MUI v6** for UI components and theming
- **Supabase** for auth, database, real-time
- **Vercel** for hosting

## Next.js 16 breaking changes discovered so far

### middleware → proxy
`middleware.ts` is deprecated. Use `proxy.ts` with an exported `proxy` function instead of `middleware`. The API is otherwise identical.

### No functions as props from Server → Client Components (React 19)
In React 19, you cannot pass a function as a prop from a Server Component to a Client Component unless it is a Server Action marked with `'use server'`.

**Broken pattern** (in a Server Component):
```tsx
<Button component={Link} href="/somewhere">Label</Button>
```

**Correct pattern** (in a Server Component):
```tsx
<Link href="/somewhere" style={{ textDecoration: 'none' }}>
  <Button>Label</Button>
</Link>
```

`component={Link}` is fine inside `'use client'` files — only breaks in Server Components.

### No theme callback functions in sx props on Server Components (React 19)
MUI's `sx` prop accepts `theme => ...` callback functions, but these cannot be passed from a Server Component to a Client Component. If a component is rendered by a Server Component, use hardcoded values instead.

**Broken** (in a Server Component or its children rendered server-side):
```tsx
<Box sx={{ background: theme => theme.palette.background.paper }} />
```

**Correct:**
```tsx
<Box sx={{ background: '#1e1a14' }} />
```

If a component needs theme callbacks extensively, mark it `'use client'`.

### Form actions (React 19)
Do not use `<Box component="form" action={clientFunction}>`. MUI's Box does not understand React 19 form actions. Use a native `<form>` element with a server action passed directly:

```tsx
<form action={myServerAction}>
  <SubmitButton>Submit</SubmitButton>
</form>
```

Use the shared `SubmitButton` component (`src/components/ui/SubmitButton.tsx`) which uses `useFormStatus` to handle pending state automatically.

### searchParams is a Promise
In Next.js 15+, `searchParams` in page props is a `Promise` and must be awaited:
```tsx
export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
}
```

### MUI v6 API changes
- `PaperProps` on Drawer → use `slotProps={{ paper: { ... } }}`
- `primaryTypographyProps` on ListItemText → use `slotProps={{ primary: { ... } }}`
- `display` is not a direct prop on Typography → put in `sx`
- `alignItems` is not a direct prop on Stack → put in `sx={{ alignItems: ... }}`
- Input constraints (`min`/`max`) → `slotProps={{ htmlInput: { min, max } }}`

## Layout component convention
Use `Stack` and `Box` deliberately and together — this is a coding style choice for the project, not just a default.

- **Stack** — single-axis flex layouts with consistent spacing between children (rows of chips, vertical form fields, stacked sections). More expressive of intent than Box + display:flex.
- **Box** — everything else: grid layouts, containers needing full sx control, non-flex wrappers, elements where Stack's defaults would need overriding anyway.

Never sacrifice performance or functionality for this convention. It's a style signature, not a rule.

## Component philosophy
Shared components are a priority. If two or more places render the same structure with different data, that structure belongs in a component — not just for DRY but so visual decisions are made once and applied consistently.

Rule: before writing card/panel markup inline in a page, ask if it will appear elsewhere. If yes, or reasonably could, make it a component first.

Shared components in `src/components/ui/`:
- `SubmitButton` — form submit with built-in pending state via useFormStatus
- `StatCard` — labelled metric card (label, value, description, colour)

## Layout constants
`src/constants/layout.ts` — shared measurements used by multiple components.
- `NAV_HEIGHT = 64` — AppNav height, referenced by Sidebar. Change once, updates everywhere.

## AppBar vs Sidebar philosophy
**AppBar** — global identity and access only: logo/brand, auth controls (sign in/out/join), future global actions (search, notifications). No navigation links on desktop.
**Sidebar** — where you go and how you're doing: all navigation links, user panel (avatar, name, level, XP), future faction standing. Hidden on mobile — AppBar drawer absorbs all navigation there.

## Optimistic action pattern (standard for interactive cards)
- Interactive cards update optimistically: flip local state immediately, call the server action, revert only if it returns `{ error }`. Don't gate the visual on the await.
- Each card owns one `useTransition` (`isBusy`/`startBusy`) and a `runBusy(action)` helper threaded to children, so any in-flight action (own or child) shows a single small `CircularProgress` in the card's top-right corner. No busy-dimming — the spinner is the "working…" feedback; the only opacity change is the 0.6 fade on completed quests.
- Rapid-fire actions (e.g. ticking several checklist items) are debounced (~300ms) and batched into ONE server action that upserts all changes, recomputes once, and revalidates once. Server actions run sequentially in Next.js and each revalidate re-runs the dashboard query, so batching avoids N sequential full revalidations. Keep deliberate single actions (numeric Save) un-batched.

## Visual design language (learned from the guild cards/pages)
Repeatable techniques that lift a surface from "web UI" to "game UI" — apply broadly, not just to factions:
- **Layered gradient "card-stock" backgrounds** instead of flat `background.paper` (e.g. `linear-gradient(160deg,#221d16,#18140f,#161310)`).
- **Recessed inner panels** for secondary content (darker inset box, e.g. `rgba(0,0,0,0.25)`).
- **Framed focal point** — put a hero element (icon/art) in its own bordered "art window" with a colour-washed backdrop + `OrnateCorners`, rather than loose on the surface.
- **Thread the accent colour** through borders, dividers, progress bars, type-lines, left-accents.
- **Depth via doubled edges** — inset gold hairline (`boxShadow: 'inset 0 0 0 1px rgba(217,182,89,0.1)'`) + a drop shadow.
- **Generous negative space** — the biggest "premium" lever.
- **Ornamental accents used sparingly** — `OrnateDivider`/`OrnateCorners`/`BorderFrame` feel special because they're not everywhere.
Reusable bits: `OrnateDivider` (colour-matched), `OrnateCorners` (colour prop), `BorderFrame` (server-only, 9-slice metallic frames in `lib/factionFrames.ts`).

## Styling decisions made
- **Animate, don't pop** — prefer transition animations (e.g. MUI `<Collapse>`) over instant conditional show/hide for UI that appears/disappears. There will be exceptions, handled case by case. When wrapping spaced sections in Collapse, use a plain container (not a spaced Stack) and put each section's spacing as internal padding so collapsed sections leave no stray gap.
- **Card hover borders** — removed from theme. Hover states only on genuinely clickable components, applied locally via `sx`.
- **Card border radius** — 8px (overrides global `shape.borderRadius` of 4px).
- **Colour philosophy** — still being defined. Avoid locking in decisions prematurely.

## Key architectural decisions
- **Guest mode**: most routes are public/read-only, only `/dashboard`, `/profile`, `/checkin` require auth
- **Auth pattern**: Server Components fetch the user and pass it as a prop to Client Components — never fetch auth state inside a Client Component on first render
- **Theme**: single source of truth in `src/theme/theme.ts` — never hardcode colours or fonts in components
- **Forms**: Server Actions + native `<form>` + `SubmitButton` component
