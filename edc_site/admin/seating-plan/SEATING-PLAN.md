# Seating Plan — Technical Documentation

> **Path:** `/admin/seating-plan/`
> **Purpose:** Event guest seating management tool for EDC administration.
> **Auth:** Shared CMS credentials (validated via `api/cms-save.php`).
> **Storage:** Browser `localStorage` (key `edc.seatingPlans.v1`). No server-side persistence.

---

## Architecture Overview

```
admin/seating-plan/
├── index.html              ← Single-page application shell
├── seating-plan.css        ← All component styles + responsive breakpoints
└── js/
    ├── types.js            ← JSDoc typedefs + localStorage key constant
    ├── data-store.js       ← CRUD wrapper around localStorage
    ├── seating-core.js     ← Pure business logic (no DOM)
    ├── import-export.js    ← File parsing (CSV/XLSX/TXT) + export helpers
    └── seating-plan.js     ← Main UI controller (event binding, rendering)
```

Scripts are loaded with `defer` in dependency order:
`types.js → data-store.js → import-export.js → seating-core.js → seating-plan.js`

External dependency: **SheetJS (xlsx@0.18.5)** via CDN — used for Excel import/export.

---

## Data Types

### SeatingGuest
| Field      | Type    | Required | Description                    |
|------------|---------|----------|--------------------------------|
| id         | string  | ✓        | Unique ID (`guest_<ts>_<rand>`) |
| firstName  | string  | ✓        | First name                     |
| lastName   | string  | ✓        | Last name                      |
| fullName   | string  | ✓        | Display name (auto-derived)    |
| country    | string  |          | Country code or name           |
| company    | string  |          | Company / organization         |
| position   | string  |          | Job title                      |
| group      | string  |          | Grouping label                 |
| language   | string  |          | Preferred language             |
| vip        | boolean |          | VIP flag                       |
| notes      | string  |          | Free-text notes                |

### SeatingTable
| Field   | Type   | Required | Description                       |
|---------|--------|----------|-----------------------------------|
| id      | string | ✓        | Unique ID (`table_<ts>_<rand>`)   |
| number  | number | ✓        | Display number (1-based)          |
| label   | string |          | Optional custom name              |
| seats   | number | ✓        | Number of chairs around the table |
| x       | number | ✓        | Canvas X position (px)            |
| y       | number | ✓        | Canvas Y position (px)            |
| notes   | string |          | Free-text notes                   |

### SeatingAssignment
| Field      | Type   | Required | Description               |
|------------|--------|----------|---------------------------|
| guestId    | string | ✓        | References `SeatingGuest.id` |
| tableId    | string | ✓        | References `SeatingTable.id` |
| seatNumber | number | ✓        | 1-based seat index         |

### SeatingPlan (root object)
| Field       | Type             | Description                           |
|-------------|------------------|---------------------------------------|
| id          | string           | Unique plan ID                        |
| name        | string           | Plan display name                     |
| version     | number           | Auto-incremented on each change       |
| updatedAt   | string (ISO)     | Last modification timestamp           |
| event       | object           | Event config (name, date, location, defaultSeats, notes) |
| tables      | SeatingTable[]   | All tables                            |
| guests      | SeatingGuest[]   | All guests (assigned + unassigned)    |
| assignments | SeatingAssignment[] | Guest-to-seat mappings             |
| viewport    | object           | Canvas state `{scale, x, y}`         |

---

## Module Reference

### types.js
Declares JSDoc `@typedef` comments for all data types above. Exports a single constant:
- `window.SeatingTypes.storageKey` → `'edc.seatingPlans.v1'`

### data-store.js — `window.SeatingStore`
| Function        | Signature                  | Description                          |
|-----------------|---------------------------|--------------------------------------|
| `loadPlans()`   | `() → SeatingPlan[]`      | Read all plans from localStorage     |
| `savePlans()`   | `(plans) → void`          | Overwrite all plans in localStorage  |
| `upsertPlan()`  | `(plan) → SeatingPlan[]`  | Insert or update a single plan       |
| `deletePlan()`  | `(id) → void`             | Remove plan by ID                    |

### seating-core.js — `window.SeatingCore`
Pure functions — no side effects, no DOM access.

| Function           | Description                                                  |
|--------------------|--------------------------------------------------------------|
| `uid(prefix)`      | Generate unique ID string                                    |
| `clean(s)`         | Trim + collapse whitespace                                   |
| `guestName(g)`     | Return display name (fullName or firstName+lastName)         |
| `normalizeGuest(row)` | Convert raw import row → `SeatingGuest` object            |
| `createPlan(name)` | Create empty plan with defaults                              |
| `createTable(n, seats, x, y)` | Create new table object                          |
| `assignGuest(plan, guestId, tableId, seatNumber)` | Assign guest to seat (removes previous assignment) |
| `swapOrAssign(plan, guestId, tableId, seatNumber)` | Swap two guests or assign to empty seat |
| `unassignGuest(plan, guestId)` | Remove guest from their seat                    |
| `availableSeats(plan)` | Count total empty seats                                  |
| `stats(plan)`      | Compute statistics (total, assigned, unassigned, fill %)     |
| `duplicateGuests(guests)` | Find guests with duplicate names                      |
| `validate(plan)`   | Return array of warning strings                              |
| `touch(plan)`      | Update timestamp + increment version                         |

