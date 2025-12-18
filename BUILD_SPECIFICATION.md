# Connection Helper 구축 명세서
## Docker GUI Wrapper Application - Step by Step Build Plan

---

## 📋 프로젝트 개요

**프로젝트명**: Connection Helper
**버전**: 1.0.0 (Initial Release)
**목적**: Docker 지식이 없는 사용자도 GUI를 통해 프로젝트를 컨테이너로 배포하고 팀원과 공유할 수 있는 데스크톱 애플리케이션
**개발 프레임워크**: Electron + Node.js
**지원 OS**: Windows 10+, macOS 10.15+, Linux (Ubuntu 20.04+)

---

## 🎯 핵심 기능 요구사항

### 사용자 관점 워크플로우
1. 프로젝트 폴더를 드래그 앤 드롭
2. 접속 범위 선택 (나만 보기 / 팀원 공유 / 외부 공개)
3. '시작하기' 버튼 클릭
4. 생성된 접속 링크 및 QR코드 확인
5. 프로젝트 관리 (시작/중지/삭제)

### 시스템 자동화 기능
- Docker 설치 여부 및 실행 상태 확인
- 프로젝트 언어/프레임워크 자동 감지
- 가용 포트 자동 할당
- Dockerfile 자동 생성
- 컨테이너 빌드 및 실행
- 접속 링크 및 QR코드 생성

---

## 📐 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Electron Application                      │
├─────────────────────────────────────────────────────────────┤
│  Renderer Process (UI)          │   Main Process (Logic)    │
│  - HTML/CSS/JavaScript           │   - System Analysis       │
│  - User Input Handling           │   - Docker Control        │
│  - Real-time Log Display         │   - Port Management       │
│  - Project Management UI         │   - File Operations       │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      Core Modules                            │
├─────────────────────────────────────────────────────────────┤
│  SystemAnalyzer  │  ProjectDetector  │  PortAllocator       │
│  DockerManager   │  TemplateEngine   │  DatabaseManager     │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   External Dependencies                      │
├─────────────────────────────────────────────────────────────┤
│  Dockerode       │  SQLite DB        │  QRCode Generator    │
│  Node.js API     │  File System      │  Network Interface   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Phase 1: 프로젝트 초기 설정

### Task 1.1: 프로젝트 구조 생성
**목적**: 프로젝트 디렉토리 구조 및 기본 파일 설정
**소요 시간**: 1시간

**작업 내역**:
```
connection-helper/
├── package.json                    # 프로젝트 메타데이터 및 의존성
├── README.md                       # 프로젝트 설명 문서
├── .gitignore                      # Git 제외 파일 목록
├── electron-builder.yml            # 빌드 설정
│
├── src/
│   ├── main/                       # Main Process (Node.js)
│   │   ├── index.js               # Electron 메인 진입점
│   │   ├── ipc-handlers.js        # IPC 통신 핸들러
│   │   └── menu.js                # 애플리케이션 메뉴
│   │
│   ├── renderer/                   # Renderer Process (UI)
│   │   ├── index.html             # 메인 UI
│   │   ├── css/
│   │   │   ├── main.css          # 전역 스타일
│   │   │   └── components.css    # 컴포넌트 스타일
│   │   ├── js/
│   │   │   ├── app.js            # UI 로직
│   │   │   ├── project-card.js   # 프로젝트 카드 컴포넌트
│   │   │   └── modal.js          # 모달 관리
│   │   └── assets/
│   │       └── icons/            # 앱 아이콘
│   │
│   ├── core/                       # 핵심 비즈니스 로직
│   │   ├── SystemAnalyzer.js      # 시스템 환경 분석
│   │   ├── ProjectDetector.js     # 프로젝트 타입 감지
│   │   ├── PortAllocator.js       # 포트 할당 관리
│   │   ├── DockerManager.js       # Docker 제어
│   │   ├── TemplateEngine.js      # Dockerfile 생성
│   │   └── DatabaseManager.js     # SQLite DB 관리
│   │
│   └── templates/                  # Dockerfile 템플릿
│       ├── nodejs.dockerfile
│       ├── python.dockerfile
│       ├── java.dockerfile
│       ├── php.dockerfile
│       └── static.dockerfile
│
├── data/                           # 데이터 저장소
│   ├── projects.db                # SQLite 데이터베이스
│   └── logs/                      # 애플리케이션 로그
│
└── docs/                          # 문서
    ├── BUILD_SPECIFICATION.md     # 이 문서
    ├── API_REFERENCE.md          # API 문서
    └── USER_GUIDE.md             # 사용자 가이드
```

**체크리스트**:
- [ ] package.json 작성 (의존성 명시)
- [ ] 디렉토리 구조 생성
- [ ] .gitignore 설정 (node_modules, data/, dist/ 제외)
- [ ] README.md 기본 내용 작성

**산출물**:
- 초기 프로젝트 구조
- package.json 파일

---

### Task 1.2: 의존성 패키지 정의
**목적**: 필요한 npm 패키지 선정 및 설치
**소요 시간**: 30분

**주요 의존성**:

**프로덕션 의존성**:
```json
{
  "dockerode": "^4.0.0",           // Docker 데몬 제어
  "better-sqlite3": "^9.2.2",      // SQLite 데이터베이스
  "express": "^4.18.2",            // 내부 API 서버 (선택)
  "qrcode": "^1.5.3",              // QR 코드 생성
  "portfinder": "^1.0.32",         // 가용 포트 탐색
  "detect-port": "^1.5.1",         // 포트 사용 여부 확인
  "node-machine-id": "^1.1.12",    // 고유 머신 ID
  "tar-fs": "^3.0.4"               // Docker 이미지 빌드용
}
```

**개발 의존성**:
```json
{
  "electron": "^27.0.0",           // Electron 프레임워크
  "electron-builder": "^24.6.4",   // 빌드/패키징 도구
  "electron-reload": "^2.0.0",     // 개발 시 자동 리로드
  "eslint": "^8.50.0",            // 코드 린터
  "prettier": "^3.0.3"            // 코드 포매터
}
```

**체크리스트**:
- [ ] package.json에 의존성 추가
- [ ] npm install 실행
- [ ] 각 패키지 버전 호환성 확인
- [ ] 라이선스 검토 (MIT, Apache 등)

**산출물**:
- node_modules/ 디렉토리
- package-lock.json

---

### Task 1.3: Electron 기본 설정
**목적**: Electron 앱의 기본 구조 및 창 설정
**소요 시간**: 2시간

**구현 내용**:

**파일**: `src/main/index.js`
```javascript
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../renderer/assets/icons/app.png'),
    title: 'Connection Helper',
    backgroundColor: '#f5f5f5'
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  
  // 개발 모드에서만 DevTools 열기
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
```

