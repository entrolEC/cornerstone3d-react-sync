import type { Types } from '@cornerstonejs/core';
import {
  Enums,
  RenderingEngine,
  imageLoader,
  init as csInit,
  metaData,
  volumeLoader,
} from '@cornerstonejs/core';
import { cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, expect, test } from 'vitest';
import { useViewportState, type StackViewportState } from './index';

// Smoke tests against the real Engine on a real canvas. They verify the
// assumption layer the jsdom fakes encode: which events CS3D actually fires,
// when, and with what payloads — not the hook logic (jsdom suite owns that).

const ROWS = 64;
const COLS = 64;
const imageIds = ['smoke:0', 'smoke:1', 'smoke:2'];

function fakeImage(imageId: string): Types.IImage {
  const pixelData = new Uint8Array(ROWS * COLS);
  return {
    imageId,
    rows: ROWS,
    columns: COLS,
    height: ROWS,
    width: COLS,
    color: false,
    rgba: false,
    numberOfComponents: 1,
    dataType: 'Uint8Array',
    slope: 1,
    intercept: 0,
    windowCenter: 128,
    windowWidth: 256,
    voiLUTFunction: 'LINEAR',
    minPixelValue: 0,
    maxPixelValue: 255,
    rowPixelSpacing: 1,
    columnPixelSpacing: 1,
    invert: false,
    sizeInBytes: pixelData.byteLength,
    getPixelData: () => pixelData,
    getCanvas: undefined,
  } as unknown as Types.IImage;
}

function fakeMetaDataProvider(type: string, imageId: string) {
  const sliceIndex = imageIds.indexOf(imageId);
  if (sliceIndex === -1) return undefined;
  switch (type) {
    case 'imagePlaneModule':
      return {
        frameOfReferenceUID: 'smoke-FOR',
        rows: ROWS,
        columns: COLS,
        imageOrientationPatient: [1, 0, 0, 0, 1, 0],
        rowCosines: [1, 0, 0],
        columnCosines: [0, 1, 0],
        imagePositionPatient: [0, 0, sliceIndex],
        pixelSpacing: [1, 1],
        rowPixelSpacing: 1,
        columnPixelSpacing: 1,
        sliceThickness: 1,
      };
    case 'imagePixelModule':
      return {
        samplesPerPixel: 1,
        photometricInterpretation: 'MONOCHROME2',
        rows: ROWS,
        columns: COLS,
        bitsAllocated: 8,
        bitsStored: 8,
        highBit: 7,
        pixelRepresentation: 0,
      };
    case 'generalSeriesModule':
      return { modality: 'SC' };
    case 'voiLutModule':
      return { windowWidth: [256], windowCenter: [128] };
    case 'modalityLutModule':
      return { rescaleSlope: 1, rescaleIntercept: 0 };
    default:
      return undefined;
  }
}

beforeAll(async () => {
  await csInit();
  imageLoader.registerImageLoader('smoke', ((imageId: string) => ({
    promise: Promise.resolve(fakeImage(imageId)),
  })) as unknown as Types.ImageLoaderFn);
  imageLoader.registerImageLoader('fail', (() => ({
    promise: Promise.reject(new Error('smoke: image load failure')),
  })) as unknown as Types.ImageLoaderFn);
  metaData.addProvider(fakeMetaDataProvider);
});

let engine: RenderingEngine;
const elements: HTMLDivElement[] = [];

function makeElement(): HTMLDivElement {
  const element = document.createElement('div');
  element.style.width = '128px';
  element.style.height = '128px';
  document.body.appendChild(element);
  elements.push(element);
  return element;
}

afterEach(() => {
  cleanup(); // unmount hooks before the Engine they watch goes away
  engine?.destroy();
  for (const element of elements.splice(0)) element.remove();
});

test('Stack viewport: real Engine state changes reach the hook', async () => {
  engine = new RenderingEngine('smoke-engine');
  engine.enableElement({
    viewportId: 'stack-vp',
    type: Enums.ViewportType.STACK,
    element: makeElement(),
  });
  const viewport = engine.getViewport('stack-vp') as Types.IStackViewport;
  await viewport.setStack(imageIds, 0);
  viewport.render();

  const { result } = renderHook(() => useViewportState('stack-vp'));
  await waitFor(() => expect(result.current?.kind).toBe('stack'));
  expect((result.current as StackViewportState).imageIdIndex).toBe(0);

  viewport.setProperties({ voiRange: { lower: 10, upper: 20 } });
  await waitFor(() => expect(result.current?.voiRange).toEqual({ lower: 10, upper: 20 }));

  await viewport.setImageIdIndex(2);
  await waitFor(() =>
    expect((result.current as StackViewportState).imageIdIndex).toBe(2),
  );

  const before = result.current!.camera.parallelScale!;
  viewport.setCamera({ parallelScale: before * 2 });
  await waitFor(() =>
    expect(result.current?.camera.parallelScale).toBeCloseTo(before * 2),
  );
});

