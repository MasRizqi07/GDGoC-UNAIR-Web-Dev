# Standing rules for this repository (apply to every task)

## Language & style
- Code, identifiers, commits, and technical docs in English. User-facing UI copy keeps the language already used in the existing UI (detect it, do not translate).
- Conventional Commits. One commit per logical change. Never commit to `main` directly.

## Laziness Ladder (stop at the first rung that holds)
1. Does this need to exist at all? If no, do not build it.
2. Already exists in this repo? Reuse it.
3. Solvable with platform/stdlib/framework built-ins? Use them.
4. Already an installed dependency? Use it.
5. Solvable in one line or one config value? Do that.
6. Only then write the minimum implementation that meets the requirement.
Never "lazy" on: authentication/authorization, input validation at trust boundaries, ownership checks, audit-worthy mutations, accessibility.

## Scope discipline
- Build only what the current phase lists. Anything else goes to `BACKLOG` section in `PROGRESS.md` as one line. Do not build it.
- No new framework migrations. No new abstraction layer for a function with one caller. No feature flags for hypothetical futures.
- Allowed new top-level docs: `README.md`, `PROGRESS.md`, `.env.example`. Do NOT create reports, handoff docs, analysis docs, or summaries.

## Safety
- Never print, log, or commit secrets. Secrets only via env vars; `.env` stays gitignored; `.env.example` has placeholders only.
- Before any destructive command (delete, `git reset --hard`, `git clean`, force push, DB drop, mass rename) stop and ask. Use `git mv` for moves so history is preserved.
- Windows + PowerShell is the dev OS: scripts in `package.json` must be cross-platform (no bash-only or PowerShell-only syntax; use `cross-env`, `rimraf`, Node scripts).
- Do not run `npm audit fix --force`. Report findings; change versions only when the phase says so.

## Evidence rule (the most important rule)
"Done" is a claim, not evidence. A phase is `VERIFIED` only when ALL of these are shown in the chat:
1. Raw command output, verbatim (typecheck/lint/test/build). Summaries do not count. If truncating, mark `[...N lines omitted]` and keep the exit code.
2. Raw runtime proof for the thing claimed (curl output with status codes, Playwright test output, container logs).
3. Ladder check: list of files added/removed and every new dependency with a one-line justification.
Missing any one of the three means status is `UNVERIFIED`. Never write "should work", "likely passes", or "tests pass" without the output.
If a command fails, report the failure verbatim. Do not weaken tests, delete assertions, or skip tests to get green.

## Working protocol
- Start of every session: read `PROGRESS.md`. End of every phase: update `PROGRESS.md` (phase status, decisions, open items, BACKLOG) and stop. Do not start the next phase without the user typing `LANJUT PHASE N`.
- Tests first for anything touching auth, user data ownership, or data mutation (write failing test, then implement).
- Prefer editing existing files over creating new ones. Prefer mature libraries over hand-rolled security code.

## Additions (v2)
- A backend that is in-memory, has no persistence, no auth, and no tests is a STUB, not an asset. Stubs are moved to `examples/` and never wired into the product.
- Tests may never be weakened to get green: no deleted assertions, no loosened matchers, no `test.skip`, no raised timeouts to hide slowness, no `retries > 0` locally. A changed assertion needs a mutation check (break the behavior, show the test goes red, revert, show green).
- `PROGRESS.md` is the only state file. Update it at the end of each phase with: status, decisions, open items, BACKLOG (one line each).

