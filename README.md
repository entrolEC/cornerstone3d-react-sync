# react-cornerstone3d

[한국어](./README.ko.md)

React bindings that expose [Cornerstone3D](https://www.cornerstonejs.org/)'s live engine state to React components — tearing-free, via `useSyncExternalStore`.

```tsx
function SliceIndicator() {
  const state = useViewportState('ct-axial');
  if (!state) return null; // viewport not enabled yet — a normal state, your call what to show
  return <span>slice {state.imageIdIndex + 1}</span>;
}
```

That one hook call replaces the ~25 lines of `useEffect` + `addEventListener` + `setState` plumbing every Cornerstone3D + React app writes per widget today.

<details>
<summary>See what you'd write without the hook</summary>

```tsx
function SliceIndicator() {
  const [state, setState] = useState<{ imageIdIndex: number }>();

  useEffect(() => {
    const enabled = getEnabledElementByViewportId('ct-axial');
    if (!enabled) return; // viewport not enabled yet? enabled later? — unhandled
    const { element } = enabled.viewport;

    const update = () => {
      const viewport = enabled.viewport as Types.IStackViewport;
      setState({ imageIdIndex: viewport.getCurrentImageIdIndex() });
    };
    update(); // patch the gap between first render and subscription — easy to forget

    element.addEventListener(Enums.Events.CAMERA_MODIFIED, update);
    element.addEventListener(Enums.Events.VOI_MODIFIED, update);
    element.addEventListener(Enums.Events.STACK_NEW_IMAGE, update);
    return () => {
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, update);
      element.removeEventListener(Enums.Events.VOI_MODIFIED, update);
      element.removeEventListener(Enums.Events.STACK_NEW_IMAGE, update);
    };
  }, []);

  if (!state) return null;
  return <span>slice {state.imageIdIndex + 1}</span>;
}
```

And after all 27 lines, you still have: the mount-order race (a viewport enabled later stays `undefined` forever), tearing under concurrent rendering, a re-render per event during drags (no batching) — repeated in every widget. The library solves these centrally.

</details>

## Why this exists

Cornerstone3D is deliberately framework-agnostic and ships no React bindings. So every React viewer hand-rolls the same event plumbing, and with it the same bug layer:

- **Missed updates** in the gap between first render and `useEffect` subscription
- **Tearing** under React 18+ concurrent rendering — two components showing two different slice numbers on one screen
- **Subscription leaks** under StrictMode double-mounting
- **Mount-order races** when UI mounts before a viewport is enabled
- **Infinite loops or deep-compare hacks**, because Cornerstone3D getters return a fresh object on every call — a naive `getSnapshot` never stabilizes (OHIF papers over this with per-hook `JSON.stringify` diffing)

This library solves that bug layer once, centrally. UI components become pure functions of engine state.

## Core design

Three decisions shape everything (full rationale in [`docs/adr/`](./docs/adr/)):

1. **The Engine is the single source of truth.** Reads flow Engine → event → immutable Snapshot → `useSyncExternalStore`. Writes stay plain Cornerstone3D API calls — their effects reach React by coming back as engine events. No parallel write API, no echo suppression, one read path regardless of who changed the state (your code or a mouse drag).

2. **The library owns no engine.** Hooks take only a `viewportId` and resolve it through Cornerstone3D's own global registry. No Provider, no singleton, no engine prop — your existing engine management stays untouched.

3. **Absence is a normal state.** A viewport that isn't enabled yet returns `undefined`; the value fills in automatically when it appears and empties when it's destroyed. What to render meanwhile is entirely your app's decision.

On top of that, the Snapshot layer guarantees **referential stability** (unchanged state ⇒ identical reference, no wasted renders, no loops) and **immutability** (deep-frozen — nothing you receive can drift under you).

## Status

v1 in progress. Sync only — the library's sole responsibility is state synchronization.

| Capability | Status |
|---|---|
| Stack viewport state (camera, VOI, slice index) | ✅ |
| Absent-viewport contract (`undefined`) | ✅ |
| Shared per-viewport Binding, StrictMode-safe | ✅ |
| Auto fill-in / empty-out on viewport enable/destroy | ✅ |
| Selectors (re-render only when *your* value changes) | 🔜 |
| rAF batching for interaction-rate events | 🔜 |
| Volume viewport state + per-kind types | 🔜 |
| Optional `<CornerstoneViewport />` component | 🔜 |
| Annotation / tool / segmentation state | roadmap (post-v1) |

**Requires:** React 18+, `@cornerstonejs/core` 5.x.

## Out of scope

App state management (use Zustand or whatever you like), write helpers, engine/viewport lifecycle beyond the optional component, rendering performance (that's the Engine's job).

## Development

```bash
npm test        # vitest, jsdom + fake CS3D registry
npm run build   # tsc → dist/
```

Tests observe only the public hook API — hook return values, referential stability, re-render counts. Domain vocabulary (Engine, Viewport State, Snapshot, Command, Binding) lives in [`CONTEXT.md`](./CONTEXT.md).
