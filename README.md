# react-cornerstone3d

[![npm](https://img.shields.io/npm/v/react-cornerstone3d?color=0151d9)](https://www.npmjs.com/package/react-cornerstone3d)
[![license](https://img.shields.io/npm/l/react-cornerstone3d?color=0151d9)](./LICENSE)
[![types](https://img.shields.io/badge/types-included-0151d9)](./src)

**[Live demo](https://entrolec.github.io/react-cornerstone3d/)** · [한국어](./README.ko.md)

Read [Cornerstone3D](https://www.cornerstonejs.org/)'s live viewport state from React components — tearing-free, through `useSyncExternalStore`.

```bash
npm install react-cornerstone3d
```

```tsx
const slice = useViewportState('ct-axial', (s) => s.sliceIndex);
```

That line is the whole subscription: no Provider, no engine prop, no event wiring, no cleanup.

![The same widget written two ways, reading one viewport](./docs/demo.gif)

> Both readouts are the **same widget written two ways**, reading the same viewport. The UI
> mounted before the image arrived, so the hand-rolled `useEffect` version never fills in — and
> never will. [**Run it yourself →**](https://entrolec.github.io/react-cornerstone3d/)

---

## Does it fit your project?

| | |
|---|---|
| **Reads** | camera · VOI window · slice index · slice count |
| **Viewport kinds** | Stack, Volume / MPR, and 3D (which reports no slices) |
| **Annotations, tools, segmentation** | **Not yet** — [roadmap](#status) |
| **Writing to the engine** | Not provided, by design — you keep calling Cornerstone3D |
| **Peer deps** | React 18 or 19 · `@cornerstonejs/core` 5.x |
| **Module format** | ESM only |

v0.2 does exactly one thing: **state synchronization.** If your screen needs annotation or
segmentation state today, this library does not cover it yet — that is the honest answer, and
it is the first thing worth knowing.

---

## Quick start

The app keeps owning the Engine. The library only reads through Cornerstone3D's own registry.

```tsx
import { useEffect } from 'react';
import {
  Enums,
  RenderingEngine,
  getEnabledElementByViewportId,
  init as coreInit,
  type Types,
} from '@cornerstonejs/core';
import { init as dicomImageLoaderInit } from '@cornerstonejs/dicom-image-loader';
import { CornerstoneViewport, useViewportState } from 'react-cornerstone3d';

const renderingEngineId = 'app-engine';

// Once, before anything mounts.
coreInit();
dicomImageLoaderInit();
new RenderingEngine(renderingEngineId);

function Viewer({ imageIds }: { imageIds: string[] }) {
  // Child effects run before parent effects, so <CornerstoneViewport> has
  // already enabled the viewport by the time this runs.
  useEffect(() => {
    const viewport = getEnabledElementByViewportId('ct-axial')
      ?.viewport as Types.IStackViewport | undefined;
    if (!viewport) return;

    viewport.setStack(imageIds).then(() => {
      viewport.resetCamera(); // fit the new series to the viewport
      viewport.render();
    });
  }, [imageIds]);

  return (
    <>
      <CornerstoneViewport
        viewportId="ct-axial"
        type={Enums.ViewportType.STACK}
        renderingEngineId={renderingEngineId}
        style={{ width: 512, height: 512 }}
      />
      <SliceIndicator />
    </>
  );
}

function SliceIndicator() {
  const slice = useViewportState('ct-axial', (s) => s.sliceIndex);
  const total = useViewportState('ct-axial', (s) => s.numberOfSlices);

  // Absent viewport is a normal state, not an error — render what you like.
  if (slice === undefined) return null;
  return <span>{slice + 1} / {total}</span>;
}
```

Scrolling, window/level, a slider — all stay plain Cornerstone3D calls. Their effect reaches
React because the Engine emits an event, which is the same path a mouse drag takes. One read
path, whoever changed the state.

<details>
<summary><b>Vite setup</b> — the DICOM loader needs two lines of config</summary>

Its decode worker is spawned with `new Worker(new URL(…, import.meta.url))`. Pre-bundled into
`.vite/deps`, that URL points at a file that isn't there and **every image decode fails
silently** — metadata loads, the canvas stays black. Excluding the loader then takes its
CommonJS codecs out of pre-bundling too, so they have to be named back in:

```ts
export default defineConfig({
  optimizeDeps: {
    exclude: ['@cornerstonejs/dicom-image-loader'],
    include: [
      'dicom-parser',
      '@cornerstonejs/codec-charls/decodewasmjs',
      '@cornerstonejs/codec-libjpeg-turbo-8bit/decodewasmjs',
      '@cornerstonejs/codec-openjpeg/decodewasmjs',
      '@cornerstonejs/codec-openjph/wasmjs',
    ],
  },
  worker: { format: 'es' },
});
```

This is a Cornerstone3D + Vite issue, not a library one — but it costs an afternoon to find,
so it is written down here.

</details>

---

## What the hook replaces

The demo renders both versions of one widget and measures each from its own source at runtime:
**13 lines with the hook, 33 without.** Here is the 33.

<details>
<summary>The hand-rolled equivalent</summary>

```tsx
import { Enums, getEnabledElementByViewportId, type Types } from '@cornerstonejs/core';
import { useEffect, useState } from 'react';

export function SliceIndicatorByHand({ viewportId }: { viewportId: string }) {
  const [state, setState] = useState<{ slice: number; total: number }>();

  useEffect(() => {
    const enabled = getEnabledElementByViewportId(viewportId);
    if (!enabled) return; // no viewport yet? then never, even once it exists
    const viewport = enabled.viewport as Types.IStackViewport;
    const { element } = viewport;

    const update = () =>
      setState({ slice: viewport.getSliceIndex(), total: viewport.getNumberOfSlices() });
    update(); // patch the gap between first render and subscription — easy to forget

    element.addEventListener(Enums.Events.CAMERA_MODIFIED, update);
    element.addEventListener(Enums.Events.VOI_MODIFIED, update);
    element.addEventListener(Enums.Events.STACK_NEW_IMAGE, update);
    return () => {
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, update);
      element.removeEventListener(Enums.Events.VOI_MODIFIED, update);
      element.removeEventListener(Enums.Events.STACK_NEW_IMAGE, update);
    };
  }, [viewportId]);

  if (!state) return <span>—</span>;
  return <span>{state.slice + 1} / {state.total}</span>;
}
```

</details>

### And after those 33 lines, the bugs are still there

Cornerstone3D is deliberately framework-agnostic and ships no React bindings, so every viewer
hand-rolls this — and inherits the same defects. Graded by how often they actually bite:

**Every single time**

- **Mount-order race.** A viewport enabled *after* the widget mounts is never subscribed to.
  The effect checked once, found nothing, and has no reason to run again.
  ([reproduced in the demo](https://entrolec.github.io/react-cornerstone3d/))
- **Ghost state.** When the viewport is destroyed, the widget keeps showing the last number it
  saw — of an image that no longer exists — with its listeners still bound to a dead element.
- **A React render per engine event.** A drag emits events far faster than frames, and nothing
  coalesces them.

**In development**

- **Double subscription** under StrictMode's deliberate double-mount.

**When the conditions line up**

- **Tearing** under concurrent rendering: two components on one screen showing two different
  slice numbers.
- **Infinite loops, or deep-compare hacks to escape them.** Cornerstone3D getters return a
  fresh object on every call, so a naive `getSnapshot` never stabilizes. Hand-rolled bindings
  end up deep-comparing or `JSON.stringify`-diffing on every event.

This library fixes that layer once, centrally, so UI components stay pure functions of engine
state.

---

## How it works

Three decisions shape everything; full rationale lives in [`docs/adr/`](./docs/adr/).

**1 · The Engine is the single source of truth.**
Reads flow Engine → event → immutable Snapshot → `useSyncExternalStore`. Writes stay plain
Cornerstone3D calls. No parallel write API, no echo suppression, one read path no matter who
moved the state.

**2 · The library owns no engine.**
Hooks take a `viewportId` and resolve it through Cornerstone3D's global registry. No Provider,
no singleton, no engine prop — your engine management is untouched.

**3 · Absence is a normal state.**
A viewport that isn't enabled yet returns `undefined`. The value fills in by itself when the
viewport appears and empties when it's destroyed. What to render meanwhile is your call.

On top of those, every Snapshot is **referentially stable** (unchanged state ⇒ identical
reference, so no wasted renders and no loops) and **deep-frozen** (nothing you receive can
drift under you).

---

## API

### `useViewportState(viewportId, selector?, options?)`

```ts
function useViewportState(
  viewportId: string,
  selector?: undefined,
  options?: UseViewportStateOptions,
): ViewportState | undefined;

function useViewportState<T>(
  viewportId: string,
  selector: (state: ViewportState) => T,
  options?: UseViewportStateOptions,
): T | undefined;
```

| Argument | Behaviour |
|---|---|
| `viewportId` | Resolved through Cornerstone3D's global registry. `undefined` while no viewport with that id is enabled. |
| `selector` | Re-renders only when the selected value changes by `Object.is`. Never called while the viewport is absent. |
| `options.batch` | Default `true`: coalesce engine events to at most one update per animation frame. `false` for event-exact updates. |

```ts
interface ViewportStateCommon {
  camera: Types.ICamera;
  voiRange: Types.VOIRange | undefined;
  sliceIndex: number | undefined;
  numberOfSlices: number | undefined;
}
interface StackViewportState extends ViewportStateCommon {
  kind: 'stack';
  sliceIndex: number;
  numberOfSlices: number;
}
interface VolumeViewportState extends ViewportStateCommon {
  kind: 'volume';
}
type ViewportState = StackViewportState | VolumeViewportState;
```

`sliceIndex` and `numberOfSlices` are common to every kind, so **one slider serves a Stack and
an MPR screen alike**; narrow on `kind` for the rest.

On a Stack, `sliceIndex` is the *requested* slice — it moves the instant you scroll, not when
the image finishes loading ([ADR 0003](./docs/adr/0003-image-id-index-is-the-requested-slice.md)).
On a Volume it derives from the camera, so it never runs ahead of the pixels. A viewport
without slices (3D, or a Volume before `setVolumes`) reports `undefined` for both.

### `<CornerstoneViewport />`

Optional. Renders a `<div>`, enables it as a viewport on mount, disables it on unmount. The
Engine stays app-created; the component only resolves it through the registry.

```tsx
<CornerstoneViewport
  viewportId="ct-axial"
  type={Enums.ViewportType.STACK}
  style={{ width: 512, height: 512 }}
/>
```

| Prop | Description |
|---|---|
| `viewportId` | Id to enable — the same id `useViewportState` observes. |
| `type` | `Enums.ViewportType`, passed to `enableElement`. |
| `defaultOptions?` | `Types.ViewportInputOptions`, applied once at enable time. Later changes do not re-enable. |
| `renderingEngineId?` | Engine to enable on. Defaults to the app's single registered Engine; throws if there are zero or several and no id is given. |
| `...divProps` | Everything else goes to the `<div>`. |

A missing Engine at mount is a mount-ordering bug, so the component throws rather than
degrade — unlike the hooks, where an absent viewport is a normal state.

---

## Status

| Capability | |
|---|---|
| Stack viewport state (camera, VOI, slice index) | ✅ |
| Volume viewport state + per-kind types | ✅ |
| Slice Position (`sliceIndex`, `numberOfSlices`) common to both kinds | ✅ |
| Absent-viewport contract (`undefined`) | ✅ |
| Shared per-viewport Binding, StrictMode-safe | ✅ |
| Auto fill-in / empty-out on viewport enable and destroy | ✅ |
| Selectors (re-render only when *your* value changes) | ✅ |
| rAF batching for interaction-rate events | ✅ |
| Optional `<CornerstoneViewport />` | ✅ |
| Annotation / tool / segmentation state | roadmap |

**Out of scope:** app state management (bring Zustand or whatever you like), write helpers,
engine and viewport lifecycle beyond the optional component, rendering performance — that one
is the Engine's job.

---

## Development

```bash
npx playwright install chromium   # once — browser tests drive real Cornerstone3D
npm test                          # unit (jsdom + fake CS3D registry) and browser projects
npm run build                     # tsc → dist/
npm run demo                      # the demo site on localhost
```

Unit tests observe only the public hook API: return values, referential stability, re-render
counts. Browser tests drive a real Engine to check the assumptions the fake makes. Domain
vocabulary (Engine, Viewport State, Snapshot, Command, Binding) lives in
[`CONTEXT.md`](./CONTEXT.md).

## License

MIT
