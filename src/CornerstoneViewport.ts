import type { Enums, Types } from '@cornerstonejs/core';
import { getRenderingEngine, getRenderingEngines } from '@cornerstonejs/core';
import { createElement, useEffect, useRef, type ComponentPropsWithoutRef } from 'react';

export interface CornerstoneViewportProps extends ComponentPropsWithoutRef<'div'> {
  /** Viewport id to enable — the same id `useViewportState` observes. */
  viewportId: string;
  /** Viewport kind, passed through to `enableElement`. */
  type: Enums.ViewportType;
  /** Applied once at enable time; later changes do not re-enable. */
  defaultOptions?: Types.ViewportInputOptions;
  /**
   * Engine to enable on, resolved via the CS3D registry (ADR 0002).
   * Defaults to the app's single registered Engine.
   */
  renderingEngineId?: string;
}

function resolveEngine(renderingEngineId?: string): Types.IRenderingEngine {
  if (renderingEngineId !== undefined) {
    const engine = getRenderingEngine(renderingEngineId);
    if (!engine) {
      throw new Error(
        `CornerstoneViewport: no RenderingEngine "${renderingEngineId}" is registered — ` +
          'the app must create it before mounting (ADR 0002).',
      );
    }
    return engine;
  }
  const engines = getRenderingEngines() ?? [];
  if (engines.length !== 1) {
    throw new Error(
      `CornerstoneViewport: expected exactly one registered RenderingEngine, found ` +
        `${engines.length} — create one before mounting, or pass renderingEngineId.`,
    );
  }
  return engines[0];
}

/**
 * Thin optional layer over the hook core: enables its own `<div>` as a
 * viewport on mount and disables it on unmount. The Engine stays app-owned
 * and app-created; this component only resolves it through the CS3D registry.
 *
 * Unlike viewport absence in hooks (a normal state, ADR 0002), a missing
 * Engine at mount is a mount-ordering bug — the component throws rather
 * than degrading, since it cannot enable anything without one.
 */
export function CornerstoneViewport({
  viewportId,
  type,
  defaultOptions,
  renderingEngineId,
  ...divProps
}: CornerstoneViewportProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const engine = resolveEngine(renderingEngineId);
    // elementRef is always set here: the div below renders before effects run.
    engine.enableElement({
      viewportId,
      type,
      element: elementRef.current as HTMLDivElement,
      defaultOptions,
    });
    return () => engine.disableElement(viewportId);
    // defaultOptions is enable-time-only by CS3D contract — re-enabling on
    // its change would destroy and recreate the viewport.
  }, [viewportId, type, renderingEngineId]);

  return createElement('div', { ref: elementRef, ...divProps });
}
