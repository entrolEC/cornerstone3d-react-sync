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
  common: { copy: string; copied: string };
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
    tabNaive: string;
    tabHook: string;
    naiveTitle: string;
    hookTitle: string;
    naiveBadge: string;
    idle: string;
    run: string;
    again: string;
    crashed: string;
    loop: string;
    decode: string;
    verdict: ReactNode;
  };
  panel3: {
    eyebrow: string;
    title: string;
    lead: ReactNode;
    imageLabel: string;
    imageOff: string;
    notMounted: string;
    preparing: string;
    next: string;
    restart: string;
    stories: StoryCopy[];
  };
  footer: ReactNode;
}

const DEMO_NOTE_LINES = 33;

export const COPY: Record<Lang, Copy> = {
  ko: {
    htmlLang: 'ko',
    common: { copy: '복사', copied: '복사됨' },
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
          이 페이지가 실제로 import해서 렌더링하는 파일(<code>demo/widgets.tsx</code>)에서 그대로
          뽑아옵니다. 그리고 직접 배선한 쪽은 Cornerstone3D + React 프로젝트가 위젯마다 반복해서
          쓰는 바로 그 패턴입니다. 그런데 줄 수는 문제의 절반일 뿐입니다 — 나머지 절반은,
          저 {DEMO_NOTE_LINES}줄을 버리고 <b>정석대로 다시 짜도 막힌다</b>는 것입니다. 다음
          패널에서 직접 눌러보세요. ↓
        </>
      ),
    },
    panel2: {
      eyebrow: '패널 2',
      title: '정석대로 해도, 여기서 막힙니다',
      lead: (
        <>
          React 18에서 외부 상태를 읽는 정답은 <code>useSyncExternalStore</code>입니다.
          Cornerstone3D에 그대로 적용하면 어떻게 되는지 직접 눌러보세요 —{' '}
          <b>이 페이지에서 진짜로 실행됩니다.</b>
        </>
      ),
      tabNaive: '순진한 구현',
      tabHook: 'useViewportState',
      naiveTitle: 'useSyncExternalStore',
      hookTitle: 'useViewportState',
      naiveBadge: '직접',
      idle: '아직 마운트하지 않았습니다',
      run: '마운트하기',
      again: '다시',
      crashed: 'React가 던진 에러',
      loop: '무한 렌더 루프 — React가 렌더링을 중단했습니다',
      decode: '에러 코드 해설',
      verdict: (
        <>
          <b>Cornerstone3D 게터는 호출할 때마다 새 객체를 돌려줍니다.</b>{' '}
          <code>useSyncExternalStore</code>는 <code>getSnapshot</code>의 결과를{' '}
          <code>Object.is</code>로 비교하므로, 매번 다른 참조를 받으면 영원히 안정되지 않습니다.
          <br />
          <br />
          필드 하나를 숫자로 꺼내 읽으면 우연히 동작합니다 — 패널 1의 훅 예제가{' '}
          <code>useViewportState</code>를 두 번 호출하는 이유가 그겁니다. 하지만 두 값을 객체로
          묶는 순간 막힙니다. 탈출구는 <code>useSyncExternalStore</code>를 포기하고{' '}
          <code>useEffect + setState</code>로 돌아가는 것뿐인데, <b>그게 바로 tearing이 생기는
          경로입니다.</b>
          <br />
          <br />
          그리고 이 벽은 위젯 안에서 넘을 수 없습니다. 스냅샷은 한 뷰포트의 모든 소비자가{' '}
          <b>공유</b>해야 참조가 안정되기 때문입니다 — 중앙에 있어야만 하는 이유입니다.
        </>
      ),
    },
    panel3: {
      eyebrow: '패널 3',
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
      preparing: '준비 중…',
      next: '다음 →',
      restart: '처음부터',
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
    common: { copy: 'Copy', copied: 'Copied' },
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
          It is pulled from the file this page actually imports and renders
          (<code>demo/widgets.tsx</code>). And the hand-rolled side is the very pattern every
          Cornerstone3D + React project repeats per widget. But the line count is only half the
          problem — the other half is that throwing those {DEMO_NOTE_LINES} lines away and{' '}
          <b>doing it the proper way hits a wall</b>. Press the button in the next panel. ↓
        </>
      ),
    },
    panel2: {
      eyebrow: 'Panel 2',
      title: 'Do it properly, and this is where you stop',
      lead: (
        <>
          <code>useSyncExternalStore</code> is React 18’s answer for reading external mutable
          state. Press the button to see what happens when you point it at Cornerstone3D —{' '}
          <b>it really runs, on this page.</b>
        </>
      ),
      tabNaive: 'The obvious binding',
      tabHook: 'useViewportState',
      naiveTitle: 'useSyncExternalStore',
      hookTitle: 'useViewportState',
      naiveBadge: 'by hand',
      idle: 'Not mounted yet',
      run: 'Mount it',
      again: 'Again',
      crashed: 'The error React threw',
      loop: 'Infinite render loop — React aborted rendering',
      decode: 'What that code means',
      verdict: (
        <>
          <b>Cornerstone3D getters return a fresh object on every call.</b>{' '}
          <code>useSyncExternalStore</code> compares what <code>getSnapshot</code> returns with{' '}
          <code>Object.is</code>, so a new reference every time never settles.
          <br />
          <br />
          Read one field as a number and it happens to work — that is why the hook example in
          panel 1 calls <code>useViewportState</code> twice. Bundle two values into an object and
          you hit the wall. The only way out is to abandon{' '}
          <code>useSyncExternalStore</code> for <code>useEffect + setState</code>, and{' '}
          <b>that is precisely the path where tearing appears.</b>
          <br />
          <br />
          This wall cannot be climbed from inside a widget: the snapshot has to be{' '}
          <b>shared</b> by every consumer of a viewport for the reference to be stable. That is
          why it has to live centrally.
        </>
      ),
    },
    panel3: {
      eyebrow: 'Panel 3',
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
      preparing: 'Setting up…',
      next: 'Next →',
      restart: 'Start over',
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
