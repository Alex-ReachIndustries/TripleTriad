# UI/UX and Gameplay Guidelines

This document defines the visual language, component patterns, gameplay presentation, and do's/don'ts for the Triple Triad web app. Use it for single-player world mode, new features, and future platforms (e.g. Android) so the experience stays consistent.

---

## 1. Visual language

### 1.1 Color palette

All UI colors are defined as CSS custom properties in `frontend/src/App.css` (`:root`). **Use these variables** instead of hardcoding hex/rgb values.

| Variable | Purpose | Example use |
|----------|---------|-------------|
| `--bg` | Page background | `.app` |
| `--surface` | Cards, panels, board | `.game-board`, `.card-view` container |
| `--surface-alt` | Secondary surfaces | Nav buttons, board cells, card background |
| `--accent` | Primary accent (gold/amber) | Active nav, selected card border, focus ring |
| `--accent-dim` | Muted accent | Hover borders, element labels |
| `--text` | Primary text | Headings, body |
| `--text-muted` | Secondary text | Hints, level, empty states |
| `--border` | Default borders | Cards, cells, inputs |
| `--border-focus` | Focus ring | `:focus-visible` outline (same as `--accent`) |
| `--player-0` | Player 1 (you) | Board cards, score |
| `--player-1` | Player 2 / opponent | Board cards, score |
| `--success` | Positive outcome | "You win!" |
| `--error` | Error / negative | Error messages, "You lose." |

**Do:** Use `var(--variable-name)` in CSS.  
**Don't:** Introduce new magic hex codes in components or inline styles.

### 1.2 Typography

- **Font family**: `--font` is `'Outfit', system-ui, sans-serif`. Loaded via Google Fonts in `frontend/index.html`.
- **Weights**: 400 (body), 600 (buttons, labels), 700 (headings, card names).
- **Headings**: `h1` ~1.5rem, `h2` ~1.1rem; both use `--text` and `--font`.

**Do:** Apply `font-family: var(--font)` to new text elements.  
**Don't:** Add additional font families without updating this doc and the design system.

### 1.3 Motion and spacing

- **Transitions**: `--transition-fast` (150ms), `--transition-normal` (220ms). Use for hover, focus, and state changes.
- **Shadows**: `--card-shadow` (default), `--card-shadow-hover` (hover/selected).
- **Border radius**: 6px (buttons, inputs), 8px (empty slots, cells), 10px (cards), 12px (board).

**Do:** Use theme transitions on interactive elements.  
**Don't:** Use long or flashy animations that distract from gameplay.

---

## 2. Component patterns

### 2.1 Navigation

- **Structure**: `<nav aria-label="Main navigation">` with tab buttons. Active tab uses `aria-current="page"`.
- **Skip link**: First focusable element is "Skip to main content" linking to `#main-content`; main content is in `<main id="main-content">`.
- **Styling**: Buttons use `--surface-alt`, `--border`; active uses `--accent` border and text. Focus ring: `--border-focus`, 2px, offset 2px.

### 2.2 Cards (CardView)

- **Layout**: **Image and name only.** Card images already show stats (ranks, level, element) in the artwork; do not duplicate level, element, or rank numbers in the UI.
- **States**: Default, hover (subtle shadow/border), selected (accent ring), compact (smaller for hand/deck slots).
- **Images**: Served from `/cards/{card.id}.png`; `alt` set to card name. The image is the source of truth for stats during play.
- **Interaction**: When selectable, use `role="button"`, `tabIndex` 0 or -1 depending on context (e.g. only focusable when it’s your turn).

**Do:** Show only image + name in card UI. Keep aspect ratio consistent.  
**Don't:** Render level, element, or rank numbers on the card component; that information is in the card image.

### 2.3 Game board

- **Grid**: 3×3; use CSS Grid with `repeat(3, 1fr)`. Max width ~320px; full width on small viewports.
- **Cells**: Each cell is a button when playable (`tabIndex={0}`), otherwise `tabIndex={-1}`. Use `aria-label` to describe position and state (e.g. "Empty cell, row 1 column 1. Click to place card.").
- **Board**: `role="grid"`, `aria-label="Game board, 3 by 3 grid"`. Cell styling: `--surface-alt`, `--border`; playable hover: `--accent-dim` border.
- **Placed cards**: Show card image and name only; color border or tint by `owner-0` / `owner-1` (player colors). Stats are visible in the card image.

