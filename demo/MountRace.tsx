import { useEffect, useRef, useState, type ReactNode } from 'react';
import { getEnabledElementByViewportId, type Types } from '@cornerstonejs/core';
import { Panel } from './ui';
import { CtViewport } from './CtViewport';
import {
  BY_HAND_SOURCE,
  HOOK_SOURCE,
  SliceIndicator,
  SliceIndicatorByHand,
  lineCount,
} from './widgets';

const VIEWPORT_ID = 'demo-race';

interface Step {
  /** 영상이 화면에 붙어 있는지 */
  image: boolean;
  /** 표시기 두 개가 화면에 있는지 */
  readouts: boolean;
  /** 이 단계에서 슬라이스를 자동으로 넘겨본다 */
  scroll?: boolean;
  caption: ReactNode;
}

interface Story {
  tab: string;
  intro: ReactNode;
  /** 표시기보다 먼저 영상이 있어야 하는 이야기인지 — 순서가 전부다. */
  imageFirst: boolean;
  steps: Step[];
  verdict: ReactNode;
}

const STORIES: Story[] = [
  {
    tab: '영상이 화면보다 늦게 온다',
    intro: (
      <>
        환자 목록에서 검사를 엽니다. 뷰어 화면은 바로 그려지고, 영상은 서버에서 받아온 뒤에
        붙습니다. React 앱에서 가장 흔한 순서입니다.
      </>
    ),
    imageFirst: false,
    steps: [
      {
        image: false,
        readouts: true,
        caption: (
          <>
            뷰어 화면이 먼저 열렸습니다. <b>슬라이스 표시기 두 개도 이때 같이 만들어졌고</b>,
            아직 읽을 영상이 없으니 둘 다 비어 있습니다.
          </>
        ),
      },
      {
        image: true,
        readouts: true,
        caption: (
          <>
            영상이 도착해 화면에 붙었습니다. <b>useViewportState 쪽은 바로 숫자가 찼습니다.</b>{' '}
            직접 짠 쪽은 그대로 비어 있습니다.
          </>
        ),
      },
      {
        image: true,
        readouts: true,
        scroll: true,
        caption: (
          <>
            슬라이스를 넘겨봅니다. 직접 짠 쪽은 <b>끝까지 비어 있습니다</b> — 만들어질 때 영상이
            없어서 구독을 포기했고, 다시 시도할 계기가 없기 때문입니다.
          </>
        ),
      },
    ],
    verdict: (
      <>
        이게 <code>useEffect</code> + <code>addEventListener</code> 조합이 놓치는 첫 번째
        지점입니다. "영상이 아직 없다"를 한 번만 확인하고 끝내니까요. 훅은 영상이 등록되는 순간을
        계속 듣고 있다가 알아서 채웁니다.
      </>
    ),
  },
  {
    tab: '보던 검사를 닫는다',
    intro: <>이번엔 반대 순서입니다. 영상이 이미 떠 있는 화면에서 시작해, 사용자가 검사를 닫습니다.</>,
    imageFirst: true,
    steps: [
      {
        image: true,
        readouts: true,
        caption: (
          <>
            영상이 이미 떠 있는 상태에서 표시기가 만들어졌습니다. 이 순서에서는{' '}
            <b>둘 다 정상으로 동작합니다.</b>
          </>
        ),
      },
      {
        image: false,
        readouts: true,
        caption: (
          <>
            검사를 닫았습니다. 영상은 사라졌는데 <b>직접 짠 쪽은 방금 전 숫자를 그대로 붙잡고
            있습니다</b> — 존재하지 않는 영상의 슬라이스 번호입니다.
          </>
        ),
      },
    ],
    verdict: (
      <>
        훅은 <code>—</code>로 비웁니다. 영상이 없는 상태는 오류가 아니라 정상 상태이고, 훅이 그걸{' '}
        <code>undefined</code>로 돌려주기 때문입니다.
      </>
    ),
  },
];

