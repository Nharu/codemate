# AI 기반 온라인 코드 협업 플랫폼 개발 문서

## 프로젝트 개요

**제목**: AI를 활용한 온라인 코드 협업 플랫폼 개발  
**GitHub URL**: https://github.com/Nharu/codemate  
**개발자**: 이재현 (학번: 2015313016)  
**지도교수**: 정윤경

### 목표

AI 기술을 활용하여 자동화된 코드 리뷰 시스템과 실시간 협업 기능을 통합한 온라인 코드 협업 플랫폼 구축

### 핵심 기능

1. **AI 기반 자동 코드 리뷰**: 대규모 언어 모델(LLM) 활용한 실시간 코드 분석 및 피드백
2. **실시간 코드 협업**: 여러 개발자가 동시에 코드 편집 가능한 환경
3. **통합 플랫폼**: 코드 작성, 리뷰, 협업 과정을 단일 플랫폼에서 처리

## 기술 스택

### Frontend

- **Framework**: Next.js 14+ + TypeScript
- **Code Editor**: Monaco Editor (VS Code 기반)
- **실시간 협업**: CRDT (Yjs)
- **UI Framework**: shadcn/ui + Tailwind CSS
- **상태관리**: Zustand
- **서버 상태관리**: TanStack Query (React Query v5)
- **HTTP 클라이언트**: Axios
- **인증**: NextAuth.js

### Backend

- **Framework**: NestJS + TypeScript
- **실시간 통신**: Socket.IO + WebSocket
- **API**: RESTful API
- **유효성 검사**: class-validator + class-transformer
- **문서화**: Swagger/OpenAPI

### Database

- **주 데이터베이스**: Amazon RDS (PostgreSQL)
- **실시간 데이터**: Amazon ElastiCache (Redis)
- **파일 저장**: Amazon S3
- **검색**: Amazon OpenSearch (선택사항)

### AI/ML

- **주 언어 모델**: Claude Sonnet 4 (2025년 최신)
- **백업 모델**: OpenAI GPT-5
- **코드 분석**: AST(Abstract Syntax Tree) 분석
- **보안 검사**: ESLint, SonarQube 통합
- **핵심 기능**:
    - 1M 토큰 컨텍스트 (전체 코드베이스 분석)
    - SWE-bench 72.7% (Claude) / 74.9% (GPT-5) 성능
    - 하이브리드 추론 모드 (빠른 응답 + 깊은 사고)
    - 환각 대폭 감소 (45-80% 더 정확)
    - 복합 도구 연동 지원

### Infrastructure & DevOps

- **Infrastructure as Code**: Terraform
- **컨테이너**: Docker + Amazon ECR
- **오케스트레이션**: Amazon ECS / EKS
- **버전 관리**: AWS CodeCommit
- **CI/CD**: AWS CodePipeline + CodeBuild + CodeDeploy
- **모니터링**: Amazon CloudWatch + X-Ray
- **로드 밸런싱**: Application Load Balancer
- **CDN**: Amazon CloudFront

## 프로젝트 구조

```
codemate/
├── frontend/                 # Next.js 클라이언트
│   ├── src/
│   │   ├── app/            # App Router (Next.js 13+)
│   │   ├── components/     # 재사용 컴포넌트 (shadcn/ui)
│   │   ├── hooks/         # Custom hooks (TanStack Query)
│   │   ├── store/         # Zustand 상태 관리
│   │   ├── lib/           # 유틸리티 & API 클라이언트 (Axios)
│   │   ├── types/         # TypeScript 타입 정의
│   │   └── styles/        # Tailwind CSS
│   └── package.json
├── backend/                  # NestJS 서버
│   ├── src/
│   │   ├── modules/       # 기능별 모듈
│   │   │   ├── auth/      # 인증 모듈
│   │   │   ├── users/     # 사용자 관리
│   │   │   ├── projects/  # 프로젝트 관리
│   │   │   ├── ai/        # AI 리뷰 서비스
│   │   │   └── collab/    # 실시간 협업
│   │   ├── common/        # 공통 모듈
│   │   ├── database/      # 데이터베이스 설정
│   │   └── websocket/     # WebSocket 게이트웨이
│   └── package.json
├── infrastructure/           # Terraform 코드
│   ├── environments/        # 환경별 설정
│   ├── modules/            # 재사용 가능한 모듈
│   └── scripts/            # 배포 스크립트
├── shared/                   # 공유 타입, 유틸리티
├── docker/                   # Docker 설정
├── docs/                     # 문서
├── tests/                    # 테스트 코드
└── README.md
```

