import type { Types } from '@cornerstonejs/core';
import { getEnabledElementByViewportId } from '@cornerstonejs/core';
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useViewportState } from './index';

// Real module loads (validates the peer dep under jsdom); only the registry
// lookup is replaced. Unconfigured vi.fn() returns undefined = empty registry.
vi.mock('@cornerstonejs/core', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@cornerstonejs/core')>()),
  getEnabledElementByViewportId: vi.fn(),
}));

afterEach(() => {
  vi.mocked(getEnabledElementByViewportId).mockReset();
});

describe('useViewportState', () => {
  test('returns undefined when the viewport does not exist', () => {
    const { result } = renderHook(() => useViewportState('no-such-viewport'));

    expect(result.current).toBeUndefined();
  });

  test('returns a snapshot when the viewport exists', () => {
    vi.mocked(getEnabledElementByViewportId).mockReturnValue(
      {} as Types.IEnabledElement,
    );

    const { result } = renderHook(() => useViewportState('vp-1'));

    expect(result.current).not.toBeUndefined();
  });
});
