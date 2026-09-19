import { useViewportState } from 'react-cornerstone3d';

// One call, one shared snapshot. It replaces the two hooks of step 4 and the
// ten of step 5, and the reference only changes when the state actually does.
export function WholeState({ viewportId }: { viewportId: string }) {
  const state = useViewportState(viewportId);

  if (!state) return <span className="ind ind--empty">—</span>;
  return (
    <span className="ind ind--small">
      {(state.sliceIndex ?? 0) + 1} / {state.numberOfSlices}
      <br />
      zoom {Math.round(state.camera.parallelScale ?? 0)}
    </span>
  );
}
