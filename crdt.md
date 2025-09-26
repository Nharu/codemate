# CRDT 실시간 협업 시스템 재구현

## 🔥 현재 상황: Yjs 방식의 한계

### 문제점

-   **Yjs + MonacoBinding 복잡성**: 예측 불가능한 동작과 디버깅 어려움
-   **실시간 동기화 실패**: Yjs 업데이트는 수신되지만 Monaco 에디터에 반영되지 않음
-   **MonacoBinding 의존성**: 자동 동기화가 작동하지 않아 강제 setValue 필요
-   **복잡한 상태 관리**: Y.Doc, Y.Text, WebSocket Provider 등 여러 레이어

### 근본적 문제

```typescript
// 현재 문제: MonacoBinding이 자동 동기화 실패
Y.applyUpdate(ydoc, update, "websocket");
// ↓ Monaco 에디터가 자동으로 업데이트되어야 하는데 안됨
// ↓ 결국 강제로 setValue() 호출해야 함
editor.setValue(ytext.toString()); // 수동 동기화
```

## 🎯 새로운 접근 방식: Event-driven 실시간 동기화

### 핵심 아이디어

**복잡한 CRDT 라이브러리 대신 Monaco Editor 기본 API + 간단한 충돌 해결**

```typescript
// 간단하고 직관적인 방식
Monaco onChange → WebSocket 전송 → Monaco executeEdits 적용
```

### 장점

-   ✅ **직관적**: Monaco API만 사용해서 예측 가능
-   ✅ **디버깅 용이**: 단순한 이벤트 플로우
-   ✅ **제어 가능**: 모든 동기화 로직을 직접 제어
-   ✅ **호환성**: Monaco Editor와 완벽 호환
-   ✅ **성능**: 불필요한 레이어 제거

## 📋 구현 단계별 계획

## 1단계: 기본 Event-driven 동기화 (우선순위: 최고)

### 목표

**두 사용자가 동시 편집 시 실시간 반영**

### 구현 작업

-   [x] **기존 Yjs 코드 완전 제거**

    -   `CollaborationContext.tsx` 전면 재작성
    -   yjs, y-monaco, y-websocket 의존성 제거
    -   복잡한 Y.Doc, Y.Text 상태 관리 삭제

-   [x] **Monaco onChange → WebSocket 직접 연결**

```typescript
const handleEditorChange = (
    value: string,
    event: editor.IModelContentChangedEvent
) => {
    if (isReceivingUpdate) return; // 무한 루프 방지

    event.changes.forEach((change) => {
        socket.emit("text-operation", {
            roomId: currentRoomId,
            operation: {
                range: change.range,
                text: change.text,
                timestamp: Date.now(),
                userId: currentUser.id,
            },
        });
    });
};
```

-   [x] **WebSocket 수신 → Monaco 직접 적용**

```typescript
socket.on("text-operation", (operation) => {
    isReceivingUpdate = true;

    const edit = {
        range: operation.range,
        text: operation.text,
    };

    editor.executeEdits("collaboration", [edit]);
    isReceivingUpdate = false;
});
```

-   [x] **무한 루프 방지 로직**

    -   `isReceivingUpdate` 플래그로 원격 업데이트 중 onChange 무시
    -   타이머 기반 플래그 해제 (100ms 후)

-   [ ] **기본 동기화 테스트**
    -   A 사용자 타이핑 → B 사용자 화면 즉시 반영
    -   양방향 동시 타이핑 테스트

### 성공 기준

-   [ ] A 사용자가 "hello"를 타이핑하면 B 사용자 화면에 즉시 "hello" 표시
-   [ ] 양방향 실시간 동기화 동작
-   [ ] 무한 루프 발생하지 않음
-   [ ] 콘솔에 명확한 동기화 로그 출력

---

## 2단계: 충돌 해결 및 안정성 (우선순위: 높음)

### 목표

**동시 편집 시에도 데이터 손실 없이 안정적 동기화**

