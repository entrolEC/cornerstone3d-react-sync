import { getEnabledElementByViewportId } from '@cornerstonejs/core';
import { useSyncExternalStore } from 'react';

// ponytail: placeholder Snapshot; the real Viewport State shape lands in issue 02.
export type ViewportState = Record<string, never>;

// Stable reference — getSnapshot must not return a fresh object per call.
const EMPTY_STATE: ViewportState = Object.freeze({});

// ponytail: Binding (event subscription) lands in issue 02.
const subscribe = () => () => {};

/**
 * Reads the Viewport State for a viewport resolved via the CS3D global
 * registry (ADR 0002). Absence is a normal state: returns `undefined`
 * when the viewport does not exist (yet).
 */
export function useViewportState(viewportId: string): ViewportState | undefined {
  return useSyncExternalStore(subscribe, () =>
    getEnabledElementByViewportId(viewportId) ? EMPTY_STATE : undefined,
  );
}
