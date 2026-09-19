import { getEnabledElementByViewportId, type Types } from '@cornerstonejs/core';

// Call getSnapshot twice in a row, with nothing happening in between, and ask
// React's own question about the two results: is it the same object?
export function readTwice(viewportId: string) {
  const viewport = getEnabledElementByViewportId(viewportId)
    ?.viewport as Types.IStackViewport | undefined;
  if (!viewport) return undefined;

  const compose = () => ({ slice: viewport.getSliceIndex(), total: viewport.getNumberOfSlices() });

  return {
    composed: Object.is(compose(), compose()),
    fromEngine: Object.is(viewport.getCamera(), viewport.getCamera()),
  };
}
