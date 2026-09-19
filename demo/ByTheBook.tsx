import { useState } from 'react';
import { Code, Panel, Steps, useCopy } from './ui';
import { CtViewport, useAutoScroll } from './CtViewport';
import { SliceNumberOnly } from './one-number';
import source from './one-number.tsx?raw';

const VIEWPORT_ID = 'demo-book';
const SOURCE = source.trim();
const STEPS = 3;

export function ByTheBook({ imageIds, theme }: { imageIds: string[]; theme: 'light' | 'dark' }) {
  const t = useCopy().panel2;
  const common = useCopy().common;
  const [step, setStep] = useState(0);

  // The last step is the claim "it works", so the image has to be moving.
  useAutoScroll(VIEWPORT_ID, step === STEPS - 1);

  return (
    <Panel eyebrow={t.eyebrow} title={t.title} lead={t.lead} alt>
      <div className="stage">
        <div className="stage__image">
          <CtViewport viewportId={VIEWPORT_ID} imageIds={imageIds} showOverlay={false} />
        </div>
        <div className="focus">
          {step === 0 && <Code theme={theme} title="demo/one-number.tsx" code={SOURCE} />}
          {step === 1 && <RuleBox />}
          {step === 2 && (
            <div className="card">
              <div className="card__head">
                {t.cardTitle} <span className="badge badge--ok">{t.cardBadge}</span>
              </div>
              <div className="card__body card__body--center">
                <SliceNumberOnly viewportId={VIEWPORT_ID} />
              </div>
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
        onRestart={() => setStep(0)}
      />

      {step === STEPS - 1 && <div className="verdict verdict--ok">{t.verdict}</div>}
    </Panel>
  );
}

/** React's contract for getSnapshot — the rule panel 3 then breaks. */
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
