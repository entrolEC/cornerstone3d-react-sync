import { Enums, getEnabledElementByViewportId } from '@cornerstonejs/core';
import { useCallback, useSyncExternalStore } from 'react';

const cameraOf = (viewportId: string) =>
  getEnabledElementByViewportId(viewportId)?.viewport.getCamera();

// Push the same trick at the camera. Syncing two viewports, or saving a view,
// needs all of it — and every value has to come back as a primitive, so the
// camera is ten hooks and ten subscriptions, in every widget that wants it.
export function CameraByHooks({ viewportId }: { viewportId: string }) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const element = getEnabledElementByViewportId(viewportId)?.viewport.element;
      element?.addEventListener(Enums.Events.CAMERA_MODIFIED, onChange);
      return () => element?.removeEventListener(Enums.Events.CAMERA_MODIFIED, onChange);
    },
    [viewportId],
  );

  const zoom = useSyncExternalStore(subscribe, () => cameraOf(viewportId)?.parallelScale);
  const posX = useSyncExternalStore(subscribe, () => cameraOf(viewportId)?.position?.[0]);
  const posY = useSyncExternalStore(subscribe, () => cameraOf(viewportId)?.position?.[1]);
  const posZ = useSyncExternalStore(subscribe, () => cameraOf(viewportId)?.position?.[2]);
  const focalX = useSyncExternalStore(subscribe, () => cameraOf(viewportId)?.focalPoint?.[0]);
  const focalY = useSyncExternalStore(subscribe, () => cameraOf(viewportId)?.focalPoint?.[1]);
  const focalZ = useSyncExternalStore(subscribe, () => cameraOf(viewportId)?.focalPoint?.[2]);
  const upX = useSyncExternalStore(subscribe, () => cameraOf(viewportId)?.viewUp?.[0]);
  const upY = useSyncExternalStore(subscribe, () => cameraOf(viewportId)?.viewUp?.[1]);
  const upZ = useSyncExternalStore(subscribe, () => cameraOf(viewportId)?.viewUp?.[2]);

  if (zoom === undefined) return <span className="ind ind--empty">—</span>;
  const round = (n: number | undefined) => Math.round(n ?? 0);
  return (
    <span className="ind ind--small">
      zoom {round(zoom)}
      <br />
      pos {[posX, posY, posZ].map(round).join(', ')}
      <br />
      focal {[focalX, focalY, focalZ].map(round).join(', ')}
      <br />
      up {[upX, upY, upZ].map(round).join(', ')}
    </span>
  );
}
