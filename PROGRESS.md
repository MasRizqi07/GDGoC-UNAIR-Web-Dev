# PROGRESS.md

## PHASE 0 — Reality Check

**Status:** VERIFIED (all inventory + raw outputs collected)

### Repo Inventory (tree depth 4, excluding node_modules/.git)

```
ROOT: D:\MY CODE\VS CODE\GDGoC UNAIR Web-Dev
├── .github/
│   └── copilot-instructions.md
├── backend/
│   ├── Study Jam 1/backend-series-1/   ← Express 5 CRUD students (STUB)
│   │   ├── controllers/studentController.js
│   │   ├── data/students.js
│   │   ├── routes/studentRoutes.js
│   │   ├── server.js
│   │   └── package.json
│   └── Study Jam 2/backend-series-2/   ← Go Fiber students API (STUB)
│       ├── cmd/main.go
│       ├── routes/student_routes.go
│       ├── go.mod, go.sum
├── frontend/
│   ├── Deep Dive Interactive UI/       ← THE PRODUCT (vanilla JS playground)
│   │   ├── index.html
│   │   ├── script.js (586 lines)
│   │   ├── styles.css
│   │   ├── e2e/playground.spec.js (10 Playwright specs)
│   │   ├── playwright.config.js
│   │   ├── tutorials/{widgets,todo,inspector}.html
│   │   ├── package.json (live-server + @playwright/test)
│   │   ├── PROJECT_HANDOFF.md (anti-pattern doc, to be deleted)
│   │   ├── README.md
│   │   ├── task.md
│   │   └── __tests__/ (EMPTY, placeholder was deleted)
│   ├── Study Jam 1/                    ← Static landing page (HTML+CSS+JS)
│   │   ├── index.html, script.js, styles.css, Logo-Branding-UNAIR-biru.png
│   ├── Study Jam 2/
│   │   ├── gdg-js-dom-project/         ← DOM color changer exercise
│   │   └── test/                       ← Task Manager app (localStorage)
│   ├── Study Jam 3/                    ← EMPTY FOLDER
│   └── Study Jam 4/react-learning-project/ ← Vite+React counter/theme
│       ├── src/{App.jsx, components/, main.jsx}
│       └── package.json (react 19, vite 8)
├── session_analysis_report.md          ← STRAY FILE (cross-project, delete)
└── (NO root package.json, NO root .gitignore)
```

### Backend Assessment

Both backends are **STUBS** (in-memory, no DB, no auth, no tests):

| Backend | Framework | Routes | Storage | Port | Status |
|---------|-----------|--------|---------|------|--------|
| Study Jam 1 | Express 5.2.1 | `GET/POST/PUT/DELETE /students` in server.js; duplicated in controller+routes (not mounted) | In-memory array | 3000 | STUB |
| Study Jam 2 | Go Fiber v2 | `GET/POST /api/students` (no update/delete) | In-memory slice | 3000 | STUB |

Both listen on port 3000 (conflict). Neither is called by the frontend. Neither has tests.

**Decision:** Move both to `examples/` with `git mv`. Build `apps/api` new with NestJS + Prisma + PostgreSQL.

### Frontend Assessment

**Deep Dive Interactive UI** (THE PRODUCT):
- Custom elements: `demo-tabs`, `drag-list`, `todo-app`, `dom-inspector` (all Shadow DOM)
- Main features: tab navigation, theme toggle, modal (focus trap), G shortcut, todo with localStorage
- localStorage keys: `ui-dark` (theme), `demo-todos-v1` (todos)
- No `fetch`/XHR calls to any backend
- 3 tutorial pages with live-edit (`innerHTML` → XSS risk if made public)

**Other frontend folders** (all study jam exercises):
- Study Jam 1: Static landing page with theme toggle (localStorage `theme`)
- Study Jam 2/gdg-js-dom-project: Color changer (no storage)
- Study Jam 2/test: Task Manager with localStorage `tasks`, `theme` — uses `innerHTML` with `escapeHTML` helper
- Study Jam 3: Empty folder
- Study Jam 4: React 19 + Vite counter/theme demo (localStorage `theme`)

**Decision:** These are course materials. Move to `examples/` alongside the backend stubs.

### npm audit Summary