**파일**: `src/main/preload.js`
```javascript
const { contextBridge, ipcRenderer } = require('electron');

// Renderer에서 사용할 안전한 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  // 시스템 정보
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  
  // 프로젝트 관리
  addProject: (projectPath, options) => 
    ipcRenderer.invoke('add-project', projectPath, options),
  getProjects: () => ipcRenderer.invoke('get-projects'),
  startProject: (projectId) => ipcRenderer.invoke('start-project', projectId),
  stopProject: (projectId) => ipcRenderer.invoke('stop-project', projectId),
  deleteProject: (projectId) => ipcRenderer.invoke('delete-project', projectId),
  
  // 실시간 로그 구독
  onProjectLog: (callback) => ipcRenderer.on('project-log', callback),
  onProjectStatus: (callback) => ipcRenderer.on('project-status', callback),
  
  // 파일 선택
  selectFolder: () => ipcRenderer.invoke('select-folder')
});
```

**체크리스트**:
- [ ] Main Process 진입점 작성
- [ ] BrowserWindow 설정 완료
- [ ] Preload 스크립트로 안전한 IPC 브릿지 구성
- [ ] 개발/프로덕션 모드 분기 처리
- [ ] 앱 아이콘 설정

**산출물**:
- src/main/index.js
- src/main/preload.js

---

## 🔍 Phase 2: 시스템 환경 분석 모듈

### Task 2.1: SystemAnalyzer 구현
**목적**: 사용자 PC의 환경을 자동으로 분석하는 모듈
**소요 시간**: 3시간

**구현 내용**:

**파일**: `src/core/SystemAnalyzer.js`

**주요 기능**:
1. **Docker 설치 여부 확인**
   - `docker --version` 명령어 실행
   - Docker Desktop 실행 상태 확인
   - Docker 데몬 응답 확인

2. **네트워크 정보 수집**
   - 로컬 IP 주소 추출 (192.168.x.x 또는 10.x.x.x)
   - 네트워크 인터페이스 목록
   - 공인 IP 확인 (선택적)

3. **시스템 리소스 확인**
   - CPU 코어 수
   - 총 메모리 / 사용 가능한 메모리
   - 디스크 여유 공간

**클래스 구조**:
```javascript
class SystemAnalyzer {
  constructor() {
    this.docker = new Docker();
    this.systemInfo = null;
  }

  async analyze() {
    return {
      docker: await this.checkDocker(),
      network: await this.getNetworkInfo(),
      resources: await this.getSystemResources()
    };
  }

  async checkDocker() {
    // Docker 설치 및 실행 상태 확인
    // 반환: { installed: boolean, running: boolean, version: string }
  }

  async getNetworkInfo() {
    // 네트워크 인터페이스 정보
    // 반환: { localIP: string, interfaces: [], publicIP: string }
  }

  async getSystemResources() {
    // 시스템 리소스 정보
    // 반환: { cpuCores: number, totalMemory: number, freeMemory: number }
  }
}
```

**예외 처리**:
- Docker 미설치 시: 설치 가이드 링크 제공
- Docker 미실행 시: 실행 방법 안내
- 네트워크 오류: 로컬 전용 모드로 전환 제안

**체크리스트**:
- [ ] Docker 설치 여부 감지 로직
- [ ] Docker 실행 상태 확인
- [ ] 로컬 IP 추출 (os.networkInterfaces() 사용)
- [ ] 시스템 리소스 확인 (os 모듈 사용)
- [ ] 에러 핸들링 및 사용자 피드백

**산출물**:
- src/core/SystemAnalyzer.js
- 시스템 분석 결과 JSON 스키마

**테스트 시나리오**:
1. Docker 설치 및 실행 중인 환경
2. Docker 설치되었으나 미실행 환경
3. Docker 미설치 환경
4. 네트워크 연결 없는 환경

---

### Task 2.2: ProjectDetector 구현
**목적**: 프로젝트 폴더를 분석하여 언어/프레임워크 자동 감지
**소요 시간**: 4시간

**구현 내용**:

**파일**: `src/core/ProjectDetector.js`

**감지 규칙**:

| 프로젝트 타입 | 감지 파일 | 우선순위 | 기본 포트 |
|---|---|---|---|
| Node.js | package.json | 1 | 3000 |
| Python | requirements.txt, setup.py | 2 | 5000 |
| Java Spring | pom.xml, build.gradle | 3 | 8080 |
| PHP | composer.json, index.php | 4 | 8000 |
| Static HTML | index.html | 5 | 80 |
| Ruby on Rails | Gemfile, config.ru | 6 | 3000 |
| Go | go.mod | 7 | 8080 |
| .NET | *.csproj, *.sln | 8 | 5000 |

**클래스 구조**:
```javascript
class ProjectDetector {
  constructor(projectPath) {
    this.projectPath = projectPath;
    this.detectedType = null;
    this.metadata = {};
  }

  async detect() {
    // 프로젝트 타입 감지
    const files = await this.scanDirectory();
    this.detectedType = this.identifyProjectType(files);
    this.metadata = await this.extractMetadata();
    
    return {
      type: this.detectedType,
      name: this.getProjectName(),
      port: this.getDefaultPort(),
      runtime: this.getRuntime(),
      metadata: this.metadata
    };
  }

  async scanDirectory() {
    // 프로젝트 루트의 파일 목록 반환
  }

  identifyProjectType(files) {
    // 감지 규칙에 따라 프로젝트 타입 결정
    // 우선순위 기반 매칭
  }

  async extractMetadata() {
    // package.json의 name, version 등 추출
    // 프로젝트별 메타데이터 수집
  }
}
```

**상세 감지 로직**:

**Node.js**:
- `package.json` 존재 확인
- `scripts.start` 또는 `scripts.dev` 명령어 추출
- 프레임워크 감지 (Express, Next.js, Nuxt.js, React, Vue 등)
- dependencies에서 주요 패키지 확인

**Python**:
- `requirements.txt` 또는 `setup.py` 확인
- Flask/Django/FastAPI 감지
- 가상환경 디렉토리 확인 (venv, .venv)

**Java**:
- Maven (`pom.xml`) vs Gradle (`build.gradle`) 구분
- Spring Boot 여부 확인
- Java 버전 추정

**체크리스트**:
- [ ] 파일 시스템 스캔 기능
- [ ] 8가지 주요 언어/프레임워크 감지 로직
- [ ] 메타데이터 추출 (프로젝트명, 버전 등)
- [ ] 여러 타입이 혼재된 경우 우선순위 처리
- [ ] 감지 실패 시 사용자 수동 선택 UI 제공

**산출물**:
- src/core/ProjectDetector.js
- 감지 결과 JSON 스키마

**테스트 케이스**:
1. Express.js 프로젝트
2. React (Create React App) 프로젝트
3. Django 프로젝트
4. Spring Boot 프로젝트
5. 순수 HTML/CSS 프로젝트
6. 복합 프로젝트 (프론트엔드 + 백엔드)

---

## ⚙️ Phase 3: Docker 제어 및 포트 관리

### Task 3.1: PortAllocator 구현
**목적**: 포트 충돌 없이 자동으로 가용 포트 할당
**소요 시간**: 2시간

**구현 내용**:

**파일**: `src/core/PortAllocator.js`

**포트 할당 전략**:
1. **기본 포트 시도**: 프로젝트 타입별 기본 포트 (3000, 5000 등)
2. **범위 내 탐색**: 3000-9000 범위에서 가용 포트 검색
3. **DB 기록**: 할당된 포트를 데이터베이스에 저장
4. **충돌 방지**: 이미 할당된 포트 재사용 금지

