import type { Types } from '@cornerstonejs/core';
import { Enums, eventTarget, getEnabledElementByViewportId } from '@cornerstonejs/core';
import { useRef, useSyncExternalStore } from 'react';

/** Observable state of one Stack viewport. Immutable Snapshot (deep-frozen). */
export interface ViewportState {
  readonly camera: Types.ICamera;
  readonly voiRange: Types.VOIRange | undefined;
  readonly imageIdIndex: number;
}

// Engine events that invalidate the Snapshot. All fire on viewport.element.
const ELEMENT_EVENTS = [
  Enums.Events.CAMERA_MODIFIED,
  Enums.Events.VOI_MODIFIED,
  Enums.Events.STACK_NEW_IMAGE,
];

function deepFreeze<T>(value: T): T {
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function camerasEqual(a: Types.ICamera, b: Types.ICamera): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of keys) {
    const av = a[key as keyof Types.ICamera];
    const bv = b[key as keyof Types.ICamera];
    if (Array.isArray(av) && Array.isArray(bv)) {
      if (av.length !== bv.length || av.some((v, i) => v !== bv[i])) return false;
    } else if (av !== bv) {
      return false;
    }
  }
  return true;
}

function statesEqual(a: ViewportState, b: ViewportState): boolean {
  return (
    a.imageIdIndex === b.imageIdIndex &&
    a.voiRange?.lower === b.voiRange?.lower &&
    a.voiRange?.upper === b.voiRange?.upper &&
    camerasEqual(a.camera, b.camera)
  );
}

interface Binding {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => ViewportState | undefined;
}

/**
 * One Binding per viewportId: subscribes to Engine events on the viewport's
 * element while it has consumers, and rebuilds an immutable Snapshot only on
 * those events, so `getSnapshot` is referentially stable (CS3D getters return
 * fresh objects per call; the Snapshot absorbs that).
 */
function createBinding(viewportId: string): Binding {
  const listeners = new Set<() => void>();
  let element: HTMLDivElement | undefined;

  const buildSnapshot = (): ViewportState | undefined => {
    const enabled = getEnabledElementByViewportId(viewportId);
    if (!enabled) return undefined;
    // ponytail: Stack-only cast; per-kind Viewport State types land in issue 06.
    const viewport = enabled.viewport as Types.IStackViewport;
    // structuredClone: getter output may share nested arrays with the Engine;
    // freezing those in place would break Engine-side mutation.
    return deepFreeze({
      camera: structuredClone(viewport.getCamera()),
      voiRange: structuredClone(viewport.getProperties().voiRange),
      imageIdIndex: viewport.getCurrentImageIdIndex(),
    });
  };

  let snapshot = buildSnapshot();

  const notify = () => listeners.forEach((listener) => listener());

  const update = () => {
    const next = buildSnapshot();
    if (next === snapshot) return;
    if (next && snapshot && statesEqual(next, snapshot)) return;
    snapshot = next;
    notify();
  };

  const attachElement = () => {
    element = getEnabledElementByViewportId(viewportId)?.viewport.element;
    for (const type of ELEMENT_EVENTS) element?.addEventListener(type, update);
  };

  const detachElement = () => {
    for (const type of ELEMENT_EVENTS) element?.removeEventListener(type, update);
    element = undefined;
  };

  const onEnabled = (evt: Event) => {
    if ((evt as Types.EventTypes.ElementEnabledEvent).detail.viewportId !== viewportId) return;
    detachElement(); // re-enable may bring a new element for the same id
    attachElement();
    update();
  };

  const onDisabled = (evt: Event) => {
    if ((evt as Types.EventTypes.ElementDisabledEvent).detail.viewportId !== viewportId) return;
    detachElement();
    // ELEMENT_DISABLED fires before registry removal — clear explicitly
    // instead of rebuilding from a registry that still holds the viewport.
    if (snapshot !== undefined) {
      snapshot = undefined;
      notify();
    }
  };

  const attach = () => {
    eventTarget.addEventListener(Enums.Events.ELEMENT_ENABLED, onEnabled);
    eventTarget.addEventListener(Enums.Events.ELEMENT_DISABLED, onDisabled);
    attachElement();
    update(); // state may have moved between render and subscription
  };

  const detach = () => {
    eventTarget.removeEventListener(Enums.Events.ELEMENT_ENABLED, onEnabled);
    eventTarget.removeEventListener(Enums.Events.ELEMENT_DISABLED, onDisabled);
    detachElement();
    // A dormant Binding can't hear disable events; a kept Snapshot could be
    // served stale to the next consumer's first render. Absence until the
    // subscribe-time update() is the honest state (ADR 0002).
    snapshot = undefined;
  };

  return {
    subscribe: (onChange) => {
      if (listeners.size === 0) attach();
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
        if (listeners.size === 0) detach();
      };
    },
    getSnapshot: () => snapshot,
  };
}

// ponytail: Bindings live for the session once created; evict at zero
// consumers if viewportId churn ever matters.
const bindings = new Map<string, Binding>();

/**
 * Reads the Viewport State for a viewport resolved via the CS3D global
 * registry (ADR 0002). Absence is a normal state: returns `undefined`
 * when the viewport does not exist (yet).
 *
 * With a selector, the component re-renders only when the selected value
 * changes (Object.is). The selector is never called while the viewport is
 * absent — the hook returns `undefined` instead.
 */
export function useViewportState(viewportId: string): ViewportState | undefined;
export function useViewportState<T>(
  viewportId: string,
  selector: (state: ViewportState) => T,
): T | undefined;
export function useViewportState<T>(
  viewportId: string,
  selector?: (state: ViewportState) => T,
): T | ViewportState | undefined {
  let binding = bindings.get(viewportId);
  if (!binding) {
    binding = createBinding(viewportId);
    bindings.set(viewportId, binding);
  }
  const { subscribe, getSnapshot } = binding;

  // useSyncExternalStore has no native selector support: it re-renders
  // whenever getSnapshot's result changes by Object.is. So getSnapshot here
  // returns the *selected* value, memoized per (Snapshot, selector) and kept
  // referentially stable while Object.is-equal.
  // ponytail: equality is Object.is only — a selector deriving a fresh object
  // per call still re-renders on every Engine event (no loop; the memo keeps
  // within-render reads consistent). Add an isEqual param if that bites.
  const memo = useRef<{
    snapshot: ViewportState | undefined;
    selector: typeof selector;
    selected: T | ViewportState | undefined;
  }>(undefined);

  return useSyncExternalStore(subscribe, () => {
    const snapshot = getSnapshot();
    const prev = memo.current;
    if (prev && prev.snapshot === snapshot && prev.selector === selector) return prev.selected;
    let selected =
      snapshot === undefined ? undefined : selector ? selector(snapshot) : snapshot;
    if (prev && Object.is(prev.selected, selected)) selected = prev.selected;
    memo.current = { snapshot, selector, selected };
    return selected;
  });
}