## 주요 기능 명세

### 1. 사용자 관리

- [x] 회원가입/로그인
- [x] 사용자 프로필 관리
- [x] 프로필 이미지 파일 업로드 (MinIO/S3)
- [x] OAuth 인증 (GitHub, Google)
- [x] OAuth 프로필 이미지 자동 다운로드 및 저장
- [x] React Hook Form 기반 폼 검증 시스템
- [x] TanStack Query 기반 서버 상태 관리 및 캐싱
- [x] 비밀번호 변경 기능 (OAuth 사용자 구분 처리)
- [ ] 권한 관리 (개발자, 리뷰어, 관리자)

### 2. 프로젝트 관리

- [x] 프로젝트 생성/수정/삭제
- [x] 파일 및 폴더 구조 관리
- [x] 파일 트리 UI 컴포넌트 (recursive 구조)
- [x] ZIP 파일 업로드를 통한 프로젝트 가져오기
- [x] 파일 내용 편집 및 저장
- [x] TanStack Query 기반 파일 데이터 캐싱 및 최적화
- [x] IDE 세션 상태 지속성 (Redis 기반, 7일 TTL)
- [x] 탭 관리 및 사이드바 상태 복원
- [x] 파일트리 재귀적 폴더 확장 및 세션 복원
- [x] 폴더 경로 지정을 통한 파일 생성 기능
- [x] 파일트리 우클릭으로 특정 폴더 하위에 파일 생성
- [x] 중복 파일 경로 체크 및 사용자 친화적 에러 처리
- [x] 커스텀 모달을 활용한 확인/알림 시스템
- [x] 파일/폴더 이름 변경 (rename)
- [ ] 드래그 앤 드롭으로 파일 이동
- [ ] 파일 복사/붙여넣기
- [ ] 파일 다운로드
- [ ] 팀원 초대/관리
- [ ] 버전 관리 (Git 통합)

### 3. AI 코드 리뷰

- [x] **실시간 코드 분석**: Claude Sonnet 4 기반 AI 코드 리뷰 시스템 구현
- [x] **오류/취약점 탐지**: 코드 이슈 분석 및 심각도별 분류 (critical, high, medium, low, info)
- [x] **코드 품질 평가**: 전체 점수 및 카테고리별 분석 (bug, security, performance, style, maintainability, best_practices)
- [x] **개선 제안 생성**: AI 기반 구체적인 코드 개선 제안 및 수정 코드 제공
- [x] **리뷰 결과 시각화**: Monaco Editor 데코레이션 및 마커를 통한 인라인 리뷰 결과 표시
- [x] **WebSocket 실시간 통신**: 리뷰 진행상황 실시간 업데이트 (initializing, analyzing, finalizing)
- [x] **파일별 상태 관리**: Zustand 기반 각 파일의 독립적인 리뷰 상태 관리
- [x] **리뷰 히스토리**: 이전 리뷰 결과 저장 및 로드 기능

### 4. 실시간 협업 에디터

- [x] Socket.IO 실시간 통신 인프라 구축
- [x] WebSocket 게이트웨이 및 JWT 인증 시스템
- [x] Redis 기반 IDE 세션 상태 지속성 (탭, 사이드바 등)
- [x] **Yjs CRDT 기반 동시 편집**: CollaborationContext를 통한 실시간 협업 편집 기본 구조 완성
- [x] **CollaborationProvider**: Context API 기반 중앙화된 협업 상태 관리
- [x] **파일별 자동 룸 전환**: 탭 변경 시 자동으로 해당 파일의 협업 룸으로 이동
- [x] **Socket 연결 안정화**: React Strict Mode 호환 및 의존성 최적화
- [ ] 실시간 커서/선택 동기화 - 미구현
- [ ] 충돌 방지 및 해결 - 미구현
- [ ] 변경 이력 추적 - 미구현

### 5. 커뮤니케이션

- [ ] 실시간 채팅
- [ ] 코드 라인별 댓글
- [ ] 알림 시스템
- [ ] 화상/음성 통화 (WebRTC)