**클래스 구조**:
```javascript
class PortAllocator {
  constructor(dbManager) {
    this.db = dbManager;
    this.portRange = { min: 3000, max: 9000 };
  }

  async allocate(projectId, preferredPort = null) {
    // 선호 포트가 있고 사용 가능하면 할당
    if (preferredPort && await this.isPortAvailable(preferredPort)) {
      return this.assignPort(projectId, preferredPort);
    }
    
    // 가용 포트 찾기
    const port = await this.findAvailablePort();
    return this.assignPort(projectId, port);
  }

  async isPortAvailable(port) {
    // TCP 연결 시도로 포트 사용 여부 확인
    // DB에서 이미 할당된 포트인지 확인
  }

  async findAvailablePort() {
    // portfinder 라이브러리 사용
    // 또는 순차 스캔
  }

  async assignPort(projectId, port) {
    // DB에 프로젝트-포트 매핑 저장
    // 반환: { port, assignedAt }
  }

  async release(projectId) {
    // 프로젝트 종료 시 포트 해제
  }
}
```

**DB 스키마** (SQLite):
```sql
CREATE TABLE port_allocations (
  project_id TEXT PRIMARY KEY,
  port INTEGER NOT NULL UNIQUE,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME
);
```

**체크리스트**:
- [ ] 포트 가용성 체크 로직
- [ ] 동적 포트 할당 알고리즘
- [ ] DB 기반 포트 관리
- [ ] 포트 해제 메커니즘
- [ ] 동시성 제어 (여러 프로젝트 동시 실행 시)

**산출물**:
- src/core/PortAllocator.js
- SQLite 테이블 스키마

---

### Task 3.2: DockerManager 구현
**목적**: Dockerode를 통해 Docker 데몬 제어
**소요 시간**: 5시간

**구현 내용**:

**파일**: `src/core/DockerManager.js`

**주요 기능**:
1. **이미지 빌드**: Dockerfile 기반 이미지 생성
2. **컨테이너 실행**: 포트 바인딩 및 환경변수 주입
3. **로그 스트리밍**: 실시간 컨테이너 로그를 UI로 전송
4. **상태 관리**: 컨테이너 시작/중지/재시작/삭제
5. **리소스 모니터링**: CPU/메모리 사용량 추적

**클래스 구조**:
```javascript
class DockerManager {
  constructor() {
    this.docker = new Docker();
  }

  async buildImage(projectPath, dockerfile, imageName) {
    // tar-fs로 빌드 컨텍스트 생성
    // docker.buildImage() 호출
    // 빌드 로그 스트리밍
    // 반환: { imageId, buildTime }
  }

  async runContainer(options) {
    // options: { imageId, name, port, env, volumes }
    // 컨테이너 생성 및 실행
    // 반환: { containerId, status }
  }

  async stopContainer(containerId) {
    // 컨테이너 정지 (graceful shutdown)
  }

  async removeContainer(containerId) {
    // 컨테이너 및 관련 이미지 삭제
  }

  async streamLogs(containerId, callback) {
    // 실시간 로그를 callback으로 전달
  }

  async getContainerStats(containerId) {
    // CPU/메모리 사용량 반환
  }

  async listContainers(filters = {}) {
    // 실행 중인 컨테이너 목록
  }
}
```

**Dockerfile 빌드 옵션**:
```javascript
{
  t: 'connection-helper/project-abc', // 이미지 태그
  labels: {
    'app': 'connection-helper',
    'project-id': 'abc123',
    'created-by': 'connection-helper-v1.0.0'
  },
  buildargs: {
    NODE_VERSION: '18'
  }
}
```

**컨테이너 실행 옵션**:
```javascript
{
  Image: 'connection-helper/project-abc',
  name: 'project-abc-container',
  ExposedPorts: {
    '3000/tcp': {}
  },
  HostConfig: {
    PortBindings: {
      '3000/tcp': [{ HostPort: '4567' }]
    },
    Binds: [
      '/host/project/path:/app'  // 볼륨 마운트
    ],
    RestartPolicy: {
      Name: 'unless-stopped'
    }
  },
  Env: [
    'NODE_ENV=development',
    'PORT=3000'
  ]
}
```

**에러 처리**:
- 이미지 빌드 실패: 에러 로그 파싱 및 사용자 친화적 메시지
- 포트 이미 사용 중: 대체 포트 제안
- 메모리 부족: 리소스 정리 제안

**체크리스트**:
- [ ] Dockerode 초기화 및 연결 테스트
- [ ] 이미지 빌드 로직 (tar-fs 사용)
- [ ] 컨테이너 생성 및 실행
- [ ] 실시간 로그 스트리밍 (IPC로 UI 전송)
- [ ] 컨테이너 생명주기 관리 (시작/중지/삭제)
- [ ] 리소스 모니터링 기능
- [ ] 에러 핸들링 및 사용자 피드백

**산출물**:
- src/core/DockerManager.js
- Docker 작업 로그 파일

**테스트 시나리오**:
1. 정상 이미지 빌드 및 실행
2. 빌드 중 에러 발생 (Dockerfile 오류)
3. 포트 충돌 상황
4. 컨테이너 중지 및 재시작
5. 여러 컨테이너 동시 실행

---

### Task 3.3: TemplateEngine 구현
**목적**: 프로젝트 타입에 맞는 Dockerfile 자동 생성
**소요 시간**: 4시간

**구현 내용**:

**파일**: `src/core/TemplateEngine.js`

**템플릿 시스템**:
- 각 언어/프레임워크별 베스트 프랙티스 기반 Dockerfile
- 변수 치환 시스템 (프로젝트명, 포트, 환경변수 등)
- 멀티 스테이지 빌드 지원 (프로덕션용)

**클래스 구조**:
```javascript
class TemplateEngine {
  constructor() {
    this.templatesPath = path.join(__dirname, '../templates');
  }

  async generate(projectType, variables) {
    // 템플릿 로드
    const template = await this.loadTemplate(projectType);
    
    // 변수 치환
    const dockerfile = this.interpolate(template, variables);
    
    return dockerfile;
  }

  async loadTemplate(projectType) {
    // templates/nodejs.dockerfile 등 로드
  }

  interpolate(template, variables) {
    // {{VAR_NAME}} 형태의 변수를 실제 값으로 치환
  }

  async createDockerignore(projectPath, projectType) {
    // .dockerignore 파일 생성
  }
}
```

**템플릿 예시**:

**Node.js 템플릿** (`templates/nodejs.dockerfile`):
```dockerfile
FROM node:{{NODE_VERSION}}-alpine

WORKDIR /app

# 의존성 설치 (캐시 최적화)
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사
COPY . .

# 환경변수
ENV NODE_ENV={{ENV}}
ENV PORT={{PORT}}

EXPOSE {{PORT}}

CMD ["npm", "start"]
```

**Python 템플릿** (`templates/python.dockerfile`):
```dockerfile
FROM python:{{PYTHON_VERSION}}-slim

WORKDIR /app

# 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 소스 코드 복사
COPY . .

ENV PYTHONUNBUFFERED=1
ENV PORT={{PORT}}

EXPOSE {{PORT}}

CMD ["python", "{{MAIN_FILE}}"]
```

