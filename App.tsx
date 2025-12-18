
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Project, ServiceStatus, SystemState, LogEntry, ThemeMode } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ConfigGenerator from './components/ConfigGenerator';
import AddProjectModal from './components/AddProjectModal';
import LogViewerModal from './components/LogViewerModal';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'config'>('dashboard');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [isScanning, setIsScanning] = useState(false);
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLogProject, setSelectedLogProject] = useState<Project | null>(null);

  const [systemState, setSystemState] = useState<SystemState>({
    docker: { running: true, version: '24.0.7' },
    traefik: { 
      status: ServiceStatus.RUNNING, 
      dashboardUrl: 'http://localhost:8080',
      port80Available: true 
    },
    firewall: { active: true },
    projects: [
      {
        id: '1',
        name: '메인-이커머스',
        path: '/users/dev/projects/shop',
        type: 'node',
        internalPort: 3000,
        status: ServiceStatus.RUNNING,
        domain: 'shop.local',
        lastSync: new Date().toISOString()
      },
      {
        id: '2',
        name: '재고-관리-API',
        path: '/users/dev/projects/api',
        type: 'python',
        internalPort: 8000,
        status: ServiceStatus.STOPPED,
        domain: 'api.local'
      }
    ]
  });

  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, level: LogEntry['level'] = 'info') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      level
    };
    setLogs(prev => [newLog, ...prev].slice(0, 150));
  }, []);

  const runSystemCheck = useCallback(async () => {
    setIsScanning(true);
    addLog('시스템 분석 모듈(SystemAnalyzer) 가동 중...', 'info');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog('Docker 소켓 감지 성공: /var/run/docker.sock', 'debug');
    addLog(`Docker 상태: Running (v${systemState.docker.version})`, 'success');
    
    await new Promise(resolve => setTimeout(resolve, 600));
    addLog('포트 80 점유 상태 점검 중...', 'info');
    addLog('포트 80 가용함 (Traefik 사용 가능)', 'success');
    
    await new Promise(resolve => setTimeout(resolve, 700));
    addLog('방화벽 인바운드 규칙 확인 완료', 'success');
    
    setIsScanning(false);
    addLog('전체 시스템 점검 완료. 서비스 정상 가동 중.', 'success');
  }, [addLog, systemState.docker.version]);

  useEffect(() => {
    runSystemCheck();
  }, []);

  const handleAddProject = (newProject: Omit<Project, 'id' | 'status'>) => {
    const project: Project = {
      ...newProject,
      id: Math.random().toString(36).substr(2, 9),
      status: ServiceStatus.STOPPED,
    };
    setSystemState(prev => ({
      ...prev,
      projects: [...prev.projects, project]
    }));
    addLog(`새 프로젝트 "${project.name}" 가 추가되었습니다.`, 'success');
    setShowAddModal(false);
  };

  const toggleProject = (id: string) => {
    setSystemState(prev => ({
      ...prev,
      projects: prev.projects.map(p => {
        if (p.id === id) {
          const isStarting = p.status !== ServiceStatus.RUNNING;
          const newStatus = isStarting ? ServiceStatus.RUNNING : ServiceStatus.STOPPED;
          
          if (isStarting) {
            addLog(`[START] ${p.name} 컨테이너 빌드 시작...`, 'info');
            addLog(`Labels 주입: Host(\`${p.domain}\`)`, 'debug');
          } else {
            addLog(`[STOP] ${p.name} 컨테이너 중지 중...`, 'warn');
          }
          
          return { ...p, status: newStatus, lastSync: isStarting ? new Date().toISOString() : p.lastSync };
        }
        return p;
      })
    }));
  };

  const toggleTunnel = async (id: string) => {
    const project = systemState.projects.find(p => p.id === id);
    if (!project) return;

    if (project.publicUrl) {
      addLog(`${project.name} 외부 터널링 중지...`, 'warn');
      setSystemState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === id ? { ...p, publicUrl: undefined } : p)
      }));
    } else {
      addLog(`${project.name} 외부 공유 터널 생성 중 (Phase 6)...`, 'info');
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockUrl = `https://${project.name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 5)}.localtunnel.me`;
      setSystemState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === id ? { ...p, publicUrl: mockUrl } : p)
      }));
      addLog(`공유 URL 생성 완료: ${mockUrl}`, 'success');
    }
  };

  const deleteProject = (id: string) => {
    const project = systemState.projects.find(p => p.id === id);
    if (confirm(`"${project?.name}" 프로젝트를 정말 삭제하시겠습니까? 관련 컨테이너 및 데이터가 제거됩니다.`)) {
      setSystemState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== id)
      }));
      addLog(`프로젝트 ${project?.name} 이(가) 시스템에서 제거되었습니다.`, 'warn');
    }
  };

  const cycleTheme = () => {
    setTheme(prev => {
      if (prev === 'dark') return 'middle';
      if (prev === 'middle') return 'white';
      return 'dark';
    });
  };

  const themeStyles = useMemo(() => {
    switch (theme) {
      case 'white': return { bg: 'bg-slate-50 text-slate-900', header: 'bg-white/80 border-slate-200 text-slate-800' };
      case 'middle': return { bg: 'bg-slate-700 text-slate-50', header: 'bg-slate-800/80 border-slate-600 text-slate-100' };
      default: return { bg: 'bg-slate-950 text-slate-100', header: 'bg-slate-900/50 border-slate-800 text-slate-100' };
    }
  }, [theme]);

  return (
    <div className={`flex h-screen transition-all duration-500 ease-in-out ${themeStyles.bg}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />
      
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className={`h-16 border-b flex items-center justify-between px-8 backdrop-blur-md sticky top-0 z-30 transition-all ${themeStyles.header}`}>
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              {activeTab === 'dashboard' ? '관제 센터' : activeTab === 'projects' ? '서비스 관리' : 'AI 아키텍처'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[11px] font-mono">
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-amber-500 animate-ping' : 'bg-green-500'}`}></span>
                <span className="opacity-60 uppercase">Docker</span>
                <span className="text-blue-400">{systemState.docker.version}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${systemState.traefik.port80Available ? 'bg-green-500' : 'bg-rose-500'}`}></span>
                <span className="opacity-60 uppercase">Port 80</span>
                <span className={systemState.traefik.port80Available ? 'text-emerald-400' : 'text-rose-400'}>
                  {systemState.traefik.port80Available ? 'AVAILABLE' : 'BLOCKED'}
                </span>
              </div>
            </div>
            
            <div className="h-8 w-px bg-slate-700 mx-2"></div>
            
            <button 
              onClick={cycleTheme}
              className={`px-4 py-1.5 rounded-xl border font-bold text-[10px] uppercase tracking-wider flex items-center gap-2 transition-all hover:scale-105 active:scale-95 ${
                theme === 'white' 
                  ? 'bg-slate-100 border-slate-300 text-slate-700' 
                  : theme === 'middle'
                    ? 'bg-slate-600 border-slate-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
            >
              <i className={`fas ${theme === 'white' ? 'fa-sun' : theme === 'middle' ? 'fa-circle-half-stroke' : 'fa-moon'}`}></i>
              Mode
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          {activeTab === 'dashboard' && <Dashboard state={systemState} logs={logs} theme={theme} onScan={runSystemCheck} isScanning={isScanning} />}
          {activeTab === 'projects' && (
            <ProjectList 
              projects={systemState.projects} 
              onToggle={toggleProject} 
              onToggleTunnel={toggleTunnel}
              onAdd={() => setShowAddModal(true)}
              onDelete={deleteProject}
              onViewLogs={(p) => setSelectedLogProject(p)}
              addLog={addLog}
              theme={theme}
            />
          )}
          {activeTab === 'config' && (
            <ConfigGenerator 
              projects={systemState.projects} 
              addLog={addLog}
              theme={theme}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      {showAddModal && (
        <AddProjectModal 
          onClose={() => setShowAddModal(false)} 
          onSubmit={handleAddProject} 
          theme={theme} 
        />
      )}
      {selectedLogProject && (
        <LogViewerModal 
          project={selectedLogProject} 
          onClose={() => setSelectedLogProject(null)} 
          theme={theme} 
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'white' ? '#cbd5e1' : '#334155'}; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme === 'white' ? '#94a3b8' : '#475569'}; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default App;