### 6. 통합 기능

- [ ] GitHub/GitLab 연동
- [ ] CI/CD 파이프라인 연동
- [ ] 이슈 트래킹
- [ ] 문서 생성

## 개발 일정 및 진행 현황

### Phase 1: 중간발표 준비 (4주) ✅ 완료

- [x] 프로젝트 구조 설계
- [x] 로컬 개발 환경 설정 (Docker Compose)
- [x] 프로젝트 기본 구조 생성
- [x] 기본 인증 시스템 구현
- [x] 데이터베이스 설계 (PostgreSQL)

### Phase 2: 핵심 기능 개발 (8주) 🚧 진행중

- [x] Monaco Editor 기반 웹 IDE 구현
- [x] 완전한 파일 관리 시스템 (CRUD, ZIP 업로드)
- [x] **AI 코드 리뷰 시스템 완성** (Claude Sonnet 4 + Zustand 상태 관리)
- [x] Socket.IO 실시간 통신 인프라 구축
- [x] WebSocket 인증 및 세션 관리 시스템
- [x] Redis 기반 IDE 상태 지속성
- [x] shadcn/ui 기반 사용자 인터페이스
- [x] NestJS API 개발
- [x] **파일별 독립적 AI 리뷰 상태 관리** (Zustand store)
- [x] **실시간 협업 편집 기본 구조 완성** (Yjs CRDT + CollaborationContext)
- [ ] 중간발표 데모 완성

### 최근 구현 완료 (2025-09-16)

#### 파일/폴더 이름 변경 시스템

- [x] 파일 이름 변경: 개별 파일 경로 업데이트 및 실시간 탭 동기화
- [x] 폴더 이름 변경: 폴더 내 모든 파일 경로 일괄 업데이트
- [x] 백엔드 API: `PATCH /projects/:id/folders/*` 엔드포인트 구현
- [x] 프론트엔드: 인라인 편집 UI (Enter/Escape 키보드 지원)
- [x] 중복 경로 검증: 충돌 방지 및 사용자 친화적 에러 메시지
- [x] TypeScript 타입 안전성: FileNode 인터페이스 활용
- [x] 실시간 탭 업데이트: 이름 변경 시 열린 파일 탭 자동 동기화
- [x] TanStack Query 캐시 무효화: 변경 후 자동 데이터 리프레시

#### Socket.IO 실시간 통신 시스템

- [x] NestJS v10 다운그레이드로 Socket.IO 호환성 확보
- [x] JWT 기반 WebSocket 인증 시스템 구현
- [x] 네임스페이스별 게이트웨이 분리 (`/ide-session`, `/collaboration`)
- [x] Redis 연동으로 세션 상태 지속성 (7일 TTL)
- [x] 디바운싱을 통한 성능 최적화 (1초 지연)
- [x] AuthModule 중앙화로 JWT 설정 일원화
- [x] TypeScript 타입 안전성 및 에러 처리 강화

### 최근 구현 완료 (2025-09-17)

#### AI 코드 리뷰 시스템 - Zustand 상태 관리 리팩토링

- [x] **복잡한 상태 관리 단순화**: useState/useEffect 체인을 Zustand 중앙화된 store로 대체
- [x] **파일별 상태 격리**: 각 파일의 리뷰 상태가 독립적으로 관리되어 탭 전환 시 상태 혼선 방지
- [x] **WebSocket 자동 동기화**: `useCodeReviewWithSocket` 훅으로 WebSocket 이벤트를 Zustand store에 자동 반영
- [x] **Request ID 기반 이벤트 라우팅**: currentRequestId로 정확한 WebSocket 이벤트 매칭 및 처리
- [x] **탭 전환 버그 수정**: 잘못된 리뷰 상태가 다른 파일에 표시되는 문제 완전 해결
- [x] **재리뷰 시 이전 결과 방지**: 새 리뷰 시작 시 이전 결과가 즉시 표시되는 문제 수정
- [x] **성능 최적화**: getSnapshot 무한 루프 해결 및 개별 selector 사용으로 불필요한 리렌더링 방지
- [x] **코드 품질 개선**: 불필요한 디버깅 콘솔 로그 제거 및 TypeScript 타입 안전성 강화
- [x] **아키텍처 개선**: subscribeWithSelector 미들웨어로 selector 안정성 확보

