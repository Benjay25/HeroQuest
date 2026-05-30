# HeroQuest — Development Plan
> Machine-readable companion to `hero-quest-plan.html`. Keep both in sync.
> Version 1.3 — May 2026

---

## Concept
A fantasy quest-log app for real-world goals. The UI looks and feels like a game's quest log (Skyrim-inspired). Users track todos as quests, earn XP, level up, and build reputation with themed factions (guilds). Core philosophy: make it frictionless to capture tasks you'd otherwise ignore. The faction system is the key differentiator — rich lore, named characters, personality, and consequences that make guilds feel alive rather than cosmetic.

---

## Naming conventions
| Term | Meaning |
|---|---|
| **Guild** | A pre-defined faction group (Fighters Guild, Mages Guild). Proper noun. |
| **Faction system** | The overarching system guilds belong to |
| **Clan** | A user-created social group of friends |

"I'm in the Fighters Guild" (faction affiliation) vs "I'm in the Hammerheads" (clan membership). Never use "guild" and "clan" interchangeably in UI copy.

---

## Quest Types
| Type | Description |
|---|---|
| **Daily** | Resets midnight. Streak-tracked. Boolean or checklist completion. Optional penalty. |
| **Weekly** | Resets Monday. Supports numeric progress (e.g. 40/50 pages) and sub-quests with individual numeric targets (e.g. triathlon: jog/swim/cycle each with own target). |
| **Story** | User-authored personal life quests. "Quests that are part of your life." Essays, studying, projects. Factionable. |
| **Epic** | Admin-authored. Multi-step checklist. Grand quest lines. |
| **Fog** | Frictionless capture (title only required). Once-off chores you're avoiding. Visual staleness progression. Optional deadline and penalty. UI is darker/more urgent. |

## Quest completion types
| Type | Description | Used by |
|---|---|---|
| **Boolean** | Simple yes/no | Daily, Fog, Story |
| **Checklist** | Sub-tasks, each boolean or numeric | Daily, Weekly, Epic |
| **Numeric** | Progress toward a single target (resets weekly) | Weekly |

## Quest template model
Admin-created quests (Epic, predefined Dailies) are **templates** (`is_template = true`). When a user adopts a template, a personal copy is created (`template_id` points to the original). The copy is fully owned by the user and can be tweaked. Admin updating a template does not affect existing copies.

## Fairness / honesty policy
To be defined in a future session. Core principle: trust users by default, add soft guardrails (XP caps, minimum reset intervals) that don't add friction but prevent obvious abuse. This app runs on the honesty system — policy should protect good-faith users from accidental advantage/disadvantage more than it polices bad actors.

---

## Factions (Guilds)
The faction system is a core differentiator. Each guild has named characters, lore, personality, and consequences for engagement/neglect. Admin-defined. Custom user clans are a future phase.

| Guild | Theme | Known Characters |
|---|---|---|
| Fighters Guild | Exercise & Health | Corbin Guster Hammerfist (leader) |
| Mages Guild | Learning & Study | TBD |
| The Court | Social & Politics | TBD |
| Merchants League | Career & Finance | TBD |
| The Wanderers | Hobbies & Exploration | TBD |
| The Conclave | Mindfulness & Rest | TBD |
| The Hearthkeepers | Home & Errands | TBD |
| The Bards | Creative & Media | TBD |

---

## Data Models
- **User** — id, display_name, avatar_url, xp, level, streak_days, created_at
- **Faction** — id, name, slug, lore, mascot_url, colour, icon
- **Quest** — id, title, description, type (enum), faction_id, xp_reward, difficulty (enum), created_by, is_template, template_id, completion_type, numeric_target, has_penalty, penalty_xp, stale_after_days
- **UserQuest** — id, user_id, quest_id, status (enum), numeric_progress, completed_at, reset_at, stale_at, deadline_at
- **QuestChecklistItem** — id, quest_id, title, sort_order, numeric_target
- **UserChecklistProgress** — id, user_id, checklist_item_id, numeric_progress, completed_at
- **UserFactionReputation** — id, user_id, faction_id, xp, rank

---

## Development Phases