**변수 맵핑**:
```javascript
const variables = {
  NODE_VERSION: '18',
  PYTHON_VERSION: '3.11',
  ENV: 'development',
  PORT: '3000',
  MAIN_FILE: 'app.py',
  PROJECT_NAME: 'my-project'
};
```

**.dockerignore 생성**:
```
node_modules
npm-debug.log
.git
.env
*.md
.DS_Store
```

**체크리스트**:
- [ ] 8가지 언어별 Dockerfile 템플릿 작성
- [ ] 변수 치환 로직 구현
- [ ] .dockerignore 자동 생성
- [ ] 템플릿 유효성 검증
- [ ] 사용자 커스텀 템플릿 지원 (향후)

**산출물**:
- src/core/TemplateEngine.js
- src/templates/*.dockerfile (8개)
- .dockerignore 템플릿

---

## 💾 Phase 4: 데이터 관리

### Task 4.1: DatabaseManager 구현
**목적**: SQLite를 사용한 프로젝트 정보 영구 저장
**소요 시간**: 3시간

**구현 내용**:

**파일**: `src/core/DatabaseManager.js`

**DB 스키마**:
```sql
-- 프로젝트 정보
CREATE TABLE projects (
  id TEXT PRIMARY KEY,              -- UUID
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,               -- nodejs, python 등
  port INTEGER,
  access_scope TEXT NOT NULL,       -- local, network, public
  status TEXT DEFAULT 'stopped',    -- stopped, running, building, error
  container_id TEXT,
  image_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_started DATETIME,
  metadata TEXT                     -- JSON 형태 추가 정보
);

-- 포트 할당
CREATE TABLE port_allocations (
  project_id TEXT PRIMARY KEY,
  port INTEGER NOT NULL UNIQUE,
  assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 실행 로그
CREATE TABLE execution_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL,
  log_type TEXT NOT NULL,          -- info, error, build, runtime
  message TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 설정
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**클래스 구조**:
```javascript
class DatabaseManager {
  constructor(dbPath) {
    this.db = new Database(dbPath);
    this.initialize();
  }

  initialize() {
    // 테이블 생성
    // 인덱스 설정
  }

  // 프로젝트 CRUD
  async createProject(projectData) {}
  async getProject(projectId) {}
  async updateProject(projectId, updates) {}
  async deleteProject(projectId) {}
  async listProjects(filters = {}) {}

  // 포트 관리
  async allocatePort(projectId, port) {}
  async releasePort(projectId) {}
  async getUsedPorts() {}

  // 로그 관리
  async addLog(projectId, logType, message) {}
  async getLogs(projectId, limit = 100) {}
  async clearLogs(projectId) {}

  // 설정 관리
  async getSetting(key) {}
  async setSetting(key, value) {}
}
```

**트랜잭션 처리**:
```javascript
async createProjectWithPort(projectData, port) {
  const transaction = this.db.transaction((data, port) => {
    // 프로젝트 생성
    this.db.prepare('INSERT INTO projects ...').run(data);
    
    // 포트 할당
    this.db.prepare('INSERT INTO port_allocations ...').run({ 
      project_id: data.id, 
      port 
    });
  });
  
  transaction(projectData, port);
}
```

**체크리스트**:
- [ ] SQLite 데이터베이스 초기화
- [ ] 테이블 스키마 생성
- [ ] CRUD 메서드 구현
- [ ] 트랜잭션 처리
- [ ] 인덱스 최적화
- [ ] 데이터베이스 백업 기능

**산출물**:
- src/core/DatabaseManager.js
- data/projects.db (런타임 생성)
- DB 마이그레이션 스크립트

---

## 🎨 Phase 5: UI/UX 개발

### Task 5.1: 메인 UI 레이아웃
**목적**: 사용자 친화적인 인터페이스 디자인 및 구현
**소요 시간**: 6시간

**구현 내용**:

**파일**: `src/renderer/index.html`

**화면 구성**:
```
┌─────────────────────────────────────────────────────────────┐
│  Connection Helper                          [─] [□] [×]      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [+] 새 프로젝트 추가                      [⚙️ 설정]  │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                               │
│  내 프로젝트 (3)                                              │
│  ┌───────────────────┬───────────────────┬────────────────┐ │
│  │  🟢 쇼핑몰-1차    │  🔴 포트폴리오     │  🟡 CRM 시스템  │ │
│  │  Node.js          │  React            │  Python        │ │
│  │  :4567            │  Stopped          │  Building...   │ │
│  │  [중지] [로그]    │  [시작] [삭제]    │  [취소]        │ │
│  └───────────────────┴───────────────────┴────────────────┘ │
│                                                               │
│  시스템 상태                                                  │
│  ├─ Docker: ✅ 실행 중 (v24.0.6)                             │
│  ├─ 네트워크: 192.168.0.15                                   │
│  └─ 사용 중인 포트: 3개 / 메모리: 45%                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**컴포넌트 구조**:
1. **헤더 바**: 앱 제목, 새 프로젝트 버튼, 설정 버튼
2. **프로젝트 그리드**: 카드 형태로 프로젝트 표시
3. **시스템 상태 바**: 하단에 시스템 정보 표시
4. **모달**: 프로젝트 추가, 로그 뷰어, 설정

**CSS 프레임워크**: 순수 CSS (또는 Tailwind CSS)

**HTML 구조**:
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Connection Helper</title>
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/components.css">
</head>
<body>
  <!-- 헤더 -->
  <header class="app-header">
    <h1>Connection Helper</h1>
    <div class="header-actions">
      <button id="btn-add-project" class="btn-primary">
        <span class="icon">+</span> 새 프로젝트
      </button>
      <button id="btn-settings" class="btn-icon">⚙️</button>
    </div>
  </header>

  <!-- 메인 컨텐츠 -->
  <main class="main-content">
    <section class="projects-section">
      <h2>내 프로젝트 (<span id="project-count">0</span>)</h2>
      <div id="projects-grid" class="projects-grid">
        <!-- 프로젝트 카드가 동적으로 추가됨 -->
      </div>
      <div id="empty-state" class="empty-state">
        <p>프로젝트를 추가하여 시작하세요</p>
        <button class="btn-secondary">첫 프로젝트 추가하기</button>
      </div>
    </section>
  </main>

  <!-- 시스템 상태 바 -->
  <footer class="status-bar">
    <div class="status-item">
      <span class="status-label">Docker:</span>
      <span id="docker-status" class="status-value">확인 중...</span>
    </div>
    <div class="status-item">
      <span class="status-label">네트워크:</span>
      <span id="network-ip" class="status-value">-</span>
    </div>
    <div class="status-item">
      <span class="status-label">활성 프로젝트:</span>
      <span id="active-count" class="status-value">0</span>
    </div>
  </footer>

  <!-- 모달 컨테이너 -->
  <div id="modal-container"></div>

  <script src="js/app.js"></script>
</body>
</html>
```

**체크리스트**:
- [ ] HTML 마크업 작성
- [ ] 반응형 레이아웃 (최소 1000px 너비)
- [ ] 접근성 고려 (키보드 네비게이션)
- [ ] 다크 모드 지원 (선택)
- [ ] 로딩 상태 UI

**산출물**:
- src/renderer/index.html
- 와이어프레임 문서

---

### Task 5.2: CSS 스타일링
**목적**: 모던하고 직관적인 UI 디자인
**소요 시간**: 4시간

**구현 내용**:

**파일**: `src/renderer/css/main.css`

**디자인 시스템**:
```css
:root {
  /* 컬러 팔레트 */
  --primary-color: #3b82f6;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --bg-primary: #ffffff;
  --bg-secondary: #f3f4f6;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;

  /* 타이포그래피 */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
  --font-size-xl: 20px;

  /* 간격 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* 그림자 */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);

  /* 보더 반경 */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