### 구현 작업

-   [ ] **Timestamp 기반 충돌 해결**

```typescript
const resolveConflict = (localOp: Operation, remoteOp: Operation) => {
    if (localOp.timestamp < remoteOp.timestamp) {
        return remoteOp; // 더 최근 것 선택
    }
    return localOp;
};
```

-   [ ] **Operation 순서 보장**

    -   Sequence number 추가
    -   순서 어긋난 operation 대기열 관리

-   [ ] **동시 편집 텍스트 병합**

    -   같은 위치 편집 시 텍스트 합치기
    -   위치 기반 우선순위 적용

-   [ ] **충돌 시 전체 동기화**
    -   복잡한 충돌 발생 시 전체 문서 동기화 요청
    -   서버에서 권위 있는 버전 제공

### 성공 기준

-   [ ] 두 사용자가 같은 줄을 동시 편집해도 텍스트 손실 없음
-   [ ] 네트워크 지연으로 순서가 바뀌어도 올바른 결과
-   [ ] 복잡한 충돌 시 자동으로 전체 동기화

---

## 3단계: 성능 최적화 (우선순위: 중간)

### 목표

**대용량 파일에서도 빠른 실시간 동기화**

### 구현 작업

-   [ ] **Operation Batching**

```typescript
const operationBuffer: Operation[] = [];
const flushBuffer = debounce(() => {
    if (operationBuffer.length > 0) {
        socket.emit("batch-operations", {
            roomId,
            operations: operationBuffer,
        });
        operationBuffer.length = 0;
    }
}, 100);
```

-   [ ] **Delta Compression**

    -   큰 텍스트 변경을 diff로 압축
    -   문자 단위가 아닌 단어/줄 단위 변경 추적

-   [ ] **Throttling**

    -   과도한 전송 방지 (최대 초당 10개 operation)
    -   타이핑 중일 때와 완료 후 다른 전략

-   [ ] **메모리 최적화**
    -   Operation 히스토리 제한 (최근 100개만 보관)
    -   주기적 가비지 컬렉션

### 성공 기준

-   [ ] 10MB 파일에서도 지연 없는 동기화
-   [ ] 네트워크 사용량 50% 이상 감소
-   [ ] 메모리 사용량 안정적 유지

---

## 4단계: 사용자 경험 개선 (우선순위: 낮음)

### 목표

**직관적이고 안정적인 협업 환경**

### 구현 작업

-   [ ] **실시간 커서 표시**

```typescript
const showRemoteCursor = (userId: string, position: Position) => {
    const cursor = document.createElement("div");
    cursor.className = `remote-cursor-${userId}`;
    cursor.style.backgroundColor = getUserColor(userId);
    editor.addOverlayWidget(cursor, position);
};
```

-   [ ] **편집 중인 사용자 하이라이트**

    -   현재 편집 중인 라인에 사용자별 색상 표시
    -   사용자 이름 tooltip

-   [ ] **충돌 알림 UI**

    -   충돌 발생 시 사용자에게 알림
    -   "동기화 중..." 로딩 인디케이터

-   [ ] **연결 상태 표시**
    -   WebSocket 연결 상태
    -   참여 중인 사용자 목록

### 성공 기준

-   [ ] 다른 사용자의 커서 위치 실시간 표시
-   [ ] 충돌 발생 시 명확한 UI 피드백
-   [ ] 네트워크 끊김 시 자동 재연결 및 상태 표시

---

## 🔧 기술 스택 변경사항

### 제거 (Yjs 생태계)

```json
{
    "dependencies": {
        "yjs": "제거",
        "y-monaco": "제거",
        "y-websocket": "제거",
        "y-indexeddb": "제거"
    }
}
```

### 추가 (간단한 유틸리티)

```json
{
    "dependencies": {
        "lodash.debounce": "Operation batching용",
        "diff": "Delta compression용"
    }
}
```

### 새로운 아키텍처