> **Immutability pattern:** `assignGuest`, `swapOrAssign`, `unassignGuest` all use `structuredClone(plan)` — they return a new plan object without mutating the original.

### import-export.js — `window.SeatingImportExport`
| Function             | Description                                              |
|----------------------|----------------------------------------------------------|
| `parseDelimited(text)` | Parse CSV/semicolon-delimited text → `{headers, rows}` |
| `parseTxt(text)`     | Parse plain text (one name per line) → `{headers, rows}` |
| `analyzeRows(rows, existing)` | Normalize rows, detect duplicates + invalid entries |
| `guestsByTable(plan)` | Group assignments by table (for export)                 |
| `toCsv(plan)`        | Generate CSV string of all guests with seat assignments  |
| `normalizeHeader(h)` | Map column header to canonical field name                |
| `normalizeRow(row)`  | Normalize all keys in a row object                       |

**Header aliases** (case-insensitive): `Full Name`, `Name`, `Guest`, `First Name`, `Last Name`, `Surname`, `Country`, `Company`, `Position`, `Title`, `Group`, `Table`, `Language`, `VIP`, `Notes`.

### seating-plan.js — Main UI Controller
Self-executing IIFE. Not exported. Manages:

- **State:** `plan` (current plan), `history[]` (undo stack, max 20), `future[]` (redo stack), `dirty` flag, `selectedGuestId` (for tap-to-assign flow).
- **Rendering:** `render()` → calls `renderPlans()`, `renderStats()`, `renderWarnings()`, `renderGuests()`, `renderCanvas()`, `renderEvent()`.
- **Auto-save:** 700ms debounce after any state change.

---

## User Flows

### Authentication
1. User enters CMS credentials in `#authForm`.
2. `POST /api/cms-save.php` with `action=validate`, `username`, `password`.
3. On success: hide `#authPanel`, show `#appPanel`.

### Guest Assignment (Desktop)
Two methods:
1. **Drag & Drop:** Drag guest from `#guestList` → drop onto a `.chair` element.
2. **Details Panel:** Click empty chair → details panel shows dropdown of unassigned guests → select + click "Assign to this seat".

### Guest Assignment (Mobile)
On screens ≤1050px, the workspace splits into 3 tabs: **Guests**, **Plan**, **Settings**.

**Tap-to-assign flow:**
1. Tap guest on list → `selectedGuestId` is set, guest highlighted, "Tap, then tap a chair" hint shown.
2. App auto-switches to "Plan" tab.
3. Floating bar shows "Assigning: [Name] — Tap a chair".
4. Tap empty chair → guest is assigned.
5. App auto-returns to "Guests" tab if unassigned guests remain.

### Canvas Interaction
- **Table drag:** Pointer events (`pointerdown` → `pointermove` → `pointerup`) with `setPointerCapture` — works on both mouse and touch.
- **Zoom:** Buttons (+/−/Fit) modify `plan.viewport.scale`.
- **Canvas transform:** CSS `translate()` + `scale()` on `#canvas`.

### Import
Supported formats: `.csv`, `.xlsx`, `.xls`, `.txt`
1. Select file → automatic parsing + preview (count, columns, duplicates, invalid).
2. Click "Confirm Import" → unique guests are added (duplicates by name are skipped).

### Export
- **CSV:** Direct download via Blob URL.
- **XLSX:** Built with SheetJS.
- **PDF/Print:** `window.print()` with `@media print` styles (A3 landscape).

---

## Undo/Redo System
- Every state change calls `push(nextPlan)`:
  - Current plan is cloned to `history[]` (max 20 entries).
  - `future[]` is cleared.
  - New plan becomes current.
- **Undo:** Pop from `history`, push current to `future`.
- **Redo:** Pop from `future`, push current to `history`.

---

## Responsive Breakpoints

| Breakpoint          | Behavior                                                    |
|---------------------|-------------------------------------------------------------|
| > 1050px            | 3-column layout: Guests | Canvas | Settings                 |
| ≤ 1050px            | Tab navigation: Guests / Plan / Settings (one visible)      |
| 900–1180px landscape | Fullscreen plan view when "Plan" tab active (header hidden) |
| Print               | Canvas only, scaled 72%, A3 landscape                       |

---

## localStorage Schema
Key: `edc.seatingPlans.v1`
Value: JSON array of `SeatingPlan` objects.

> **No server-side persistence.** Data is stored only in the browser's localStorage. Clearing browser data will delete all seating plans.

---

## Known Limitations
- No multi-user collaboration (localStorage is single-browser).
- No server-side backup of seating plans.
- Maximum plan complexity limited by localStorage quota (~5–10 MB).
- Export to "PDF" is actually browser print dialog, not true PDF generation.