**컴포넌트 스타일**:

**프로젝트 카드**:
```css
.project-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.3s ease;
}

.project-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.project-card.status-running {
  border-left: 4px solid var(--success-color);
}

.project-card.status-stopped {
  border-left: 4px solid var(--text-secondary);
}

.project-card.status-error {
  border-left: 4px solid var(--error-color);
}
```

**버튼**:
```css
.btn-primary {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}
```

**체크리스트**:
- [ ] CSS 변수 시스템 정의
- [ ] 전역 스타일 설정
- [ ] 컴포넌트별 스타일 작성
- [ ] 호버/포커스 상태 정의
- [ ] 애니메이션 효과

**산출물**:
- src/renderer/css/main.css
- src/renderer/css/components.css

---

### Task 5.3: JavaScript UI 로직
**목적**: UI 상호작용 및 IPC 통신 처리
**소요 시간**: 6시간

**구현 내용**:

**파일**: `src/renderer/js/app.js`

**주요 기능**:
1. **초기화**: 앱 로드 시 시스템 정보 및 프로젝트 목록 로드
2. **프로젝트 추가**: 모달 표시 및 폴더 선택
3. **프로젝트 카드 렌더링**: 상태에 따른 동적 UI 업데이트
4. **실시간 로그**: IPC를 통한 실시간 로그 수신 및 표시
5. **에러 핸들링**: 사용자 친화적 에러 메시지 표시

**코드 구조**:
```javascript
class ConnectionHelperApp {
  constructor() {
    this.projects = [];
    this.systemInfo = null;
    this.init();
  }

  async init() {
    // 시스템 정보 로드
    await this.loadSystemInfo();
    
    // 프로젝트 목록 로드
    await this.loadProjects();
    
    // 이벤트 리스너 등록
    this.attachEventListeners();
    
    // 실시간 업데이트 구독
    this.subscribeToUpdates();
  }

  async loadSystemInfo() {
    this.systemInfo = await window.electronAPI.getSystemInfo();
    this.updateSystemStatus();
  }

  async loadProjects() {
    this.projects = await window.electronAPI.getProjects();
    this.renderProjects();
  }

  renderProjects() {
    const grid = document.getElementById('projects-grid');
    const emptyState = document.getElementById('empty-state');
    
    if (this.projects.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
      return;
    }
    
    grid.innerHTML = '';
    emptyState.style.display = 'none';
    
    this.projects.forEach(project => {
      const card = this.createProjectCard(project);
      grid.appendChild(card);
    });
  }

  createProjectCard(project) {
    // 프로젝트 카드 HTML 생성
    // 상태에 따른 버튼 렌더링
  }

  attachEventListeners() {
    // 새 프로젝트 버튼
    document.getElementById('btn-add-project')
      .addEventListener('click', () => this.showAddProjectModal());
    
    // 기타 이벤트
  }

  subscribeToUpdates() {
    // 실시간 로그 수신
    window.electronAPI.onProjectLog((event, data) => {
      this.handleProjectLog(data);
    });
    
    // 프로젝트 상태 변경 수신
    window.electronAPI.onProjectStatus((event, data) => {
      this.updateProjectStatus(data);
    });
  }

  async showAddProjectModal() {
    // 모달 표시 로직
  }

  async handleProjectLog(logData) {
    // 로그 표시 로직
  }

  updateProjectStatus(statusData) {
    // 프로젝트 카드 상태 업데이트
  }
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
  new ConnectionHelperApp();
});
```

**체크리스트**:
- [ ] 앱 초기화 로직
- [ ] 프로젝트 목록 렌더링
- [ ] 프로젝트 카드 동적 생성
- [ ] 모달 관리 시스템
- [ ] IPC 통신 처리
- [ ] 에러 핸들링 및 토스트 알림

**산출물**:
- src/renderer/js/app.js
- src/renderer/js/project-card.js
- src/renderer/js/modal.js

---

### Task 5.4: 프로젝트 추가 모달
**목적**: 프로젝트 추가 워크플로우 UI
**소요 시간**: 4시간

**구현 내용**:

**모달 레이아웃**:
```
┌─────────────────────────────────────────────────────┐
│  새 프로젝트 추가                             [×]    │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1️⃣ 프로젝트 폴더 선택                              │
│  ┌────────────────────────────────────────────────┐ │
│  │  [📁 폴더 선택하기]                            │ │
│  │                                                 │ │
│  │  선택된 폴더: C:\Users\Dev\MyProject           │ │
│  │  감지된 타입: Node.js (Express)                │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  2️⃣ 프로젝트 이름                                   │
│  ┌────────────────────────────────────────────────┐ │
│  │  MyProject                                     │ │
│  └────────────────────────────────────────────────┘ │
│                                                      │
│  3️⃣ 접속 범위                                       │
│  ⚪ 나만 보기 (localhost)                          │
│  🔘 팀원과 공유 (내부 네트워크)                     │
│  ⚪ 외부 공개 (인터넷)                              │
│                                                      │
│  [취소]                            [프로젝트 시작] │
│                                                      │
└─────────────────────────────────────────────────────┘
```

**상태별 UI**:

**초기 상태**:
- 폴더 미선택: '시작하기' 버튼 비활성화
- 드래그 앤 드롭 영역 강조

**분석 중**:
- 로딩 스피너 표시
- "프로젝트 분석 중..." 메시지

**감지 완료**:
- 감지된 정보 표시 (언어, 프레임워크)
- 자동 입력된 프로젝트 이름 (수정 가능)

**시작 중**:
- 진행 상태 표시
  - "Dockerfile 생성 중..."
  - "이미지 빌드 중... (30%)"
  - "컨테이너 실행 중..."

**체크리스트**:
- [ ] 모달 HTML 구조
- [ ] 파일 선택 다이얼로그 연동
- [ ] 프로젝트 타입 자동 감지 표시
- [ ] 접속 범위 라디오 버튼
- [ ] 진행 상태 UI
- [ ] 입력 유효성 검증

**산출물**:
- src/renderer/js/add-project-modal.js

---

### Task 5.5: 로그 뷰어 모달
**목적**: 실시간 컨테이너 로그 확인
**소요 시간**: 3시간

**구현 내용**:

