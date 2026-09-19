import { Enums, getEnabledElementByViewportId, type Types } from '@cornerstonejs/core';
import { useCallback, useSyncExternalStore } from 'react';

const stackOf = (viewportId: string) =>
  getEnabledElementByViewportId(viewportId)?.viewport as Types.IStackViewport | undefined;

// The obvious objection: two values need not mean one object. Call the hook
// twice and hand back a plain number each time — and it works, because
// Object.is settles on primitives.
export function SliceAndTotalByHooks({ viewportId }: { viewportId: string }) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const element = stackOf(viewportId)?.element;
      element?.addEventListener(Enums.Events.STACK_NEW_IMAGE, onChange);
      return () => element?.removeEventListener(Enums.Events.STACK_NEW_IMAGE, onChange);
    },
    [viewportId],
  );

  const slice = useSyncExternalStore(subscribe, () => stackOf(viewportId)?.getSliceIndex());
  const total = useSyncExternalStore(subscribe, () => stackOf(viewportId)?.getNumberOfSlices());

  if (slice === undefined) return <span className="ind ind--empty">—</span>;
  return (
    <span className="ind">
      {slice + 1} / {total}
    </span>
  );
}