**frontend/Deep Dive Interactive UI/** (10 findings, all DEV-ONLY via `live-server`):

| Package | Severity | Runtime? | Fix |
|---------|----------|----------|-----|
| braces (via live-server→chokidar→micromatch) | HIGH ×4 | DEV-ONLY | live-server upgrade to 1.2.0 (breaking) or replace |
| decode-uri-component (via source-map-resolve) | MODERATE ×2 | DEV-ONLY | `npm audit fix` |
| uuid (via http-auth) | MODERATE ×2 | DEV-ONLY | `npm audit fix` |

**Conclusion:** All 10 vulnerabilities are in `live-server` and its transitive deps. None are runtime. `live-server` is only used for dev preview and will be replaced or kept dev-only.

**backend/Study Jam 1/** (1 finding):

| Package | Severity | Runtime? | Fix |
|---------|----------|----------|-----|
| qs (via Express 5) | MODERATE ×1 | Would be runtime if used | `npm audit fix` |

This backend is a stub moving to `examples/`, so it does not affect the product.

### innerHTML / XSS Inventory

| File | Line | Context | Risk |
|------|------|---------|------|
| `tutorials/inspector.html` | 44 | Live-edit preview: `innerHTML = editor.value` | Self-inflicted XSS if published |
| `tutorials/todo.html` | 48 | Live-edit preview: `innerHTML = code` | Same |
| `tutorials/widgets.html` | 68 | Live-edit preview: `innerHTML = code` | Same |
| `script.js` | 21, 110, 203, 385 | Shadow DOM `shadowRoot.innerHTML` in `connectedCallback` | Static template strings, LOW risk |
| `Study Jam 2/test/script.js` | 106, 109, 126 | Task rendering | Has `escapeHTML()`, moving to examples |

**Decision:** Phase 7 will sandbox tutorial live-edit with `<iframe sandbox>`.

### Secrets Scan

- **Working tree:** 6 hits in `frontend/Study Jam 2/test/` — all FALSE POSITIVES (CSS class strings and FontAwesome icon classes containing colon patterns).
- **Git history:** No `.env`, `.pem`, `.key`, `.p12`, or `.pfx` files ever committed.
- **No real secrets found.**

### Stray / Dead Files

| File | Action |
|------|--------|
| `session_analysis_report.md` (root) | DELETE (cross-project, not part of this product) |
| `PROJECT_HANDOFF.md` (Deep Dive) | DELETE (anti-pattern doc for team that doesn't exist) |
| `task.md` (Deep Dive) | DELETE (old baseline, replaced by PROGRESS.md) |
| `__tests__/` (empty dir in Deep Dive) | DELETE |
| `test-results/` (Deep Dive) | Already gitignored, OK |
| `frontend/Study Jam 3/` | EMPTY FOLDER — delete or keep as placeholder? |

---

## PHASE 1 — Safety Net (Characterization Tests)

**Status:** VERIFIED

### Evidence
- 10 Playwright specs in `e2e/playground.spec.js`
- `npm test` = `node --check script.js && playwright test` → 10/10 pass, exit 0
- `--repeat-each=5` → 50/50 pass, exit 0, zero flakes
- Mutation check on G shortcut guard: removed `!typing`, spec goes RED (`Expected: false, Received: true`), revert → GREEN
- Mutation check on modal focus-restore: previously verified (from earlier session)
- `playwright.config.js` hardened: `retries: 0`, `forbidOnly: !!process.env.CI`, explicit `timeout: 30_000`, `expect.timeout: 5_000`
- `__tests__/placeholder.test.js` DELETED (folder still exists but empty)
- Cold-start anomaly (inspector 20s) was due to `webServer` spinning up live-server; subsequent runs 1-4s. Config's `webServer.timeout: 30_000` and `reuseExistingServer` handle this.

---

## UNIFICATION DECISION RECORD

### Stack Decision

| Rule | Match | Decision |
|------|-------|----------|
| "If backend/ already contains a working framework" | NO — both are stubs (in-memory, no persistence/auth/tests) | ❌ Skip |
| "If backend/ is empty or only a stub" | YES | ✅ Scaffold NestJS + Prisma + PostgreSQL |

### Target Folder Mapping

| Old Path | New Path | Method |
|----------|----------|--------|
| `frontend/Deep Dive Interactive UI/` | `apps/web/` | `git mv` |
| `backend/Study Jam 1/backend-series-1/` | `examples/study-jam-1-express/` | `git mv` |
| `backend/Study Jam 2/backend-series-2/` | `examples/study-jam-2-go-fiber/` | `git mv` |
| `frontend/Study Jam 1/` | `examples/study-jam-1-frontend/` | `git mv` |
| `frontend/Study Jam 2/` | `examples/study-jam-2-frontend/` | `git mv` |
| `frontend/Study Jam 3/` | DELETE (empty) | `rmdir` |
| `frontend/Study Jam 4/react-learning-project/` | `examples/study-jam-4-react/` | `git mv` |
| (new) | `apps/api/` | Scaffold |
| (new) | `packages/contracts/` | Scaffold |

### Risks

1. Folder name with spaces (`Deep Dive Interactive UI`) breaks many CLI tools. Rename to kebab-case is required.
2. `live-server` audit findings (4 HIGH) are dev-only but still noisy. Consider replacing with `vite preview` or `npx serve` in Phase 2.
3. Tutorial `innerHTML` usage is a self-XSS risk that blocks public deployment. Phase 7 fix needed.
4. React project (Study Jam 4) has its own `node_modules` if installed — must NOT be included in workspaces or Docker image.

### PRODUCT BRIEF — Questions for Owner

> These lines are marked `[ASSUMPTION]` in the master prompt. **Answer before Phase 2:**

1. **Who uses this site?** [ASSUMPTION: Students learning web dev in GDGoC/campus study jams]
2. **First 5 minutes?** [ASSUMPTION: Open site, try playground, read tutorial, save a todo]
3. **Why do they return?** [ASSUMPTION: Saved progress follows them across devices; new tutorials]
4. **Is this for real users or portfolio showcase?** If portfolio, Phases 4-6 shrink significantly.
5. **Study jam materials (examples/) — keep accessible from the site or just preserve in repo?**

---

## BACKLOG

- Replace `live-server` with lighter alternative (no audit findings)
- Sandbox tutorial live-edit with `<iframe sandbox>` (Phase 7)
- Consider converting `script.js` custom elements to ES modules (only if needed for API client)
- Add root `.gitignore`
- Delete empty `__tests__/` directory



---

## STEP 0 - Audit and close Phase 2

**Status:** VERIFIED

### Updates
- **Lockfiles:** Restored `package-lock.json` for `study-jam-1-express` and `study-jam-4-react` as they are isolated examples outside the main npm workspace.
- **Port Hygiene:** Tested `playwright.config.js` with `reuseExistingServer: false`. This ensures Playwright spins up a fresh `live-server` for tests, avoiding stale state false positives. Reverted config back to `!process.env.CI` for local dev speed after confirming it works.
- **Root Tests:** `npm test` now runs `node --check apps/web/script.js` before executing `playwright test`. Validated by clearing `node_modules` and doing a fresh `npm ci`.
- **Examples Inventory:**
  - `study-jam-1-express`: Express, `server.js`, 3000
  - `study-jam-2-go-fiber`: Go Fiber, `cmd/main.go`, 3000
  - `study-jam-4-react`: Vite + React, `index.html` -> `src/main.jsx`, 5173
  - All examples are confirmed to be stubs/course materials and isolated from the main workspace.
- **Security & Secrets:** Verified that `live-server` is the sole source of the 10 vulnerabilities (all Dev-Only). Confirmed `innerHTML` XSS risk in tutorials. No real secrets found in working tree or git history.
- **Mutation Check:** The `G` shortcut guard in `apps/web/script.js` was manually mutated (removed `!typing` check), which successfully broke the tests (RED). Reverting it restored the tests (GREEN), confirming test reliability.

---

## PHASE 3 — Frontend Shell & Accessibility

**Status:** VERIFIED

### Evidence
- **Link check:** `npm run check:links` (using linkinator) yields 0 broken links across all HTML files.
- **Accessibility:** `@axe-core/playwright` test (`a11y.spec.js`) added and passes on `index.html` and the 3 tutorials in both light and dark modes with 0 serious/critical violations.
- **Keyboard navigation:** `keyboard-nav.spec.js` added and demonstrates tabbing reaches the playground widgets panel and correctly focuses the tutorial links, as well as checking the shell structure.
- **HTML Rewrites:** `tutorials/widgets.html`, `tutorials/todo.html`, and `tutorials/inspector.html` all successfully updated with a standard semantic `<header>`, `<main id="main-content">`, `<a href="#main-content" class="skip-link">`, and `<footer>`. The headings in `widgets.html` were correctly ordered to match accessibility requirements.
- **Tokens extraction:** Shared CSS variables migrated to `tokens.css`, replacing hardcoded colors in `styles.css`.
- **Existing tests:** `npm test` at the root executes all 19 tests perfectly (10 playground specs + 8 a11y specs + 1 keyboard spec), exit code 0.
- **Dependencies:** `linkinator` and `@axe-core/playwright` added to `package.json` devDependencies as required for the a11y checks and link checking gate.
