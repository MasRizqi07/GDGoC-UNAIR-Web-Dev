# GDGoC UNAIR Web Frontend (`apps/web`)

High-performance, accessible, frameworkless vanilla JavaScript client and interactive web development playground.

---

## 1. Architecture & Design Principles

The frontend emphasizes browser fundamentals, standard web platform APIs, and strict accessibility compliance:

- **Frameworkless Core:** Vanilla ES Modules with zero heavy runtime dependencies, ensuring instant page loads and minimal overhead.
- **Vite Bundler:** Bundles assets for production distribution with sourcemaps, minification, and asset hashing.
- **Design Token System (`tokens.css`):** Centralized CSS custom properties for all colors, typography, elevation, spacing, and transitions. No hardcoded color literals exist outside `tokens.css`.
- **Zero-Trust Client Security:** Tutorial interactive code executions run in an isolated iframe sandbox (`sandbox="allow-scripts"` without `allow-same-origin`), guaranteeing complete protection against script injection and XSS.

---

## 2. Accessibility (WCAG 2.1 AA Compliance)

The user interface adheres to strict accessibility standards verified by automated `@axe-core/playwright` audits:

1. **Focus Management & Indicators:**
   - All interactive controls have a visible focus indicator with at least `3px` solid high-contrast outline and offset.
   - Modals and confirmation dialogs implement circular focus trapping and return focus to the trigger element upon closing.
2. **Touch & Target Sizing:**
   - All primary buttons, tab buttons, and input fields meet or exceed the `44x44 CSS px` minimum touch target size.
3. **Reflow & Responsive Layout:**
   - The layout seamlessly reflows down to `320px` viewport width without triggering horizontal scrollbars.
4. **Motion & Color Preferences:**
   - Respects `prefers-reduced-motion` by disabling transitions and animations for users with motion sensitivities.
   - Respects system `prefers-color-scheme` by default, while supporting a persistent manual theme toggle saved in `localStorage`.
5. **Screen Reader Form Support:**
   - All form controls are linked to `<label>` elements.
   - Validation error messages use `aria-live="polite"` and are referenced via `aria-describedby`.

---

## 3. Interactive Labs & Features

The platform provides interactive web development curriculum labs:

- **Component Playground:** Tabs with keyboard arrow navigation (`ArrowLeft` / `ArrowRight`), nested panels, and state management.
- **Todo Application:** Drag-and-drop reordering, inline editing, completion toggles, and server sync.
- **DOM Inspector:** Demonstrates DOM event phases (capturing vs bubbling) with visual highlighting.
- **Interactive Tutorials:** Guided interactive walkthroughs (`/tutorials/widgets.html`, `/tutorials/todo.html`, `/tutorials/inspector.html`).
- **Privacy Notice:** Transparent data handling disclosure at `/privacy-notice.html`.

---

## 4. State Synchronization & Offline Resilience

- **Authentication Interceptor:** Intercepts `401 Unauthorized` responses and automatically triggers silent token refresh before transparently retrying the failed request.
- **Local Todo Import:** Automatically detects locally saved todos on first user registration and performs an idempotent migration to the database.
- **Preferences Sync:** Persists theme selections and tutorial completion progress to the user's backend profile.
- **Offline States:** Displays clear visual indicators when network connectivity is lost, maintaining read access to cached items.

---

## 5. Development & Testing

```bash
# Run local development server
npm run dev

# Build production bundle into dist/
npm run build

# Run Playwright E2E browser test suite
npm run test:e2e
```