```typescript
// 기존: 복잡한 Yjs 레이어
Yjs Y.Doc → Y.Text → MonacoBinding → Monaco Editor
       ↓
WebSocket Provider ← Socket.IO

// 새로운: 직접적인 이벤트 플로우
Monaco Editor → WebSocket → Monaco Editor
     ↓              ↓
onChange Event → Socket.IO → executeEdits
```

---

## 📁 수정 대상 파일들

### Frontend

-   `frontend/src/contexts/CollaborationContext.tsx`

    -   **전면 재작성**: Yjs 관련 코드 모두 제거
    -   간단한 WebSocket 이벤트 핸들링으로 대체

-   `frontend/src/components/ide/WebIDE.tsx`

    -   Monaco onChange 핸들러를 직접 WebSocket에 연결
    -   `hasOtherUsers` 조건 제거 (항상 실시간 동기화)

-   `frontend/src/hooks/useCollaboration.ts`
    -   복잡한 Y.Doc 상태 관리 제거
    -   단순한 socket 연결 상태만 관리

### Backend

-   `backend/src/modules/collaboration/collaboration.gateway.ts`

    -   `yjs-update` 이벤트를 `text-operation` 이벤트로 변경
    -   operation 순서 보장 및 충돌 해결 로직 추가

-   `backend/src/modules/collaboration/collaboration.service.ts`
    -   Yjs 관련 서버 로직 제거
    -   간단한 operation 브로드캐스팅 로직으로 대체

---

## ✅ 1단계 완료 체크리스트

### 환경 정리

-   [ ] package.json에서 yjs 관련 의존성 제거
-   [ ] CollaborationContext.tsx 백업 후 새로 작성
-   [ ] 기존 Yjs import 문 모두 제거

### 핵심 기능 구현

-   [ ] Monaco onChange 이벤트 핸들러 작성
-   [ ] WebSocket text-operation 이벤트 구현
-   [ ] 무한 루프 방지 로직 구현
-   [ ] 기본 에러 처리 추가

### 테스트

-   [ ] 브라우저 2개 탭에서 동시 편집 테스트
-   [ ] 한글/영문/특수문자 입력 테스트
-   [ ] 복사/붙여넣기 테스트
-   [ ] 개발자 도구에서 WebSocket 메시지 확인

### 성공 기준

-   [ ] "A 사용자가 타이핑 → B 사용자 화면에 즉시 반영"
-   [ ] 양방향 실시간 동기화 동작
-   [ ] 무한 루프 발생하지 않음
-   [ ] 명확한 콘솔 로그 출력

---

## 🚀 예상 개발 일정

-   **1단계 (기본 동기화)**: 1-2일
-   **2단계 (충돌 해결)**: 2-3일
-   **3단계 (성능 최적화)**: 1-2일
-   **4단계 (UX 개선)**: 1-2일

**총 예상 소요 시간**: 5-9일

---

## 📊 기대 효과

### 개발 생산성

-   ✅ **디버깅 시간 90% 단축**: 단순한 이벤트 플로우
-   ✅ **새 기능 개발 속도 3배**: 직관적인 API
-   ✅ **유지보수성 대폭 개선**: 복잡한 외부 의존성 제거

### 사용자 경험

-   ✅ **더 빠른 실시간 동기화**: 중간 레이어 제거
-   ✅ **더 안정적인 협업**: 예측 가능한 동작
-   ✅ **더 나은 오류 처리**: 명확한 에러 메시지

### 기술적 이점

-   ✅ **번들 크기 감소**: Yjs 라이브러리 제거로 ~200KB 절약
-   ✅ **메모리 사용량 감소**: 복잡한 CRDT 상태 구조 제거
-   ✅ **타입 안전성 개선**: 모든 이벤트와 상태를 직접 정의

---

_마지막 업데이트: 2025-09-17_
_다음 작업: 1단계 기본 Event-driven 동기화 구현 시작_