### 2.4 Forms and buttons

- **Inputs**: Associated with a visible or visually hidden `<label>`; use `id`/`htmlFor`. Focus ring via `:focus-visible`.
- **Buttons**: Explicit `type="button"` where not submit. Disabled state: reduce opacity or cursor; keep accessible.
- **Sections**: Use `<section>` with `aria-label` or `aria-labelledby` for form blocks (e.g. "Play options").

### 2.5 Status and feedback

- **Game status**: "Your turn" / "Opponent's turn" / "You win!" / "You lose." / "Draw." Use `role="status"` and `aria-live="polite"` so screen readers announce changes.
- **Hints**: Short instructional text (e.g. "Select a card, then click a cell.") with `--text-muted`.
- **Errors**: Use `--error` and a dedicated `.error` class; place near the relevant control.

### 2.6 How to play and gameplay clarity

- **In-app**: Provide a "How to Play" section (title screen, menu, or dedicated tab) that explains: 3×3 grid, five cards each, place one per turn, capture by higher adjacent rank, win by having more cards at the end. Link or summarize rules from `docs/game-mechanics.md`.
- **First-time flow**: New players should see a title screen or welcome, then choose Deck Builder / Play / World; do not land directly on Deck Builder by default.
- **World map**: Map markers must remain clickable; tooltips (e.g. region rules on hover) must not block pointer events (use `pointer-events: none` on overlay tooltips).

---

## 3. Accessibility and responsiveness

### 3.1 Focus and keyboard

- **Visible focus**: All interactive elements (buttons, links, inputs, cards, board cells) use `:focus-visible` with 2px `--border-focus` outline and 2px offset.
- **Tab order**: Skip link → nav → main content → in-page controls. Avoid tabbing into disabled actions (use `tabIndex={-1}` when not playable).
- **Activation**: Buttons and button-like elements support Enter and Space; call `e.preventDefault()` on keydown to avoid scroll or double fire.

**Do:** Ensure every interactive element has a visible focus style and an accessible name (aria-label or visible text).  
**Don't:** Use `outline: none` without replacing with a visible focus indicator.

### 3.2 Labels and landmarks

- **Landmarks**: One `<main id="main-content">`; nav with `aria-label`; sections with `aria-label` or `aria-labelledby` where useful.
- **Visually hidden text**: Use the `.visually-hidden` class for labels that are only for screen readers (e.g. "Room code to join").

### 3.3 Viewport and touch

- **Breakpoint**: At `max-width: 480px`, reduce padding, allow board and hand to use full width, keep touch targets at least 44×44px where possible.
- **Touch**: Hand card buttons and board cells have minimum touch-friendly size (e.g. `minHeight: 44`, `minWidth: 44` on hand cards).

**Do:** Test layout at 320px and 480px width; ensure no horizontal scroll.  
**Don't:** Rely on hover-only feedback for primary actions; support both pointer and keyboard.

---

## 4. Do's and don'ts for new features

### Do

- Use CSS variables from `:root` for all colors, transitions, and font.
- Add a skip link or preserve focus order when adding new top-level sections.
- Give every control an accessible name and visible focus style.
- Use semantic HTML (`main`, `nav`, `section`, `button`, `label`) and ARIA where it improves clarity (e.g. `aria-live` for status updates).
- Keep card and board layout consistent with existing patterns so Phase 4 (world map, shops, tournaments) feels like the same game.
- Document any new component or pattern in this file or in a linked doc.

### Don't

- Don't hardcode colors or fonts; use the design tokens.
- Don't remove or weaken focus indicators.
- Don't add interactive elements without keyboard and screen-reader support.
- Don't introduce a second visual style (e.g. a different palette or font) for single-player mode; extend the same theme.
- Don't use low-contrast text (e.g. gray on gray); keep `--text` and `--text-muted` on `--bg`/`--surface` readable.

---

## 5. Reference

- **Theme and components**: `frontend/src/App.css`
- **Card component**: `frontend/src/components/CardView.tsx` (image + name only)
- **Board and hand**: `frontend/src/components/GameBoard.tsx`
- **App shell and nav**: `frontend/src/App.tsx`
- **Game and rules**: `docs/game-mechanics.md`, `docs/rules.md`
- **World structure**: Prefer 8 regions (continents) with multiple areas (towns, dungeons) per region; within each area, multiple NPCs/locations (duels, shops, tournaments). Map markers should match in-game locations.