**로그 뷰어 레이아웃**:
```
┌─────────────────────────────────────────────────────┐
│  프로젝트 로그: 쇼핑몰-1차                      [×]  │
├─────────────────────────────────────────────────────┤
│  [자동 스크롤: ON] [로그 지우기] [로그 저장]       │
├─────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────┐  │
│  │ [14:23:01] INFO  Starting server...           │  │
│  │ [14:23:02] INFO  Connected to database        │  │
│  │ [14:23:02] SUCCESS Server listening on :3000  │  │
│  │ [14:23:15] INFO  GET / 200 25ms               │  │
│  │ [14:23:18] ERROR Database connection lost     │  │
│  │                                                │  │
│  │                                                │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  [닫기]                                              │
└─────────────────────────────────────────────────────┘
```

**기능**:
- 실시간 로그 스트리밍
- 자동 스크롤 토글
- 로그 레벨별 색상 구분 (INFO, ERROR, WARNING)
- 로그 필터링 (검색)
- 로그 내보내기 (.txt)

**코드 구조**:
```javascript
class LogViewer {
  constructor(projectId) {
    this.projectId = projectId;
    this.logs = [];
    this.autoScroll = true;
    this.init();
  }

  init() {
    this.render();
    this.subscribeLogs();
  }

  subscribeLogs() {
    window.electronAPI.onProjectLog((event, logData) => {
      if (logData.projectId === this.projectId) {
        this.addLog(logData);
      }
    });
  }

  addLog(logData) {
    this.logs.push(logData);
    this.renderLog(logData);
    
    if (this.autoScroll) {
      this.scrollToBottom();
    }
  }

  renderLog(logData) {
    const logElement = document.createElement('div');
    logElement.className = `log-entry log-${logData.level}`;
    logElement.textContent = 
      `[${logData.timestamp}] ${logData.level.toUpperCase()} ${logData.message}`;
    
    this.logsContainer.appendChild(logElement);
  }
}
```

**체크리스트**:
- [ ] 로그 뷰어 HTML 구조
- [ ] 실시간 로그 수신 및 표시
- [ ] 자동 스크롤 기능
- [ ] 로그 레벨별 스타일링
- [ ] 로그 내보내기 기능

**산출물**:
- src/renderer/js/log-viewer.js

---

## 🔗 Phase 6: IPC 통신 및 통합

### Task 6.1: IPC 핸들러 구현
**목적**: Renderer와 Main 프로세스 간 안전한 통신
**소요 시간**: 4시간

**구현 내용**:

**파일**: `src/main/ipc-handlers.js`

**IPC 채널 정의**:
```javascript
const { ipcMain, dialog } = require('electron');

class IPCHandlers {
  constructor(systemAnalyzer, projectManager, dockerManager, dbManager) {
    this.systemAnalyzer = systemAnalyzer;
    this.projectManager = projectManager;
    this.dockerManager = dockerManager;
    this.dbManager = dbManager;
    
    this.registerHandlers();
  }

  registerHandlers() {
    // 시스템 정보
    ipcMain.handle('get-system-info', async () => {
      return await this.systemAnalyzer.analyze();
    });

    // 프로젝트 관리
    ipcMain.handle('add-project', async (event, projectPath, options) => {
      return await this.projectManager.addProject(projectPath, options);
    });

    ipcMain.handle('get-projects', async () => {
      return await this.dbManager.listProjects();
    });

    ipcMain.handle('start-project', async (event, projectId) => {
      return await this.projectManager.startProject(projectId);
    });

    ipcMain.handle('stop-project', async (event, projectId) => {
      return await this.projectManager.stopProject(projectId);
    });

    ipcMain.handle('delete-project', async (event, projectId) => {
      return await this.projectManager.deleteProject(projectId);
    });

    // 폴더 선택 다이얼로그
    ipcMain.handle('select-folder', async () => {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
      });
      return result.filePaths[0];
    });

    // 로그 스트리밍은 이벤트 형태
    this.setupLogStreaming();
  }

  setupLogStreaming() {
    // DockerManager에서 발생하는 로그를 UI로 전송
    this.dockerManager.on('log', (projectId, logData) => {
      this.mainWindow.webContents.send('project-log', {
        projectId,
        ...logData
      });
    });

    this.dockerManager.on('status-change', (projectId, status) => {
      this.mainWindow.webContents.send('project-status', {
        projectId,
        status
      });
    });
  }
}
```

**에러 응답 형식**:
```javascript
{
  success: false,
  error: {
    code: 'DOCKER_NOT_RUNNING',
    message: 'Docker Desktop이 실행되고 있지 않습니다.',
    action: 'Docker Desktop을 실행한 후 다시 시도해주세요.'
  }
}
```

**체크리스트**:
- [ ] 모든 IPC 채널 핸들러 구현
- [ ] 에러 처리 및 응답 형식 통일
- [ ] 파일 다이얼로그 연동
- [ ] 실시간 이벤트 스트리밍
- [ ] 보안 검증 (경로 접근 제한 등)

**산출물**:
- src/main/ipc-handlers.js

---

### Task 6.2: ProjectManager 통합 클래스
**목적**: 프로젝트 생명주기를 관리하는 중앙 컨트롤러
**소요 시간**: 5시간

**구현 내용**:

**파일**: `src/core/ProjectManager.js`

**책임**:
- 프로젝트 추가 워크플로우 조율
- 각 모듈 간 데이터 흐름 관리
- 상태 관리 및 에러 복구

