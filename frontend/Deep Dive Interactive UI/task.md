# Task Baseline — Deep Dive Interactive UI

## Objective

Upgrade the existing vanilla-JavaScript playground into a polished, responsive, accessible learning experience while keeping its core purpose and browser-native implementation. Preserve the page’s four custom elements, global tabs, theme, modal, and keyboard demo.

## Approved Scope

- [index.html](./index.html): semantic structure, accessible labels/states, and presentation of the existing interactive demos.
- [styles.css](./styles.css): visual system, responsive layout, focus states, and purposeful motion.
- [script.js](./script.js): robust interaction state, event lifecycle, persistence, and optional-element handling.
- [README.md](./README.md): accurate setup, feature, accessibility, and validation guidance.
- [package.json](./package.json), [package-lock.json](./package-lock.json), and [.gitignore](./.gitignore): correct existing scripts, lock the restored declared development dependencies, and exclude generated dependencies/logs.
- [tutorials/](./tutorials): only if the shared page changes break a directly linked learning path.

## Non-Goals

- Do not redesign or refactor the unrelated `backend/` or other `frontend/` projects.
- Do not migrate this playground to React, a bundler, TypeScript, or a component framework.
- Do not add authentication, analytics, network APIs, or other production services.
- Do not add dependencies unless the existing environment cannot verify a required behavior and the benefit is justified.
- Do not invent app features unrelated to the JS/DOM learning purpose.

## Work Phases

1. **Baseline and contract** — record scope, acceptance criteria, dependencies, and exact validation.
2. **UI and responsive design** — build a cohesive editorial/technical visual system, refine hierarchy and spacing, support narrow screens, add subtle transitions, and honor `prefers-reduced-motion`.
3. **Interaction and accessibility** — preserve all current demos while correcting component state, lifecycle, persistence, keyboard, modal, drag/drop, and inspector behavior.
4. **Verification and handoff** — run syntax/package checks and browser smoke tests; update README and this file with concrete evidence and remaining limitations.

## Acceptance Criteria

### UI, responsive behavior, and accessibility

1. The page clearly introduces the JS/DOM learning playground and presents widgets, todos, and inspector as navigable learning sections.
2. All existing interactive features remain available; the redesign does not remove or break existing content.
3. Layout remains readable and usable at mobile widths (320px and above), tablet, and desktop, with no horizontal page overflow.
4. Keyboard focus is visible, controls have accessible names and appropriate semantics, and tabs expose synchronized selected/hidden state.
5. Animations are restrained, support state feedback rather than decoration alone, and are reduced/disabled when `prefers-reduced-motion: reduce` is active.
6. Light/dark theme tokens maintain readable foreground, surface, border, and focus contrast.

### Interaction behavior

7. Existing custom elements register and render: `demo-tabs`, `drag-list`, `todo-app`, and `dom-inspector`.
8. Main page tabs update panel visibility plus `aria-selected` and `aria-hidden`; nested demo tabs switch content without hiding their own controls.
9. Theme toggling persists through `localStorage` using the existing `ui-dark` key.
10. Modal open/close, backdrop, Escape, and focus restoration work without throwing if optional controls are absent.
11. Todo submission ignores blank values, persists non-blank values, and removes the intended item.
12. Drag-and-drop reordering does not duplicate or lose items and tolerates drops on descendants of a list item.
13. The inspector can be started and stopped while active; its own controls remain usable, inspected clicks do not trigger page actions, and lifecycle cleanup restores page state.
14. Keyboard shortcut `G` continues to highlight the site header without interfering with text-entry controls, including controls inside Shadow DOM.
15. No uncaught console errors occur during main-page smoke testing.

## Dependencies and Source of Truth

- Browser APIs: Custom Elements, Shadow DOM, DOM events, `localStorage`, and HTML drag-and-drop.
- Page contract: IDs, roles, classes, and `data-*` attributes in [index.html](./index.html).
- Existing package contract: [package.json](./package.json) declares `live-server`; the existing `npm test` script is only a placeholder until replaced or supplemented with meaningful checks.
- The vanilla-JS learning purpose and existing user-facing features take precedence over introducing a new framework or unrelated capabilities.

## Validation Plan

1. Run `node --check script.js` from this directory.
2. Run `npm test` from this directory and distinguish actual tests from placeholder output.
3. Run the local demo with `npm start` when browser interaction validation is needed.
4. At 320px and desktop width, inspect the main page for usability and horizontal overflow.
5. Smoke-test tabs, theme persistence, modal open/close/Escape/focus, todo persistence/removal, drag reordering, inspector start/stop, and `G`.
6. Check browser console and verify reduced-motion behavior.
7. Record exact commands and observable results below; do not mark an unverified criterion complete.

## Completion Evidence

- Initial baseline validation: `npm test` from this directory exited successfully but printed “No tests configured yet”; it did not run assertions.
- Baseline status check: `git diff --check` passed when this file was first added.
- Implementation check: `npm test` passed (`node --check script.js`); `git diff --check` passed.
- Preview check: `npm start` served the page at `http://127.0.0.1:5500/` with HTTP 200. All three linked tutorial pages also returned HTTP 200.
- Responsive check: at 320 CSS px, document scroll width was 320 px; at 1440 CSS px, scroll width was 1425 px (vertical scrollbar) and neither viewport had horizontal overflow.
- Motion check: under `prefers-reduced-motion: reduce`, computed hero animation and body transition durations were both `0.00001s`.
- Browser smoke checks passed for main and nested tabs (including ARIA/panel synchronization and arrow navigation); theme persistence across reload; modal close button, “Back to the lab”, backdrop, Escape, focus trapping, and focus restoration; todo add/remove and storage; drag reordering; inspector start/stop and interception of inspected clicks; and shortcut `G` outside text entry. The shortcut was corrected to inspect the original composed event target so focused inputs inside Shadow DOM are respected.
- A fresh browser page and the interaction run reported zero console errors.
- Lighthouse audits reported 100 for accessibility, best practices, SEO, and agentic browsing on desktop (light and dark themes) and mobile. The initial audit caught two contrast/text-name issues; muted and accent text tokens were darkened for contrast, and the visible brand text was included in its accessible name before all audits passed.
- Dependency restore (`npm install`, using the already-declared `live-server`) reported 10 npm audit findings (6 moderate, 4 high). No automatic audit fixes were applied; dependency-security remediation remains out of scope.
