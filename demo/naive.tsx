import { Enums, getEnabledElementByViewportId, type Types } from '@cornerstonejs/core';
import { useSyncExternalStore } from 'react';

// The obvious binding: useSyncExternalStore is React 18's answer for reading
// external mutable state, so read what the widget needs straight from the
// engine. Two fields, so getSnapshot returns them as an object.
export function SliceIndicatorNaive({ viewportId }: { viewportId: string }) {
  const state = useSyncExternalStore(
    (onChange) => {
      const element = getEnabledElementByViewportId(viewportId)?.viewport.element;
      element?.addEventListener(Enums.Events.STACK_NEW_IMAGE, onChange);
      return () => element?.removeEventListener(Enums.Events.STACK_NEW_IMAGE, onChange);
    },
    () => {
      const viewport = getEnabledElementByViewportId(viewportId)
        ?.viewport as Types.IStackViewport | undefined;
      if (!viewport) return undefined;
      return { slice: viewport.getSliceIndex(), total: viewport.getNumberOfSlices() };
    },
  );

  if (!state) return <span className="ind ind--empty">—</span>;
  return (
    <span className="ind">
      {state.slice + 1} / {state.total}
    </span>
  );
}