**클래스 구조**:
```javascript
class ProjectManager {
  constructor(dbManager, systemAnalyzer, projectDetector, 
              portAllocator, templateEngine, dockerManager) {
    this.db = dbManager;
    this.systemAnalyzer = systemAnalyzer;
    this.projectDetector = projectDetector;
    this.portAllocator = portAllocator;
    this.templateEngine = templateEngine;
    this.dockerManager = dockerManager;
  }

  async addProject(projectPath, options) {
    try {
      // 1. 프로젝트 타입 감지
      const projectInfo = await this.projectDetector.detect(projectPath);
      
      // 2. 포트 할당
      const port = await this.portAllocator.allocate(
        projectInfo.id, 
        projectInfo.port
      );
      
      // 3. Dockerfile 생성
      const dockerfile = await this.templateEngine.generate(
        projectInfo.type,
        { ...projectInfo, port, ...options }
      );
      
      // 4. DB에 프로젝트 저장
      await this.db.createProject({
        ...projectInfo,
        port,
        path: projectPath,
        access_scope: options.accessScope
      });
      
      // 5. Docker 이미지 빌드
      await this.buildProject(projectInfo.id, projectPath, dockerfile);
      
      return { success: true, project: projectInfo };
      
    } catch (error) {
      // 롤백 처리
      await this.rollbackProject(projectInfo?.id);
      throw error;
    }
  }

  async buildProject(projectId, projectPath, dockerfile) {
    // 빌드 진행 상태를 UI로 전송하며 이미지 빌드
    const imageId = await this.dockerManager.buildImage(
      projectPath,
      dockerfile,
      `connection-helper/${projectId}`
    );
    
    await this.db.updateProject(projectId, { image_id: imageId });
    
    return imageId;
  }

  async startProject(projectId) {
    const project = await this.db.getProject(projectId);
    
    // 컨테이너 실행
    const containerId = await this.dockerManager.runContainer({
      imageId: project.image_id,
      name: `${projectId}-container`,
      port: project.port,
      env: this.buildEnvVars(project),
      volumes: [`${project.path}:/app`]
    });
    
    await this.db.updateProject(projectId, {
      container_id: containerId,
      status: 'running',
      last_started: new Date()
    });
    
    // 로그 스트리밍 시작
    this.dockerManager.streamLogs(containerId, (log) => {
      this.emit('log', projectId, log);
    });
    
    return { success: true, containerId, accessUrl: this.getAccessUrl(project) };
  }

  async stopProject(projectId) {
    const project = await this.db.getProject(projectId);
    
    await this.dockerManager.stopContainer(project.container_id);
    await this.db.updateProject(projectId, { status: 'stopped' });
    
    return { success: true };
  }

  async deleteProject(projectId) {
    const project = await this.db.getProject(projectId);
    
    // 컨테이너 및 이미지 삭제
    if (project.container_id) {
      await this.dockerManager.removeContainer(project.container_id);
    }
    
    // 포트 해제
    await this.portAllocator.release(projectId);
    
    // DB에서 삭제
    await this.db.deleteProject(projectId);
    
    return { success: true };
  }

  getAccessUrl(project) {
    const ip = project.access_scope === 'local' ? 
      'localhost' : 
      this.systemAnalyzer.getLocalIP();
    
    return `http://${ip}:${project.port}`;
  }

  buildEnvVars(project) {
    return [
      `NODE_ENV=development`,
      `PORT=${project.port}`,
      `PROJECT_ID=${project.id}`
    ];
  }

  async rollbackProject(projectId) {
    // 실패 시 생성된 리소스 정리
    if (!projectId) return;
    
    try {
      await this.portAllocator.release(projectId);
      await this.db.deleteProject(projectId);
    } catch (err) {
      console.error('Rollback error:', err);
    }
  }
}
```

**체크리스트**:
- [ ] 프로젝트 추가 워크플로우 구현
- [ ] 각 모듈 통합 및 데이터 전달
- [ ] 에러 발생 시 롤백 로직
- [ ] 상태 관리 및 업데이트
- [ ] 접속 URL 생성 로직

**산출물**:
- src/core/ProjectManager.js

---

## 🎁 Phase 7: 부가 기능

### Task 7.1: QR 코드 생성
**목적**: 모바일 기기에서 쉽게 접속할 수 있도록 QR 코드 제공
**소요 시간**: 2시간

**구현 내용**:

**파일**: `src/core/QRCodeGenerator.js`

```javascript
const QRCode = require('qrcode');

class QRCodeGenerator {
  async generate(url) {
    // Data URL 형태로 QR 코드 생성
    const qrDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return qrDataUrl;
  }

  async saveToFile(url, filepath) {
    await QRCode.toFile(filepath, url);
  }
}
```

**UI 통합**:
- 프로젝트 카드에 'QR코드' 버튼 추가
- 클릭 시 모달로 QR코드 표시
- QR코드 이미지 다운로드 기능

**체크리스트**:
- [ ] QR 코드 생성 로직
- [ ] UI 모달 구현
- [ ] 이미지 저장 기능

**산출물**:
- src/core/QRCodeGenerator.js
- QR 코드 모달 UI

---

### Task 7.2: 공유 기능
**목적**: 생성된 링크를 쉽게 공유
**소요 시간**: 2시간

**구현 내용**:

**기능**:
1. 클립보드 복사 (원클릭)
2. 이메일로 전송 (mailto: 링크)
3. Slack 연동 (Webhook)

**UI**:
```html
<div class="share-buttons">
  <button onclick="copyToClipboard(url)">
    📋 링크 복사
  </button>
  <button onclick="shareViaEmail(url)">
    ✉️ 이메일 전송
  </button>
  <button onclick="shareToSlack(url)">
    💬 Slack 전송
  </button>
</div>
```

**코드**:
```javascript
async function copyToClipboard(url) {
  await navigator.clipboard.writeText(url);
  showToast('링크가 복사되었습니다');
}

function shareViaEmail(url) {
  const subject = '프로젝트 접속 링크';
  const body = `다음 링크로 접속해주세요:\n${url}`;
  window.open(`mailto:?subject=${subject}&body=${encodeURIComponent(body)}`);
}
```

**체크리스트**:
- [ ] 클립보드 복사 기능
- [ ] 이메일 공유 링크
- [ ] Slack Webhook 연동 (선택)
- [ ] 토스트 알림 표시

**산출물**:
- 공유 기능 UI 및 로직

---

### Task 7.3: 설정 관리
**목적**: 앱 설정 및 환경 설정 UI
**소요 시간**: 3시간

**구현 내용**:

**설정 항목**:
```
┌─────────────────────────────────────────────┐
│  설정                                  [×]   │
├─────────────────────────────────────────────┤
│                                              │
│  일반                                        │
│  ├─ 자동 시작: [ ] 시스템 부팅 시 실행     │
│  ├─ 테마: [v] 라이트  [ ] 다크             │
│  └─ 언어: [한국어 ▼]                       │
│                                              │
│  Docker                                      │
│  ├─ Docker 경로: /usr/local/bin/docker     │
│  ├─ 기본 메모리 제한: 2GB                  │
│  └─ 빌드 캐시: [v] 사용                    │
│                                              │
│  네트워크                                    │
│  ├─ 기본 포트 범위: 3000 ~ 9000            │
│  ├─ 방화벽 경고: [v] 표시                  │
│  └─ 외부 접속: [ ] 허용                    │
│                                              │
│  고급                                        │
│  ├─ 로그 레벨: [INFO ▼]                    │
│  ├─ 로그 보관 기간: 7일                    │
│  └─ 데이터베이스 백업: [백업하기]          │
│                                              │
│  [취소]                          [저장]     │
└─────────────────────────────────────────────┘
```

**코드 구조**:
```javascript
class SettingsManager {
  constructor(dbManager) {
    this.db = dbManager;
    this.settings = {};
  }

  async load() {
    const rows = await this.db.getAllSettings();
    rows.forEach(row => {
      this.settings[row.key] = JSON.parse(row.value);
    });
  }

  async save(key, value) {
    await this.db.setSetting(key, JSON.stringify(value));
    this.settings[key] = value;
  }

