# Deep Dive — JavaScript & DOM Playground

A hands-on browser lab for learning how JavaScript interacts with the DOM. It uses vanilla JavaScript and browser APIs—no application framework or build step.

## Run locally

From this directory:

```sh
npm ci
npx playwright install chromium
npm start
```

The browser install is needed once per machine for end-to-end tests. The demo opens at `http://127.0.0.1:5500/`. You can also open `index.html` directly in a browser.

## Labs

- **Widgets** — nested custom-element tabs, drag-and-drop reordering, and a keyboard shortcut.
- **Todo & state** — add and remove tasks persisted in this browser’s `localStorage`.
- **DOM inspector** — inspect elements during the capture phase without activating their click actions.
- **Quick note** — modal behavior with keyboard dismissal and focus restoration.

The walkthroughs in [`tutorials/`](./tutorials) are linked from the matching labs.

For the implementation record, QA evidence, deployment notes, open risks, and
recommended handoff actions, see the [project handoff report](./PROJECT_HANDOFF.md).

## Accessibility and motion

- Use `Tab` to move between controls and `ArrowLeft` / `ArrowRight` to move between tabs.
- The `G` shortcut highlights the page header when focus is not in a text-entry control.
- Theme selection is saved in `localStorage` under `ui-dark`; tasks use `demo-todos-v1`.
- UI animations respect the browser’s `prefers-reduced-motion` setting.

## Validation

```sh
npm test
```

This checks `script.js` syntax and runs the Playwright end-to-end suite in Chromium. Playwright starts the local preview server automatically for tests; use `npm start` separately for manual testing. The suite covers tabs, theme persistence, modal focus and dismissal, todo storage, drag ordering, inspector behavior, keyboard shortcut, reduced motion, narrow viewport layout, and tutorial routes.
