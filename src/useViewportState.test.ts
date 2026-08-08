import type { Types } from '@cornerstonejs/core';
import { Enums, getEnabledElementByViewportId } from '@cornerstonejs/core';
import { act, renderHook } from '@testing-library/react';
import { createElement, StrictMode, type ReactNode } from 'react';
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

/**
 * Fake Stack viewport mirroring the CS3D contract the library relies on:
 * getters return a FRESH object on every call, and engine events fire as
 * CustomEvents on the viewport's element.
 */
function createFakeStackViewport(viewportId: string) {
  const element = document.createElement('div');
  const engineState = {
    camera: {
      position: [0, 0, 100] as Types.Point3,
      focalPoint: [0, 0, 0] as Types.Point3,
      parallelScale: 100,
    },
    voiRange: { lower: 0, upper: 400 },
    imageIdIndex: 0,
  };
  const viewport = {
    element,
    getCamera: (): Types.ICamera => ({
      ...engineState.camera,
      position: [...engineState.camera.position] as Types.Point3,
      focalPoint: [...engineState.camera.focalPoint] as Types.Point3,
    }),
    getProperties: () => ({ voiRange: { ...engineState.voiRange } }),
    getCurrentImageIdIndex: () => engineState.imageIdIndex,
  };
  // CS3D declares a non-optional return but yields undefined for unknown ids.
  vi.mocked(getEnabledElementByViewportId).mockImplementation(
    (id) =>
      (id === viewportId ? { viewport } : undefined) as unknown as Types.IEnabledElement,
  );
  const fire = (type: string) =>
    act(() => {
      element.dispatchEvent(new CustomEvent(type));
    });
  return { element, engineState, fire };
}

const strictModeWrapper = ({ children }: { children: ReactNode }) =>
  createElement(StrictMode, null, children);

describe('useViewportState', () => {
  test('returns undefined when the viewport does not exist', () => {
    const { result } = renderHook(() => useViewportState('no-such-viewport'));

    expect(result.current).toBeUndefined();
  });

  test('returns the current Viewport State when the viewport exists', () => {
    const { engineState } = createFakeStackViewport('vp-exists');

    const { result } = renderHook(() => useViewportState('vp-exists'));

    expect(result.current).toEqual({
      camera: engineState.camera,
      voiRange: engineState.voiRange,
      imageIdIndex: engineState.imageIdIndex,
    });
  });

  test('returns updated state when a camera Engine event fires', () => {
    const { engineState, fire } = createFakeStackViewport('vp-camera');
    const { result } = renderHook(() => useViewportState('vp-camera'));

    engineState.camera.parallelScale = 50;
    fire(Enums.Events.CAMERA_MODIFIED);

    expect(result.current?.camera.parallelScale).toBe(50);
  });

  test('returns updated state when a VOI Engine event fires', () => {
    const { engineState, fire } = createFakeStackViewport('vp-voi');
    const { result } = renderHook(() => useViewportState('vp-voi'));

    engineState.voiRange = { lower: -100, upper: 300 };
    fire(Enums.Events.VOI_MODIFIED);

    expect(result.current?.voiRange).toEqual({ lower: -100, upper: 300 });
  });

  test('returns updated state when a stack-new-image Engine event fires', () => {
    const { engineState, fire } = createFakeStackViewport('vp-stack');
    const { result } = renderHook(() => useViewportState('vp-stack'));

    engineState.imageIdIndex = 42;
    fire(Enums.Events.STACK_NEW_IMAGE);

    expect(result.current?.imageIdIndex).toBe(42);
  });

  test('returns the identical reference across re-renders when state did not change', () => {
    createFakeStackViewport('vp-stable');
    const { result, rerender } = renderHook(() => useViewportState('vp-stable'));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  test('returns the identical reference when an event fires but state is unchanged', () => {
    const { fire } = createFakeStackViewport('vp-stable-event');
    const { result } = renderHook(() => useViewportState('vp-stable-event'));
    const first = result.current;

    fire(Enums.Events.CAMERA_MODIFIED);

    expect(result.current).toBe(first);
  });

  test('multiple consumers of one viewport share one Snapshot and one Engine subscription', () => {
    const { element } = createFakeStackViewport('vp-shared');
    const addSpy = vi.spyOn(element, 'addEventListener');

    const { result } = renderHook(() => ({
      a: useViewportState('vp-shared'),
      b: useViewportState('vp-shared'),
    }));

    expect(result.current.a).toBe(result.current.b);
    const addedTypes = addSpy.mock.calls.map(([type]) => type);
    expect(new Set(addedTypes).size).toBe(addedTypes.length);
  });

  test('keeps the Engine subscription alive while other consumers remain', () => {
    const { engineState, fire } = createFakeStackViewport('vp-remaining');
    const first = renderHook(() => useViewportState('vp-remaining'));
    const second = renderHook(() => useViewportState('vp-remaining'));

    first.unmount();
    engineState.imageIdIndex = 5;
    fire(Enums.Events.STACK_NEW_IMAGE);

    expect(second.result.current?.imageIdIndex).toBe(5);
  });

  test('returns fresh state on remount after the Engine changed while unobserved', () => {
    const { engineState } = createFakeStackViewport('vp-remount');
    const first = renderHook(() => useViewportState('vp-remount'));
    first.unmount();

    engineState.imageIdIndex = 9;
    const second = renderHook(() => useViewportState('vp-remount'));

    expect(second.result.current?.imageIdIndex).toBe(9);
  });

  test('unsubscribes from the Engine when the last consumer unmounts', () => {
    const { element } = createFakeStackViewport('vp-unmount');
    const addSpy = vi.spyOn(element, 'addEventListener');
    const removeSpy = vi.spyOn(element, 'removeEventListener');

    const { unmount } = renderHook(() => ({
      a: useViewportState('vp-unmount'),
      b: useViewportState('vp-unmount'),
    }));
    unmount();

    expect(removeSpy.mock.calls.map(([type]) => type).sort()).toEqual(
      addSpy.mock.calls.map(([type]) => type).sort(),
    );
  });

  test('StrictMode double-mount leaves exactly one live Engine subscription and no leak after unmount', () => {
    const { element, engineState, fire } = createFakeStackViewport('vp-strict');
    const addSpy = vi.spyOn(element, 'addEventListener');
    const removeSpy = vi.spyOn(element, 'removeEventListener');

    const { result, unmount } = renderHook(() => useViewportState('vp-strict'), {
      wrapper: strictModeWrapper,
    });

    const liveAfterMount = addSpy.mock.calls.length - removeSpy.mock.calls.length;
    const liveTypes = new Set(addSpy.mock.calls.map(([type]) => type));
    expect(liveAfterMount).toBe(liveTypes.size);

    engineState.imageIdIndex = 7;
    fire(Enums.Events.STACK_NEW_IMAGE);
    expect(result.current?.imageIdIndex).toBe(7);

    unmount();
    expect(addSpy.mock.calls.length).toBe(removeSpy.mock.calls.length);
  });

  test('a Snapshot handed to a consumer never changes afterwards', () => {
    const { engineState, fire } = createFakeStackViewport('vp-immutable');
    const { result } = renderHook(() => useViewportState('vp-immutable'));
    const before = result.current;

    engineState.camera.parallelScale = 25;
    engineState.imageIdIndex = 3;
    fire(Enums.Events.CAMERA_MODIFIED);

    expect(before?.camera.parallelScale).toBe(100);
    expect(before?.imageIdIndex).toBe(0);
    expect(Object.isFrozen(result.current)).toBe(true);
    expect(Object.isFrozen(result.current?.camera)).toBe(true);
  });
});
