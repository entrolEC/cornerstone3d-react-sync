import { Enums, getEnabledElementByViewportId, type Types } from '@cornerstonejs/core';
import { useCallback, useSyncExternalStore } from 'react';

// The same binding, with one change: the screen needs the total as well as
// the index, so getSnapshot hands both back together.
export function SliceAndTotal({ viewportId }: { viewportId: string }) {
  // Memoised, or useSyncExternalStore re-subscribes on every render.
  const subscribe = useCallback(
    (onChange: () => void) => {
      const element = getEnabledElementByViewportId(viewportId)?.viewport.element;
      element?.addEventListener(Enums.Events.STACK_NEW_IMAGE, onChange);
      return () => element?.removeEventListener(Enums.Events.STACK_NEW_IMAGE, onChange);
    },
    [viewportId],
  );

  const state = useSyncExternalStore(subscribe, () => {
    const viewport = getEnabledElementByViewportId(viewportId)
      ?.viewport as Types.IStackViewport | undefined;
    if (!viewport) return undefined;
    return { slice: viewport.getSliceIndex(), total: viewport.getNumberOfSlices() };
  });

  if (!state) return <span className="ind ind--empty">—</span>;
  return (
    <span className="ind">
      {state.slice + 1} / {state.total}
    </span>
  );
}
