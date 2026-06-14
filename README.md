# FrankieOne — Address Onboarding (FE)

Vite + React + TypeScript + Tailwind v4 + shadcn/ui

## Quick start

```bash
pnpm install
pnpm dev          # http://localhost:3001
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

## Step by Step Instructions
1. Initiate the repo by prompting to AI:
skills: senior-fe-architect
prompt: initiate Vite, React, Typescript, Tailwind v4, shadcn/ui, unit test using vitest, e2e test using playwright, and the localization using i18next.

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