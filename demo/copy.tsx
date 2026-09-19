import type { ReactNode } from 'react';

export type Lang = 'ko' | 'en';

interface StoryCopy {
  tab: string;
  intro: ReactNode;
  /** One per visible step, in order. */
  captions: ReactNode[];
  verdict: ReactNode;
}

export interface Copy {
  htmlLang: string;
  common: { copy: string; copied: string; next: string; restart: string; preparing: string };
  nav: { theme: string };
  hero: {
    chips: string[];
    title: ReactNode;
    sub: ReactNode;
    demo: string;
    github: string;
  };
  loading: string;
  failed: string;
  panel1: {
    eyebrow: string;
    title: string;
    lead: ReactNode;
    tabHook: string;
    tabByHand: string;
    lines: (n: number) => string;
    viewportHint: string;
    running: string;
    note: ReactNode;
  };
  panel2: {
    eyebrow: string;
    title: string;
    lead: ReactNode;
    cardTitle: string;
    cardBadge: string;
    rules: { title: string; items: string[] };
    captions: ReactNode[];
    verdict: ReactNode;
  };
  panel3: {
    eyebrow: string;
    title: string;
    lead: ReactNode;
    naiveTitle: string;
    hookTitle: string;
    naiveBadge: string;
    run: string;
    again: string;
    crashed: string;
    loop: string;
    decode: string;
    probe: {
      title: string;
      snapshotTitle: string;
      composedWhat: string;
      composed: string;
      cameraWhat: string;
      camera: string;
      snapshotWhat: string;
      snapshot: string;
      same: string;
      diff: string;
    };
    captions: ReactNode[];
    verdict: ReactNode;
  };
  panel4: {
    eyebrow: string;
    title: string;
    lead: ReactNode;
    imageLabel: string;
    imageOff: string;
    notMounted: string;
    stories: StoryCopy[];
  };
  footer: ReactNode;
}

