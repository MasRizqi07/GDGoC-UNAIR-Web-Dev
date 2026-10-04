# Deep Dive — JavaScript & DOM Playground

A hands-on browser lab for learning how JavaScript interacts with the DOM. It uses vanilla JavaScript and browser APIs—no application framework or build step.

## Run locally

From this directory:

```sh
npm install
npm start
```

The demo opens at `http://127.0.0.1:5500/`. You can also open `index.html` directly in a browser.

## Labs

- **Widgets** — nested custom-element tabs, drag-and-drop reordering, and a keyboard shortcut.
- **Todo & state** — add and remove tasks persisted in this browser’s `localStorage`.
- **DOM inspector** — inspect elements during the capture phase without activating their click actions.
- **Quick note** — modal behavior with keyboard dismissal and focus restoration.

The walkthroughs in [`tutorials/`](./tutorials) are linked from the matching labs.

## Accessibility and motion

- Use `Tab` to move between controls and `ArrowLeft` / `ArrowRight` to move between tabs.
- The `G` shortcut highlights the page header when focus is not in a text-entry control.
- Theme selection is saved in `localStorage` under `ui-dark`; tasks use `demo-todos-v1`.
- UI animations respect the browser’s `prefers-reduced-motion` setting.

## Validation

```sh
npm test
```

This runs `node --check script.js` as a JavaScript syntax check. It is not a unit-test suite. Verify behavior in a browser by exercising the tabs, theme persistence, modal close/Escape/focus, todo persistence/removal, drag ordering, inspector start/stop, keyboard shortcut, and reduced-motion mode.