### 최근 구현 완료 (2025-09-17 - 협업 편집)

#### 실시간 협업 편집 시스템 - Yjs CRDT 기반 구현

- [x] **CollaborationContext 중앙화**: 협업 상태를 Context API로 중앙 관리하여 컴포넌트 간 일관성 확보
- [x] **Yjs CRDT 통합**: 충돌 없는 실시간 문서 동기화를 위한 Yjs 라이브러리 통합 (`yjs`, `y-monaco`, `y-indexeddb`, `y-websocket`)
- [x] **Socket.IO 협업 네임스페이스**: `/collaboration` 네임스페이스로 협업 전용 WebSocket 연결 분리
- [x] **JWT 기반 협업 인증**: 기존 인증 토큰을 활용한 협업 세션 보안 인증
- [x] **파일별 자동 룸 관리**: `project-{id}-file-{fileId}` 패턴으로 파일별 독립적인 협업 룸 운영
- [x] **탭 변경 시 자동 룸 전환**: 사용자가 파일 탭을 변경하면 자동으로 해당 파일의 협업 룸으로 이동
- [x] **React Context Provider 패턴**: WebIDE를 CollaborationProvider로 래핑하여 하위 컴포넌트에서 협업 기능 접근
- [x] **Socket 연결 안정화**: React Strict Mode와 호환되도록 useEffect 의존성 최적화 및 중복 연결 방지
- [x] **프로덕션 준비**: 모든 디버깅 로그 제거 및 linting 규칙 준수

#### 구현된 핵심 아키텍처

```typescript
// CollaborationContext.tsx: 중앙화된 협업 상태 관리
interface CollaborationContextType {
    isConnected: boolean;
    isConnecting: boolean;
    socket: Socket | null;
    currentRoomId: string | null;
    connectedUsers: ConnectedUser[];
    joinRoom: (roomId: string) => void;
    leaveRoom: () => void;
    startCollaboration: () => void;
    stopCollaboration: () => void;
    isCollaborationEnabled: boolean;
}

// WebIDE.tsx: 자동 룸 전환 로직
useEffect(() => {
    if (activeTab && isCollaborationEnabled) {
        const roomId = `project-${projectId}-file-${activeTab.id}`;
        if (currentRoomId !== roomId) {
            joinRoom(roomId);
        }
    }
}, [activeTab?.id, isCollaborationEnabled, currentRoomId, joinRoom, projectId]);
```

#### 해결된 주요 기술적 문제

1. **Socket 즉시 연결 해제**: useEffect 의존성 최적화로 React Strict Mode 호환성 확보
2. **Context 통합**: 기존 직접 구현 방식을 Context 패턴으로 리팩토링하여 상태 관리 일원화
3. **Yjs 동적 로딩**: Monaco Editor 바인딩과 Yjs를 동적 import로 최적화
4. **TypeScript 타입 안전성**: 모든 협업 관련 인터페이스 및 타입 정의 완성
5. **Linting 규칙 준수**: ESLint 규칙 완전 준수 및 프로덕션 코드 품질 확보

#### 기술적 성과

- **CRDT 기반 충돌 없는 편집**: Yjs를 통한 자동 병합 및 충돌 해결
- **확장 가능한 아키텍처**: Context API로 향후 추가 협업 기능 쉽게 통합 가능
- **성능 최적화**: 파일별 독립적인 룸으로 불필요한 데이터 동기화 방지
- **사용자 경험 향상**: 탭 변경 시 자동 룸 전환으로 매끄러운 협업 환경 제공

#### 구현된 핵심 구조

```typescript
// Zustand Store 중앙 관리
codeReviewStore.ts: {
  reviews: Record<filePath, FileReviewState>,
  currentReviewingFile: string | null,
  currentRequestId: string | null,
  // WebSocket 이벤트 자동 동기화 액션들
}

// WebSocket ↔ Store 통합
useCodeReviewWithSocket.ts: {
  // WebSocket 이벤트를 자동으로 Store에 반영
  // progress, result, error 실시간 동기화
}
```

#### 해결된 주요 문제들

