# GEARBOX Clinical Trial Matching POC (Frontend)

## Overview
This project is a frontend proof of concept (POC) for searching and browsing clinical trial matching criteria. It is built with React and Tailwind CSS and focuses on performance, accessibility, and clean UI design when working with large datasets.

The application generates a deterministic mock dataset of 5,000 clinical criteria items, provides a debounced and abortable search experience, and renders results using list virtualization for smooth scrolling and low memory overhead.

**Deployed POC:** https://gearboc-poc-gsoc-2026.vercel.app/

## Features

- **Strictly typed data model** using a discriminated union for clinical criteria.
- **Deterministic mock dataset generator** (5,000 items) to reliably reproduce UI and performance behavior.
- **Debounced and abortable search hook** to avoid unnecessary work and to cancel stale requests.
- **Virtualized results list** using `react-window` to efficiently render large result sets.
- **Conditional row states** (Adult vs Pediatric context conflicts) with disabled styling and an overlay state.
- **Centered “INCOMPATIBLE” overlay** implemented with absolute positioning and flex centering.
- **Skeleton loading UI** for better perceived performance.
- **Accessibility-focused input** behavior (combobox semantics and live region updates).

## Technical Implementation

### Core Technologies

- React + TypeScript
- Tailwind CSS
- Vite (build tooling)
- `react-window` (virtualized list rendering)
- `lodash/debounce` (input debounce)

### Data Model
Clinical criteria are represented with a strictly typed discriminated union (`kind` as the discriminant). The model is located in:

- `clinicalCriteria.ts`

### Search
Search is implemented as a client-side filtering flow with a mocked asynchronous API and cancellation support.

- `useSearchCriteria.ts`

Key behaviors:

- Debounces the user input to reduce re-filtering.
- Uses `AbortController` to cancel in-flight searches when the query changes.
- Exposes a small, strongly typed state surface: results, loading, error.

### Virtualized List
The criteria list is rendered with virtualization to keep UI responsive even with thousands of items.

- `CriteriaList.tsx`

Each row:

- Uses conditional styles based on the `ClinicalCriteria.kind`.
- Applies a conflict state when the active search context is incompatible with the criterion (Adult vs Pediatric).
- Supports a visual overlay state for incompatibility.

## Key Design Decisions

- **Virtualization as a first-class requirement:** Rendering only visible rows keeps React rendering cost predictable and prevents UI stalls.
- **Discriminated unions for correctness:** The `ClinicalCriteria` union enables exhaustive checks and reduces runtime branching errors.
- **Separation of concerns:**
  - Data model and mock generation are isolated from UI.
  - Search logic is encapsulated in a reusable hook.
  - Rendering is split into focused components.
- **Visual state isolation:** Disabled styling (opacity/grayscale) is applied to the card while the overlay remains legible and centered.

## Challenges and Solutions

### Centering the “INCOMPATIBLE” Overlay
**Problem:** The overlay label drifted from center due to layout constraints, padding, and attempts to compensate with hard-coded offsets.

**Solution:** Use a full-card overlay with stable centering utilities:

- Overlay container covers the card using `absolute` positioning with `inset-0`.
- The overlay content is centered using `flex`, `items-center`, and `justify-center`.
- The card uses a relative positioning context (`relative`).

### Layout and Paint Issues in Virtualized Rows
**Problem:** Certain effects (e.g., backdrop blur, full-opacity overlays, overflow clipping) can cause rendering artifacts or unexpected behavior when used inside virtualized rows.

**Solution:** Prefer simple, predictable overlay styles (semi-transparent backgrounds, no layout-affecting transforms) and keep overlay elements `pointer-events-none` where appropriate.

## Installation and Setup

### Prerequisites

- Node.js (LTS recommended)
- npm

### Install

```bash
cd /Users/khushboo/Desktop/a/demoProjectG
npm install
```

### Run locally

```bash
npm run dev
```

### Production build

```bash
npm run build
npm run preview
```

## Usage

- Type into the search box to filter the dataset.
- Results update after a short debounce.
- Conflicting criteria (Adult context vs Pediatric criteria) render as visually disabled and show an **INCOMPATIBLE** overlay.

## Architecture / Component Structure

High-level structure:

- `src/main.tsx`
  - Application entry point.
- `src/App.tsx`
  - Creates the dataset and hosts the main UI.
- `SearchCriteriaBox.tsx`
  - Search input with accessibility semantics and live announcements.
  - Uses `useSearchCriteria` and renders `CriteriaList`.
- `CriteriaList.tsx`
  - Virtualized list rendering (`react-window`).
  - Row renderer handles per-kind styling and incompatible state overlay.
- `clinicalCriteria.ts`
  - Data model and deterministic mock dataset generator.
- `useSearchCriteria.ts`
  - Debounced + abortable search hook.

## Performance Considerations

- **Virtualization (`react-window`):** Only visible rows are rendered, keeping reconciliation and DOM size small.
- **Debounced search:** Limits filtering/requests while the user is typing.
- **Cancellation:** Prevents stale responses from overwriting newer search results and reduces wasted work.
- **Skeleton loading:** Improves perceived responsiveness and communicates loading state.

## Future Improvements

- Add an explicit `ageGroup: 'Adult' | 'Pediatric'` field to the base criteria model instead of relying on category fallback.
- Make the search context user-selectable via a UI toggle (Adult/Pediatric) and persist the selection.
- Add keyboard navigation for results (active descendant pattern) and richer combobox behaviors.
- Add tests for search cancellation, row rendering, and conflict state behavior.
- Expand filtering semantics (tokenization, field-specific filters, highlighting).

## Deployment

### Vercel
This project is deployed as a static Vite build on Vercel.

Build settings:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`

Live deployment:

- https://gearboc-poc-gsoc-2026.vercel.app/

### Notes on Base Path
For sub-path hosting (for example, GitHub Pages), the Vite `base` path can be set using an environment variable:

```bash
VITE_BASE=/demoProjectG/ npm run build
```

For Vercel deployments, the default base (`/`) is typically sufficient.
