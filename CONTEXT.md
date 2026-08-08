# cornerstone3d-react-sync

React bindings that expose Cornerstone3D's live engine state to React components, tearing-free, via `useSyncExternalStore`.

## Language

**Engine**:
The running Cornerstone3D instance (rendering engine, viewports, tools). The single source of truth for all synced state.
_Avoid_: store, backend

**Viewport State**:
The observable state of one viewport: camera, VOI (window/level), current slice index, and similar per-viewport values.
_Avoid_: viewport data, view state

**Snapshot**:
An immutable, referentially-stable copy of a piece of Engine state, rebuilt only when a relevant Engine event fires. What `getSnapshot` returns.
_Avoid_: state copy, cache object

**Command**:
A write from React to the Engine — always a Cornerstone3D API call. Its effect reaches React only by coming back as an Engine event; the library never writes to Snapshots directly.
_Avoid_: setter, dispatch, mutation

**Binding**:
A subscription connecting one Engine event source to Snapshot rebuilding, keyed by viewportId.
_Avoid_: sync, connector
