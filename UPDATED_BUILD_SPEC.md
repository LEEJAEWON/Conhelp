# Connection Helper 구축 마스터 체크리스트 (v1.1.0)

이 문서는 Connection Helper 애플리케이션(Electron + React + Docker + Traefik)을 단계별로 구축하기 위한 상세 가이드입니다.

---

## 🏗️ Phase 1: 프로젝트 초기 설정 (React + Vite + Electron)

### 1.1 환경 구성 및 의존성 설치
- [x] `npm create electron-vite connection-helper` (또는 기존 프로젝트 재활용)
- [x] 불필요한 보일러플레이트 파일 정리
- [x] **Core Dependencies 설치**:
  - [x] `npm install dockerode` (Docker 제어)
  - [x] `npm install better-sqlite3` (DB)
  - [x] `npm install sudo-prompt` (관리자 권한/방화벽)
  - [x] `npm install localtunnel` (외부 공유)
  - [x] `npm install fix-path` (macOS 경로 이슈 해결)
  - [x] `npm install @google/genai` (AI 진단용 - 기존 유지)
- [x] **UI Dependencies 설치**:
  - [x] `npm install react react-dom`
  - [x] `npm install zustand` (상태 관리)
  - [x] `npm install tailwindcss postcss autoprefixer`
  - [x] `npm install clsx tailwind-merge` (스타일링 유틸)
  - [x] `npm install lucide-react` (아이콘)
  - [x] `npm install react-ansi` (로그 뷰어 컬러링)

### 1.2 Tailwind CSS 설정
- [x] `npx tailwindcss init -p` 실행
- [x] `tailwind.config.js`의 `content` 배열에 React 컴포넌트 경로 추가
- [x] `src/renderer/src/index.css`에 `@tailwind` 지시어 추가

### 1.3 프로젝트 구조 생성 (Electron-Vite 표준)
- [x] `src/main/`
    - `index.ts` (메인 엔트리)
    - `core/` (비즈니스 로직 - SystemAnalyzer, DockerManager 등)
- [x] `src/preload/`
    - `index.ts` (IPC 브릿지)
- [x] `src/renderer/`
    - `src/components/` (UI 컴포넌트)
    - `src/hooks/`
    - `src/store/` (Zustand)
    - `src/App.tsx` (메인 UI)

### 1.4 개발 환경 검증
- [x] `package.json` 스크립트 수정 (`dev`, `build` 등)
- [x] `npm run dev` 실행 시 Electron 창 정상 로드 확인
- [x] React Hot Reload(HMR) 작동 확인

---

## 🔍 Phase 2: 시스템 환경 분석 모듈

### 2.1 SystemAnalyzer 구현 (`src/main/core/SystemAnalyzer.ts`)
- [x] Docker 소켓 경로 자동 감지 로직 (OS별 분기)
- [x] `checkDockerStatus()`: Docker 데몬 연결 테스트
- [x] `checkPort80()`: 80번 포트 점유 여부 확인
- [x] `getLocalIP()`: 호스트 내부 IP 추출
- [x] `checkFirewall()`: 방화벽 상태 확인

---

## ⚙️ Phase 3: Docker & Traefik 제어 (핵심 엔진)

### 3.1 TraefikManager 구현 (`src/main/core/TraefikManager.ts`)
- [x] `ensureNetwork()`: `traefik_network` 생성
- [x] `ensureProxyRunning()`: `traefik_gateway` 컨테이너(Traefik) 실행 보장
- [x] Traefik 실행 옵션 구성 (Port 80 바인딩, Docker 소켓 마운트)

### 3.2 TemplateEngine 구현 (`src/main/core/TemplateEngine.ts`)
- [x] 프로젝트 타입별(Node, Python 등) Hot Reload 지원 Dockerfile 생성 로직.
- [ ] `docker-compose.yml` 생성 로직 (선택적).

### 3.3 DockerManager 구현 (`src/main/core/DockerManager.ts`)
- [x] `runProject(project)`:
  - [x] Labels 주입 (Traefik 라우팅용)
  - [x] Volume Binding (소스 동기화)
  - [x] Network 연결
- [x] `stopProject(containerId)`
- [x] `streamLogs(containerId)`: IPC로 실시간 로그 전송

---

## 💾 Phase 4: 데이터 관리 (SQLite)

### 4.1 DatabaseManager 구현 (`src/main/core/DatabaseManager.ts`)
- [x] SQLite 연결 및 초기화
- [x] **Schema**:
  - `projects` (id, name, path, type, port, domain_url, public_url)
- [x] CRUD 메서드 구현

---

## 🎨 Phase 5: UI/UX 개발 (React)

### 5.1 Zustand Store (`src/renderer/src/store/useStore.ts`)
- [x] `projects`, `systemStatus` 상태 정의
- [x] IPC 액션 래퍼 구현

### 5.2 주요 컴포넌트 개발
- [x] `Layout.tsx`: 사이드바, 헤더, 상태바
- [x] `Dashboard.tsx`: 시스템 상태 요약 대시보드
- [x] `ProjectList.tsx` & `ProjectCard.tsx`: 도메인 접속, 로그 보기, 제어 버튼
- [x] `AddProjectModal.tsx`: 폴더 선택 및 프로젝트 추가
- [x] `LogViewer.tsx`: 실시간 로그 뷰어

### 5.3 IPC 연동 (`src/preload/index.ts`)
- [x] Renderer에 노출할 API 정의 (`getProjects`, `startProject`, `onLog` 등)

### 5.4 통합 및 테스트
- [x] App.tsx를 Zustand store와 연동
- [x] better-sqlite3 대신 JSON 파일 기반 저장소로 전환 (네이티브 모듈 빌드 이슈 해결)
- [x] `npm run dev` 실행 성공 확인

---

## 🔗 Phase 6: 네트워크 및 보안 자동화

### 6.1 FirewallManager 구현 (`src/main/core/FirewallManager.ts`)
- [ ] `allowPort(port)`: `sudo-prompt`로 방화벽 인바운드 규칙 자동 추가

### 6.2 TunnelManager 구현 (`src/main/core/TunnelManager.ts`)
- [ ] `localtunnel` 등으로 외부 공유 URL 생성 및 관리

---

## 🧪 Phase 7: 품질 및 배포 (Quality & Build)

### 7.1 자동 복구 및 편의 기능
- [ ] Gemini AI 기반 에러 분석 연동 (`services/geminiService.ts` 활용)
- [ ] QR 코드 표시 및 URL 클립보드 복사

### 7.2 빌드 설정 (`electron-builder.yml`)
- [ ] 아이콘, 앱 메타데이터 설정
- [ ] `npm run build` 테스트 및 인스톨러 생성 확인
