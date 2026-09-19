import { useEffect, useState, type ReactNode } from 'react';
import { getEnabledElementByViewportId, type Types } from '@cornerstonejs/core';
import { Panel, useCopy } from './ui';
import { CtViewport } from './CtViewport';
import {
  BY_HAND_SOURCE,
  HOOK_SOURCE,
  SliceIndicator,
  SliceIndicatorByHand,
  lineCount,
} from './widgets';

const VIEWPORT_ID = 'demo-race';

/** What is on screen at each step. The order is the whole point. */
interface Stage {
  image: boolean;
  readouts: boolean;
  /** Page through slices during this step. */
  scroll?: boolean;
}

/** Mechanics only — every word lives in copy.tsx, indexed the same way. */
const STAGES: Stage[][] = [
  [
    { image: false, readouts: true },
    { image: true, readouts: true },
    { image: true, readouts: true, scroll: true },
  ],
  [
    { image: true, readouts: true },
    { image: false, readouts: true },
  ],
];

/** Whether the image must already exist before the readouts appear. */
const IMAGE_FIRST = [false, true];

export function MountRace({ imageIds }: { imageIds: string[] }) {
  const t = useCopy().panel3;
  const [storyIndex, setStoryIndex] = useState(0);
  // -1 = before the story starts: no readouts yet, image only where the story needs it.
  const [stepIndex, setStepIndex] = useState(-1);
  const [run, setRun] = useState(0);

  const stages = STAGES[storyIndex];
  const story = t.stories[storyIndex];
  const stage = stages[stepIndex];
  const done = stepIndex === stages.length - 1;

  const image = stage ? stage.image : IMAGE_FIRST[storyIndex];
  const readouts = stage?.readouts ?? false;

  // Switching stories puts the image in place first, then creates the readouts a
  // beat later. That beat is the entire experiment: which one existed first.
  useEffect(() => {
    setStepIndex(-1);
    const id = setTimeout(() => setStepIndex(0), 450);
    return () => clearTimeout(id);
  }, [storyIndex, run]);

  useAutoScroll(stage?.scroll === true && image);

  return (
    <Panel eyebrow={t.eyebrow} title={t.title} lead={t.lead}>
      <div className="tabs tabs--spaced" role="tablist">
        {t.stories.map((candidate, index) => (
          <button
            key={candidate.tab}
            className="tab"
            role="tab"
            aria-selected={index === storyIndex}
            onClick={() => setStoryIndex(index)}
          >
            {index + 1}. {candidate.tab}
          </button>
        ))}
      </div>

      <p className="story__intro">{story.intro}</p>

      <div className="stage">
        <div className="stage__image">
          {image ? (
            <CtViewport viewportId={VIEWPORT_ID} imageIds={imageIds} showOverlay={false} />
          ) : (
            <div className="vp vp--off">{t.imageOff}</div>
          )}
          <div className="stage__label">{t.imageLabel}</div>
        </div>

        <div className="stage__readouts">
          <Readout title="useEffect + addEventListener" lines={lineCount(BY_HAND_SOURCE)} tone="bad">
            {readouts ? <SliceIndicatorByHand viewportId={VIEWPORT_ID} /> : t.notMounted}
          </Readout>
          <Readout title="useViewportState" lines={lineCount(HOOK_SOURCE)} tone="ok">
            {readouts ? <SliceIndicator viewportId={VIEWPORT_ID} /> : t.notMounted}
          </Readout>
        </div>
      </div>

      <div className="steps">
        <div className="steps__dots" aria-hidden>
          {stages.map((_, index) => (
            <span key={index} className={`dot ${index <= stepIndex ? 'dot--on' : ''}`} />
          ))}
        </div>
        <p className="steps__caption">
          {stage ? (
            <>
              <b>{stepIndex + 1}.</b> {story.captions[stepIndex]}
            </>
          ) : (
            t.preparing
          )}
        </p>
        <div className="steps__buttons">
          {!done && (
            <button
              className="button button--primary button--sm"
              disabled={!stage}
              onClick={() => setStepIndex((index) => index + 1)}
            >
              {t.next}
            </button>
          )}
          {stepIndex > 0 && (
            <button
              className="button button--secondary button--sm"
              onClick={() => setRun((count) => count + 1)}
            >
              {t.restart}
            </button>
          )}
        </div>
      </div>

      {done && <div className="verdict verdict--bad">{story.verdict}</div>}
    </Panel>
  );
}

function Readout({
  title,
  lines,
  tone,
  children,
}: {
  title: string;
  lines: number;
  tone: 'ok' | 'bad';
  children: ReactNode;
}) {
  return (
    <div className="card">
      <div className="card__head">
        {title} <span className={`badge badge--${tone}`}>{lines} lines</span>
      </div>
      <div className="card__body card__body--center">
        {typeof children === 'string' ? <span className="ind ind--empty">{children}</span> : children}
      </div>
    </div>
  );
}

/** Pages through slices on the last step, so the readouts can be seen following. */
function useAutoScroll(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const viewport = getEnabledElementByViewportId(VIEWPORT_ID)?.viewport as
        | Types.IStackViewport
        | undefined;
      if (!viewport) return;
      void viewport.setImageIdIndex((viewport.getSliceIndex() + 1) % viewport.getNumberOfSlices());
    }, 700);
    return () => clearInterval(id);
  }, [active]);
}
