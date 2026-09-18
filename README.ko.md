# react-cornerstone3d

[English](./README.md)

[Cornerstone3D](https://www.cornerstonejs.org/)의 살아있는 엔진 상태를 React 컴포넌트에 노출하는 React 바인딩 — `useSyncExternalStore` 기반, tearing 없음.

```tsx
function SliceIndicator() {
  const state = useViewportState('ct-axial');
  if (!state) return null; // 뷰포트가 아직 enable 전 — 정상 상태이며, 뭘 보여줄지는 앱의 몫
  return <span>slice {state.imageIdIndex + 1}</span>;
}
```

이 훅 한 줄이, 오늘날 모든 Cornerstone3D + React 앱이 위젯마다 작성하는 ~25줄의 `useEffect` + `addEventListener` + `setState` 배관을 대체합니다.

<details>
<summary>훅이 없다면 어떤 코드를 쓰게 되는지 펼쳐보기</summary>

```tsx
function SliceIndicator() {
  const [state, setState] = useState<{ imageIdIndex: number }>();

  useEffect(() => {
    const enabled = getEnabledElementByViewportId('ct-axial');
    if (!enabled) return; // 뷰포트가 아직 enable 전이면? 나중에 생기면? — 처리 안 됨
    const { element } = enabled.viewport;

    const update = () => {
      const viewport = enabled.viewport as Types.IStackViewport;
      setState({ imageIdIndex: viewport.getCurrentImageIdIndex() });
    };
    update(); // 첫 렌더 ~ 구독 시작 사이의 갭 보정 — 잊기 쉬운 줄

    element.addEventListener(Enums.Events.CAMERA_MODIFIED, update);
    element.addEventListener(Enums.Events.VOI_MODIFIED, update);
    element.addEventListener(Enums.Events.STACK_NEW_IMAGE, update);
    return () => {
      element.removeEventListener(Enums.Events.CAMERA_MODIFIED, update);
      element.removeEventListener(Enums.Events.VOI_MODIFIED, update);
      element.removeEventListener(Enums.Events.STACK_NEW_IMAGE, update);
    };
  }, []);

  if (!state) return null;
  return <span>slice {state.imageIdIndex + 1}</span>;
}
```

이 27줄을 쓰고도 남는 문제들: 마운트 순서 경합(뷰포트가 나중에 enable되면 영영 `undefined`), concurrent 렌더링에서의 tearing, 드래그 중 이벤트마다 리렌더(배칭 없음), 그리고 이 전부를 위젯마다 반복. 라이브러리는 이것들을 중앙에서 해결합니다.

</details>

## 왜 만들었나

Cornerstone3D는 의도적으로 프레임워크 비종속이며 React 바인딩을 제공하지 않습니다. 그래서 모든 React 뷰어가 같은 이벤트 배관을 손수 재발명하고, 그와 함께 같은 버그 계층을 떠안습니다:

- **업데이트 유실** — 첫 렌더와 `useEffect` 구독 시작 사이의 갭
- **Tearing** — React 18+ concurrent 렌더링에서 한 화면의 두 컴포넌트가 서로 다른 슬라이스 번호를 표시
- **구독 누수** — StrictMode 이중 마운트에서
- **마운트 순서 경합** — 뷰포트가 enable되기 전에 UI가 먼저 마운트될 때
- **무한 루프 또는 깊은 비교 땜질** — Cornerstone3D getter는 매 호출 새 객체를 반환하므로 naive한 `getSnapshot`은 절대 안정되지 않음 (OHIF는 훅마다 `JSON.stringify` 비교로 덮어둠)

이 라이브러리는 그 버그 계층을 중앙에서 한 번에 해결합니다. UI 컴포넌트는 엔진 상태의 순수 함수가 됩니다.

## 핵심 설계

모든 것을 결정하는 세 가지 선택 (전체 근거는 [`docs/adr/`](./docs/adr/)):

1. **Engine이 유일한 진실 공급원.** 읽기는 Engine → 이벤트 → 불변 Snapshot → `useSyncExternalStore`로 흐릅니다. 쓰기는 평범한 Cornerstone3D API 호출 그대로이며 — 그 효과는 엔진 이벤트로 되돌아와 React에 반영됩니다. 병렬 쓰기 API 없음, 에코 억제 없음, 상태를 누가 바꿨든(코드든 마우스 드래그든) 읽기 경로는 하나입니다.

2. **라이브러리는 엔진을 소유하지 않습니다.** 훅은 `viewportId`만 받아 Cornerstone3D 자체의 전역 레지스트리로 뷰포트를 찾습니다. Provider 없음, 싱글톤 없음, engine prop 없음 — 앱의 기존 엔진 관리는 그대로 유지됩니다.

3. **부재는 정상 상태입니다.** 아직 enable되지 않은 뷰포트는 `undefined`를 반환하고, 뷰포트가 생기면 값이 자동으로 채워지며, destroy되면 다시 비워집니다. 그동안 무엇을 렌더링할지는 전적으로 앱의 결정입니다.

그 위에서 Snapshot 계층이 **참조 안정성**(상태 무변경 ⇒ 동일 참조, 낭비 리렌더 없음, 루프 없음)과 **불변성**(deep-frozen — 받은 객체가 나중에 변하지 않음)을 보장합니다.

## 현재 상태

v1 진행 중. 동기화만 — 이 라이브러리의 유일한 책임은 상태 동기화입니다.

| 기능 | 상태 |
|---|---|
| Stack 뷰포트 상태 (카메라, VOI, 슬라이스 인덱스) | ✅ |
| 뷰포트 부재 계약 (`undefined`) | ✅ |
| viewportId당 공유 Binding, StrictMode 안전 | ✅ |
| 뷰포트 enable/destroy 시 자동 채움/비움 | ✅ |
| 셀렉터 (내가 쓰는 값이 바뀔 때만 리렌더) | 🔜 |
| 고빈도 이벤트 rAF 배칭 | 🔜 |
| Volume 뷰포트 상태 + kind별 타입 | 🔜 |
| 선택적 `<CornerstoneViewport />` 컴포넌트 | 🔜 |
| 어노테이션 / 툴 / 세그멘테이션 상태 | 로드맵 (post-v1) |

**요구사항:** React 18+, `@cornerstonejs/core` 5.x.

## 범위 밖

앱 상태 관리(Zustand 등 원하는 것을 쓰세요), 쓰기 헬퍼, 선택적 컴포넌트를 넘어서는 엔진/뷰포트 생명주기 관리, 렌더링 성능(그건 Engine의 일입니다).

## 개발

```bash
npm test        # vitest, jsdom + 가짜 CS3D 레지스트리
npm run build   # tsc → dist/
```

테스트는 공개 훅 API만 관찰합니다 — 훅 반환값, 참조 안정성, 리렌더 횟수. 도메인 용어(Engine, Viewport State, Snapshot, Command, Binding)는 [`CONTEXT.md`](./CONTEXT.md)에 있습니다.
