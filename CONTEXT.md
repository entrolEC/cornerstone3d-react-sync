# react-cornerstone3d

React bindings that expose Cornerstone3D's live engine state to React components, tearing-free, via `useSyncExternalStore`.

## Language

**Engine**:
The running Cornerstone3D instance (rendering engine, viewports, tools). The single source of truth for all synced state.
_Avoid_: store, backend

**Viewport State**:
The observable state of one viewport: camera, VOI (window/level), Slice Position, and similar per-viewport values. Values are what the Engine *reports*, not what is painted on the canvas: the slice index is the slice the Engine has been told to show, which may run ahead of the pixels.
_Avoid_: viewport data, view state

**Slice Position**:
The current slice index and the number of slices of a viewport, as the Engine reports them. Shared by every viewport kind so one slice control serves Stack and Volume alike. In a Stack it is the position in the image list; in a Volume it is derived from the camera, so it never runs ahead of the pixels. A viewport without slices (3D, or a Volume before its data arrives) has no Slice Position.
_Avoid_: current/total, slice info, slider state

**Snapshot**:
An immutable, referentially-stable copy of a piece of Engine state, rebuilt only when a relevant Engine event fires. What `getSnapshot` returns.
_Avoid_: state copy, cache object

**Command**:
A write from React to the Engine — always a Cornerstone3D API call. Its effect reaches React only by coming back as an Engine event; the library never writes to Snapshots directly.
_Avoid_: setter, dispatch, mutation

**Binding**:
A subscription connecting one Engine event source to Snapshot rebuilding, keyed by viewportId.
_Avoid_: sync, connector