export const COPY: Record<Lang, Copy> = {
  ko: {
    htmlLang: 'ko',
    common: { copy: '복사', copied: '복사됨', next: '다음 →', restart: '처음부터', preparing: '준비 중…' },
    nav: { theme: '테마 전환' },
    hero: {
      chips: ['v0.2', 'MIT', 'ESM'],
      title: <>Cornerstone3D의 엔진 상태를, React 상태로</>,
      sub: (
        <>
          뷰포트 상태를 읽는 <code>useSyncExternalStore</code> 바인딩. tearing 없이, Provider
          없이, 여러분의 엔진 관리 방식은 그대로 둔 채로.
        </>
      ),
      demo: '데모 보기',
      github: 'GitHub',
    },
    loading: 'CT 시리즈를 불러오는 중…',
    failed: 'DICOM 데이터를 불러오지 못했습니다',
    panel1: {
      eyebrow: '패널 1',
      title: '훅 한 번 호출이 위젯 하나의 배선을 전부 대신합니다',
      lead: (
        <>
          아래 CT는 진짜 Cornerstone3D 엔진입니다. 스크롤하거나 슬라이더를 움직이면 슬라이스가
          바뀌고, 옆의 위젯은 그 변화를 React 상태로 읽습니다. 탭을 바꾸면{' '}
          <b>지금 화면에서 실제로 실행 중인 구현</b>이 바뀝니다.
        </>
      ),
      tabHook: 'useViewportState',
      tabByHand: '직접 배선',
      lines: (n) => `${n}줄`,
      viewportHint: '스크롤 또는 슬라이더로 슬라이스 이동',
      running: '실행 중인 위젯',
      note: (
        <>
          <strong>오른쪽 코드는 지어낸 게 아닙니다.</strong>
          <p>
            이 페이지가 실제로 import해서 렌더링하는 파일(<code>demo/widgets.tsx</code>)에서 그대로
            뽑아옵니다. 직접 배선한 쪽은 Cornerstone3D + React 프로젝트가 위젯마다 반복해서 쓰는
            바로 그 패턴입니다.
          </p>
          <p>
            그런데 줄 수는 문제의 작은 쪽입니다. 저 코드가 하는 일은 결국{' '}
            <b>엔진이 이미 갖고 있는 상태를 <code>setState</code>로 한 벌 더 복사해 두는 것</b>
            입니다. 사본은 늦게 도착하고, 오래되고, 옆 위젯의 사본과 어긋납니다. React 18이{' '}
            <code>useSyncExternalStore</code>를 추가한 이유가 정확히 이겁니다 —{' '}
            <b>외부 상태는 복사하지 말고 구독해서 읽으라</b>는 것. 그럼 그걸 쓰면 되지 않을까요?
            다음 패널에서 씁니다. ↓
          </p>
        </>
      ),
    },
    panel2: {
      eyebrow: '패널 2',
      title: 'React가 준비해 둔 정답으로 다시 짜봅니다',
      lead: (
        <>
          패널 1의 코드는 엔진이 이미 갖고 있는 상태를 React state로 복사했습니다. React 18에는
          복사하지 않고 <b>구독해서 그때그때 읽는</b> 공식 훅이 따로 있습니다 —{' '}
          <code>useSyncExternalStore</code>. 그게 어떻게 생긴 물건인지부터 봅니다.
        </>
      ),
      cardTitle: 'useSyncExternalStore',
      cardBadge: '직접',
      rules: {
        title: 'React가 getSnapshot 을 쓰는 방법',
        items: [
          '렌더할 때마다 getSnapshot() 을 호출한다',
          '지난번에 받은 값과 Object.is 로 비교한다',
          '다르면 상태가 바뀐 것으로 보고 다시 렌더한다',
        ],
      },
      captions: [
        <>
          인자는 두 개입니다. 첫째는 <b>구독 함수</b> — 값이 바뀌면 React에게 알려줄 방법을
          등록합니다. 둘째가 <b><code>getSnapshot</code></b> — React가 <i>"지금 값 줘"</i> 하고
          부를 때 실행되는 함수입니다. 여기서는 슬라이스 번호 <b>하나만</b> 돌려줍니다.
        </>,
        <>
          React는 그 <code>getSnapshot</code>을 이렇게 씁니다. 지금은 <b>3번</b>만 기억해
          두세요 — 비교가 <code>Object.is</code>라는 것.
        </>,
        <>
          그리고 <b>실제로 잘 동작합니다.</b> 영상이 넘어갈 때마다 숫자가 따라옵니다.{' '}
          <code>setState</code> 사본도 없고, 첫 렌더와 구독 사이의 틈을 메우는 코드도 필요
          없습니다. <b>여기까지는 라이브러리가 필요 없습니다.</b>
        </>,
      ],
      verdict: (
        <>
          이게 정답입니다. Cornerstone3D 상태를 React로 읽는 가장 바른 방법이고, 이 라이브러리도
          속에서는 정확히 이걸 씁니다. — 그런데 <b>값 하나로 끝나는 화면은 없습니다.</b>
        </>
      ),
    },
    panel3: {
      eyebrow: '패널 3',
      title: '값이 둘이 되는 순간, 막힙니다',
      lead: (
        <>
          슬라이스 번호만 띄우는 화면은 없습니다. 보통 <code>68 / 135</code>처럼 전체 장수도
          같이 보여주죠. 값이 둘이 되면 <code>getSnapshot</code>은 <b>객체</b>를 돌려줘야
          합니다. 딱 그 지점에서 막힙니다.
        </>
      ),
      naiveTitle: 'useSyncExternalStore',
      hookTitle: 'useViewportState',
      naiveBadge: '직접',
      run: '마운트하기',
      again: '다시',
      crashed: 'React가 던진 에러',
      loop: '무한 렌더 루프 — React가 렌더링을 중단했습니다',
      decode: '에러 코드 해설',
      probe: {
        title: '화면에서 아무 일도 일어나지 않은 동안, getSnapshot 을 두 번 호출했습니다',
        snapshotTitle: '2번과 똑같은 실험, 이번엔 훅으로',
        composedWhat: '내가 만든 객체를 반환할 때',
        composed: 'return { slice, total }',
        cameraWhat: '엔진이 준 객체를 그대로 반환할 때',
        camera: 'return viewport.getCamera()',
        snapshotWhat: '훅이 준 스냅샷을 두 번 읽을 때',
        snapshot: 'useViewportState(id)',
        same: '같은 객체',
        diff: '다른 객체',
      },
      captions: [
        <>
          패널 2의 코드에서 <b>바뀐 곳은 한 군데</b>입니다 — <code>getSnapshot</code>이 숫자
          대신 <code>{'{ slice, total }'}</code> 객체를 돌려줍니다. 누구라도 이렇게 씁니다.
        </>,
        <>
          그런데 <code>getSnapshot</code>을 연달아 두 번 불러보면, 그 사이{' '}
          <b>화면에서는 아무 일도 없었는데</b> 매번 다른 객체가 나옵니다. 내가 만들어 반환하든,
          엔진이 준 걸 그대로 반환하든 똑같습니다.
        </>,
        <>
          패널 2의 <b>3번 규칙</b>을 떠올려 보세요 — 비교가 <code>Object.is</code>입니다. 객체가
          매번 다르니 React는 <b>매번 상태가 바뀐 것</b>으로 봅니다. 그래서 다시 렌더하고, 또
          부르고, 또 다른 객체를 받고… 눌러서 확인해 보세요. 에러 경계가 없으면 페이지 전체가
          죽습니다.
        </>,
        <>
          <code>useViewportState</code>는 엔진 이벤트가 올 때만 스냅샷을 새로 만들고, 그 사이에는{' '}
          <b>같은 객체를 그대로 돌려줍니다.</b> 2번과 똑같은 실험인데 결과가 반대입니다.
        </>,
      ],
      verdict: (
        <>
          <b>이 벽은 위젯 안에서 넘을 수 없습니다.</b> 참조가 안정되려면 스냅샷을 한 뷰포트의 모든
          소비자가 공유해야 하고, 그건 중앙에 있어야만 가능합니다. 남은 선택지는{' '}
          <code>useSyncExternalStore</code>를 포기하고 패널 1의{' '}
          <code>useEffect + setState</code>로 돌아가는 것뿐인데 — 그게 바로 tearing이 생기는
          경로입니다.
        </>
      ),
    },
    panel4: {
      eyebrow: '패널 4',
      title: '줄 수가 아니라, 남아있는 버그가 문제입니다',
      lead: (
        <>
          아래 표시기 두 개는 <b>패널 1과 똑같은 코드</b>입니다. 영상과 표시기 중 무엇이 먼저
          생기느냐에 따라 결과가 갈립니다 — 그리고 그 순서는 앱이 정하는 게 아니라, 네트워크와
          사용자가 정합니다.
        </>
      ),
      imageLabel: '영상',
      imageOff: '아직 영상이 없음',
      notMounted: '아직 화면에 없음',
      stories: [
        {
          tab: '영상이 화면보다 늦게 온다',
          intro: (
            <>
              환자 목록에서 검사를 엽니다. 뷰어 화면은 바로 그려지고, 영상은 서버에서 받아온 뒤에
              붙습니다. React 앱에서 가장 흔한 순서입니다.
            </>
          ),
          captions: [
            <>
              뷰어 화면이 먼저 열렸습니다. <b>슬라이스 표시기 두 개도 이때 같이 만들어졌고</b>,
              아직 읽을 영상이 없으니 둘 다 비어 있습니다.
            </>,
            <>
              영상이 도착해 화면에 붙었습니다.{' '}
              <b>useViewportState 쪽은 바로 숫자가 찼습니다.</b> 직접 짠 쪽은 그대로 비어
              있습니다.
            </>,
            <>
              슬라이스를 넘겨봅니다. 직접 짠 쪽은 <b>끝까지 비어 있습니다</b> — 만들어질 때 영상이
              없어서 구독을 포기했고, 다시 시도할 계기가 없기 때문입니다.
            </>,
          ],
          verdict: (
            <>
              이게 <code>useEffect</code> + <code>addEventListener</code> 조합이 놓치는 첫 번째
              지점입니다. "영상이 아직 없다"를 한 번만 확인하고 끝내니까요. 훅은 영상이 등록되는
              순간을 계속 듣고 있다가 알아서 채웁니다.
            </>
          ),
        },
        {
          tab: '보던 검사를 닫는다',
          intro: (
            <>이번엔 반대 순서입니다. 영상이 이미 떠 있는 화면에서 시작해, 사용자가 검사를 닫습니다.</>
          ),
          captions: [
            <>
              영상이 이미 떠 있는 상태에서 표시기가 만들어졌습니다. 이 순서에서는{' '}
              <b>둘 다 정상으로 동작합니다.</b>
            </>,
            <>
              검사를 닫았습니다. 영상은 사라졌는데{' '}
              <b>직접 짠 쪽은 방금 전 숫자를 그대로 붙잡고 있습니다</b> — 존재하지 않는 영상의
              슬라이스 번호입니다.
            </>,
          ],
          verdict: (
            <>
              훅은 <code>—</code>로 비웁니다. 영상이 없는 상태는 오류가 아니라 정상 상태이고, 훅이
              그걸 <code>undefined</code>로 돌려주기 때문입니다.
            </>
          ),
        },
      ],
    },
    footer: (
      <>
        영상 데이터는 Cornerstone3D 공식 예제가 사용하는 공개 CT 시리즈입니다.
      </>
    ),
  },

  en: {
    htmlLang: 'en',
    common: { copy: 'Copy', copied: 'Copied', next: 'Next →', restart: 'Start over', preparing: 'Setting up…' },
    nav: { theme: 'Toggle theme' },
    hero: {
      chips: ['v0.2', 'MIT', 'ESM'],
      title: <>Cornerstone3D engine state, as React state</>,
      sub: (
        <>
          A <code>useSyncExternalStore</code> binding that reads viewport state. No tearing, no
          Provider, and your engine management stays exactly as it is.
        </>
      ),
      demo: 'See the demo',
      github: 'GitHub',
    },
    loading: 'Loading the CT series…',
    failed: 'Could not load the DICOM data',
    panel1: {
      eyebrow: 'Panel 1',
      title: 'One hook call replaces a whole widget’s wiring',
      lead: (
        <>
          The CT below is a real Cornerstone3D engine. Scroll it or drag the slider and the slice
          changes; the widget beside it reads that change as React state. Switching tabs swaps{' '}
          <b>the implementation actually running on this page</b>.
        </>
      ),
      tabHook: 'useViewportState',
      tabByHand: 'Hand-rolled',
      lines: (n) => `${n} lines`,
      viewportHint: 'Scroll or drag the slider to change slice',
      running: 'Currently running',
      note: (
        <>
          <strong>The code on the right isn’t an illustration.</strong>
          <p>
            It is pulled from the file this page actually imports and renders
            (<code>demo/widgets.tsx</code>), and the hand-rolled side is the very pattern every
            Cornerstone3D + React project repeats per widget.
          </p>
          <p>
            But the line count is the smaller half of the problem. What that code does is{' '}
            <b>keep a second copy of state the engine already owns</b>, pushed across by{' '}
            <code>setState</code>. Copies arrive late, go stale, and disagree with the copy in
            the widget next to them. That is exactly why React 18 added{' '}
            <code>useSyncExternalStore</code> — <b>don’t copy external state, subscribe and read
            it</b>. So why not just use that? The next panel does. ↓
          </p>
        </>
      ),
    },
    panel2: {
      eyebrow: 'Panel 2',
      title: 'Rewrite it with the answer React already ships',
      lead: (
        <>
          The code in panel 1 copied state the engine already owns into React state. React 18
          ships an official hook that doesn’t copy it but{' '}
          <b>subscribes and reads it on demand</b> — <code>useSyncExternalStore</code>. Let’s see
          what it looks like first.
        </>
      ),
      cardTitle: 'useSyncExternalStore',
      cardBadge: 'by hand',
      rules: {
        title: 'How React uses getSnapshot',
        items: [
          'Call getSnapshot() on every render',
          'Compare the result with the previous one using Object.is',
          'If they differ, treat the state as changed and render again',
        ],
      },
      captions: [
        <>
          It takes two arguments. The first is a <b>subscribe function</b> — it registers how
          React gets told the value changed. The second is{' '}
          <b><code>getSnapshot</code></b> — what React calls when it wants{' '}
          <i>“the value, now”</i>. Here it returns <b>one thing</b>: the slice number.
        </>,
        <>
          Here is how React uses that <code>getSnapshot</code>. For now just remember{' '}
          <b>line 3</b> — the comparison is <code>Object.is</code>.
        </>,
        <>
          And <b>it works.</b> The number follows every time the image moves. No{' '}
          <code>setState</code> copy, and nothing to patch the gap between first render and
          subscription. <b>No library needed so far.</b>
        </>,
      ],
      verdict: (
        <>
          This is the right answer. It is the correct way to read Cornerstone3D state from
          React, and this library uses exactly this underneath. — Except that{' '}
          <b>no real screen needs only one value.</b>
        </>
      ),
    },
    panel3: {
      eyebrow: 'Panel 3',
      title: 'The moment there are two values',
      lead: (
        <>
          No screen shows just a slice number. It usually shows <code>68 / 135</code> — the
          total as well. Two values mean <code>getSnapshot</code> has to hand back an{' '}
          <b>object</b>. That is where it stops.
        </>
      ),
      naiveTitle: 'useSyncExternalStore',
      hookTitle: 'useViewportState',
      naiveBadge: 'by hand',
      run: 'Mount it',
      again: 'Again',
      crashed: 'The error React threw',
      loop: 'Infinite render loop — React aborted rendering',
      decode: 'What that code means',
      probe: {
        title: 'Nothing happened on screen. getSnapshot was called twice anyway:',
        snapshotTitle: 'The same experiment as step 2, now with the hook',
        composedWhat: 'returning an object you build',
        composed: 'return { slice, total }',
        cameraWhat: 'returning what the engine gives you',
        camera: 'return viewport.getCamera()',
        snapshotWhat: 'reading the hook’s snapshot twice',
        snapshot: 'useViewportState(id)',
        same: 'same object',
        diff: 'different object',
      },
      captions: [
        <>
          Exactly <b>one thing changed</b> from panel 2’s code — <code>getSnapshot</code>{' '}
          returns a <code>{'{ slice, total }'}</code> object instead of a number. Anyone would
          write it this way.
        </>,
        <>
          But call <code>getSnapshot</code> twice in a row, with{' '}
          <b>nothing happening on screen in between</b>, and a different object comes back each
          time — whether you build the object yourself or hand back what the engine gave you.
        </>,
        <>
          Remember <b>line 3</b> from panel 2: the comparison is <code>Object.is</code>. A
          different object every time reads as <b>the state changed every time</b>. So React
          renders again, calls again, gets another object again… press it and watch. Without an
          error boundary this takes the whole page down.
        </>,
        <>
          <code>useViewportState</code> rebuilds its snapshot only when an engine event arrives,
          and in between it <b>hands back the very same object.</b> The same experiment as step
          2, the opposite result.
        </>,
      ],
      verdict: (
        <>
          <b>This wall cannot be climbed from inside a widget.</b> For the reference to be
          stable, every consumer of a viewport has to share one snapshot, and that can only live
          centrally. The only option left is to give up <code>useSyncExternalStore</code> and go
          back to panel 1’s <code>useEffect + setState</code> — which is precisely the path
          where tearing appears.
        </>
      ),
    },
    panel4: {
      eyebrow: 'Panel 4',
      title: 'It’s not the line count — it’s the bugs that survive it',
      lead: (
        <>
          The two readouts below are <b>the same code as panel 1</b>. What decides the outcome is
          which comes first, the image or the readout — and that order isn’t yours to pick. The
          network and the user pick it.
        </>
      ),
      imageLabel: 'Image',
      imageOff: 'No image yet',
      notMounted: 'Not on screen yet',
      stories: [
        {
          tab: 'The image arrives after the screen',
          intro: (
            <>
              You open a study from the worklist. The viewer UI paints immediately; the image
              shows up once it comes back from the server. The most ordinary order there is.
            </>
          ),
          captions: [
            <>
              The viewer screen opened first. <b>Both slice readouts were created right then</b>,
              and with no image to read, both are empty.
            </>,
            <>
              The image arrived and attached to the screen.{' '}
              <b>The useViewportState side filled in immediately.</b> The hand-rolled one is
              still empty.
            </>,
            <>
              Now we page through slices. The hand-rolled one stays{' '}
              <b>empty all the way</b> — there was no image when it was created, so it gave up on
              subscribing, and nothing will make it try again.
            </>,
          ],
          verdict: (
            <>
              This is the first thing <code>useEffect</code> + <code>addEventListener</code>{' '}
              misses: it checks “no image yet” exactly once and stops. The hook keeps listening
              for the moment the viewport registers, and fills in by itself.
            </>
          ),
        },
        {
          tab: 'The user closes the study',
          intro: (
            <>
              The opposite order this time. We start with the image already on screen, and the
              user closes the study.
            </>
          ),
          captions: [
            <>
              The readouts were created while the image was already up. In this order,{' '}
              <b>both of them work.</b>
            </>,
            <>
              The study was closed. The image is gone, yet{' '}
              <b>the hand-rolled one is still holding the number it saw a moment ago</b> — a
              slice index of an image that no longer exists.
            </>,
          ],
          verdict: (
            <>
              The hook empties to <code>—</code>. An absent viewport isn’t an error, it’s a
              normal state, and the hook hands it back as <code>undefined</code>.
            </>
          ),
        },
      ],
    },
    footer: (
      <>The image data is the public CT series the official Cornerstone3D examples use.</>
    ),
  },
};
