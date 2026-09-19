import { useState } from 'react';
import { getEnabledElementByViewportId, type Types } from '@cornerstonejs/core';
import { Catch, Code, Panel, Steps, useCopy } from './ui';
import { CtViewport } from './CtViewport';
import { SliceIndicator } from './widgets';
import { SliceIndicatorNaive } from './naive';
import { useViewportState } from 'react-cornerstone3d';
import naiveSource from './naive.tsx?raw';

const VIEWPORT_ID = 'demo-wall';
const NAIVE_SOURCE = naiveSource.trim();
const STEPS = 5;

// A production React build ships error #185 as a bare code, so the page says
// what failed in words and links React's own page for it.
const minifiedCode = (message: string) => /Minified React error #(\d+)/.exec(message)?.[1];

export function Breakdown({ imageIds, theme }: { imageIds: string[]; theme: 'light' | 'dark' }) {
  const t = useCopy().panel2;
  const common = useCopy().common;
  const [step, setStep] = useState(0);
  // A key, not a flag: remounting is what re-runs the experiment.
  const [attempt, setAttempt] = useState(0);

  const restart = () => {
    setStep(0);
    setAttempt(0);
  };

  return (
    <Panel eyebrow={t.eyebrow} title={t.title} lead={t.lead} alt>
      <div className="stage">
        <div className="stage__image">
          <CtViewport viewportId={VIEWPORT_ID} imageIds={imageIds} showOverlay={false} />
        </div>
        <div className="focus">
          {step === 0 && <Code theme={theme} title="demo/naive.tsx" code={NAIVE_SOURCE} />}
          {step === 1 && <RuleBox />}
          {step === 2 && <IdentityProbe viewportId={VIEWPORT_ID} />}
          {step === 3 && (
            <div className="card">
              <div className="card__head">
                {t.naiveTitle} <span className="badge badge--bad">{t.naiveBadge}</span>
              </div>
              <div className="card__body card__body--center">
                {attempt === 0 ? (
                  <button
                    className="button button--primary button--sm"
                    onClick={() => setAttempt(1)}
                  >
                    {t.run}
                  </button>
                ) : (
                  <Catch
                    key={attempt}
                    fallback={(error) => {
                      const code = minifiedCode(error.message);
                      return (
                        <div className="crash">
                          <div className="crash__label">{t.crashed}</div>
                          <p className="crash__loop">{t.loop}</p>
                          <p className="crash__message">{error.message}</p>
                          {code && (
                            <a
                              className="crash__link"
                              href={`https://react.dev/errors/${code}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {t.decode} → react.dev/errors/{code}
                            </a>
                          )}
                          <button
                            className="button button--secondary button--sm"
                            onClick={() => setAttempt((n) => n + 1)}
                          >
                            {t.again}
                          </button>
                        </div>
                      );
                    }}
                  >
                    <SliceIndicatorNaive viewportId={VIEWPORT_ID} />
                  </Catch>
                )}
              </div>
            </div>
          )}
          {step === 4 && (
            <div className="focus__stack">
              <div className="card">
                <div className="card__head">
                  {t.hookTitle} <span className="badge badge--ok">react-cornerstone3d</span>
                </div>
                <div className="card__body card__body--center">
                  <SliceIndicator viewportId={VIEWPORT_ID} />
                </div>
              </div>
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
        onRestart={restart}
      />

      {step === STEPS - 1 && <div className="verdict verdict--ok">{t.verdict}</div>}
    </Panel>
  );
}

/** The rule that makes the next step mean something. */
function RuleBox() {
  const t = useCopy().panel2.rules;
  return (
    <div className="probe">
      <p className="probe__title">{t.title}</p>
      <ol className="rules">
        {t.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </div>
  );
}

/**
 * Calls getSnapshot twice in a row with nothing in between, and reports
 * whether the two results are the same object. Both rows come back false:
 * one for an object we compose, one straight out of an engine getter.
 */
function IdentityProbe({ viewportId }: { viewportId: string }) {
  const t = useCopy().panel2.probe;
  const viewport = getEnabledElementByViewportId(viewportId)?.viewport as
    | Types.IStackViewport
    | undefined;
  if (!viewport) return null;

  const compose = () => ({ slice: viewport.getSliceIndex(), total: viewport.getNumberOfSlices() });

  return (
    <div className="probe">
      <p className="probe__title">{t.title}</p>
      <ProbeRow
        what={t.composedWhat}
        code={t.composed}
        same={Object.is(compose(), compose())}
      />
      <ProbeRow
        what={t.cameraWhat}
        code={t.camera}
        same={Object.is(viewport.getCamera(), viewport.getCamera())}
      />
    </div>
  );
}

/** The same two reads against the hook: one shared snapshot, one reference. */
function SnapshotProbe({ viewportId }: { viewportId: string }) {
  const t = useCopy().panel2.probe;
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
  const t = useCopy().panel2.probe;
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