export function MountRace({ imageIds }: { imageIds: string[] }) {
  const [storyIndex, setStoryIndex] = useState(0);
  // -1 = 이야기 시작 전. 표시기는 아직 없고, 영상만 이야기가 요구하는 상태로 둔다.
  const [stepIndex, setStepIndex] = useState(-1);
  const [run, setRun] = useState(0);

  const story = STORIES[storyIndex];
  const step = story.steps[stepIndex];
  const done = stepIndex === story.steps.length - 1;

  const image = step ? step.image : story.imageFirst;
  const readouts = step?.readouts ?? false;

  // 탭을 바꾸면 영상만 먼저 제자리에 두고, 한 박자 뒤 첫 걸음에서 표시기를 만든다.
  // 이 한 박자가 이야기의 전부다 — 둘 중 무엇이 먼저 존재했는가.
  useEffect(() => {
    setStepIndex(-1);
    const id = setTimeout(() => setStepIndex(0), 450);
    return () => clearTimeout(id);
  }, [storyIndex, run]);

  useAutoScroll(step?.scroll === true && image);

  return (
    <Panel
      eyebrow="패널 2"
      title="줄 수가 아니라, 남아있는 버그가 문제입니다"
      lead={
        <>
          아래 표시기 두 개는 <b>패널 1과 똑같은 코드</b>입니다. 영상과 표시기 중 무엇이 먼저
          생기느냐에 따라 결과가 갈립니다 — 그리고 그 순서는 앱이 정하는 게 아니라, 네트워크와
          사용자가 정합니다.
        </>
      }
    >
      <div className="tabs" style={{ marginBottom: '1.25rem' }} role="tablist">
        {STORIES.map((candidate, index) => (
          <button
            key={candidate.tab}
            className="tab"
            role="tab"
            aria-selected={index === storyIndex}
            onClick={() => setStoryIndex(index)}
          >
            상황 {index + 1}. {candidate.tab}
          </button>
        ))}
      </div>

      <p className="panel__lead" style={{ marginBottom: '1.25rem' }}>
        {story.intro}
      </p>

      <div className="stage">
        <div className="stage__image">
          {image ? (
            <CtViewport viewportId={VIEWPORT_ID} imageIds={imageIds} showOverlay={false} />
          ) : (
            <div className="vp vp--off">아직 영상이 없음</div>
          )}
          <div className="stage__label">영상</div>
        </div>

        <div className="stage__readouts">
          <Readout
            title="useEffect + addEventListener"
            lines={lineCount(BY_HAND_SOURCE)}
            tone="bad"
          >
            {readouts ? <SliceIndicatorByHand viewportId={VIEWPORT_ID} /> : null}
          </Readout>
          <Readout title="useViewportState" lines={lineCount(HOOK_SOURCE)} tone="ok">
            {readouts ? <SliceIndicator viewportId={VIEWPORT_ID} /> : null}
          </Readout>
        </div>
      </div>

      <div className="steps">
        <div className="steps__dots">
          {story.steps.map((_, index) => (
            <span
              key={index}
              className={`dot ${index <= stepIndex ? 'dot--on' : ''}`}
              aria-hidden
            />
          ))}
        </div>
        <p className="steps__caption">
          {step ? (
            <>
              <b>{stepIndex + 1}.</b> {step.caption}
            </>
          ) : (
            '준비 중…'
          )}
        </p>
        <div className="steps__buttons">
          {!done && (
            <button
              className="button button--primary button--sm"
              disabled={!step}
              onClick={() => setStepIndex((index) => index + 1)}
            >
              다음 →
            </button>
          )}
          {stepIndex > 0 && (
            <button
              className="button button--secondary button--sm"
              onClick={() => setRun((count) => count + 1)}
            >
              처음부터
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
      <div className="card__body" style={{ textAlign: 'center' }}>
        {children ?? <span className="ind ind--empty">아직 화면에 없음</span>}
      </div>
    </div>
  );
}

/** 마지막 단계에서 슬라이스를 천천히 넘겨, 표시기가 따라오는지 보여준다. */
function useAutoScroll(active: boolean) {
  const ref = useRef(active);
  ref.current = active;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const viewport = getEnabledElementByViewportId(VIEWPORT_ID)?.viewport as
        | Types.IStackViewport
        | undefined;
      if (!viewport) return;
      const next = (viewport.getSliceIndex() + 1) % viewport.getNumberOfSlices();
      void viewport.setImageIdIndex(next);
    }, 700);
    return () => clearInterval(id);
  }, [active]);
}