  get(key, defaultValue) {
    return this.settings[key] ?? defaultValue;
  }
}
```

**체크리스트**:
- [ ] 설정 UI 구현
- [ ] 설정 로드/저장 로직
- [ ] 설정 유효성 검증
- [ ] 기본값 설정

**산출물**:
- src/core/SettingsManager.js
- 설정 UI

---

## 🧪 Phase 8: 테스트 및 안정화

### Task 8.1: 단위 테스트
**목적**: 핵심 모듈의 기능 검증
**소요 시간**: 6시간

**테스트 대상**:
- SystemAnalyzer
- ProjectDetector
- PortAllocator
- TemplateEngine

**프레임워크**: Jest

**예시**:
```javascript
describe('ProjectDetector', () => {
  it('should detect Node.js project', async () => {
    const detector = new ProjectDetector('/path/to/nodejs-project');
    const result = await detector.detect();
    
    expect(result.type).toBe('nodejs');
    expect(result.port).toBe(3000);
  });
  
  it('should extract metadata from package.json', async () => {
    const detector = new ProjectDetector('/path/to/nodejs-project');
    const result = await detector.detect();
    
    expect(result.metadata.name).toBe('my-project');
    expect(result.metadata.version).toBeDefined();
  });
});
```

**체크리스트**:
- [ ] 테스트 환경 설정
- [ ] 각 모듈별 10+ 테스트 케이스
- [ ] 엣지 케이스 테스트
- [ ] 모킹 설정 (Docker, File System)

**산출물**:
- tests/ 디렉토리
- Jest 설정 파일

---

### Task 8.2: 통합 테스트
**목적**: 전체 워크플로우 검증
**소요 시간**: 4시간

**시나리오**:
1. 프로젝트 추가부터 실행까지
2. 여러 프로젝트 동시 실행
3. 포트 충돌 상황 처리
4. Docker 미실행 상황
5. 네트워크 오류 상황

**체크리스트**:
- [ ] E2E 테스트 환경 구축
- [ ] 5가지 주요 시나리오 테스트
- [ ] 에러 복구 테스트

**산출물**:
- 통합 테스트 스크립트

---

### Task 8.3: 버그 수정 및 최적화
**목적**: 안정성 및 성능 개선
**소요 시간**: 8시간

**점검 사항**:
- [ ] 메모리 누수 확인
- [ ] 이미지 빌드 시간 최적화
- [ ] UI 반응성 개선
- [ ] 에러 메시지 개선
- [ ] 로그 성능 최적화

**산출물**:
- 버그 트래킹 리스트
- 성능 개선 보고서

---

## 📦 Phase 9: 빌드 및 배포

### Task 9.1: Electron Builder 설정
**목적**: 실행 파일 빌드 설정
**소요 시간**: 3시간

**구현 내용**:

**파일**: `electron-builder.yml`

```yaml
appId: com.connection-helper.app
productName: Connection Helper
copyright: Copyright © 2024

directories:
  output: dist
  buildResources: build

files:
  - src/**/*
  - package.json

mac:
  category: public.app-category.developer-tools
  icon: build/icon.icns
  target:
    - dmg
    - zip

win:
  icon: build/icon.ico
  target:
    - nsis
    - portable

linux:
  icon: build/icon.png
  category: Development
  target:
    - AppImage
    - deb

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
```

**체크리스트**:
- [ ] 빌드 설정 파일 작성
- [ ] 앱 아이콘 준비 (.icns, .ico, .png)
- [ ] 자동 업데이트 설정 (선택)
- [ ] 코드 서명 (선택)

**산출물**:
- electron-builder.yml
- 빌드 스크립트

---

### Task 9.2: 설치 가이드 및 문서화
**목적**: 사용자 및 개발자 문서 작성
**소요 시간**: 4시간

**문서 목록**:
1. **README.md**: 프로젝트 개요 및 빠른 시작
2. **USER_GUIDE.md**: 사용자 가이드
3. **DEVELOPER_GUIDE.md**: 개발자 가이드
4. **API_REFERENCE.md**: API 문서
5. **TROUBLESHOOTING.md**: 문제 해결 가이드

**체크리스트**:
- [ ] 설치 방법 문서화
- [ ] 스크린샷 및 GIF 추가
- [ ] FAQ 작성
- [ ] 기여 가이드

**산출물**:
- docs/ 디렉토리
- 완성된 문서

---

## 📊 완료 체크리스트

### Phase 1: 프로젝트 초기 설정
- [ ] 프로젝트 구조 생성
- [ ] 의존성 패키지 설치
- [ ] Electron 기본 설정 완료

### Phase 2: 시스템 환경 분석 모듈
- [ ] SystemAnalyzer 구현
- [ ] ProjectDetector 구현

### Phase 3: Docker 제어 및 포트 관리
- [ ] PortAllocator 구현
- [ ] DockerManager 구현
- [ ] TemplateEngine 구현

### Phase 4: 데이터 관리
- [ ] DatabaseManager 구현
- [ ] DB 스키마 생성

### Phase 5: UI/UX 개발
- [ ] 메인 UI 레이아웃
- [ ] CSS 스타일링
- [ ] JavaScript UI 로직
- [ ] 프로젝트 추가 모달
- [ ] 로그 뷰어 모달

### Phase 6: IPC 통신 및 통합
- [ ] IPC 핸들러 구현
- [ ] ProjectManager 통합

### Phase 7: 부가 기능
- [ ] QR 코드 생성
- [ ] 공유 기능
- [ ] 설정 관리

### Phase 8: 테스트 및 안정화
- [ ] 단위 테스트
- [ ] 통합 테스트
- [ ] 버그 수정 및 최적화

### Phase 9: 빌드 및 배포
- [ ] Electron Builder 설정
- [ ] 문서화 완료
- [ ] 배포 패키지 생성

---

## 📅 일정 계획

| Phase | 소요 시간 | 시작일 | 종료일 |
|---|---|---|---|
| Phase 1 | 3.5시간 | Day 1 | Day 1 |
| Phase 2 | 7시간 | Day 1-2 | Day 2 |
| Phase 3 | 11시간 | Day 2-3 | Day 3 |
| Phase 4 | 3시간 | Day 3 | Day 3 |
| Phase 5 | 23시간 | Day 4-6 | Day 6 |
| Phase 6 | 9시간 | Day 6-7 | Day 7 |
| Phase 7 | 7시간 | Day 7-8 | Day 8 |
| Phase 8 | 18시간 | Day 8-10 | Day 10 |
| Phase 9 | 7시간 | Day 10-11 | Day 11 |

**총 예상 소요 시간**: 약 88.5시간 (11일)

---

## 🎯 성공 기준

1. **기능 완성도**
   - Docker 지식 없이 프로젝트 실행 가능
   - 8가지 주요 언어 자동 감지
   - 포트 충돌 0% 달성

2. **성능**
   - 프로젝트 추가 시간 < 3분
   - UI 반응 속도 < 100ms
   - 메모리 사용량 < 200MB

3. **안정성**
   - 크리티컬 버그 0개
   - 에러 복구율 > 95%
   - 테스트 커버리지 > 80%

4. **사용성**
   - 신규 사용자 온보딩 < 5분
   - 클릭 횟수 < 5회 (프로젝트 시작까지)
   - 사용자 만족도 > 4.5/5.0

---

## 📌 주요 의존성 버전

```json
{
  "electron": "^27.0.0",
  "dockerode": "^4.0.0",
  "better-sqlite3": "^9.2.2",
  "qrcode": "^1.5.3",
  "portfinder": "^1.0.32",
  "express": "^4.18.2",
  "tar-fs": "^3.0.4"
}
```

---

## 🔮 향후 확장 계획

1. **Phase 10**: 클라우드 연동 (Docker Hub, GitHub)
2. **Phase 11**: 팀 협업 기능 (설정 동기화)
3. **Phase 12**: 플러그인 시스템
4. **Phase 13**: 모니터링 대시보드
5. **Phase 14**: CI/CD 통합

---

## 📞 지원 및 문의

- GitHub Issues: (프로젝트 URL)
- 문서: docs/
- 이메일: support@connection-helper.com

---

**문서 버전**: 1.0.0
**최종 수정일**: 2024-12-18
**작성자**: Development Team
