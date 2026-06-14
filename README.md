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

1. **One config drives the whole form.** Each country is just a config entry: its fields, the order, the labels, the dropdown options, and which fields are needed. The form reads that config and draws itself. There are no `if (country === 'USA')` checks spread across the code. Adding a fourth country means adding one config and one schema, not changing how the form draws. This is the part I most wanted to get right, because it's what makes this more than a one-off demo.

2. **One Zod schema per country, used everywhere.** The rules (US 5-digit ZIP, AUS 4-digit postcode, IDN 5-digit, the state and province lists) live in one Zod schema per country. The form checks against it, and the same shape matches what the backend wants. So what the user types is what the API accepts, and there's no second copy of the rules to fall out of step.

3. **State is split by what it is.** Server data (saved addresses, country info) goes through TanStack Query, so I get caching, retries, and refresh for free. Screen state (the manual-edit toggle, the draft) sits in one small Zustand store. Form values stay in React Hook Form. Each tool does the one job it's good at, and server data never leaks into the screen store.

4. **Each feature stays in its own box.** Everything lives under `src/features/address-form/`, and the rest of the app only sees `index.ts`. Network calls only happen in the feature's `api/` folder or in `shared/api/`. This keeps changes contained and the feature easy to follow on its own.

5. **Autocomplete is the fast path, not the only path.** Google Places makes entry quick. But if the key is missing, the script won't load, or the user just wants to type, manual entry is always there. The form does not break when a third party is down.

6. **Two languages from day one (en + id).** Every label and message goes through the i18n layer, with English and Indonesian kept in step. Indonesia is one of the supported countries, so English-only felt wrong.

### Trade-offs

1. **The config approach is less direct to read.** A form built from config takes more effort to follow than three hand-written country forms. You have to read the config to see what shows up. For only three countries, hardcoding would be quicker to ship. I chose the config way on purpose, because the bonus ask in the brief was about supporting dynamic country data, and this answers it.

2. **The front end keeps its own copy of the country config.** I store the field config locally so the form shows up right away without waiting on the server, and sync with the backend when it's there. The cost is two places describing the same countries. The win is a form that works offline and feels instant. For a real product I'd treat the server as the source of truth and the local copy as a cache with a clear refresh plan.

3. **SPA, not Next.js.** This is Vite + React, so there's no server rendering. For a small onboarding form that talks to its own API, an SPA is lighter and simpler, and there's no SEO need. If this grew into a public marketing page I'd think again.

4. **Tests were sized to the time limit.** I covered the parts most likely to break: per-country validation, the country switch, the autocomplete-to-manual handoff, and one full run-through plus validation and a language switch. It's not full coverage. It's the coverage that buys the most confidence per hour.

5. **Zustand over Context.** For state this small, Context would work too and add nothing extra. I picked Zustand because it keeps re-renders tight, reads cleanly, and the project already uses it. On a tighter budget, Context would be fine as well.

## Step-by-Step AI Workflow
1. Initiate the repo by prompting to AI:
```
/senior-fe-architect, initiate Vite, React, Typescript, Tailwind v4, shadcn/ui, unit test using vitest, e2e test using playwright, and the localization using i18next.
```

2. Init [spec-kit](https://github.com/github/spec-kit)
3. Run in terminal agents:
```
  /speckit-constitution add principles for this project that will cater all the needs 
    in this reqs (for FE only):                                                                       
    Background                                                                          
                                                                                        
    AcmeCorp is building a new customer onboarding flow that collects user addresses.   
    Since addresses vary by country, the company needs a dynamic form system that       
    adapts based on the selected country.                                               
                                                                                        
    The design requirements are:                                                        
                                                                                        
    - Country dropdown at the top of the page.                                          
                                                                                        
    - Address input with Google Places autocomplete for quick entry.                    
                                                                                        
    - A “Manually Edit” button that switches the form into manual entry mode.           
                                                                                        
    - In manual mode, the form layout should dynamically adjust fields based on the     
    selected country.                                                                   
                                                                                        
    - Captured addresses must be saved to a backend service and stored in a database.   
                                                                                        
    Supported Countries & Field Layouts                                                 
                                                                                        
    1. United States (USA)                                                              
                                                                                        
    - Address Line 1 (required)                                                         
                                                                                        
    - Address Line 2 (optional)                                                         
                                                                                        
    - City (required)                                                                   
                                                                                        
    - State (dropdown: e.g., CA, NY, TX)                                                
                                                                                        
    - ZIP Code (5-digit, required)                                                      
                                                                                        
    2. Australia (AUS)                                                                  
                                                                                        
    - Address Line 1 (required)                                                         
                                                                                        
    - Address Line 2 (optional)                                                         
                                                                                        
    - Suburb (required)                                                                 
                                                                                        
    - State (dropdown: NSW, VIC, QLD, WA, SA, TAS, ACT, NT)                             
                                                                                        
    - Postcode (4-digit, required)                                                      
                                                                                        
    3. Indonesia (IDN)                                                                  
                                                                                        
    - Province (dropdown: e.g., Jawa Barat, Bali, Sumatra Utara)                        
                                                                                        
    - City / Regency (required)                                                         
                                                                                        
    - District (Kecamatan, required)                                                    
                                                                                        
    - Village (Kelurahan/Desa, optional)                                                
                                                                                        
    - Postal Code (required, 5-digit)                                                   
                                                                                        
    - Street Address (required)                                                         
                                                                                        
  Your Task (Timebox: 2 hours)                                                          
                                                                                        
  Build a small end-to-end application that demonstrates this feature.                  
                                                                                        
  Frontend Requirements                                                                 
                                                                                        
  - Dropdown to select country.                                                         
                                                                                        
  - Address input with Google Places autocomplete integration.                          
                                                                                        
  - “Manually Edit” button that dynamically renders address fields appropriate to the   
  country.                                                                              
                                                                                        
  - Validation for required fields (configurable per country).                          
                                                                                        
  - Clean, responsive UI.                                                               
                                                                                        
  Backend Requirements                                                                  
                                                                                        
  - API to receive and store address data.                                              
                                                                                        
  - Simple database schema for addresses (e.g., country, city, postal code, line1,      
  line2, etc.).                                                                         
                                                                                        
  - API to retrieve saved addresses (for demo purposes).                                
                                                                                        
  Notes                                                                                 
                                                                                        
  - Please use the React framework.                                                     
                                                                                        
  - For backend, use a lightweight framework (Express, Hono, Fastify).                  
                                                                                        
  - Database can be in-memory (SQLite) or mock if needed.                               
                                                                                        
  - Bonus: show how you would design the API to support dynamic country-specific        
  metadata (field names, validation rules).
```

4. Run in terminal agents:
```
/speckit-specify
```
5. Run in terminal agents:
```
/speckit-plan
```
6. Run in terminal agents:
```
/speckit-tasks
```
7. Run in terminal agents (for cross-check spec↔plan↔tasks):
```
/speckit-analyze
```
8. If something need to be added, simply rerun in terminal agents:
```
/speckit-tasks
```