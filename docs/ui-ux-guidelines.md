# UI/UX and Gameplay Guidelines

This document defines the visual language, component patterns, gameplay presentation, and do's/don'ts for the Triple Triad web app. Use it for all features and platforms so the experience stays consistent.

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
- **Text scale**: Base font size uses `calc(1rem * var(--text-scale))` on `.app`. The `--text-scale` variable (default 1) is set from Settings and persisted to localStorage.

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

The app has two main views:

- **Title screen**: Full-screen with buttons: Continue, New Game, How to Play, 2P Duel, Settings.
- **Game view**: Top nav bar with tabs: Home | World | Collection | Quests | Guide. Nav is hidden during battles and 2P duels.

**Structure**: `<nav aria-label="Main navigation">` with tab buttons. Active tab uses `aria-current="page"`.
**Skip link**: First focusable element is "Skip to main content" linking to `#main-content`.

The game view uses a flex column layout (`.app-game`):
- Nav bar: `flex-shrink: 0` (always visible at top)
- Main content: `flex: 1; overflow-y: auto` (scrollable, never overlaps nav)

### 2.2 Cards (CardView)

- **Layout**: Card image with optional rank number overlay. Card images are at `/cards/{card.id}.png`.
- **Rank overlay**: `.card-ranks` with `.rank.top`, `.rank.right`, `.rank.bottom`, `.rank.left`. Controlled by `--card-overlay-scale` (0 = hidden, default 1). Users toggle this in Settings.
- **States**: Default, hover (subtle shadow/border), selected (accent ring), compact (smaller for hand/deck slots).
- **Interaction**: When selectable, use `role="button"`, `tabIndex` 0 or -1 depending on context.

**Do:** Respect `--card-overlay-scale` and `--card-overlay-display` CSS variables. Keep aspect ratio consistent.
**Don't:** Hardcode overlay visibility — it's user-configurable.

### 2.3 Game board

- **Grid**: 3x3; use CSS Grid with `repeat(3, 1fr)`. Max width ~320px; full width on small viewports.
- **Cells**: Each cell is a button when playable (`tabIndex={0}`), otherwise `tabIndex={-1}`. Use `aria-label` to describe position and state.
- **Board**: `role="grid"`, `aria-label="Game board, 3 by 3 grid"`. Cards use `object-fit: contain` (no cropping).
- **Placed cards**: Show card with owner tint (`owner-0` / `owner-1`).

### 2.4 Settings

The Settings screen (`SettingsScreen.tsx`) provides:
- **Text scale** slider (0.7–1.5): Sets `--text-scale` CSS variable. Preview shows heading, body, and UI tag text.
- **Card overlay scale** slider (0–1.5): Sets `--card-overlay-scale` and `--card-overlay-display`. Preview shows a sample card.
- **Reset to Defaults** button.
- Settings are persisted to `localStorage` under key `tripletriad-settings` and applied on mount via `applySettingsToDOM()`.

### 2.5 Tutorial popups

- Triggered before a duel when encountering new rules.
- Modal overlay with page carousel (icon, heading, body text, dot indicators).
- "Next" / "Got it!" buttons; no overlay dismiss (prevents accidental closure on mobile).
- Seen tutorials tracked in `worldState.seenTutorials[]`.
- All tutorials reviewable from the Guide tab (`TutorialsMenu.tsx`).

### 2.6 Forms and buttons

- **Inputs**: Associated with a visible or visually hidden `<label>`; use `id`/`htmlFor`. Focus ring via `:focus-visible`.
- **Buttons**: Explicit `type="button"` where not submit. Disabled state: reduce opacity or cursor; keep accessible.
- **Sections**: Use `<section>` with `aria-label` or `aria-labelledby` for form blocks.

### 2.7 Status and feedback

- **Game status**: "Your turn" / "Opponent's turn" / "You win!" / "You lose." / "Draw." Use `role="status"` and `aria-live="polite"`.
- **Hints**: Short instructional text with `--text-muted`.
- **Errors**: Use `--error` and a dedicated `.error` class.

---

## 3. Accessibility and responsiveness

### 3.1 Focus and keyboard

- **Visible focus**: All interactive elements use `:focus-visible` with 2px `--border-focus` outline and 2px offset.
- **Tab order**: Skip link → nav → main content → in-page controls.
- **Activation**: Buttons support Enter and Space; call `e.preventDefault()` on keydown to avoid scroll or double fire.

### 3.2 Labels and landmarks

- **Landmarks**: One `<main id="main-content">`; nav with `aria-label`; sections with `aria-label` or `aria-labelledby` where useful.
- **Visually hidden text**: Use the `.visually-hidden` class for labels that are only for screen readers.

### 3.3 Viewport and touch

- **Breakpoint**: At `max-width: 480px`, reduce padding, allow board and hand to use full width, keep touch targets at least 44x44px.
- **Safe areas**: Edge-to-edge display on Android; CSS variables `--sat`, `--sab`, `--sal`, `--sar` injected by `MainActivity.java`. All layouts must respect these.

### 3.4 Android back button

The system back button navigates within the app:
- Settings/HowTo → title screen
- Game tabs → world tab
- Battle → cancel to world
- World → title screen
- Title → minimize app

---

## 4. Do's and don'ts for new features

### Do

- Use CSS variables from `:root` for all colors, transitions, and font.
- Respect `--text-scale` and `--card-overlay-scale` user preferences.
- Add safe area padding (`var(--sat)`, `var(--app-pt)`) to any new full-page screens.
- Give every control an accessible name and visible focus style.
- Use semantic HTML and ARIA where it improves clarity.
- Keep card and board layout consistent with existing patterns.

### Don't

- Don't hardcode colors or fonts; use the design tokens.
- Don't remove or weaken focus indicators.
- Don't add interactive elements without keyboard and screen-reader support.
- Don't introduce a second visual style; extend the same theme.
- Don't use low-contrast text; keep `--text` and `--text-muted` on `--bg`/`--surface` readable.
- Don't use `position: sticky` for nav; use the flex layout pattern in `.app-game`.

---

## 5. Reference

- **Theme and components**: `frontend/src/App.css`
- **Card component**: `frontend/src/components/CardView.tsx`
- **Board and hand**: `frontend/src/components/GameBoard.tsx`
- **App shell and nav**: `frontend/src/App.tsx`
- **Settings**: `frontend/src/components/SettingsScreen.tsx`
- **Tutorials**: `frontend/src/data/tutorials.ts`, `frontend/src/components/TutorialPopup.tsx`
- **Battle screen**: `frontend/src/components/BattleScreen.tsx`
- **World mode**: `frontend/src/components/world/WorldMode.tsx`
- **Game rules**: `docs/game-mechanics.md`, `docs/rules.md`