1. **탭 전환 시 상태 혼선**: A 파일 리뷰 중 B 탭으로 이동 시 B 파일에 A의 상태가 표시되던 문제
2. **재리뷰 시 이전 결과 표시**: 새 리뷰 시작과 동시에 서버에서 이전 결과를 다시 로드하는 문제
3. **getSnapshot 무한 루프**: Zustand selector가 매번 새 객체를 반환하여 발생하는 성능 문제
4. **복잡한 상태 동기화**: 여러 useEffect 체인으로 인한 예측 불가능한 상태 변화

#### 기술적 성과

- **상태 관리 복잡도 대폭 감소**: 200+ 줄의 복잡한 상태 로직을 깔끔한 Zustand store로 단순화
- **타입 안전성 강화**: 모든 상태와 액션에 대한 TypeScript 타입 보장
- **성능 최적화**: 개별 selector 사용으로 불필요한 컴포넌트 리렌더링 방지
- **유지보수성 향상**: 중앙화된 상태 관리로 디버깅 및 확장 용이성 확보

### Phase 3: 최종발표 준비 (6주)

- [ ] AWS 클라우드 인프라 구축 (Terraform)
- [ ] CI/CD 파이프라인 구성 (AWS CodePipeline)
- [ ] 성능 최적화 및 보안 강화
- [ ] 실시간 통신 안정화

### Phase 4: 완성 및 발표 (4주)

- [ ] 통합 테스트 및 버그 수정
- [ ] 최종발표 시연 준비
- [ ] 문서 정리 및 포트폴리오 작성
- [ ] 프로덕션 배포

## Git 워크플로우 및 연구노트 관리

### 커밋 메시지 컨벤션

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 종류**:

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 수정
- `style`: 코드 스타일 변경
- `refactor`: 코드 리팩토링
- `test`: 테스트 코드
- `chore`: 빌드, 설정 파일 수정
- `research`: 연구 및 실험

**예시**:

```bash
feat(auth): implement JWT authentication system

- Add JWT token generation and validation
- Implement login/logout endpoints
- Add middleware for protected routes
- Update user model with token fields

Closes #12
```

### 브랜치 전략

```
main                    # 안정된 버전
├── develop            # 개발 통합 브랜치
├── feature/auth       # 인증 시스템 개발
├── feature/ai-review  # AI 리뷰 기능 개발
├── feature/realtime   # 실시간 협업 개발
└── release/v1.0       # 중간발표용 릴리즈
```

### Phase별 커밋 가이드라인

#### Phase 1: 기반 구조

- `chore: setup project structure`
- `docs: add initial README and dev guide`
- `feat: setup Docker Compose development environment`
- `feat(database): design and implement user schema`

#### Phase 2: 핵심 기능

- `feat(ai): integrate Claude Sonnet 4 for code review`
- `feat(editor): implement basic real-time collaboration with Yjs`
- `feat(ui): setup shadcn/ui component library`
- `research: experiment with CRDT conflict resolution`

#### Phase 3: 인프라

- `chore(infra): setup Terraform AWS infrastructure`
- `feat(cicd): implement AWS CodePipeline`
- `docs: document cloud deployment process`

### Issue 및 프로젝트 관리

- **Labels**: `bug`, `enhancement`, `research`, `documentation`
- **Milestones**: 각 Phase별로 설정
- **Projects**: Kanban 보드로 진행상황 관리

## 개발 환경 설정

### 요구사항

- Node.js 18+
- Python 3.9+ (AI 서비스)
- PostgreSQL 14+
- Redis 6+
- Docker & Docker Compose
- Git 2.30+

### 로컬 개발 환경

```bash
# 프로젝트 클론
git clone https://github.com/Nharu/codemate.git
cd codemate

# 의존성 설치
npm run install:all

# 환경 변수 설정
cp .env.example .env

# Docker 컨테이너 실행 (개발용 DB)
docker-compose up -d postgres redis

# 개발 서버 실행
npm run dev
```

## 인프라 구축 (AWS + Terraform)

### Terraform 구조

```
infrastructure/
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── terraform.tfvars
│   ├── staging/
│   └── prod/
├── modules/
│   ├── networking/        # VPC, 서브넷, 보안 그룹
│   ├── database/         # RDS, ElastiCache
│   ├── compute/          # ECS, ALB
│   ├── storage/          # S3, ECR
│   ├── cicd/            # CodeCommit, CodePipeline
│   └── monitoring/       # CloudWatch, X-Ray
└── scripts/
    ├── deploy.sh
    └── destroy.sh
```

