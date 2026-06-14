# FrankieOne — Address Onboarding (FE)

Vite + React + TypeScript + Tailwind v4 + shadcn/ui

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3001
go to http://localhost:3001/onboarding/address
```

## Commands

| Command            | Purpose                  |
|--------------------|--------------------------|
| `pnpm dev`         | Dev server               |
| `pnpm build`       | Production build         |
| `pnpm lint`        | ESLint                   |
| `pnpm format`      | Prettier                 |
| `pnpm type-check`  | TypeScript --noEmit      |
| `pnpm test`        | Vitest (watch)           |
| `pnpm test:ci`     | Vitest (single run)      |
| `pnpm test:e2e`    | Playwright               |
| `pnpm test:e2e:ui` | Playwright UI mode       |

## Architecture

See [CLAUDE.md](./CLAUDE.md) for the full contract.

## Design decisions & trade-offs

A quick note on how I built this and why. The best choice here really depends on what you care about most, so I'll lay out my thinking.

### Design decisions

1. **The backend metadata controls the whole form.**
  The list of countries comes from `GET /countries`, and the fields, options, and
  validation rules for each country come from `GET /countries/:code/fields`. Because of
  this, when we want to add a new country or change an existing one, we only need to
  change the backend. We do not need to change the frontend code or deploy it again.

2. **The Zod schema is created at runtime from the metadata.**
  A schema builder takes the metadata rules, such as `required`, `length`, `numeric`,
  `pattern`, and `maxLength`, and turns them into the RHF resolver. This means we do not
  write a separate schema for each country by hand. In addition, the strict validator on
  the backend is still the final check that decides if the data is accepted.

3. **The renderer does not depend on the country.**
  `DynamicFieldRenderer` and `AddressConfirmation` draw the fields in a general way from
  the metadata, and they follow the order that the backend gives. As a result, there are
  no `if (country === ...)` branches in the code.

4. **The labels have a safe fallback.**
  Each label is found by its field key. First the code looks for a local translation,
  then it uses the English label from the backend, and finally it uses a humanized key.
  Translations are optional, so a missing translation is something the form expects and
  handles, and the user never sees a raw key on the screen.

5. **The state is divided by what it is.**
  We use Query for server data, such as the metadata and the addresses, Zustand for the
  UI, and RHF for the forms. The metadata is also cached, and it is refreshed when the
  `version` field in the payload changes.

6. **Every feature stays inside its own box.**
  A feature is shared only through its `index.ts` file, and all network calls are kept
  inside the `api/` folder.

7. **Autocomplete is the fast way, but not the only way.**
  Manual entry always works, even when Places is not available. The logic that maps a
  place to the fields stays on the frontend because it is country-specific logic and not
  data, and it is keyed against the metadata field keys.

### Trade-offs

1. **The form now needs to fetch the metadata first.**
  It can no longer render straight away from local data, so it has to show clear loading,
  error, and retry states. The cost is that there is more asynchronous code to manage, but
  the benefit is that the country data can never drift out of sync.

2. **The general rendering is harder to read.**
  It is more difficult to follow than fields that are written directly in the code.
  However, this is the reason why changes to a country can be made on the backend only.

3. **It is an SPA and not Next.js.**
  This is lighter for a small form that does not need SEO.

4. **The tests were planned around the time limit.**
  They cover the parts that are most likely to break rather than every case.

5. **Zustand was chosen instead of Context.**
  It keeps the re-renders smaller, it reads clearly, and it was already used in the
  project.