### ✅ Phase 0 — Project Skeleton (complete)
Next.js + MUI + Supabase scaffolded. Theme created. Vercel deploy pipeline ready.

### ✅ Phase 1 — Auth & User Shell (complete)
- Email/password auth via Supabase
- Guest mode (read-only browse)
- Proxy for selective route protection
- Collapsible sidebar, AppNav
- PlayerCard on dashboard
- Profile table with DB trigger

### Phase 2 — Quest Log Core
- Quest creation form (title, type, description, faction)
- Quest list views per type, filterable
- QuestCard shared component
- Mark complete → XP gain, visual feedback
- Fog quick-add (title only, FAB on mobile)
- Lore-flavoured empty states
- XP saved to Supabase
- Dashboard: 1:2:1 layout (Story | Daily+Weekly | Fog), maxWidth 1400

### Phase 3 — Factions
- Faction data seeded in Supabase
- Faction pages (lore, mascot, colour identity, named leader)
- Faction filtering on quest log
- Reputation system (XP per guild, rank titles)
- Faction colour on quest cards
- Faction leader mood system (sidebar badge when quests neglected too long)

### Phase 4 — Epic Quests & Admin
> **First task:** add `role` column to `profiles` (`'user'` | `'admin'`), protect `/admin` routes.
- Epic quest detail page (checklist, progress bar, lore)
- Admin authoring interface
- Quest Board (available / in-progress / completed)
- Random Quest Board (admin-curated, shuffle mechanic)

### Phase 5 — Gamification Layer
- XP thresholds, level-up animation
- Daily/weekly reset logic (cron)
- Streak tracking + **streak freezes** (max 2, replenishable via in-game currency)
- **Daily Check-in** — Fog prompt, reflection questions, optional streak-required dailies
- Achievement scaffolding
- Quest difficulty tiers
- **In-game reward shop** — spend earned currency on: UI themes, streak freeze replenishment, cosmetics
- Full profile page

### Phase 6 — Polish & Feel (ongoing)
- Page transitions, completion animations (Framer Motion)
- Sound design (optional)
- Skyrim typography, iconography, decorative borders
- Day/night mode
- Styled loading skeletons
- Lore-voiced error and empty states

---

## Confirmed Backlog (Phase 7+)
- React Native mobile app (same Supabase backend)
- Watchlists & Reading Lists
- **Notes feature** — detached from game systems, plain notes/tasks in one app alongside quests
- Avatar customisation (earnable/purchasable)
- Guild banners and icons (purchasable)
- **Clans** — user-created social groups, can affiliate with one or more guilds, contribute to shared XP or team goals
- User-authored Epic quests (shareable)
- Social features (compare standings with friends)
- Push notifications (web first, then mobile)
- Companion / mascot system (early concept, needs design)

---

## Under Consideration (needs design)
- **Paths** — progress through themed paths based on faction reputation (e.g. Fighters Lv2 + Conclave Lv3 → Monk Path). Open questions: visibility, branching, UI.
- **Community Quest Contributions** — users submit to Random Quest Board. Needs moderation.
- **Faction leader dialogue/reactions** — leaders comment on your progress or neglect. Extends the mood/badge system.

---

## Mobile Migration Notes
*(for eventual React Native app — nothing to build yet)*
- Supabase backend works unchanged; auth setup differs (AsyncStorage instead of cookies)
- Push notifications: Supabase Edge Functions trigger FCM/APNs. Plan backend triggers now.
- Widgets (iOS WidgetKit, Android App Widgets): native-only, late-stage feature
- Deep linking: plan URL scheme early (`heroquest://quest/123`) for notification tap handling
- Shared code: keep business logic in pure `.ts` files — reusable across web and mobile
- Touch targets: already designing at 44px+ which translates directly

---

## Guiding Principles
1. **Frontend first** — use fake data to build components, wire to backend when solid
2. **Theme as infrastructure** — all colours/fonts in `src/theme/theme.ts`, never hardcoded
3. **Shared components early** — QuestCard, FactionBadge, XPBar built once, reused everywhere
4. **Nothing is a black box** — explain every decision as we go (this is a learning project)
5. **Faction system depth** — guilds have characters, lore, personality. This is the differentiator. Never treat factions as just a filter tag.
