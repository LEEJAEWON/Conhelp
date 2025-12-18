import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Project, ThemeMode, ServiceStatus } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ConfigGenerator from './components/ConfigGenerator';
import AddProjectModal from './components/AddProjectModal';
import LogViewerModal from './components/LogViewerModal';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'projects' | 'config'>('dashboard');
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Zustand Store
  const {
    systemStatus,
    projects,
    loadSystemStatus,
    loadProjects,
    startProject,
    stopProject,
    addProject,
    deleteProject
  } = useStore();

  const [isScanning, setIsScanning] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLogProject, setSelectedLogProject] = useState<Project | null>(null);

  // Local logs system (mixed with store/IPC in reality, but UI needs local state for the dashboard widget)
  // For the dashboard widget, we might just show global logs or "Last Event"
  // Implementing a simple global log listener here for the dashboard.
  const [dashboardLogs, setDashboardLogs] = useState<any[]>([]);

  const addDashboardLog = useCallback((msg: string, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    setDashboardLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message: msg,
      level
    }, ...prev].slice(0, 50));
  }, []);

  const runSystemCheck = useCallback(async () => {
    setIsScanning(true);
    addDashboardLog('시스템 상태 스캔 중...', 'info');
    await loadSystemStatus();
    // Simulate some "scanning" usage feeling
    await new Promise(r => setTimeout(r, 500));
    setIsScanning(false);
    addDashboardLog('시스템 스캔 완료', 'success');
  }, [loadSystemStatus, addDashboardLog]);

  // Initial Load
  useEffect(() => {
    runSystemCheck();
    loadProjects();

    // Listen to global logs for dashboard
    const handleLog = (data: any) => {
      // Just showing start/stop events or errors in dashboard
      // Filtering raw build logs out to avoid noise in the main dashboard
      // Or we can show them. Let's show "Project X: ..."
      if (typeof data.msg === 'string' && (data.msg.includes('Building') || data.msg.includes('Error'))) {
        // rough filter
        addDashboardLog(`[${data.projectId}] ${data.msg.substring(0, 50)}...`, 'info');
      }
    };

    // @ts-ignore
    if (window.api && window.api.onLog) {
      // @ts-ignore
      window.api.onLog(handleLog);
    }

    return () => {
      // @ts-ignore
      if (window.api && window.api.removeLogListener) window.api.removeLogListener();
    }
  }, []);

  const handleAddProject = async (newProject: Omit<Project, 'id' | 'status'>) => {
    await addProject(newProject);
    addDashboardLog(`새 프로젝트 "${newProject.name}" 추가됨`, 'success');
    setShowAddModal(false);
  };

  const handleToggleProject = async (id: string) => {
    const p = projects.find(prj => prj.id === id);
    if (!p) return;

    if (p.status === 'RUNNING') {
      addDashboardLog(`${p.name} 서비스 중지 요청`, 'warn');
      await stopProject(id);
    } else {
      addDashboardLog(`${p.name} 서비스 시작 요청`, 'info');
      await startProject(id);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (confirm('프로젝트를 삭제하시겠습니까?')) {
      await deleteProject(id);
      addDashboardLog('프로젝트 삭제 완료', 'warn');
    }
  }

  // Phase 6 placeholder
  const toggleTunnel = async (id: string) => {
    alert('Phase 6: Tunneling is not implemented yet.');
  }

  // System State fallback
  const safeSystemState = systemStatus || {
    docker: { running: false, version: '-' },
    traefik: { status: ServiceStatus.STOPPED, dashboardUrl: '', port80Available: false },
    firewall: { active: false },
    projects: []
  };

  // Merge store projects with safeSystemState for Dashboard component which expects a unified object
  const dashboardState = {
    ...safeSystemState,
    projects: projects // Use the projects from store
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
      case 'white': return { bg: 'bg-gray-50 text-gray-900', header: 'bg-white/95 border-gray-200 text-gray-900' };
      case 'middle': return { bg: 'bg-slate-800 text-slate-50', header: 'bg-slate-900/95 border-slate-700 text-slate-100' };
      default: return { bg: 'bg-[#0a0e1a] text-slate-100', header: 'bg-[#0f1419]/95 border-slate-800/50 text-slate-100' };
    }
  }, [theme]);

  return (
    <div className={`flex h-screen transition-colors duration-300 ${themeStyles.bg}`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className={`h-16 border-b flex items-center justify-between px-6 backdrop-blur-xl sticky top-0 z-30 transition-colors duration-300 ${themeStyles.header}`}>
          <div className="flex items-center gap-3">
            <h1 className={`text-lg font-semibold tracking-tight ${theme === 'white' ? 'text-gray-900' : 'text-white'}`}>
              {activeTab === 'dashboard' ? 'Dashboard' : activeTab === 'projects' ? 'Projects' : 'AI Assistant'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme === 'white' ? 'bg-gray-100' : 'bg-slate-800/50'}`}>
                <span className={`w-2 h-2 rounded-full ${isScanning ? 'bg-amber-400 animate-pulse' : safeSystemState.docker.running ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`text-xs font-medium ${theme === 'white' ? 'text-gray-600' : 'text-slate-400'}`}>Docker</span>
              </div>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${theme === 'white' ? 'bg-gray-100' : 'bg-slate-800/50'}`}>
                <span className={`w-2 h-2 rounded-full ${safeSystemState.traefik.port80Available ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                <span className={`text-xs font-medium ${theme === 'white' ? 'text-gray-600' : 'text-slate-400'}`}>Port 80</span>
              </div>
            </div>

            <button
              onClick={cycleTheme}
              className={`p-2 rounded-lg transition-all hover:scale-105 active:scale-95 ${theme === 'white'
                  ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  : theme === 'middle'
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    : 'bg-slate-800/50 hover:bg-slate-700 text-slate-300'
                }`}
            >
              <i className={`fas ${theme === 'white' ? 'fa-sun' : theme === 'middle' ? 'fa-circle-half-stroke' : 'fa-moon'} text-sm`}></i>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
          {activeTab === 'dashboard' && <Dashboard state={dashboardState} logs={dashboardLogs} theme={theme} onScan={runSystemCheck} isScanning={isScanning} />}
          {activeTab === 'projects' && (
            <ProjectList
              projects={projects}
              onToggle={handleToggleProject}
              onToggleTunnel={toggleTunnel}
              onAdd={() => setShowAddModal(true)}
              onDelete={handleDeleteProject}
              onViewLogs={(p) => setSelectedLogProject(p)}
              addLog={addDashboardLog}
              theme={theme}
            />
          )}
          {activeTab === 'config' && (
            <ConfigGenerator
              projects={projects}
              addLog={addDashboardLog}
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
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'white' ? '#d1d5db' : '#334155'}; border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme === 'white' ? '#9ca3af' : '#475569'}; }
      `}</style>
    </div>
  );
};

export default App;
