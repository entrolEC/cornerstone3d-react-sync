import { useState } from 'react';

import { Catch, Code, Panel, useCopy } from './ui';
import { CtViewport } from './CtViewport';
import { SliceIndicator, HOOK_SOURCE } from './widgets';
import { SliceIndicatorNaive } from './naive';
import naiveSource from './naive.tsx?raw';

const VIEWPORT_ID = 'demo-wall';
const NAIVE_SOURCE = naiveSource.trim();

// A production React build ships error #185 as a bare code, so the page says
// which one it is and links to React's own page for it.
const minifiedCode = (message: string) => /Minified React error #(\d+)/.exec(message)?.[1];

export function Breakdown({ imageIds, theme }: { imageIds: string[]; theme: 'light' | 'dark' }) {
  const t = useCopy().panel2;
  const [tab, setTab] = useState<'naive' | 'hook'>('naive');
  // A key, not a boolean: remounting is what re-runs the experiment.
  const [attempt, setAttempt] = useState(0);
  const naive = tab === 'naive';

  return (
    <Panel eyebrow={t.eyebrow} title={t.title} lead={t.lead} alt>
      <div className="stage">
        <div className="stage__image">
          <CtViewport viewportId={VIEWPORT_ID} imageIds={imageIds} showOverlay={false} />
        </div>

        <div className="stage__readouts">
          <div className="card">
            <div className="card__head">
              {t.naiveTitle} <span className="badge badge--bad">{t.naiveBadge}</span>
            </div>
            <div className="card__body card__body--center">
              {attempt === 0 ? (
                <button className="button button--primary button--sm" onClick={() => setAttempt(1)}>
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

          <div className="card">
            <div className="card__head">
              {t.hookTitle} <span className="badge badge--ok">react-cornerstone3d</span>
            </div>
            <div className="card__body card__body--center">
              <SliceIndicator viewportId={VIEWPORT_ID} />
            </div>
          </div>
        </div>
      </div>

      {attempt > 0 && <div className="verdict verdict--bad">{t.verdict}</div>}

      <div className="tabs tabs--top" role="tablist">
        <button className="tab" role="tab" aria-selected={naive} onClick={() => setTab('naive')}>
          {t.tabNaive}
        </button>
        <button className="tab" role="tab" aria-selected={!naive} onClick={() => setTab('hook')}>
          {t.tabHook}
        </button>
      </div>
      <Code
        theme={theme}
        title={naive ? 'demo/naive.tsx' : 'demo/widgets.tsx'}
        code={naive ? NAIVE_SOURCE : HOOK_SOURCE}
      />
    </Panel>
  );
}