test('Stack viewport: imageIdIndex is the requested slice even when the image never loads', async () => {
  engine = new RenderingEngine('smoke-engine');
  engine.enableElement({
    viewportId: 'stack-fail-vp',
    type: Enums.ViewportType.STACK,
    element: makeElement(),
  });
  const viewport = engine.getViewport('stack-fail-vp') as Types.IStackViewport;
  await viewport.setStack([...imageIds, 'fail:3'], 0);
  viewport.render();

  const { result } = renderHook(() => useViewportState('stack-fail-vp'));
  await waitFor(() => expect(result.current?.kind).toBe('stack'));

  // CS3D swallows the failure: no STACK_NEW_IMAGE, IMAGE_LOAD_ERROR goes to
  // eventTarget, and the promise resolves (GPU path) or rejects (CPU path).
  // PRE_STACK_NEW_IMAGE, fired after the index is assigned, is the only
  // element event carrying the new index — this fails without it, and fails
  // if CS3D ever fires it before the assignment (ADR 0003).
  // CS3D's cache chains a second .then onto the loader promise with no catch,
  // so the rejection also surfaces as unhandled — swallow it for this test.
  const swallow = (evt: PromiseRejectionEvent) => evt.preventDefault();
  window.addEventListener('unhandledrejection', swallow);
  try {
    await viewport.setImageIdIndex(3).catch(() => undefined);
    await waitFor(() =>
      expect((result.current as StackViewportState).imageIdIndex).toBe(3),
    );
  } finally {
    window.removeEventListener('unhandledrejection', swallow);
  }
});

test('Volume viewport: real Engine state changes reach the hook', async () => {
  const volumeId = 'smokeVolume';
  volumeLoader.createLocalVolume(volumeId, {
    metadata: {
      BitsAllocated: 8,
      BitsStored: 8,
      HighBit: 7,
      SamplesPerPixel: 1,
      PhotometricInterpretation: 'MONOCHROME2',
      PixelRepresentation: 0,
      Modality: 'CT',
      ImageOrientationPatient: [1, 0, 0, 0, 1, 0],
      PixelSpacing: [1, 1],
      FrameOfReferenceUID: 'smoke-FOR',
      Columns: COLS,
      Rows: ROWS,
      voiLut: [],
      VOILUTFunction: 'LINEAR',
    },
    dimensions: [COLS, ROWS, 4],
    spacing: [1, 1, 1],
    origin: [0, 0, 0],
    direction: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    scalarData: new Uint8Array(COLS * ROWS * 4),
  });

  engine = new RenderingEngine('smoke-engine');
  engine.enableElement({
    viewportId: 'volume-vp',
    type: Enums.ViewportType.ORTHOGRAPHIC,
    element: makeElement(),
  });
  const viewport = engine.getViewport('volume-vp') as Types.IVolumeViewport;
  await viewport.setVolumes([{ volumeId }]);
  viewport.render();

  const { result } = renderHook(() => useViewportState('volume-vp'));
  await waitFor(() => expect(result.current?.kind).toBe('volume'));

  viewport.setProperties({ voiRange: { lower: 5, upper: 50 } });
  await waitFor(() => expect(result.current?.voiRange).toEqual({ lower: 5, upper: 50 }));

  const before = result.current!.camera.parallelScale!;
  viewport.setCamera({ parallelScale: before * 2 });
  await waitFor(() =>
    expect(result.current?.camera.parallelScale).toBeCloseTo(before * 2),
  );
});

test('enable/disable lifecycle: undefined before enable and after disable', async () => {
  engine = new RenderingEngine('smoke-engine');
  const { result } = renderHook(() => useViewportState('lifecycle-vp'));
  expect(result.current).toBeUndefined();

  engine.enableElement({
    viewportId: 'lifecycle-vp',
    type: Enums.ViewportType.STACK,
    element: makeElement(),
  });
  const viewport = engine.getViewport('lifecycle-vp') as Types.IStackViewport;
  await viewport.setStack(imageIds, 0);
  viewport.render();
  await waitFor(() => expect(result.current?.kind).toBe('stack'));

  // destroy(), not disableElement(): the spec's contract is enable/destroy,
  // and destroy must fire ELEMENT_DISABLED per viewport for the hook to see.
  engine.destroy();
  await waitFor(() => expect(result.current).toBeUndefined());
});
