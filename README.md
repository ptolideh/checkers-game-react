# Checkers

A Checkers game built with React, TypeScript, Tailwind, DnD Kit and Vite using a modern design
approach. It plays on both desktop and mobile devices. It supports two players or a quick match
against a simple computer opponent. The game keeps track of move history and game stats for each
player and incorporates that design into the visual feedback players see when their turn ends.

## Getting Started

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open http://localhost:3000 to start playing.

Type‑check, lint, and format:

```bash
npm run check-types
npm run lint
npm run format
```

Run tests:

```bash
npm run test
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run serve
```

## Project Structure

```
checkers/
├── index.html                 # App HTML entry
├── src/
│   ├── main.tsx               # Client entry
│   ├── index.css              # Global Base styles
│   ├── components/            # UI components
│   │
│   ├── game-logic/            # Pure game logic (UI‑agnostic)
│   │   ├── engine.ts          # Legal moves, captures, winners
│   │   ├── state.actions.ts   # Action creators + action unions
│   │   ├── state.reducer.ts   # Game reducer + init state
│   │   ├── rules.ts           # Board size, movement, constants
│   │   ├── types.ts           # Shared types
│   │   └── utils.ts           # Generic helpers
│   ├── hooks/
│   │   └── useComputerTurn.ts # Connects AI to render lifecycle
│   ├── lib/
│   │   └── utils.ts           # generic global helpers
│   └── __tests__/             # Vitest tests
├
├── public/
│   ├── favicon.svg
│   └── _redirects             # Netlify redirects
├── eslint.config.js           # Configs...
├── prettier.config.cjs
├── tsconfig.json
└── vite.config.ts
```

Path alias: import from `@` rather than long relative paths, e.g.
`import { App } from '@/components/App'`.

## Frontend System Design

- Components as much as possible only render state and fire actions.
- A single `useReducer` manages `GameState` (current player, board, selection, forced capture key,
  stats, winner).

- The reducer in `@/game-logic/state.reducer.ts` handles most important game actions: piece
  selection, move application, multi‑jumps, restarts, and mode changes.

- Reducer actions defined in `@/game-logic/state.actions.ts` are explicit and faily small
  (APPLY_MOVE is a bit more complex). But reducer pattern keeps UI updates predictable since this is
  fairly complex application.

- States that can be derived from the current state are computed in functions provided in
  `@/game-logic/engine.ts`. This also avoids mixing UI and rules. `engine.ts` computes legal
  steps/captures, resolves move results, tracks chains, and evaluates winners.

- Rules live in `rules.ts` (board size, offsets, colors, modes) and are used by engine and helpers.

- A simple AI picks a random legal move, prioritizing captures. `useComputerTurn` schedules
  selection and applies the move after a short delay to simulate a more natural game feel.

- While behaviour has been delegated to the engine and hooks, game UI is rendered using `BoardView`
  which composes `BoardSquare` and `DraggablePiece`.

- The game works with clicks or drag‑and‑drop.

- Mode selection and game stats are rendered using `GameModeSelection` and `GameStats`.

- Tests can be found in `__tests__/` built using Vitest and React Testing Library.

---

## Trade‑offs and Future Considerations

**Testing**

- Project in its current state has a good coverage for game-engine functions and utils. Same with
  AI-player functions.
- However, more tests are needed for UI components and state management (specially at reducer level)
- The project could also benefit from integration tests given the procedural nature of the game.
- Storybook is also a good option if we want to create a more reusable UI library.

**Extensibility**

- I went with reducer pattern for managing game state. Also sepearated game engine from state for
  better testability and extensibility. This approach makes it a bit easier to understand and track
  changes over time and also allows extending the game further in the future using features such as
  Undo/redo, move history, and timers.
- The game engine also allows us to derive various interactivity states from the current state,
  which makes the code more versatile.
- That said, we're not using any context in this app. So perhaps it's worthwhile to consider how we
  might share game-state across multiple components if prop-drilling becomes a problem.

**AI depth**

- The AI is fast but also simple and random. This was intentional due to the time constraints. But
  For better solo play, we should consider more sophisticated algorithms that incorporate
  heuristics, iterative deepening, and pruning.

**Persistence**

- State is in‑memory only right now. Adding db storate, url state, or even localStorage would be
  much better so user can resume plays.

**Accessibility**

- Drag‑and‑drop is pointer‑first. We should add keyboard controls and ARIA attributes for move
  feedback and meet a11y standards.
- We're using DIVs instead of buttons for clickable squares.

**Animations**

- Movements fell snappy there are UI transitions available when player makes a selction or player
  turn ends. But more well-thoughout piece relocation transition and capture chains could make the
  actions more clear to the users and make the experience more engaging.

**Testing**

- Engine logic is ideal for unit tests. Expand coverage for multi‑jump chains, forced captures, and
  promotion edge cases.

**Routing and layouts**

- The app is a single screen. If it grows (for example, adding stats page or settings), we should
  consider adding router.

**Compponents and Styling**

- Styling is handled by Tailwind which brings some sense of consistency to the UI. But we should
  consider adding themeing and more perhaps variant driven styles instead of inline styling
  everything and using ternaries.

## Environment

This app doesn't require environment variables

## License

MIT, or your preferred license. Add a `LICENSE` file if needed.
