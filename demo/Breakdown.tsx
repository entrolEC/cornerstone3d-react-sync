import { useState, type ReactNode } from 'react';
import { useViewportState } from 'react-cornerstone3d';
import { Catch, Code, Panel, Steps, useCopy } from './ui';
import { CtViewport } from './CtViewport';
import { SliceAndTotal } from './two-values';
import { SliceAndTotalByHooks } from './two-hooks';
import { CameraByHooks } from './camera-by-hooks';
import { WholeState } from './whole-state';
import { readTwice } from './read-twice';
import twoValuesSource from './two-values.tsx?raw';
import twoHooksSource from './two-hooks.tsx?raw';
import cameraSource from './camera-by-hooks.tsx?raw';
import wholeStateSource from './whole-state.tsx?raw';
import readTwiceSource from './read-twice.ts?raw';

const VIEWPORT_ID = 'demo-wall';
const STEPS = 6;

// A production React build ships error #185 as a bare code, so the page says
// what failed in words and links React's own page for it.
const minifiedCode = (message: string) => /Minified React error #(\d+)/.exec(message)?.[1];

export function Breakdown({ imageIds, theme }: { imageIds: string[]; theme: 'light' | 'dark' }) {
  const t = useCopy().panel3;
  const common = useCopy().common;
  const [step, setStep] = useState(0);
  // A key, not a flag: remounting is what re-runs the experiment.
  const [attempt, setAttempt] = useState(0);

  return (
    <Panel eyebrow={t.eyebrow} title={t.title} lead={t.lead}>
      <div className="stage">
        <div className="stage__image">
          <CtViewport viewportId={VIEWPORT_ID} imageIds={imageIds} showOverlay={false} />
        </div>

        <div className="focus">
          {step === 0 && <Code theme={theme} title="demo/two-values.tsx" code={twoValuesSource.trim()} />}
          {step === 1 && (
            <div className="focus__stack">
              <IdentityProbe viewportId={VIEWPORT_ID} />
              <Code theme={theme} title="demo/read-twice.ts" code={readTwiceSource.trim()} />
            </div>
          )}

          {step === 2 && (
            <Card title={t.naiveTitle} badge={t.naiveBadge} tone="bad">
              {attempt === 0 ? (
                <button className="button button--primary button--sm" onClick={() => setAttempt(1)}>
                  {t.run}
                </button>
              ) : (
                <Catch key={attempt} fallback={(error) => <Crash error={error} />}>
                  <SliceAndTotal viewportId={VIEWPORT_ID} />
                </Catch>
              )}
            </Card>
          )}

          {step === 3 && (
            <div className="focus__stack">
              <Card title="useSyncExternalStore × 2" badge={t.naiveBadge} tone="ok">
                <SliceAndTotalByHooks viewportId={VIEWPORT_ID} />
              </Card>
              <Code theme={theme} title="demo/two-hooks.tsx" code={twoHooksSource.trim()} />
            </div>
          )}

          {step === 4 && (
            <div className="focus__stack">
              <Card title="useSyncExternalStore × 10" badge={t.naiveBadge} tone="ok">
                <CameraByHooks viewportId={VIEWPORT_ID} />
              </Card>
              <Code theme={theme} title="demo/camera-by-hooks.tsx" code={cameraSource.trim()} />
            </div>
          )}

          {step === 5 && (
            <div className="focus__stack">
              <Card title={t.hookTitle} badge="react-cornerstone3d" tone="ok">
                <WholeState viewportId={VIEWPORT_ID} />
              </Card>
              <Code theme={theme} title="demo/whole-state.tsx" code={wholeStateSource.trim()} />
              <SnapshotProbe viewportId={VIEWPORT_ID} />
            </div>
          )}
        </div>
      </div>

      <Steps
        count={STEPS}
        index={step}
        caption={t.captions[step]}
        preparing={common.preparing}
        next={common.next}
        restart={common.restart}
        onNext={() => setStep((n) => n + 1)}
        onRestart={() => {
          setStep(0);
          setAttempt(0);
        }}
      />

      {step === STEPS - 1 && <div className="verdict verdict--ok">{t.verdict}</div>}
    </Panel>
  );
}

function Card({
  title,
  badge,
  tone,
  children,
}: {
  title: string;
  badge: string;
  tone: 'ok' | 'bad';
  children: ReactNode;
}) {
  return (
    <div className="card">
      <div className="card__head">
        {title} <span className={`badge badge--${tone}`}>{badge}</span>
      </div>
      <div className="card__body card__body--center">{children}</div>
    </div>
  );
}

function Crash({ error }: { error: Error }) {
  const t = useCopy().panel3;
  const code = minifiedCode(error.message);
  return (
    <div className="crash">
      <div className="crash__label">{t.crashed}</div>
      <p className="crash__loop">{t.loop}</p>
      <p className="crash__message">{error.message}</p>
      {code && (
        <a className="crash__link" href={`https://react.dev/errors/${code}`} target="_blank" rel="noreferrer">
          {t.decode} → react.dev/errors/{code}
        </a>
      )}
    </div>
  );
}

/**
 * Calls getSnapshot twice in a row with nothing in between, and reports
 * whether the two results are the same object. Both rows come back false:
 * one for an object we compose, one straight out of an engine getter.
 */
function IdentityProbe({ viewportId }: { viewportId: string }) {
  const t = useCopy().panel3.probe;
  const result = readTwice(viewportId);
  if (!result) return null;

  return (
    <div className="probe">
      <p className="probe__title">{t.title}</p>
      <ProbeRow what={t.composedWhat} code={t.composed} same={result.composed} />
      <ProbeRow what={t.cameraWhat} code={t.camera} same={result.fromEngine} />
    </div>
  );
}

/** The same two reads against the hook: one shared snapshot, one reference. */
function SnapshotProbe({ viewportId }: { viewportId: string }) {
  const t = useCopy().panel3.probe;
  const first = useViewportState(viewportId);
  const second = useViewportState(viewportId);

  return (
    <div className="probe">
      <p className="probe__title">{t.snapshotTitle}</p>
      <ProbeRow what={t.snapshotWhat} code={t.snapshot} same={Object.is(first, second)} />
    </div>
  );
}

function ProbeRow({ what, code, same }: { what: string; code: string; same: boolean }) {
  const t = useCopy().panel3.probe;
  return (
    <div className="probe__row">
      <span className="probe__label">
        {what}
        <code>{code}</code>
      </span>
      <span className="probe__result">
        <code>Object.is → {String(same)}</code>
        <span className={`badge badge--${same ? 'ok' : 'bad'}`}>{same ? t.same : t.diff}</span>
      </span>
    </div>
  );
}