### 주요 AWS 리소스

- **VPC**: 프라이빗 네트워킹
- **ECS Fargate**: 컨테이너 오케스트레이션
- **RDS PostgreSQL**: 주 데이터베이스
- **ElastiCache Redis**: 세션 & 캐시
- **S3**: 파일 저장 및 정적 자산
- **CloudFront**: CDN
- **ALB**: 로드 밸런서
- **ECR**: Docker 이미지 저장소
- **CodeCommit**: Git 저장소
- **CodePipeline**: CI/CD 파이프라인
- **CloudWatch**: 모니터링 & 로깅

### CI/CD 파이프라인 (AWS 네이티브)

```
CodeCommit → CodeBuild → ECR → ECS
    ↓
CodePipeline (통합 관리)
    ↓
CloudFormation (Terraform과 연동)
```

### TanStack Query 서버 상태 관리

**React Query v5 활용**:

- **Query Client 설정**: 1분 staleTime, window focus refetch 비활성화
- **Custom Hooks**: 각 API별 useQuery/useMutation 훅 구현
- **캐시 최적화**: 자동 데이터 무효화 및 백그라운드 리페치
- **에러 처리**: 통일된 에러 처리 및 사용자 알림
- **낙관적 업데이트**: 빠른 UI 응답성 보장
- **개발자 도구**: ReactQueryDevtools 통합

```typescript
// 설정 예시
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60 * 1000, // 1분
            refetchOnWindowFocus: false,
        },
    },
});
```

### CRDT 실시간 협업 구현

**Yjs 라이브러리 활용**:

- **Y.Doc**: 공유 문서 상태
- **Y.Text**: 텍스트 동시 편집
- **WebSocket Provider**: 실시간 동기화
- **IndexedDB Provider**: 오프라인 지원
- **충돌 해결**: 자동 머지 알고리즘

### 배포 명령어

```bash
# 인프라 초기화
cd infrastructure/environments/dev
terraform init

# 인프라 계획 확인
terraform plan

# 인프라 배포
terraform apply

# CI/CD 파이프라인 트리거
git push origin main
```

## API 명세

### 인증 API

```
POST /auth/login          # 로그인
POST /auth/register       # 회원가입
POST /auth/logout         # 로그아웃
GET  /auth/profile        # 프로필 조회
```

### 프로젝트 API

```
GET    /projects          # 프로젝트 목록
POST   /projects          # 프로젝트 생성
GET    /projects/:id      # 프로젝트 조회
PUT    /projects/:id      # 프로젝트 수정
DELETE /projects/:id      # 프로젝트 삭제
```

### AI 리뷰 API

```
POST /ai/review           # 코드 리뷰 요청
GET  /ai/review/:id       # 리뷰 결과 조회
POST /ai/suggestions      # 개선 제안 요청
```

### 실시간 통신 이벤트

```
connection                # 연결
join-room                 # 룸 참가
leave-room               # 룸 나가기
code-change              # 코드 변경
cursor-move              # 커서 이동
chat-message             # 채팅 메시지
```

## 데이터베이스 설계

### Users (사용자)

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  avatar_url VARCHAR(255),
  role VARCHAR(20) DEFAULT 'developer',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Projects (프로젝트)

```sql
CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id INTEGER REFERENCES users(id),
  visibility VARCHAR(20) DEFAULT 'private',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Files (파일)

```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id),
  path VARCHAR(500) NOT NULL,
  content TEXT,
  language VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 테스트 전략

### 단위 테스트

- Jest + Testing Library
- 컴포넌트 테스트
- API 엔드포인트 테스트
- AI 서비스 테스트

### 통합 테스트

- E2E 테스트 (Playwright)
- 실시간 기능 테스트
- 성능 테스트

### 테스트 실행

```bash
npm run test              # 단위 테스트
npm run test:e2e          # E2E 테스트
npm run test:integration  # 통합 테스트
npm run test:performance  # 성능 테스트
```

## 배포 전략

### 개발 환경

- GitHub Actions를 통한 자동 빌드/테스트
- 개발 브랜치 푸시시 자동 배포

### 운영 환경

- Docker 컨테이너 배포
- AWS ECS 또는 Kubernetes 사용
- Blue-Green 배포 전략
- 로드 밸런싱 및 오토 스케일링

## 모니터링 및 로깅

### 애플리케이션 모니터링

- Prometheus: 메트릭 수집
- Grafana: 대시보드 및 시각화
- Winston: 구조화된 로깅

### 성능 모니터링

- 응답 시간 측정
- 리소스 사용량 추적
- 실시간 연결 모니터링

## 보안 고려사항

### 인증 및 인가

- JWT 토큰 기반 인증
- 권한별 접근 제어
- 세션 관리

### 데이터 보호

- HTTPS 통신
- 민감 정보 암호화
- SQL 인젝션 방지

### AI 보안

- 코드 유출 방지
- API 키 보안 관리
- 모델 접근 제한

## 성능 최적화

### Frontend 최적화

- Code Splitting
- Lazy Loading
- 번들 최적화
- CDN 활용

### Backend 최적화

- 데이터베이스 인덱싱
- 캐싱 전략 (Redis)
- 연결 풀링
- 비동기 처리

### 실시간 통신 최적화

- WebSocket 연결 관리
- 메시지 압축
- 배치 처리

## 문제 해결 및 디버깅

### 로그 레벨

- ERROR: 시스템 오류
- WARN: 경고사항
- INFO: 일반 정보
- DEBUG: 디버깅 정보

### 공통 이슈

- 실시간 동기화 문제
- AI 모델 응답 지연
- 메모리 누수
- 동시성 문제

## 비용 계획 및 예산

### 월별 예상 비용 (USD)

| 구성요소                 | 개발환경     | 프로덕션     |
| ------------------------ | ------------ | ------------ |
| ECS Fargate              | $25-35       | $80-120      |
| RDS + ElastiCache        | $27          | $60-100      |
| 스토리지 (S3, ECR)       | $5           | $15-25       |
| 네트워킹 (ALB, CDN)      | $23          | $50-80       |
| AI 서비스 (Claude + GPT) | $40          | $100-200     |
| 모니터링                 | $10          | $25          |
| **총합**                 | **$130-150** | **$330-550** |

### 비용 절감 방안

1. **AWS 학생 크레딧**: $100-200 무료 크레딧 활용
2. **단계별 구축**: 로컬 → 최소 클라우드 → 풀스택
3. **AI 최적화**: 캐싱, 배치 처리, 스마트 라우팅
4. **프리티어**: 첫 12개월 EC2, RDS, S3 무료

### 개발 단계별 예산

- **중간발표 (로컬 환경)**: $0/월
- **최종발표 (클라우드 데모)**: $130-150/월
- **프로덕션 (실제 서비스)**: $330-550/월

### 발표 전략

- **중간발표**: Docker Compose 로컬 환경에서 핵심 기능 데모
- **최종발표**: AWS 클라우드 인프라에서 완전한 서비스 시연

### GitHub 연구노트 전략

- **목적**: GitHub을 연구노트 대신 활용하여 개발 과정 문서화
- **커밋 전략**: 각 단계별 진행사항을 상세한 커밋 메시지로 기록
- **브랜치 관리**: feature 브랜치별로 개발하여 진행과정 명확히 추적
- **이슈 활용**: 개발 중 발생하는 문제와 해결과정을 Issue로 관리
- **릴리즈**: 각 Phase 완료시마다 릴리즈 태그로 마일스톤 기록

## 향후 계획

### 단기 목표 (3개월)

- 베타 버전 출시
- 사용자 피드백 수집
- 핵심 기능 안정화

### 중기 목표 (6개월)

- 다양한 프로그래밍 언어 지원
- 모바일 앱 개발
- Enterprise 기능 추가

### 장기 목표 (1년)

- AI 모델 자체 개발
- 오픈소스 생태계 구축
- 글로벌 서비스 확장

## 참고 자료

- [React.js 공식 문서](https://react.dev/)
- [Socket.IO 문서](https://socket.io/docs/)
- [OpenAI API 문서](https://platform.openai.com/docs)
- [PostgreSQL 문서](https://www.postgresql.org/docs/)
- [Docker 문서](https://docs.docker.com/)

---

_이 문서는 프로젝트 진행에 따라 지속적으로 업데이트됩니다._
